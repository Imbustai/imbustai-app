import type { Json } from '@imbustai/story-runtime';
import type { VossStory } from '../schema';
import type { AuthoritySignals } from './signals';
import type { VossState } from './state';

// The 17 December (§7), the six Endings (§8) and the verdict (§9). All
// decided by code, never by a model: the routes are tried in order and the
// first that holds wins.

type Route = NonNullable<VossState['december']>['route'];
type Arrest = 'A' | 'B' | 'C';

/** The offices that count as «an authority» for the routes: the Procura, the Mobile, and the Garbatella that forwards to it. */
export const AUTHORITIES = ['procura', 'mobile', 'garbatella'];

function route(story: VossStory, key: Route) {
  const r = story.routes.find((x) => x.key === key);
  if (!r) throw new Error(`engine-voss: no route "${key}"`);
  return r;
}

/**
 * Route 1, the search (checked on every Turn up to its last): a Letter to an
 * authority that names Aldo and cites at least two pieces of evidence the
 * Player already held before writing it — one, if the teacher was reported
 * to the Procura before she died.
 */
export function searchHolds(story: VossStory, s: VossState, turn: number, letter: AuthoritySignals, heldBefore: string[]): boolean {
  const r = route(story, 'search');
  if (r.lastTurn !== null && turn > r.lastTurn) return false;
  if (!letter.namesAldo) return false;
  const cited = new Set(letter.citesEvidence.filter((p) => heldBefore.includes(p)));
  const min = (s.benvenutiReported ? r.minEvidenceIfBenvenutiReported : r.minEvidence) ?? 0;
  return cited.size >= min;
}

/**
 * Route 2, the stakeout: a Letter to an authority with the date, Voss as the
 * target, and a fact in support (evidence the Player holds, or the reasoning
 * on the calendar).
 */
export function stakeoutHolds(story: VossStory, turn: number, letter: AuthoritySignals, heldBefore: string[]): boolean {
  const r = route(story, 'stakeout');
  if (r.lastTurn !== null && turn > r.lastTurn) return false;
  const fact = letter.calendarReasoning || letter.citesEvidence.some((p) => heldBefore.includes(p));
  return letter.statesDate && letter.vossAsTarget && fact;
}

/**
 * The 17 December, decided once the Letters of the last Turn that reach Rome
 * before it (Turn 7) are read, so batch 7 can carry its clipping. A search
 * already decided it earlier.
 */
export function decideDecember(s: VossState, turn: number): NonNullable<VossState['december']> {
  if (s.december) return s.december;
  if (s.stakeoutTurn !== null) return { route: 'stakeout', arrest: 'B', turn };
  if (s.ladders.killer === 2) return { route: 'voss_knows', arrest: 'B', turn };
  if (s.ladders.target === 2 && s.vossKnowsDate) return { route: 'voss_hides', arrest: null, turn };
  return { route: 'otherwise', arrest: s.aldoNamedInTurn !== null ? 'C' : null, turn };
}

export function vossDies(december: VossState['december']): boolean {
  return december?.route === 'otherwise';
}

/** The Ending, once Turn 8 is read (§7, §8). */
export function decideEnding(story: VossStory, s: VossState): VossStory['endings'][number] {
  const d = s.december;
  if (!d) throw new Error('engine-voss: the 17 December is not decided yet');
  let vossAlive: boolean;
  let killer: 'unknown' | 'fled' | 'caught';
  switch (d.route) {
    case 'search':
    case 'stakeout':
    case 'voss_knows':
      vossAlive = true;
      killer = 'caught';
      break;
    case 'voss_hides':
      vossAlive = true;
      killer = s.aldoNamedInTurn !== null || s.ladders.killer === 2 ? 'fled' : 'unknown';
      break;
    case 'otherwise':
      vossAlive = false;
      killer = d.arrest === 'C' ? 'caught' : s.aldoNamedInTurn !== null ? 'fled' : 'unknown';
      break;
  }
  const ending = story.endings.find((e) => e.vossAlive === vossAlive && e.killer === killer);
  if (!ending) throw new Error(`engine-voss: no Ending for vossAlive=${vossAlive}, killer=${killer}`);
  return ending;
}

// ─── Evidence and the verdict ───────────────────────────────────────────────

/** What each arrest turns up (§9.2), P11 apart. */
const FINDS: Record<Arrest, string[]> = {
  A: ['P5', 'P6', 'P12', 'P7'],
  B: ['P10', 'P6', 'P12', 'P7'],
  C: ['P12', 'P7'],
};

const COUNTS = ['cortesi', 'ferri', 'benvenuti'] as const;
type Count = (typeof COUNTS)[number];

const LUCA_DOUBT_DOCUMENTS = ['procura_nota_perizia_1985', 'scientifica_perizia_balistica', 'cancelleria_ricognizioni'];

export interface Verdict {
  arrest: Arrest;
  /** Every piece of evidence counted, with the weight it scored. */
  evidence: { key: string; weight: number }[];
  score: number;
  /** The three 1987 murders. */
  guilty: Count[];
  acquitted: Count[];
  /** Count d): Voss. */
  voss: 'murder' | 'attempted' | null;
  /** Aldo confesses (P11): the investigators know of Luca. */
  confession: boolean;
  /** Summary (confession or in flagrante) or formal instruction: sets the Epilogue's dates. */
  procedure: 'summary' | 'formal';
  dates: { verdict: string; letter: string };
  /** The unscrewed bulb was passed to the Procura: premeditation in the Ferri count. */
  premeditationFerri: boolean;
  /** The PM calls Luca's conviction «quantomeno dubbia». */
  lucaDoubtful: boolean;
}

/** The evidence the Player holds now: documents received, plus P8 and P9 once told to an authority. */
export function heldEvidence(story: VossStory, s: VossState): string[] {
  const held = new Set(s.evidence);
  for (const d of s.documents) {
    const doc = story.documents.find((x) => x.key === d);
    if (doc?.evidence) held.add(doc.evidence);
  }
  const knows = (k: string) => s.clues[k]?.status === 'understood';
  if (s.told.cancellations && (knows('K3') || knows('K4') || knows('K5'))) held.add('P8');
  const has = (k: string) => (s.clues[k]?.deliveredIn ?? null) !== null;
  if (s.told.ariaAndRigoletto && has('K6') && has('K9')) held.add('P9');
  return [...held].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
}

/** The verdict on Aldo (§9), for the Endings with a trial. */
export function verdict(story: VossStory, s: VossState): Verdict {
  const arrest = s.december?.arrest;
  if (!arrest) throw new Error('engine-voss: no arrest, no trial');
  const vossDead = vossDies(s.december);
  const lucaKnown = arrest === 'A' || s.told.lucaLink || heldEvidence(story, s).includes('P3');

  const keys = new Set([...heldEvidence(story, s), ...FINDS[arrest]]);
  if (lucaKnown) keys.add('P11');
  const evidence = story.evidence
    .filter((e) => keys.has(e.key))
    .map((e) => ({ key: e.key, weight: vossDead && e.weightIfVossDead !== null ? e.weightIfVossDead : e.weight }));
  const score = evidence.reduce((sum, e) => sum + e.weight, 0);

  const proven = new Set(story.evidence.filter((e) => keys.has(e.key)).flatMap((e) => e.proves));
  const guilty: Count[] =
    score >= story.verdict.all
      ? [...COUNTS]
      : score >= story.verdict.partial
        ? COUNTS.filter((c) => proven.has(c))
        : [];
  const acquitted = COUNTS.filter((c) => !guilty.includes(c));

  const procedure = lucaKnown || arrest === 'B' ? 'summary' : 'formal';
  return {
    arrest,
    evidence,
    score,
    guilty,
    acquitted,
    voss: arrest === 'B' ? 'attempted' : arrest === 'C' ? 'murder' : null,
    confession: lucaKnown,
    procedure,
    dates: story.verdict.dates[procedure],
    premeditationFerri: s.told.bulb,
    lucaDoubtful: s.documents.some((d) => LUCA_DOUBT_DOCUMENTS.includes(d)),
  };
}

/** The Ending's detail for the closing batch (#42): everything the Epilogue needs to know. */
export function endingDetail(story: VossStory, s: VossState): Json {
  const ending = decideEnding(story, s);
  const d = s.december!;
  return {
    number: ending.number,
    route: d.route,
    arrest: d.arrest,
    aldoNamedInTurn: s.aldoNamedInTurn,
    vossConfessedToLombardo: s.layers['4'] !== undefined,
    confessionReportedToPm: s.told.vossConfession,
    benvenutiReported: s.benvenutiReported,
    bulbPassed: s.told.bulb,
    evidenceHeld: heldEvidence(story, s),
    verdict: ending.hasTrial ? (verdict(story, s) as unknown as Json) : null,
  };
}
