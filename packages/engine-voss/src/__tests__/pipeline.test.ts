import { describe, expect, it } from 'vitest';
import {
  createAiAccess,
  createHookContext,
  DEFAULT_MODEL_PROFILE,
  MockProvider,
  type DeliveredLetter,
  type DraftBatch,
  type GameView,
  type PlayerLetter,
  type StructuredRequest,
  type TextRequest,
  type UsageRecord,
} from '@imbustai/story-runtime';
import { vossEngine, vossEffectsSchema, type VossState } from '../engine';
import { initialState } from '../mechanics/state';
import type { VossStory } from '../schema';
import { adelaide, office, play, story, voss, warm } from './script';

// The writing pipeline through the Engine's Hooks, as the platform calls
// them, with a scripted model behind the hook context: the reader's signals
// are scripted per addressee, writers return a marked Letter, the checker and
// the Ledger return what each test sets.

const OPENING: DeliveredLetter = {
  direction: 'in',
  turn: 0,
  key: 'opening:voss',
  kind: 'letter',
  from: 'voss',
  storyDate: '1987-09-05',
  body: story.opening.letter.body,
  enclosures: [],
};

const NOTES = {
  questions: ["Com'era Luca quando l'avete arrestato?"],
  claimsAboutSelf: ['Ha una sorella a Cremona'],
  actions: [],
  hypotheses: [],
  requests: [],
  answersToCharacterQuestions: [],
  tone: 'Asciutto.',
};

interface Script {
  /** Reader signals per addressee slug. */
  signals?: Record<string, unknown>;
  /** The writer's Letter, by Character name found in the writer prompt. */
  write?: (request: TextRequest) => string;
  check?: (request: StructuredRequest) => unknown;
  texture?: string[];
  report?: { showpieces: string[]; clues: string[] };
}

function harness(script: Script = {}) {
  const usage: UsageRecord[] = [];
  const provider = new MockProvider(
    (request) => {
      switch (request.format.name) {
        case 'reader': {
          const to = Object.keys(script.signals ?? {}).find((slug) =>
            request.user.includes(`Letter to ${story.correspondents.find((c) => c.slug === slug)!.name}`),
          );
          return { ...NOTES, signals: to ? script.signals![to] : {} };
        }
        case 'checker':
          return script.check?.(request) ?? { issues: [], questionsAnswered: [] };
        case 'ledger':
          return { facts: script.texture ?? [] };
        case 'ledger_report':
          return script.report ?? { showpieces: [], clues: [] };
        default:
          throw new Error(`unexpected structured call "${request.format.name}"`);
      }
    },
    (request) => {
      // The editing pass returns the Letter it was given.
      if (request.system.startsWith('Rileggi')) return request.user.split('\n\n').slice(1).join('\n\n');
      return script.write?.(request) ?? 'Roma, 22 settembre 1987\n\nCaro Giacomo,\n\nuna Lettera.\n\nFlorian';
    },
  );
  const ai = createAiAccess({
    profile: {
      ...DEFAULT_MODEL_PROFILE,
      characters: { voss: { analyst: { model: 'claude-opus-5-5', effort: 'high' } } },
    },
    providerFor: () => provider,
    turn: 1,
    onUsage: (u) => usage.push(u),
  });
  const ctx = createHookContext({ ai, gameId: 'g', turn: 1, locale: 'it-IT' });
  return { ctx, provider, usage };
}

function viewOf(
  submission: PlayerLetter[],
  over: Partial<GameView<VossStory, VossState>> = {},
): GameView<VossStory, VossState> {
  return { gameId: 'g', story, state: initialState(story), turn: 1, history: [OPENING], submission, ...over };
}

const toVoss: PlayerLetter = { to: 'voss', body: "Caro Florian, com'era Luca quando l'avete arrestato? Mia sorella mi scrive da Cremona." };
const vossSignals = (warm({ asksAbout1977: true }) as { signals: unknown }).signals;

const callsOf = (usage: UsageRecord[]) => usage.map((u) => `${u.role}:${u.purpose}:${u.character ?? ''}:${u.model}`);

describe('generateTurn, Turn 1', () => {
  it('reads the Letter, plans the Turn and sends Voss\'s reply through writer, checker and editing pass', async () => {
    const h = harness({ signals: { voss: vossSignals } });
    const draft = await vossEngine.generateTurn(h.ctx, viewOf([toVoss]), { kind: 'batch' });

    expect(draft.letters).toHaveLength(1);
    expect(draft.letters[0]).toMatchObject({ key: 'voss', kind: 'letter', from: 'voss', enclosures: [] });
    expect(draft.letters[0].body).toContain('Caro Giacomo,');
    // The mechanics date both sides.
    expect(draft.submissionDate).toBe('1987-09-14');
    expect(draft.letters[0].storyDate >= '1987-09-22' && draft.letters[0].storyDate <= '1987-09-24').toBe(true);

    // Voss is read and checked on his stronger analyst; Fable writes and edits.
    expect(callsOf(h.usage)).toEqual([
      'analyst:reader:voss:claude-opus-5-5',
      'writer:reply:voss:claude-fable-5-1',
      'analyst:checker:voss:claude-opus-5-5',
      'writer:editor:voss:claude-fable-5-1',
    ]);

    // The state after the batch rides in effects, with the plan it was written from.
    const effects = vossEffectsSchema.parse(draft.effects);
    expect(effects.state.batch).toBe(1);
    expect(effects.state.trust).toBe(4);
    expect(effects.state.layers).toMatchObject({ '1': 1 });
    expect(effects.state.ledger).toEqual([
      { turn: 1, teller: 'lombardo', audience: 'voss', fact: 'Ha una sorella a Cremona' },
    ]);
  });

  it('writes from the cached writer view and the Turn plan, and never shows the writer the answer', async () => {
    const h = harness({ signals: { voss: vossSignals } });
    await vossEngine.generateTurn(h.ctx, viewOf([toVoss]), { kind: 'batch' });
    const [writer] = h.provider.textRequests;
    const vossSheet = story.correspondents.find((c) => c.slug === 'voss')!;

    expect(writer.cachedPrefix).toContain(vossSheet.writerView!);
    expect(writer.cachedPrefix).toContain(vossSheet.examples[0].text);
    expect(writer.user).toContain(story.opening.letter.body);
    expect(writer.user).toContain(toVoss.body);
    // Layer 1 was earned by the question about 1977; the batch-1 Aldo clue is due.
    expect(writer.user).toContain(story.voss.layers[1].says);
    expect(writer.user).toContain('Aldo è un ex capotreno, vedovo, «nessuno al mondo».');
    // What already happened and he would tell if asked: the 3 September, not the October that has not come.
    expect(writer.user).toContain(story.clues.find((c) => c.key === 'K4')!.clue);
    expect(writer.user).not.toContain('nipote');
    // The door: he wrote to no office, so Voss points at the Cancelleria.
    expect(writer.user).toContain("Cancelleria della Corte d'Assise di Roma");
    // No length cap for Voss.
    expect(writer.user).not.toContain('Lunghezza');

    const everything = `${writer.cachedPrefix}\n${writer.system}\n${writer.user}`;
    for (const secret of ['Ferrante', 'Carini', 'patrigno', 'chiave quadra', 'K2', 'K4']) {
      expect(everything).not.toContain(secret);
    }
  });

  it('gives the checker the case file, the Story\'s own rules, the Turn state and the reader\'s questions', async () => {
    const h = harness({ signals: { voss: vossSignals } });
    await vossEngine.generateTurn(h.ctx, viewOf([toVoss]), { kind: 'batch' });
    const checker = h.provider.requests.find((r) => r.format.name === 'checker')!;

    expect(checker.cachedPrefix).toContain(story.plotKeys.find((p) => p.key === 'aldo')!.fact);
    expect(checker.cachedPrefix).toContain(story.pipeline.storyRules);
    expect(checker.user).toContain(story.voss.layers[1].says);
    expect(checker.user).toContain(NOTES.questions[0]);
  });

  it('rewrites once, in the writer\'s own conversation, when the checker finds a must', async () => {
    let drafts = 0;
    const h = harness({
      signals: { voss: vossSignals },
      write: () => (++drafts === 1 ? 'Caro Giacomo,\n\nhai ragione.\n\nFlorian' : 'Caro Giacomo,\n\nnon ti seguo.\n\nFlorian'),
      check: () => ({
        issues: [{ rule: 'voice', severity: 'must', quote: 'hai ragione', problem: 'Banned phrase.', fix: 'Push back with a reason.' }],
        questionsAnswered: [],
      }),
    });
    const draft = await vossEngine.generateTurn(h.ctx, viewOf([toVoss]), { kind: 'batch' });

    expect(draft.letters[0].body).toContain('non ti seguo');
    expect(h.usage.filter((u) => u.purpose === 'rewrite')).toHaveLength(1);
    expect(h.usage.filter((u) => u.purpose === 'checker')).toHaveLength(1);
    expect(draft.adminNotes.join('\n')).toContain('rewritten once');
  });

  it('flags a Plot-key name the writer invented, and a Letter that still has it holds the draft', async () => {
    const h = harness({
      signals: { voss: vossSignals },
      write: () => 'Caro Giacomo,\n\nallo sportello viene una signora di via Carini.\n\nFlorian',
    });
    const view = viewOf([toVoss]);
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    expect(h.usage.filter((u) => u.purpose === 'rewrite')).toHaveLength(1);

    const findings = await vossEngine.validateDraft(h.ctx, view, draft);
    expect(findings).toEqual([
      expect.objectContaining({ rule: 'plot_key_collision', severity: 'error', letterKey: 'voss' }),
    ]);
  });

  it('answers the same day from the Garbatella, and keeps the other offices for their own batch', async () => {
    const h = harness({
      signals: {
        voss: vossSignals,
        garbatella: (office('garbatella', { reportsBenvenuti: true }) as { signals: unknown }).signals,
        cancelleria: (office('cancelleria', { requestKeys: ['trial_ref'] }) as { signals: unknown }).signals,
      },
      write: (r) => (r.cachedPrefix?.includes('Gli uffici di Roma') ? 'COMMISSARIATO DI P.S. GARBATELLA\n\nSi trasmette per competenza.' : 'Caro Giacomo,\n\nFlorian'),
    });
    const draft = await vossEngine.generateTurn(
      h.ctx,
      viewOf([
        toVoss,
        { to: 'garbatella', body: 'Segnalo che la signora Clara Benvenuti è in pericolo.' },
        { to: 'cancelleria', body: 'Chiedo copia degli atti del processo contro Moretti Luca.' },
      ]),
      { kind: 'batch' },
    );

    expect(draft.letters.map((l) => l.from)).toEqual(['voss', 'garbatella']);
    const office1 = draft.letters[1];
    expect(office1.body).toContain('per competenza');
    // An office is written and edited by the clerk, and checked on the default analyst.
    expect(callsOf(h.usage).filter((c) => c.includes(':garbatella:'))).toEqual([
      'analyst:reader:garbatella:claude-sonnet-5-5',
      'clerk:reply:garbatella:claude-sonnet-5-5',
      'analyst:checker:garbatella:claude-sonnet-5-5',
      'clerk:editor:garbatella:claude-sonnet-5-5',
    ]);
    // Voss was not pointed at a door: the Lead wrote to offices himself.
    const effects = vossEffectsSchema.parse(draft.effects);
    expect(effects.state.pending.map((p) => p.office)).toContain('cancelleria');
  });
});

describe('generateTurn, later batches', () => {
  it('sends an office\'s documents as Enclosures with the Story\'s text, listed and never copied', async () => {
    // Turn 1 asked the Stato Civile for Luca's acts: two weeks of office time, read with batch 2.
    const after1 = play([[voss(), office('stato_civile', { requestKeys: ['luca_name'] })]]).final;
    const h = harness({
      write: (r) => (r.cachedPrefix?.includes('Gli uffici di Roma') ? 'UFFICIO DI STATO CIVILE\n\nSi trasmettono in copia conforme gli atti.' : 'Caro Giacomo,\n\nFlorian'),
    });
    const history: DeliveredLetter[] = [
      OPENING,
      { direction: 'out', turn: 1, to: 'stato_civile', storyDate: '1987-09-14', body: 'Chiedo gli atti di Moretti Luca.' },
    ];
    const draft = await vossEngine.generateTurn(h.ctx, viewOf([], { state: after1, turn: 2, history }), { kind: 'batch' });

    const reply = draft.letters.find((l) => l.from === 'stato_civile')!;
    const death = story.documents.find((d) => d.key === 'stato_civile_morte_luca')!;
    expect(reply.enclosures).toContainEqual({ key: death.key, kind: 'document', title: death.title, body: death.text });
    expect(reply.body).not.toContain(death.text);
    const clerk = h.provider.textRequests.find((r) => r.cachedPrefix?.includes('Gli uffici di Roma'))!;
    expect(clerk.user).toContain('Chiedo gli atti di Moretti Luca.');
    expect(clerk.user).toContain(death.title);
    expect(clerk.user).not.toContain(death.text);

    // Adelaide's first Letter is authored: delivered as written, with no model call.
    const first = draft.letters.find((l) => l.from === 'adelaide')!;
    expect(first.body).toBe(story.texts.find((t) => t.key === 'adelaide_first_letter')!.text);
    expect(h.usage.some((u) => u.character === 'adelaide')).toBe(false);
  });

  it('sends the clipping of the third murder as a Dispatch from the newspaper', async () => {
    const after2 = play([[voss()], [voss()]]).final;
    const h = harness();
    const draft = await vossEngine.generateTurn(h.ctx, viewOf([], { state: after2, turn: 3 }), { kind: 'batch' });
    const clipping = story.texts.find((t) => t.key === 'clipping_murder_3')!;
    expect(draft.letters).toContainEqual({
      key: 'dispatch:clipping_murder_3',
      kind: 'dispatch',
      from: 'messaggero',
      storyDate: '1987-10-23',
      body: clipping.text,
      enclosures: [],
    });
  });

  it('tells Adelaide\'s writer her Panorama clues and her word limit', async () => {
    const after2 = play([[voss()], [voss()]]).final;
    const h = harness({ signals: { adelaide: (adelaide() as { signals: unknown }).signals } });
    const view = viewOf([{ to: 'adelaide', body: 'Gentile signora, mi dica del Panorama.' }], { state: after2, turn: 3 });
    await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    const sheet = story.correspondents.find((c) => c.slug === 'adelaide')!;
    const writer = h.provider.textRequests.find((r) => r.cachedPrefix?.startsWith(sheet.writerView!))!;
    expect(writer.user).toContain(story.panorama.clues.find((c) => c.key === 'I3')!.clue);
    expect(writer.user).toMatch(/300.*600 parole/);
  });
});

describe('regenerating one Letter', () => {
  it('rewrites that Letter with the admin\'s guidance and keeps the plan, the state and the other Letters', async () => {
    const h = harness({
      signals: { voss: vossSignals, garbatella: (office('garbatella') as { signals: unknown }).signals },
    });
    const view = viewOf([toVoss, { to: 'garbatella', body: 'Segnalo la signora Benvenuti.' }]);
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });

    const again = harness({ write: () => 'Caro Giacomo,\n\nuna Lettera più calda.\n\nFlorian' });
    const next = await vossEngine.generateTurn(again.ctx, view, {
      kind: 'letter',
      draft,
      letterKey: 'voss',
      guidance: 'Più caldo.',
    });

    expect(next.letters[0].body).toContain('più calda');
    expect(next.letters[1]).toEqual(draft.letters[1]);
    expect(next.effects).toEqual(draft.effects);
    // No second reading: the plan is the one the draft was written from.
    expect(again.usage.map((u) => u.purpose)).toEqual(['reply', 'checker', 'editor']);
    expect(again.provider.textRequests[0].user).toContain('Più caldo.');
    expect(again.provider.requests[0].user).toContain(NOTES.questions[0]);
  });
});

describe('validateDraft', () => {
  async function drafted() {
    const h = harness({ signals: { voss: vossSignals } });
    const view = viewOf([toVoss]);
    return { h, view, draft: await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' }) };
  }

  it('passes a generated draft with no model call', async () => {
    const { h, view, draft } = await drafted();
    const before = h.usage.length;
    expect(await vossEngine.validateDraft(h.ctx, view, draft)).toEqual([]);
    expect(h.usage).toHaveLength(before);
  });

  it('holds a draft whose Letter the admin emptied, or that lost a Letter the plan needs', async () => {
    const { h, view, draft } = await drafted();
    const emptied: DraftBatch = { ...draft, letters: [{ ...draft.letters[0], body: '  ' }] };
    expect(await vossEngine.validateDraft(h.ctx, view, emptied)).toEqual([
      expect.objectContaining({ rule: 'empty_letter', severity: 'error', letterKey: 'voss' }),
    ]);
    expect(await vossEngine.validateDraft(h.ctx, view, { ...draft, letters: [] })).toEqual([
      expect.objectContaining({ rule: 'missing_letter', severity: 'error', letterKey: 'voss' }),
    ]);
  });

  it('lets a name through once the Lead has written it himself', async () => {
    const h = harness({
      signals: { voss: vossSignals },
      write: () => 'Caro Giacomo,\n\nquel Colasanti che nomini non lo conosco.\n\nFlorian',
    });
    const view = viewOf([{ to: 'voss', body: 'Caro Florian, hai mai sentito di un certo Colasanti?' }]);
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    expect(await vossEngine.validateDraft(h.ctx, view, draft)).toEqual([]);
  });

  it('warns when a Character with a word limit runs far over it', async () => {
    const after2 = play([[voss()], [voss()]]).final;
    const h = harness({ write: () => `Egregio Commissario,\n\n${'parola '.repeat(900)}\n\nAdelaide Bellucci` });
    const view = viewOf([], { state: after2, turn: 3 });
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    expect(await vossEngine.validateDraft(h.ctx, view, draft)).toContainEqual(
      expect.objectContaining({ rule: 'length', severity: 'warning', letterKey: 'adelaide' }),
    );
  });
});

describe('applyTurn', () => {
  it('records the Texture of the Letters as sent, and a clue Voss gave early because he was asked', async () => {
    const h = harness({
      signals: { voss: vossSignals },
      texture: ['Ha una sorella a Caldaro, Martha'],
      report: { showpieces: [], clues: ['K4'] },
    });
    const view = viewOf([toVoss]);
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    const state = await vossEngine.applyTurn(h.ctx, view, draft);

    expect(state.batch).toBe(1);
    expect(state.ledger).toContainEqual({ turn: 1, teller: 'voss', audience: 'lombardo', fact: 'Ha una sorella a Caldaro, Martha' });
    // K4 is scheduled for batch 3: delivered now, it will not be given as new again.
    expect(state.clues.K4).toMatchObject({ deliveredIn: 1, status: 'ignored' });
    expect(state.clues.K5.deliveredIn).toBeNull();
    const report = h.provider.requests.find((r) => r.format.name === 'ledger_report')!;
    expect(report.user).toContain(story.clues.find((c) => c.key === 'K4')!.clue);
    expect(vossEngine.schema.state.parse(state)).toEqual(state);
  });

  it('marks a free showpiece used once it shows up in an approved Letter', async () => {
    const after2 = play([[voss()], [voss()]]).final;
    const h = harness({ report: { showpieces: ['postscripts'], clues: [] } });
    const view = viewOf([], { state: after2, turn: 3 });
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    const state = await vossEngine.applyTurn(h.ctx, view, draft);
    expect(state.signatures['adelaide.postscripts'].showpiece).toBe(3);
  });

  it('shows the next writer what the two have told each other, and nothing told to someone else', async () => {
    const h = harness({ signals: { voss: vossSignals }, texture: ['Ha una sorella a Caldaro, Martha'] });
    const view = viewOf([toVoss]);
    const draft = await vossEngine.generateTurn(h.ctx, view, { kind: 'batch' });
    const state = await vossEngine.applyTurn(h.ctx, view, draft);
    state.ledger.push({ turn: 1, teller: 'lombardo', audience: 'adelaide', fact: 'Detesta i gerani' });

    const h2 = harness({ signals: { voss: vossSignals } });
    await vossEngine.generateTurn(h2.ctx, viewOf([toVoss], { state, turn: 2 }), { kind: 'batch' });
    const writer = h2.provider.textRequests.find((r) => !r.system.startsWith('Rileggi'))!;
    expect(writer.user).toContain('Ha una sorella a Caldaro, Martha');
    expect(writer.user).toContain('Ha una sorella a Cremona');
    expect(writer.user).not.toContain('Detesta i gerani');
  });
});
