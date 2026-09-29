// PROTOTYPE — throwaway. The smallest Engine that exercises every Hook:
// two Characters, an archive that answers with an Enclosure, a culprit the
// Player must name, and a tribunal Epilogue enclosing the dispositivo.

import { z } from 'zod';
import type { DraftBatch, Engine, Finding, OutgoingLetter, PlayerLetter } from './contract';

const dataSchema = z.object({
  characters: z.array(z.object({ slug: z.string(), name: z.string(), address: z.string() })),
  /** Written only by the archive; never a Contact at start. */
  archive: z.object({ slug: z.string(), name: z.string(), address: z.string() }),
  culprit: z.string(),
  turns: z.number().int().positive(),
  startDate: z.string(),
  opening: z.string(),
});
type FakeData = z.infer<typeof dataSchema>;

const stateSchema = z.object({
  storyDate: z.string(),
  turnsPlayed: z.number().int(),
  archiveUnlocked: z.boolean(),
  namedCulprit: z.boolean(),
  ledger: z.array(z.string()),
});
type FakeState = z.infer<typeof stateSchema>;

const effectsSchema = z.object({ namedCulprit: z.boolean(), unlocksArchive: z.boolean(), storyDate: z.string() });

const replySchema = z.object({ body: z.string(), texture: z.array(z.string()) });

const wordCount = (text: string) => text.trim().split(/\s+/).length;

export const fakeEngine: Engine<FakeData, FakeState> = {
  id: 'engine-fake',
  schema: { data: dataSchema, state: stateSchema },
  maxLettersPerTurn: 3,

  async startGame(_ctx, { story }) {
    return {
      state: { storyDate: story.startDate, turnsPlayed: 0, archiveUnlocked: false, namedCulprit: false, ledger: [] },
      opening: [
        { key: 'opening', kind: 'letter', from: story.characters[0].slug, storyDate: story.startDate, body: story.opening, enclosures: [] },
      ],
    };
  },

  cast(story) {
    return {
      lead: { slug: 'lombardo', name: 'Commissario Giacomo Lombardo', address: 'Commissariato, Isola', kind: 'person' },
      correspondents: [
        ...story.characters.map((c) => ({ ...c, kind: 'person' as const })),
        { ...story.archive, kind: 'office' },
        { slug: 'pm', name: 'Procura della Repubblica di Roma', address: 'Piazzale Clodio, Roma', kind: 'office' },
        { slug: 'il-messaggero', name: 'Il Messaggero', kind: 'newspaper' },
      ],
    };
  },

  contacts({ story, state }) {
    const people = state.archiveUnlocked ? [...story.characters, story.archive] : story.characters;
    return people.map((p) => p.slug);
  },

  validateSubmission(view, submission) {
    const findings: Finding[] = [];
    if (submission.length === 0) findings.push({ rule: 'empty', severity: 'error', message: 'Write at least one Letter.' });
    if (submission.length > this.maxLettersPerTurn)
      findings.push({ rule: 'too_many', severity: 'error', message: `At most ${this.maxLettersPerTurn} Letters.` });
    const allowed = new Set(this.contacts(view));
    for (const letter of submission)
      if (!allowed.has(letter.to)) findings.push({ rule: 'not_a_contact', severity: 'error', message: `${letter.to} is not a Contact.` });
    return findings;
  },

  async generateTurn(ctx, view, request) {
    const { story, state } = view;
    const replyDate = ctx.dates.addDays(state.storyDate, 7 + Math.floor(ctx.random('post') * 4));

    const writeReply = async (to: PlayerLetter, guidance?: string): Promise<OutgoingLetter> => {
      const isArchive = to.to === story.archive.slug;
      const reply = await ctx.ai.structured(isArchive ? 'clerk' : 'writer', {
        purpose: `reply:${to.to}`,
        character: to.to,
        cachedPrefix: `You are ${to.to}.`,
        system: [`Reply as ${to.to}.`, ...ctx.adminNotes.map((n) => `Admin: ${n.text}`), guidance ? `Guidance: ${guidance}` : '']
          .filter(Boolean)
          .join('\n'),
        user: to.body,
        schema: replySchema,
      });
      return {
        key: `reply:${to.to}`,
        kind: 'letter',
        from: to.to,
        storyDate: replyDate,
        body: reply.body,
        enclosures: isArchive
          ? [{ key: 'certificate', kind: 'document', title: 'Certificato di stato di famiglia', body: `Patrigno: ${story.culprit}` }]
          : [],
      };
    };

    const effects = {
      namedCulprit: view.submission.some((l) => l.body.includes(story.culprit)),
      unlocksArchive: view.submission.some((l) => /archivio/i.test(l.body)),
      storyDate: replyDate,
    };

    if (request.kind === 'letter') {
      const target = view.submission.find((l) => `reply:${l.to}` === request.letterKey);
      if (!target) throw new Error(`No Player letter behind ${request.letterKey}`);
      const replaced = await writeReply(target, request.guidance);
      return {
        ...request.draft,
        letters: request.draft.letters.map((l) => (l.key === request.letterKey ? { ...replaced, storyDate: l.storyDate } : l)),
      };
    }

    const letters = await Promise.all(view.submission.map((l) => writeReply(l, request.guidance)));
    if (effects.unlocksArchive && !state.archiveUnlocked)
      letters.push({
        key: 'dispatch:archive',
        kind: 'dispatch',
        from: story.archive.slug,
        storyDate: ctx.dates.addDays(state.storyDate, 1),
        body: 'TELEGRAMMA — Archivio disponibile per richieste ufficiali.',
        enclosures: [],
      });
    return { letters, submissionDate: state.storyDate, effects, adminNotes: [`Named culprit: ${effects.namedCulprit}`] };
  },

  async validateDraft(_ctx, view, draft: DraftBatch) {
    const findings: Finding[] = [];
    for (const letter of draft.letters) {
      if (wordCount(letter.body) > 800)
        findings.push({ rule: 'length', severity: 'error', message: 'Over 800 words.', letterKey: letter.key });
      const echoed = view.submission.some((p) => p.body.length > 20 && letter.body.includes(p.body.slice(0, 20)));
      if (echoed) findings.push({ rule: 'no_echo', severity: 'error', message: 'Echoes the Player.', letterKey: letter.key });
    }
    return findings;
  },

  async applyTurn(ctx, view, approved) {
    const effects = effectsSchema.parse(approved.effects);
    const { texture } = await ctx.ai.structured('analyst', {
      purpose: 'ledger',
      system: 'List every piece of Texture in these Letters.',
      user: approved.letters.map((l) => l.body).join('\n---\n'),
      schema: z.object({ texture: z.array(z.string()) }),
    });
    return {
      storyDate: effects.storyDate,
      turnsPlayed: view.state.turnsPlayed + 1,
      archiveUnlocked: view.state.archiveUnlocked || effects.unlocksArchive,
      namedCulprit: view.state.namedCulprit || effects.namedCulprit,
      ledger: [...view.state.ledger, ...texture],
    };
  },

  resolveEnding({ story, state }) {
    if (state.turnsPlayed < story.turns) return null;
    return { key: state.namedCulprit ? 'caught' : 'escaped', detail: { score: state.namedCulprit ? 1 : 0 } };
  },

  async generateEpilogue(ctx, { story, state }, ending) {
    const date = ctx.dates.addDays(state.storyDate, 30);
    if (ending.key === 'escaped')
      return {
        letters: [{ key: 'clipping', kind: 'dispatch', from: 'il-messaggero', storyDate: date, body: 'Il caso resta irrisolto.', enclosures: [] }],
        effects: null,
        adminNotes: [],
      };
    const verdict = await ctx.ai.text('writer', {
      purpose: 'epilogue:pm',
      system: 'Write as the Pubblico Ministero.',
      user: `Ending ${ending.key}, dated ${ctx.dates.format(date)}.`,
    });
    return {
      letters: [
        {
          key: 'epilogue:pm',
          kind: 'epilogue',
          from: 'pm',
          storyDate: date,
          body: verdict,
          enclosures: [{ key: 'dispositivo', kind: 'document', title: 'Dispositivo', body: `${story.culprit}: colpevole.` }],
        },
      ],
      effects: null,
      adminNotes: [`Score ${JSON.stringify(ending.detail)}`],
    };
  },
};
