import { z } from 'zod';
import {
  COLLISION_RULE,
  composeLetter,
  type ComposedLetter,
  findPlotKeyCollisions,
  ledgerFromReader,
  type DraftBatch,
  type Enclosure,
  type Finding,
  type GameView,
  type GenerateRequest,
  type HookContext,
  type Json,
  type OutgoingLetter,
  type ReaderNotes,
} from '@imbustai/story-runtime';
import { turnRow } from '../mechanics/calendar';
import { vossStateSchema, type VossState } from '../mechanics/state';
import { playTurn, type FixedText, type OfficePlan, type TurnPlan } from '../mechanics/turn';
import type { VossStory } from '../schema';
import {
  adelaideTurnState,
  adminSection,
  caseFile,
  characterSheet,
  correspondenceWith,
  correspondent,
  documentOf,
  fill,
  knownText,
  ledgerSection,
  longDate,
  officeBrief,
  officePrefix,
  personPrefix,
  plainTurnState,
  readerSection,
  reservedTerms,
  sections,
  vossTurnState,
} from './prompts';
import { readSubmission, type ReaderBySlug } from './read';

// The writing pipeline (Imbustai/imbustai-app#41): the Turn plan in, the
// batch out. `generateTurn` reads the Lead's Letters, lets the mechanics plan
// the Turn, and writes each Letter the plan calls for: a fixed text as
// authored, anything else through the runtime's `composeLetter` (writer, the
// Plot-key collision check, the reply-rule checker, at most one rewrite, the
// editing pass). The state after the batch, the plan and the reader's notes
// ride in the draft's `effects`.

/**
 * What a Voss draft carries in `effects`: the state after the batch, the plan
 * its Letters were written from, and the reader's notes per addressee (a
 * regenerated Letter is checked against the same questions).
 */
export const vossEffectsSchema = z.object({
  state: vossStateSchema,
  plan: z.unknown(),
  reader: z.record(z.string(), z.unknown()).default({}),
});
export interface VossEffects {
  state: VossState;
  plan: TurnPlan;
  reader: ReaderBySlug;
}

export function effectsOf(draft: DraftBatch): VossEffects {
  return vossEffectsSchema.parse(draft.effects) as VossEffects;
}

type View = GameView<VossStory, VossState>;

/** One Letter the plan calls for. */
type Job =
  | { key: string; type: 'person'; slug: string; date: string; fixed: FixedText | null }
  | { key: string; type: 'office'; office: OfficePlan }
  | { key: string; type: 'dispatch'; text: string; from: string; date: string };

/** The Letters of batch N, in the order the Player finds them: people, offices, clippings. */
export function jobsOf(plan: TurnPlan): Job[] {
  const jobs: Job[] = [];
  if (plan.voss) jobs.push({ key: 'voss', type: 'person', slug: 'voss', date: plan.voss.date, fixed: plan.voss.fixedLetter });
  if (plan.adelaide) {
    jobs.push({ key: 'adelaide', type: 'person', slug: 'adelaide', date: plan.adelaide.date, fixed: plan.adelaide.fixedLetter });
  }
  if (plan.armando) jobs.push({ key: 'armando', type: 'person', slug: 'armando', date: plan.armando.date, fixed: null });
  const seen = new Map<string, number>();
  for (const office of plan.offices) {
    const base = `office:${office.office}:${office.turn}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    jobs.push({ key: n === 0 ? base : `${base}:${n + 1}`, type: 'office', office });
  }
  for (const d of plan.dispatches) jobs.push({ key: `dispatch:${d.key}`, type: 'dispatch', text: d.key, from: d.from, date: d.date });
  return jobs;
}

export async function generateTurn(ctx: HookContext, view: View, request: GenerateRequest): Promise<DraftBatch> {
  if (request.kind === 'letter') return regenerateLetter(ctx, view, request);

  const { story, state, turn } = view;
  const read = await readSubmission(ctx, view);
  const { plan, state: next } = playTurn(story, state, { turn, letters: read.letters, random: ctx.random });
  for (const [slug, notes] of Object.entries(read.notes)) {
    next.ledger.push(...ledgerFromReader(notes, { turn, lead: story.lead.slug, character: slug }));
  }

  const guidance = request.guidance ? [request.guidance] : [];
  // Writers see the state the batch leaves: what it delivers, and what the Lead has just said of himself.
  const after = { ...view, state: next };
  const written = await Promise.all(jobsOf(plan).map((job) => write(ctx, after, plan, read.notes, job, guidance)));
  return {
    letters: written.map((w) => w.letter),
    submissionDate: plan.submissionDate,
    effects: JSON.parse(JSON.stringify({ state: next, plan, reader: read.notes })) as Json,
    adminNotes: [...plan.adminNotes, ...written.flatMap((w) => w.adminNotes)],
  };
}

/** One Letter again, with the admin's guidance: same plan, same state, the other Letters untouched. */
async function regenerateLetter(
  ctx: HookContext,
  view: View,
  request: Extract<GenerateRequest, { kind: 'letter' }>,
): Promise<DraftBatch> {
  const { state, plan, reader } = effectsOf(request.draft);
  const job = jobsOf(plan).find((j) => j.key === request.letterKey);
  if (!job) throw new Error(`engine-voss: the draft has no Letter "${request.letterKey}"`);
  const { letter, adminNotes } = await write(ctx, { ...view, state }, plan, reader, job, [request.guidance]);
  const had = request.draft.letters.some((l) => l.key === job.key);
  return {
    ...request.draft,
    letters: had ? request.draft.letters.map((l) => (l.key === job.key ? letter : l)) : [...request.draft.letters, letter],
    adminNotes: [...request.draft.adminNotes, ...adminNotes],
  };
}

interface Written {
  letter: OutgoingLetter;
  adminNotes: string[];
}

async function write(
  ctx: HookContext,
  view: View,
  plan: TurnPlan,
  reader: ReaderBySlug,
  job: Job,
  guidance: string[],
): Promise<Written> {
  const { story } = view;
  if (job.type === 'dispatch') {
    const text = fixedText(story, job.text);
    return {
      letter: { key: job.key, kind: 'dispatch', from: job.from, storyDate: job.date, body: text.text, enclosures: text.enclosures },
      adminNotes: [],
    };
  }
  if (job.type === 'office') return writeOffice(ctx, view, plan, reader, job.key, job.office, guidance);
  if (job.fixed) return writeFixed(ctx, story, job.key, job.slug, job.date, job.fixed);
  return writePerson(ctx, view, plan, reader, job.key, job.slug, job.date, guidance);
}

function fixedText(story: VossStory, key: string) {
  const t = story.texts.find((x) => x.key === key);
  if (!t) throw new Error(`engine-voss: no fixed text "${key}"`);
  return t;
}

/**
 * An authored Letter: sent as written when no variant applies. A variant is
 * a small authored change; the Character's own model applies it to the text.
 */
async function writeFixed(
  ctx: HookContext,
  story: VossStory,
  key: string,
  slug: string,
  date: string,
  fixed: FixedText,
): Promise<Written> {
  const text = fixedText(story, fixed.key);
  const c = correspondent(story, slug);
  const letter: OutgoingLetter = { key, kind: 'letter', from: slug, storyDate: date, body: text.text, enclosures: text.enclosures };
  const changes = text.variants.filter((v) => fixed.variants.includes(v.when));
  if (changes.length === 0) return { letter, adminNotes: [`${slug}: the fixed text «${fixed.key}», as authored`] };

  const body = await ctx.ai.text(c.kind === 'person' ? 'writer' : 'clerk', {
    purpose: 'fixed',
    character: slug,
    system: fill(story, 'writer_fixed', {
      name: c.name,
      changes: changes.map((v) => `- ${v.change}`).join('\n'),
      text: text.text,
    }),
    user: fill(story, 'ask_person', { name: c.name, lead: story.lead.name, date: longDate(ctx.dates, date) }),
    effort: 'low',
  });
  return {
    letter: { ...letter, body: body.trim() },
    adminNotes: [`${slug}: the fixed text «${fixed.key}» with ${changes.length} variant(s): ${changes.map((v) => v.when).join('; ')}`],
  };
}

async function writePerson(
  ctx: HookContext,
  view: View,
  plan: TurnPlan,
  reader: ReaderBySlug,
  key: string,
  slug: string,
  date: string,
  guidance: string[],
): Promise<Written> {
  const { story, state, history, submission } = view;
  const c = correspondent(story, slug);
  const lead = story.lead.name;
  const written = submission.some((l) => l.to === slug);
  const notes: ReaderNotes | undefined = reader[slug];

  const turnState =
    slug === 'voss' && plan.voss
      ? vossTurnState(story, ctx.dates, state, plan, plan.voss, written)
      : slug === 'adelaide' && plan.adelaide
        ? adelaideTurnState(story, ctx.dates, plan, plan.adelaide, written)
        : plainTurnState(story, ctx.dates, plan, slug, date);

  const enclosures: Enclosure[] =
    slug === 'adelaide' && plan.adelaide?.reveal ? fixedText(story, 'adelaide_reveal').enclosures : [];

  const composed = await composeLetter(ctx.ai, {
    character: c,
    lead,
    language: story.locale,
    writer: {
      cachedPrefix: personPrefix(story, c),
      system: fill(story, 'writer_person', { name: c.name, lead }),
      user: sections(
        correspondenceWith(story, ctx.dates, slug, history, submission, plan.submissionDate),
        readerSection(story, notes),
        turnState,
        ledgerSection(story, state, slug),
        adminSection(story, [...ctx.adminNotes.map((n) => n.text), ...guidance]),
        fill(story, 'ask_person', { name: c.name, lead, date: longDate(ctx.dates, date) }),
      ),
      // Thinking included: Voss has no length cap.
      maxTokens: 32000,
    },
    check: {
      caseFile: caseFile(story),
      storyRules: story.pipeline.storyRules,
      characterSheet: characterSheet(story, c),
      turnState,
      playerLetter: submission.filter((l) => l.to === slug).map((l) => l.body).join('\n\n---\n\n') || undefined,
      readerNotes: notes,
      plotKeys: { reserved: reservedTerms(story), knownText: knownText(slug, history, submission) },
    },
    edit: { voice: c.voice ?? undefined, examples: c.examples.map((e) => e.text).join('\n\n---\n\n') || undefined },
  });

  return {
    letter: { key, kind: 'letter', from: slug, storyDate: date, body: composed.body, enclosures },
    adminNotes: [...composed.adminNotes, ...mustNotes(slug, composed)],
  };
}

async function writeOffice(
  ctx: HookContext,
  view: View,
  plan: TurnPlan,
  reader: ReaderBySlug,
  key: string,
  office: OfficePlan,
  guidance: string[],
): Promise<Written> {
  const { story, history, submission } = view;
  const c = correspondent(story, office.office);
  const base = { key, kind: 'letter' as const, from: c.slug, storyDate: office.date };
  const enclosures: Enclosure[] = office.documents.map((d) => {
    const doc = documentOf(story, d);
    return { key: doc.key, kind: 'document', title: doc.title, body: doc.text };
  });
  if (office.fixedLetter) {
    const text = fixedText(story, office.fixedLetter.key);
    return {
      letter: { ...base, body: text.text, enclosures: [...text.enclosures, ...enclosures] },
      adminNotes: [`${c.slug}: the fixed text «${office.fixedLetter.key}», as authored`],
    };
  }

  // The Letter it answers: written to it, or to the office that forwarded the request.
  const addressee = office.forwardedFrom ?? office.office;
  const asked =
    office.turn === plan.turn
      ? submission.filter((l) => l.to === addressee).map((l) => l.body)
      : history.filter((l) => l.direction === 'out' && l.turn === office.turn && l.to === addressee).map((l) => l.body);
  const playerLetter = asked.join('\n\n---\n\n');
  const row = turnRow(story, office.turn);
  const lead = story.lead.name;
  const brief = officeBrief(story, office);

  const composed = await composeLetter(ctx.ai, {
    character: c,
    lead,
    language: story.locale,
    writer: {
      cachedPrefix: officePrefix(story, c),
      system: fill(story, 'writer_office', { name: c.name, lead }),
      user: sections(
        fill(story, 'office_letter', {
          lead,
          playerDate: longDate(ctx.dates, row.playerDate),
          arrivesRome: longDate(ctx.dates, row.arrivesRome),
        }),
        playerLetter,
        brief,
        adminSection(story, guidance),
        fill(story, 'ask_office', { name: c.name, date: longDate(ctx.dates, office.date) }),
      ),
    },
    check: {
      caseFile: caseFile(story),
      storyRules: story.pipeline.storyRules,
      characterSheet: characterSheet(story, c),
      turnState: brief,
      playerLetter: playerLetter || undefined,
      readerNotes: office.turn === plan.turn ? reader[addressee] : undefined,
      plotKeys: { reserved: reservedTerms(story), knownText: [playerLetter, ...knownText(c.slug, history, submission)] },
    },
    edit: { voice: story.pipeline.officeStyle },
  });

  return { letter: { ...base, body: composed.body, enclosures }, adminNotes: [...composed.adminNotes, ...mustNotes(c.slug, composed)] };
}

/** What the one rewrite was asked to fix, for the admin: the count alone says nothing to review against. */
function mustNotes(slug: string, composed: ComposedLetter): string[] {
  return composed.check.mustFix.map((m) => `${slug}: must (${m.rule}) «${m.quote}»: ${m.problem}`);
}

// ─── validateDraft ──────────────────────────────────────────────────────────

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

/**
 * Re-run after every generation and every admin edit, so it calls no model:
 * the batch holds exactly the Letters its plan calls for, none is empty, no
 * generated Letter uses a Plot-key name its sender does not know (an error:
 * it would plant a false clue), every office encloses the documents the
 * mechanics counted, and a Character with a word limit stays near it.
 */
export function validateDraft(view: View, draft: DraftBatch): Finding[] {
  const { story, history, submission, turn } = view;
  const parsed = vossEffectsSchema.safeParse(draft.effects);
  if (!parsed.success) {
    return [{ rule: 'effects', severity: 'error', message: 'The draft carries no valid engine-voss effects.' }];
  }
  const { state, plan } = parsed.data as VossEffects;
  const findings: Finding[] = [];
  if (state.batch !== turn) {
    findings.push({ rule: 'effects', severity: 'error', message: `The effects are for batch ${state.batch}, not Turn ${turn}.` });
  }

  const jobs = jobsOf(plan);
  const reserved = reservedTerms(story);
  for (const job of jobs) {
    const letter = draft.letters.find((l) => l.key === job.key);
    if (!letter) {
      findings.push({ rule: 'missing_letter', severity: 'error', message: `The plan calls for the Letter "${job.key}".`, letterKey: job.key });
      continue;
    }
    if (!letter.body.trim()) {
      findings.push({ rule: 'empty_letter', severity: 'error', message: 'The Letter is empty.', letterKey: job.key });
      continue;
    }
    // Authored texts are the Story's own: only generated Letters are checked.
    const authored = job.type === 'dispatch' || (job.type === 'person' ? job.fixed !== null : job.office.fixedLetter !== null);
    if (authored) continue;

    const slug = job.type === 'person' ? job.slug : job.office.office;
    const known = knownText(slug, history, submission);
    if (job.type === 'office') {
      const addressee = job.office.forwardedFrom ?? job.office.office;
      known.push(...knownText(addressee, history, submission));
      for (const d of job.office.documents) {
        if (!letter.enclosures.some((e) => e.key === d)) {
          findings.push({ rule: 'missing_enclosure', severity: 'error', message: `The Letter must enclose "${d}".`, letterKey: job.key });
        }
      }
    }
    for (const hit of findPlotKeyCollisions(letter.body, { character: slug, reserved, knownText: known })) {
      findings.push({
        rule: COLLISION_RULE,
        severity: 'error',
        message: `"${hit.term}" is a Plot key ${slug} does not know: «${hit.quote}»`,
        letterKey: job.key,
      });
    }
    const { length } = correspondent(story, slug);
    const count = words(letter.body);
    if (length && (count > length.max * 1.25 || count < length.min * 0.5)) {
      findings.push({
        rule: 'length',
        severity: 'warning',
        message: `${count} words; ${slug} writes ${length.min}–${length.max}.`,
        letterKey: job.key,
      });
    }
  }
  for (const letter of draft.letters) {
    if (!jobs.some((j) => j.key === letter.key)) {
      findings.push({ rule: 'unplanned_letter', severity: 'error', message: 'The plan does not call for this Letter.', letterKey: letter.key });
    }
  }
  return findings;
}
