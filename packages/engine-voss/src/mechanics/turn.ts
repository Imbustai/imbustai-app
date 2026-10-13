import type { VossStory } from '../schema';
import { eventsBefore, eventsNewIn, promptReplyDate, turnRow, batchReadOnOrAfter } from './calendar';
import { deliver, judgeClues, newCluesFor, reapproaches, type Reapproach } from './clues';
import {
  AUTHORITIES,
  decideDecember,
  decideEnding,
  heldEvidence,
  searchHolds,
  stakeoutHolds,
  vossDies,
} from './december';
import { routeOfficeLetter } from './offices';
import type { AdelaideSignals, AuthoritySignals, ReadLetter, VossSignals } from './signals';
import type { LadderKey, PendingAnswer, VossState } from './state';
import {
  applyLattanzi,
  climbLadders,
  moveTrust,
  nextDoor,
  targetLit,
  tellLayer,
  trustBand,
  type LadderMove,
  type TrustBand,
} from './voss';

// One Turn of the mechanics: the Player's Letters of Turn N, as the reader
// read them, in; the plan of batch N — who writes, on what date, and what
// each Character is allowed to say — and the state after it, out. Pure: the
// writing pipeline (#41) turns the plan into Letters and stores the state in
// the draft's `effects`, which `applyTurn` hands back on approve.

export interface SignatureAllowance {
  key: string;
  ordinary: boolean;
  showpiece: boolean;
}

/** A fixed Story text (`story.texts`) and the variants of it that apply. */
export interface FixedText {
  key: string;
  /** The `when` of each variant that applies. */
  variants: string[];
}

export interface VossPlan {
  date: string;
  /** Short and formal, signed «Voss»: answers, but no personal questions, no Texture, no layer, no step. */
  cold: boolean;
  trust: number;
  band: TrustBand;
  /** The layer he may tell in this batch, and those already told. */
  layer: { granted: number | null; told: number[]; circling: boolean };
  ladders: Record<LadderKey, { step: number; lit: boolean }>;
  moves: LadderMove[];
  /** Ladders the Lead pushed with no reason: Voss asks «perché?». */
  bare: LadderKey[];
  /** The one new Aldo clue of this Letter, with a suggested bridge. */
  aldoClue: { key: string | null; clue: string; bridge: string } | null;
  /** Clues due for the first time in this Letter (the Aldo clue's included). */
  newClues: string[];
  reapproaches: Reapproach[];
  door: { office: string; document: string } | null;
  /** Knowledge unlocked so far: keys of `unlocks` in his correspondent entry. */
  unlocks: string[];
  signatures: SignatureAllowance[];
  /** Signatures that never share a Letter. */
  exclusive: string[][];
  /** Fixed passages the Letter carries (`story.texts`). */
  passages: string[];
  /** Batch 8: the Letter after the 17th is a fixed text. */
  fixedLetter: FixedText | null;
  /** Batch 7, when he dies on the 17th: it is his last Letter. */
  lastLetter: boolean;
  /** Batch 7: what he does with Aldo's invitation for the 17th. */
  invitation: 'accepts' | 'wary' | 'hides' | null;
}

export interface AdelaidePlan {
  date: string;
  fixedLetter: FixedText | null;
  panoramaClues: string[];
  newClues: string[];
  reapproaches: Reapproach[];
  reveal: { variant: 'deduced' | 'seen' } | null;
  /** The Lead accused one tenant last Turn: the accused gives himself away with a detail. */
  accusedTenantSlips: boolean;
  unlocks: string[];
  signatures: SignatureAllowance[];
}

export interface OfficePlan {
  office: string;
  kind: PendingAnswer['kind'];
  date: string;
  /** The Turn whose Letter it answers. */
  turn: number;
  documents: string[];
  partial: boolean;
  forwardedFrom: string | null;
  forwardedTo: string[];
  fixedLetter: FixedText | null;
  passages: string[];
  /** The Procura reports the search and Aldo's arrest. */
  search: boolean;
}

export interface TurnPlan {
  turn: number;
  /** The date the Lead's Letters of this Turn bear. */
  submissionDate: string;
  /** Fixed events since the last Turn, for the writers' context. */
  events: string[];
  voss: VossPlan | null;
  adelaide: AdelaidePlan | null;
  /** Armando answers only when written to. */
  armando: { date: string } | null;
  offices: OfficePlan[];
  /** Clippings sent on their own (`story.texts`), dated. */
  dispatches: { key: string; from: string; date: string }[];
  december: VossState['december'];
  /** Batch 8: the Ending, decided by code. */
  ending: string | null;
  adminNotes: string[];
}

export interface TurnInput {
  turn: number;
  letters: ReadLetter[];
  /** The hook context's seeded random. */
  random: (label: string) => number;
}

const of = <K extends ReadLetter['kind']>(letters: ReadLetter[], kind: K) =>
  letters.filter((l): l is Extract<ReadLetter, { kind: K }> => l.kind === kind);

function fixedText(story: VossStory, key: string) {
  const t = story.texts.find((x) => x.key === key);
  if (!t) throw new Error(`engine-voss: no fixed text "${key}"`);
  return t;
}

/** The `when` of a text's variant, checked against the Story so a renamed variant fails loudly. */
function variant(story: VossStory, key: string, startsWith: string): string {
  const v = fixedText(story, key).variants.find((x) => x.when.startsWith(startsWith));
  if (!v) throw new Error(`engine-voss: text "${key}" has no variant "${startsWith}…"`);
  return v.when;
}

/** Plays Turn N against the state after batch N−1. */
export function playTurn(story: VossStory, state: VossState, input: TurnInput): { plan: TurnPlan; state: VossState } {
  const { turn: N, letters } = input;
  if (state.batch !== N - 1) throw new Error(`engine-voss: Turn ${N} after batch ${state.batch}`);
  if (state.ending !== null) throw new Error('engine-voss: the Game has ended');
  const s: VossState = structuredClone(state);
  const notes: string[] = [];
  const row = turnRow(story, N);
  const events = eventsBefore(story, N);
  const fresh = eventsNewIn(story, N);
  const vossAlive = !(vossDies(s.december) && N === 8);

  // 1. Events before Voss reads the Turn's Letters.
  if (fresh.has('lattanzi')) {
    applyLattanzi(s);
    notes.push("Lattanzi's arrest: every ladder on step 1 is back to 0.");
  }

  // 2. What the Player made of the clues he has.
  judgeClues(s, letters.flatMap((l) => l.signals.clues));

  // 3. Letters to offices.
  const heldBefore = heldEvidence(story, s);
  const murder3 = story.calendar.events.find((e) => e.key === 'murder_3')!.date;
  for (const letter of of(letters, 'authority')) {
    const sig: AuthoritySignals = letter.signals;
    if (!s.officesWritten.includes(letter.to)) s.officesWritten.push(letter.to);
    const answers = routeOfficeLetter(story, letter.to, N, sig.requestKeys);
    if (AUTHORITIES.includes(letter.to)) {
      if (sig.reportsBenvenuti) {
        for (const a of answers) if (a.office === letter.to && a.kind === 'answer') a.topics.push('benvenuti');
        if (letter.to === 'procura' && row.arrivesRome < murder3) s.benvenutiReported = true;
      }
      if (sig.namesAldo && s.aldoNamedInTurn === null) s.aldoNamedInTurn = N;
      if (sig.reportsCancellations) s.told.cancellations = true;
      if (sig.joinsAriaAndRigoletto) s.told.ariaAndRigoletto = true;
      if (sig.passesTheBulb) s.told.bulb = true;
      if (sig.linksToLuca) s.told.lucaLink = true;
      if (sig.reportsVossConfession) s.told.vossConfession = true;
      if (!s.december && searchHolds(story, s, N, sig, heldBefore)) {
        s.december = { route: 'search', arrest: 'A', turn: N };
        const procura = answers.find((a) => a.office === 'procura' && a.kind === 'answer');
        if (procura) procura.topics.push('search');
        else {
          const [own] = routeOfficeLetter(story, 'procura', N, []);
          if (own) answers.push({ ...own, forwardedFrom: letter.to, topics: ['search'] });
        }
        notes.push(`Route 1: the Letter to ${letter.to} names Aldo with enough evidence; the Procura searches via Carini (arrest A).`);
      }
      if (s.stakeoutTurn === null && stakeoutHolds(story, N, sig, heldBefore)) {
        s.stakeoutTurn = N;
        notes.push(`Route 2: the Letter to ${letter.to} asks for a stakeout that holds.`);
      }
    }
    s.pending.push(...answers);
  }
  s.evidence = heldEvidence(story, s);

  // 4. Letters to Voss.
  const toVoss: VossSignals[] = vossAlive ? of(letters, 'voss').map((l) => l.signals) : [];
  let voss: VossPlan | null = null;
  const passages: string[] = [];
  if (vossAlive) {
    for (const l of toVoss) {
      if (l.asksAbout1977) s.asked.about1977 = true;
      if (l.asksAboutCareer) s.asked.aboutCareer = true;
      if (l.doubtsLineups) s.asked.doubtsLineups = true;
    }
    if (N === 1 && toVoss.some((l) => l.asksToWarnBenvenuti)) {
      s.benvenutiVisited = true;
      passages.push('voss_visits_benvenuti');
    }
    const stakeoutDeadline = story.calendar.deadlines.stakeout;
    if (N <= stakeoutDeadline && toVoss.some((l) => l.tellsTheDate)) s.vossKnowsDate = true;
  }
  const { cold } = vossAlive ? moveTrust(story, s, toVoss) : { cold: false };
  if (cold) notes.push('Voss was accused before layer 4: −3 trust, and his Letter is cold.');
  const layer = vossAlive ? tellLayer(story, s, N, events, cold) : { granted: null, circling: false };
  if (layer.granted === 2) deliver(s, 'K12', N);
  const ladders = vossAlive ? climbLadders(story, s, N, events, cold, toVoss) : { moves: [], bare: [] };

  // 5. Letters to Adelaide.
  for (const letter of of(letters, 'adelaide')) {
    const sig: AdelaideSignals = letter.signals;
    if (sig.deducesPanorama && s.panorama.deducedInTurn === null && N >= 2 && N <= story.calendar.deadlines.panoramaDeduction) {
      s.panorama.deducedInTurn = N;
    }
    if (sig.accusesOneTenant) s.panorama.accusedInTurn = N;
  }

  // 6. The 17 December, once the last Letters that reach Rome before it are read.
  if (N === story.calendar.deadlines.stakeout) {
    s.december = decideDecember(s, N);
    notes.push(`17 December: route «${s.december.route}», arrest ${s.december.arrest ?? 'none'}.`);
  }
  const dies = vossDies(s.december);

  // 7. Who writes in batch N.
  const writing = new Set<string>();
  if (vossAlive) writing.add('voss');
  if (N >= 2) writing.add('adelaide');
  const toArmando = letters.some((l) => l.to === 'armando');
  if (toArmando) writing.add('armando');

  // Clues ignored or misread come back through Voss or Adelaide.
  const reapp = reapproaches(story, s, N, new Set([...writing].filter((w) => w === 'voss' || w === 'adelaide')));

  // 8. Voss's Letter.
  if (vossAlive) {
    const aldoArrestedBefore = s.december?.route === 'search' && s.december.turn < N;
    // One new Aldo clue per Letter: the earliest due; the rest wait. None once Aldo is in jail.
    const due = aldoArrestedBefore ? [] : newCluesFor(story, s, 'voss', N);
    const aldo = due.slice(0, story.voss.aldoCluesPerLetter);
    for (const c of aldo) deliver(s, c.key, N);
    const aldoClue: VossPlan['aldoClue'] = aldo[0]
      ? {
          key: aldo[0].key,
          clue: aldo[0].clue,
          bridge: story.aldoThread.find((t) => t.batch === aldo[0].firstBatch)?.bridge ?? '',
        }
      : null;

    const wroteToOffice = of(letters, 'authority').length > 0;
    const door = wroteToOffice ? null : nextDoor(story, s, N);

    let invitation: VossPlan['invitation'] = null;
    if (N === 7 && s.december && s.december.route !== 'search') {
      passages.push('voss_invitation');
      invitation =
        s.december.route === 'voss_knows' ? 'wary' : s.december.route === 'voss_hides' ? 'hides' : 'accepts';
    }

    let fixedLetter: FixedText | null = null;
    if (N === 8) fixedLetter = vossAfter(story, s);

    voss = {
      date: fixedLetter ? fixedText(story, fixedLetter.key).date! : promptReplyDate(story, N, input.random('voss.date')),
      cold,
      trust: s.trust,
      band: trustBand(story, s.trust),
      layer: { ...layer, told: Object.keys(s.layers).map(Number).sort() },
      ladders: {
        target: { step: s.ladders.target, lit: targetLit(events) },
        killer: { step: s.ladders.killer, lit: true },
        luca: { step: s.ladders.luca, lit: true },
      },
      moves: ladders.moves,
      bare: ladders.bare,
      aldoClue,
      newClues: aldo.map((c) => c.key),
      reapproaches: reapp.filter((r) => r.from === 'voss'),
      door: door && { office: door.office, document: door.document },
      unlocks: unlock(story, s, 'voss', N, events),
      signatures: cold ? [] : vossSignatures(s, N),
      exclusive: [['wine', 'back']],
      passages,
      fixedLetter,
      lastLetter: N === 7 && dies,
      invitation,
    };
  }

  // 9. Adelaide's Letter: she writes from batch 2, on her own.
  let adelaide: AdelaidePlan | null = null;
  if (writing.has('adelaide')) {
    let reveal: AdelaidePlan['reveal'] = null;
    if (s.panorama.revealBatch === null) {
      if (s.panorama.deducedInTurn === N) reveal = { variant: 'deduced' };
      else if (N === story.calendar.deadlines.panoramaDeduction) reveal = { variant: 'seen' };
      if (reveal) {
        s.panorama.revealBatch = N;
        s.panorama.variant = reveal.variant;
        deliver(s, 'K11', N);
      }
    }
    const panoramaClues = story.panorama.clues
      .filter((c) => c.latestBatch !== null && c.latestBatch <= N && s.panoramaClues[c.key] === undefined)
      .map((c) => c.key);
    for (const k of panoramaClues) s.panoramaClues[k] = N;
    const newClues = newCluesFor(story, s, 'adelaide', N).map((c) => c.key);
    for (const k of newClues) deliver(s, k, N);

    let fixedLetter: FixedText | null = null;
    if (N === 2) fixedLetter = { key: 'adelaide_first_letter', variants: [] };
    else if (reveal?.variant === 'seen') fixedLetter = { key: 'adelaide_reveal', variants: [] };
    else if (N === 8) fixedLetter = adelaideFarewell(story, s);

    adelaide = {
      date: fixedLetter ? fixedText(story, fixedLetter.key).date! : promptReplyDate(story, N, input.random('adelaide.date')),
      fixedLetter,
      panoramaClues,
      newClues,
      reapproaches: reapp.filter((r) => r.from === 'adelaide'),
      reveal,
      accusedTenantSlips: s.panorama.accusedInTurn === N - 1,
      unlocks: unlock(story, s, 'adelaide', N, events),
      signatures: adelaideSignatures(s, N),
    };
  }

  // 10. The offices whose answers fall in batch N.
  const offices: OfficePlan[] = [];
  for (const a of s.pending.filter((p) => p.batch === N)) {
    const op: OfficePlan = {
      office: a.office,
      kind: a.kind,
      date: a.date,
      turn: a.turn,
      documents: a.documents,
      partial: a.partial,
      forwardedFrom: a.forwardedFrom,
      forwardedTo: a.forwardedTo,
      fixedLetter: null,
      passages: [],
      search: a.topics.includes('search'),
    };
    if (a.office === 'mobile' && a.turn === 1 && a.topics.includes('benvenuti')) {
      op.fixedLetter = { key: 'mobile_reply_benvenuti', variants: [] };
    }
    const remembers = s.unlocks.procura?.includes('remembers_benvenuti');
    if (a.office === 'procura' && a.kind === 'answer' && s.benvenutiReported && a.date > murder3 && !remembers) {
      op.passages.push('procura_remembers_benvenuti');
      s.unlocks.procura = [...(s.unlocks.procura ?? []), 'remembers_benvenuti'];
    }
    for (const d of a.documents) {
      if (!s.documents.includes(d)) s.documents.push(d);
      for (const k of story.documents.find((x) => x.key === d)?.clues ?? []) deliver(s, k, N);
    }
    offices.push(op);
  }
  s.pending = s.pending.filter((p) => p.batch > N);
  s.evidence = heldEvidence(story, s);

  // 11. Dispatches: the fixed clippings, and those of the 17th's outcome.
  const dispatches = dispatchesFor(story, s, N, offices);

  // 12. The Ending, once Turn 8 is read.
  let ending: string | null = null;
  if (N === story.turns) {
    ending = decideEnding(story, s).key;
    s.ending = ending;
    notes.push(`Ending: ${ending}.`);
  }

  s.batch = N;
  const plan: TurnPlan = {
    turn: N,
    submissionDate: row.playerDate,
    events: [...fresh],
    voss,
    adelaide,
    armando: toArmando ? { date: promptReplyDate(story, N, input.random('armando.date')) } : null,
    offices,
    dispatches,
    december: s.december,
    ending,
    adminNotes: notes,
  };
  return { plan, state: s };
}

/** Knowledge unlocked by batch N: fixed events, plus the ones the Game earns. */
function unlock(story: VossStory, s: VossState, who: string, batch: number, events: Set<string>): string[] {
  const c = story.correspondents.find((x) => x.slug === who)!;
  const earned = (key: string): boolean => {
    if (events.has(key)) return true;
    switch (key) {
      case 'benvenuti_visit':
        return s.benvenutiVisited;
      case 'adelaide':
        return batch > 2;
      case 'panorama_reveal':
        return s.panorama.revealBatch !== null && s.panorama.revealBatch <= batch;
      default:
        return false;
    }
  };
  const keys = c.unlocks.map((u) => u.key).filter(earned);
  s.unlocks[who] = keys;
  return keys;
}

function sig(s: VossState, who: string, key: string) {
  const k = `${who}.${key}`;
  s.signatures[k] ??= { lastOrdinary: null, showpiece: null };
  return s.signatures[k];
}

/**
 * Voss's Signatures in batch N: wine at most every other Letter, never with
 * the back; the back's showpiece with the mutua doctor in batch 2 (the Aldo
 * thread's bridge); the wine's showpiece only in the closing batch (§0 K).
 */
function vossSignatures(s: VossState, batch: number): SignatureAllowance[] {
  const wine = sig(s, 'voss', 'wine');
  const back = sig(s, 'voss', 'back');
  const wineOk = wine.lastOrdinary === null || batch - wine.lastOrdinary >= 2;
  if (wineOk) wine.lastOrdinary = batch;
  const backShow = batch === 2 && back.showpiece === null;
  if (backShow) back.showpiece = batch;
  back.lastOrdinary = batch;
  return [
    { key: 'wine', ordinary: wineOk, showpiece: false },
    { key: 'back', ordinary: true, showpiece: backShow },
  ];
}

/**
 * Adelaide's Signatures in batch N: Ernesto's showpiece in the reveal; the
 * geranium's after the reveal or in the farewell, until it is used; the long
 * P.S. once, until it is used. The Ledger (#41) marks a free showpiece used
 * with `markShowpiece`.
 */
function adelaideSignatures(s: VossState, batch: number): SignatureAllowance[] {
  const ernesto = sig(s, 'adelaide', 'ernesto');
  const geraniums = sig(s, 'adelaide', 'geraniums');
  const ps = sig(s, 'adelaide', 'postscripts');
  const revealNow = s.panorama.revealBatch === batch;
  if (revealNow && ernesto.showpiece === null) ernesto.showpiece = batch;
  const afterReveal = s.panorama.revealBatch !== null && batch > s.panorama.revealBatch;
  return [
    { key: 'geraniums', ordinary: true, showpiece: geraniums.showpiece === null && (afterReveal || batch === 8) },
    { key: 'postscripts', ordinary: true, showpiece: ps.showpiece === null },
    { key: 'ernesto', ordinary: true, showpiece: revealNow && ernesto.showpiece === batch },
  ];
}

/** Records a free showpiece the Ledger saw in an approved Letter, so it is never offered again. */
export function markShowpiece(state: VossState, who: string, key: string, batch: number): VossState {
  const s = structuredClone(state);
  sig(s, who, key).showpiece = batch;
  return s;
}

/** Voss's Letter after the 17th (batch 8), by Ending. */
function vossAfter(story: VossStory, s: VossState): FixedText | null {
  const ending = decideEnding(story, s);
  if (!ending.vossAlive) return null;
  const noConfession = s.layers['4'] === undefined;
  if (ending.killer === 'caught') {
    const key = 'voss_after_caught';
    const variants: string[] = [];
    if (noConfession) variants.push(variant(story, key, 'Lo strato 4'));
    if (s.december?.route === 'stakeout') variants.push(variant(story, key, "L'appostamento"));
    if (s.december?.route === 'search') variants.push(variant(story, key, 'Finale 6 (A)'));
    return { key, variants };
  }
  if (ending.killer === 'fled') {
    const key = 'voss_after_fled';
    const variants: string[] = [];
    if (noConfession) variants.push(variant(story, key, 'Lo strato 4'));
    if (s.aldoNamedInTurn === 8 || (s.aldoNamedInTurn === null && s.ladders.killer === 2)) {
      variants.push(variant(story, key, 'Aldo è stato nominato solo nel Turno 8'));
    }
    return { key, variants };
  }
  return { key: 'voss_after_unknown', variants: [] };
}

/** Adelaide's farewell (batch 8): the Ending's variant; the full text is Ending 6's. */
function adelaideFarewell(story: VossStory, s: VossState): FixedText {
  const ending = decideEnding(story, s);
  const key = 'adelaide_farewell';
  const variants = ending.number === 6 ? [] : [variant(story, key, `Finale ${ending.number},`)];
  return { key, variants };
}

/**
 * The clippings of batch N: the murder of the teacher and Lattanzi's arrest
 * in the first batch read after them; in batch 7, the public outcome of the
 * 17th (Voss dead; Aldo caught on the stairs; Aldo stopped at Termini); the
 * search's clipping with the Procura's answer. In Endings 4 and 5 nothing is
 * public, and the Player writes Turn 8 not knowing whether Voss is alive.
 */
function dispatchesFor(story: VossStory, s: VossState, batch: number, offices: OfficePlan[]) {
  const keys: string[] = [];
  for (const k of ['clipping_murder_3', 'clipping_lattanzi']) {
    if (batchReadOnOrAfter(story, fixedText(story, k).date!) === batch) keys.push(k);
  }
  if (offices.some((o) => o.search)) keys.push('clipping_search');
  if (batch === story.calendar.deadlines.stakeout && s.december) {
    const { route, arrest } = s.december;
    if (route === 'otherwise') keys.push('clipping_voss_dead');
    if (route === 'otherwise' && arrest === 'C') keys.push('clipping_termini');
    if (route === 'stakeout' || route === 'voss_knows') keys.push('clipping_stairs');
  }
  return keys.map((key) => {
    const t = fixedText(story, key);
    return { key, from: t.from, date: t.date! };
  });
}
