import {
  renderLedger,
  renderReaderNotes,
  ledgerFor,
  type DateTools,
  type DeliveredLetter,
  type PlayerLetter,
  type ReaderNotes,
  type ReservedTerm,
} from '@imbustai/story-runtime';
import type { VossState } from '../mechanics/state';
import type { AdelaidePlan, OfficePlan, SignatureAllowance, TurnPlan, VossPlan } from '../mechanics/turn';
import { turnRow } from '../mechanics/calendar';
import type { PromptKey, VossCorrespondent, VossStory } from '../schema';

// What the writing pipeline says to the models. Every sentence comes from the
// Story document (`pipeline.prompts`, the writer views, the fixed texts); this
// file only chooses which ones a Turn plan calls for and fills their
// placeholders. A writer is told what may enter its Letter, never why: the
// plan's reasons (clue keys, gates, routes) stay with the mechanics.

/** A Story prompt with its `{placeholders}` filled; an unknown placeholder is a bug in the Story. */
export function fill(story: VossStory, key: PromptKey, vars: Record<string, string | number> = {}): string {
  const template = story.pipeline.prompts[key];
  if (template === undefined) throw new Error(`engine-voss: the Story has no prompt "${key}"`);
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    if (!(name in vars)) throw new Error(`engine-voss: prompt "${key}" needs {${name}}`);
    return String(vars[name]);
  });
}

export function correspondent(story: VossStory, slug: string): VossCorrespondent {
  const c = story.correspondents.find((x) => x.slug === slug);
  if (!c) throw new Error(`engine-voss: "${slug}" is not in the cast`);
  return c;
}

/** "martedì 22 settembre 1987": Letters of 1987 carry the weekday. */
export function longDate(dates: DateTools, iso: string): string {
  const weekday = new Date(`${iso}T00:00:00Z`).toLocaleDateString('it-IT', { weekday: 'long', timeZone: 'UTC' });
  return `${weekday} ${dates.format(iso)}`;
}

const sections = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join('\n\n');
const lines = (...parts: (string | null | undefined | false)[]) => parts.filter(Boolean).join('\n');

// ─── Cached prefixes ────────────────────────────────────────────────────────

/** A person's cached prefix: the writer view, the Lead as it knows him, its example Letters. */
export function personPrefix(story: VossStory, c: VossCorrespondent): string {
  const examples = c.examples.length
    ? sections(
        fill(story, 'examples', { name: c.name }),
        ...c.examples.map((e) => fill(story, 'example', { context: e.context, text: e.text })),
      )
    : null;
  return sections(c.writerView, c.leadView, examples);
}

/** An office's cached prefix: how every office answers, then its own sheet. */
export function officePrefix(story: VossStory, c: VossCorrespondent): string {
  return sections(story.pipeline.officeStyle, c.writerView, c.leadView);
}

// ─── The correspondence ─────────────────────────────────────────────────────

/** Every Letter between the Lead and `slug` so far, oldest first, then this Turn's. */
export function correspondenceWith(
  story: VossStory,
  dates: DateTools,
  slug: string,
  history: DeliveredLetter[],
  submission: PlayerLetter[],
  submissionDate: string,
): string {
  const them = correspondent(story, slug).name;
  const lead = story.lead.name;
  const heading = (from: string, to: string, date: string) =>
    fill(story, 'letter_heading', { from, to, date: date ? longDate(dates, date) : '' });
  const past = history
    .filter((l) => (l.direction === 'in' ? l.from === slug && l.kind !== 'dispatch' : l.to === slug))
    .map((l) => `${l.direction === 'in' ? heading(them, lead, l.storyDate) : heading(lead, them, l.storyDate)}\n\n${l.body}`);
  const now = submission
    .filter((l) => l.to === slug)
    .map((l) => `${heading(lead, them, submissionDate)}\n\n${l.body}`);
  return sections(
    fill(story, 'correspondence'),
    ...past,
    ...(now.length ? now : [fill(story, 'no_letter', { lead, name: them })]),
  );
}

/** Everything `slug` has read or written: a reserved term in it is known to it. */
export function knownText(slug: string, history: DeliveredLetter[], submission: PlayerLetter[]): string[] {
  return [
    ...history.filter((l) => (l.direction === 'in' ? l.from === slug : l.to === slug)).map((l) => l.body),
    ...submission.filter((l) => l.to === slug).map((l) => l.body),
  ];
}

/** The Story's reserved terms in the runtime's shape; no note, since the rewrite would read it. */
export function reservedTerms(story: VossStory): ReservedTerm[] {
  return story.reserved.flatMap((r) => r.patterns.map((term) => ({ term, knownBy: r.allowedFor })));
}

// ─── The Turn state, per writer ─────────────────────────────────────────────

function knowledge(story: VossStory, c: VossCorrespondent, unlocked: string[]): string | null {
  const texts = c.unlocks.filter((u) => unlocked.includes(u.key)).map((u) => `- ${u.text}`);
  return texts.length ? sections(fill(story, 'knowledge', { name: c.name }), texts.join('\n')) : null;
}

function signatureLines(story: VossStory, c: VossCorrespondent, allowances: SignatureAllowance[]): string[] {
  return allowances.map((a) => {
    const s = c.signatures.find((x) => x.key === a.key);
    if (!s) throw new Error(`engine-voss: ${c.slug} has no Signature "${a.key}"`);
    if (a.showpiece) return fill(story, 'signature_showpiece', { name: s.name, showpiece: s.showpiece });
    if (a.ordinary) return fill(story, 'signature_ordinary', { name: s.name, ordinary: s.ordinary });
    return fill(story, 'signature_off', { name: s.name });
  });
}

function passageLines(story: VossStory, keys: string[]): string[] {
  return keys.map((key) => {
    const t = story.texts.find((x) => x.key === key);
    if (!t) throw new Error(`engine-voss: no fixed text "${key}"`);
    return fill(story, 'passage', { text: t.text });
  });
}

function dateLine(story: VossStory, dates: DateTools, plan: TurnPlan, name: string, date: string, written: boolean): string {
  if (!written) return fill(story, 'date_unprompted', { name, date: longDate(dates, date) });
  const row = turnRow(story, plan.turn);
  return fill(story, 'date', {
    name,
    lead: story.lead.name,
    date: longDate(dates, date),
    playerDate: longDate(dates, row.playerDate),
    arrivesRome: longDate(dates, row.arrivesRome),
  });
}

function reapproachLines(story: VossStory, list: { how: string; wrongLead: string | null }[]): string[] {
  const lead = story.lead.name;
  return list.map(
    (r) =>
      fill(story, 'reapproach', { lead, how: r.how }) +
      (r.wrongLead ? fill(story, 'wrong_lead', { lead, wrongLead: r.wrongLead }) : ''),
  );
}

/** The Story's clue texts carry their key for the author («… (K2).»): a writer never sees one. */
function authorKeysOut(text: string): string {
  return text.replace(/\s*\((?:[KIP]\d+)(?:,\s*[KIP]\d+)*\)/g, '');
}

/** What Voss may say in this batch: the plan, in the Story's words. */
export function vossTurnState(
  story: VossStory,
  dates: DateTools,
  /** The state after the batch was planned: what it delivers is no longer «on request». */
  state: VossState,
  plan: TurnPlan,
  v: VossPlan,
  written: boolean,
): string {
  const c = correspondent(story, 'voss');
  const lead = story.lead.name;
  const out: string[] = [dateLine(story, dates, plan, c.name, v.date, written)];

  if (v.cold) {
    out.push(fill(story, 'cold', { text: story.voss.trust.coldTurn }));
  } else {
    out.push(fill(story, `trust_${v.band}`, { lead }));
  }

  if (v.layer.granted !== null) {
    out.push(fill(story, 'layer_granted', { lead, layer: v.layer.granted, says: story.voss.layers[v.layer.granted].says }));
  } else {
    out.push(fill(story, 'layer_none'));
  }
  const told = v.layer.told.filter((n) => n !== v.layer.granted);
  out.push(fill(story, 'layers_told', { told: told.join(', ') }));
  if (v.layer.circling) out.push(fill(story, 'layer_circling', { lead }));

  for (const ladder of story.voss.ladders) {
    const at = v.ladders[ladder.key];
    const move = v.moves.find((m) => m.ladder === ladder.key);
    // An unlit ladder's `before` is the author's note (it names what comes later): the writer gets the Story's prompt.
    if (!at.lit) {
      out.push(fill(story, 'target_unlit', { name: ladder.name }));
      continue;
    }
    const stance = ladder.steps[at.step].stance;
    if (move) out.push(fill(story, 'ladder_move', { name: ladder.name, lead, basis: move.basis, stance }));
    else out.push(fill(story, 'ladder', { name: ladder.name, stance }));
    if (v.bare.includes(ladder.key)) out.push(fill(story, 'ladder_bare', { name: ladder.name, lead }));
  }

  out.push(v.aldoClue ? fill(story, 'aldo_clue', { clue: authorKeysOut(v.aldoClue.clue), bridge: authorKeysOut(v.aldoClue.bridge) }) : fill(story, 'aldo_none'));
  // A fact that has already happened and is scheduled for a later Letter: his to tell, if asked.
  for (const k of story.clues) {
    const due = k.askableFrom !== null && k.askableFrom <= v.date && k.from.includes('voss');
    if (due && state.clues[k.key]?.deliveredIn === null) {
      out.push(fill(story, 'on_request', { lead, clue: authorKeysOut(k.clue) }));
    }
  }
  out.push(...reapproachLines(story, v.reapproaches));

  if (v.door) {
    out.push(fill(story, 'door', { lead, office: correspondent(story, v.door.office).name, document: v.door.document }));
  }

  out.push(...signatureLines(story, c, v.signatures));
  for (const group of v.exclusive) {
    const names = group.map((key) => c.signatures.find((s) => s.key === key)?.name ?? key);
    out.push(fill(story, 'exclusive', { names: names.join(', ') }));
  }

  out.push(...passageLines(story, v.passages));
  if (v.invitation) out.push(fill(story, `invitation_${v.invitation}`, { lead }));
  out.push(fill(story, 'direct_answers', { lead, name: c.name }));

  return sections(knowledge(story, c, v.unlocks), fill(story, 'turn_state'), out.join('\n'));
}

/** What Adelaide may say in this batch. */
export function adelaideTurnState(story: VossStory, dates: DateTools, plan: TurnPlan, a: AdelaidePlan, written: boolean): string {
  const c = correspondent(story, 'adelaide');
  const lead = story.lead.name;
  const clue = (key: string) => story.clues.find((k) => k.key === key)?.clue;
  const out: string[] = [dateLine(story, dates, plan, c.name, a.date, written)];
  for (const key of a.panoramaClues) {
    const found = story.panorama.clues.find((k) => k.key === key);
    if (found) out.push(fill(story, 'panorama_clue', { clue: found.clue }));
  }
  for (const key of a.newClues) {
    const text = clue(key);
    if (text) out.push(fill(story, 'new_clue', { clue: text }));
  }
  out.push(...reapproachLines(story, a.reapproaches));
  if (a.reveal?.variant === 'deduced') out.push(fill(story, 'reveal_deduced', { lead }));
  if (a.accusedTenantSlips) out.push(fill(story, 'accused_slips', { lead }));
  out.push(...signatureLines(story, c, a.signatures));
  if (c.length) out.push(fill(story, 'length', c.length));
  out.push(fill(story, 'direct_answers', { lead, name: c.name }));
  return sections(knowledge(story, c, a.unlocks), fill(story, 'turn_state'), out.join('\n'));
}

/** A Character with no plan of its own (Armando): the date, its length, direct answers. */
export function plainTurnState(story: VossStory, dates: DateTools, plan: TurnPlan, slug: string, date: string): string {
  const c = correspondent(story, slug);
  return sections(
    fill(story, 'turn_state'),
    lines(
      dateLine(story, dates, plan, c.name, date, true),
      c.length && fill(story, 'length', c.length),
      fill(story, 'direct_answers', { lead: story.lead.name, name: c.name }),
    ),
  );
}

/** What an office answers with: its documents by title, a forward, a partial answer. */
export function officeBrief(story: VossStory, o: OfficePlan): string {
  const name = (slug: string) => correspondent(story, slug).name;
  const out: string[] = [];
  if (o.forwardedFrom) out.push(fill(story, 'office_forwarded_from', { office: name(o.forwardedFrom) }));
  if (o.kind === 'forward') {
    out.push(fill(story, 'office_forward', { offices: o.forwardedTo.map(name).join(', ') }));
  } else if (o.documents.length > 0) {
    const titles = o.documents.map((key, i) => `  ${i + 1}. ${documentOf(story, key).title}`).join('\n');
    out.push(fill(story, 'office_documents', { titles }));
  } else {
    out.push(fill(story, 'office_no_documents'));
    if (o.partial && !o.search) out.push(fill(story, 'office_partial'));
  }
  if (o.search) {
    const find = story.verdict.finds.find((f) => f.arrest === 'A');
    if (find) out.push(fill(story, 'office_search', { what: find.what }));
  }
  out.push(...passageLines(story, o.passages));
  const c = correspondent(story, o.office);
  if (c.length) out.push(fill(story, 'length', c.length));
  return sections(fill(story, 'turn_state'), out.join('\n'));
}

export function documentOf(story: VossStory, key: string) {
  const d = story.documents.find((x) => x.key === key);
  if (!d) throw new Error(`engine-voss: no document "${key}"`);
  return d;
}

// ─── What goes around the Turn state ────────────────────────────────────────

/** The reader's notes on the Lead's Letters to one Character, as a prompt section. */
export function readerSection(story: VossStory, notes: ReaderNotes | undefined): string | null {
  return notes ? sections(fill(story, 'reader_notes', { lead: story.lead.name }), renderReaderNotes(notes)) : null;
}

/** What the Lead and `slug` have told each other about themselves; nothing told to anyone else. */
export function ledgerSection(story: VossStory, state: VossState, slug: string): string | null {
  const entries = ledgerFor(state.ledger, slug);
  if (entries.length === 0) return null;
  const names = Object.fromEntries([
    [story.lead.slug, story.lead.name],
    ...story.correspondents.map((c) => [c.slug, c.name] as const),
  ]);
  return sections(fill(story, 'ledger'), renderLedger(entries, names));
}

export function adminSection(story: VossStory, notes: string[]): string | null {
  const kept = notes.map((n) => n.trim()).filter(Boolean);
  return kept.length ? sections(fill(story, 'admin_notes'), kept.map((n) => `- ${n}`).join('\n')) : null;
}

// ─── The checker's material ─────────────────────────────────────────────────

/** The whole truth for the checker, from the Story document: author only, never a writer's. */
export function caseFile(story: VossStory): string {
  const list = (items: string[]) => items.map((i) => `- ${i}`).join('\n');
  return sections(
    '## Plot keys',
    list(story.plotKeys.map((p) => `**${p.key}**: ${p.fact}`)),
    '## Calendar',
    list(story.calendar.events.map((e) => `${e.date}: ${e.what}`)),
    '## The Lead',
    story.lead.sheet,
    '## Clues',
    list(story.clues.map((c) => `**${c.key}** (from ${c.from.join(', ')}): ${c.clue}`)),
    list(story.panorama.clues.map((c) => `**${c.key}** (Adelaide): ${c.clue}`)),
    '## Evidence',
    list(story.evidence.map((e) => `**${e.key}**: ${e.name}. ${e.howObtained}`)),
    "## The offices' documents",
    ...story.documents.map((d) => `### ${d.title} (${d.holder})\n\n${d.text}`),
  );
}

/** What the Character is and knows, for the checker: its view and what it has learned since. */
export function characterSheet(story: VossStory, c: VossCorrespondent): string {
  return sections(c.kind === 'office' ? story.pipeline.officeStyle : null, c.writerView, c.leadView);
}

export { sections };
