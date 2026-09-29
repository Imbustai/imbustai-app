import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createAiAccess, type UsageRecord } from '../ai/access';
import { MockProvider } from '../ai/provider';
import type { DraftBatch, Engine } from '../contract';
import { createHookContext } from '../host/context';
import { applyLetterEdits, contactsOf, reviewDraft, unknownSenders } from '../host/game';
import { seededRandom } from '../time/dates';

const TOOL = { name: 'answer', description: 'x', input_schema: { type: 'object' } };
const schema = z.object({ items: z.array(z.string()) });

describe('createAiAccess', () => {
  it('meters every attempt and repairs malformed structured output', async () => {
    const outputs: unknown[] = [{ items: 'not-an-array' }, { items: '["a","b"]' }];
    const provider = new MockProvider(() => outputs.shift());
    const usage: UsageRecord[] = [];
    const ai = createAiAccess({ provider, turn: 4, onUsage: (u) => usage.push(u) });

    const result = await ai.structured('writer', {
      purpose: 'npc_letter',
      character: 'voss',
      system: 's',
      user: 'u',
      schema,
      tool: TOOL,
    });

    expect(result).toEqual({ items: ['a', 'b'] });
    expect(provider.requests[1].user).toContain('previous tool call was malformed');
    expect(usage.map((u) => [u.role, u.purpose, u.character, u.turn])).toEqual([
      ['writer', 'npc_letter', 'voss', 4],
      ['writer', 'npc_letter', 'voss', 4],
    ]);
  });

  it('gives up after the retries with the purpose in the error', async () => {
    const ai = createAiAccess({ provider: new MockProvider(() => ({})), turn: 1, retries: 1 });
    await expect(
      ai.structured('writer', { purpose: 'orchestrator', system: 's', user: 'u', schema, tool: TOOL }),
    ).rejects.toThrow(/orchestrator parse failed after 2 attempts/);
  });
});

describe('createHookContext', () => {
  it('seeds random by Game, Turn and label', () => {
    const ctx = createHookContext({ gameId: 'g', turn: 3, ai: createAiAccess({ provider: new MockProvider(() => ({})), turn: 3 }) });
    expect(ctx.random('voss')).toBe(seededRandom('g:3:voss'));
    expect(ctx.dates.format('1987-12-17')).toBe('17 dicembre 1987');
  });
});

const engine = {
  id: 'engine-test',
  cast: () => ({
    lead: { slug: 'lead', name: 'Lead', kind: 'person' },
    correspondents: [{ slug: 'voss', name: 'Voss', kind: 'person' }],
  }),
  contacts: () => ['voss'],
  validateDraft: async () => [{ rule: 'engine_rule', severity: 'warning', message: 'm' }],
} as unknown as Engine<unknown, unknown>;

const draft: DraftBatch = {
  letters: [
    { key: 'a', kind: 'letter', from: 'voss', storyDate: '1987-12-01', body: 'ciao', enclosures: [] },
    { key: 'b', kind: 'letter', from: 'stranger', storyDate: '1987-12-01', body: 'chi?', enclosures: [] },
  ],
  submissionDate: '1987-11-30',
  effects: { secret: 1 },
  adminNotes: [],
};

describe('platform rules around the Hooks', () => {
  it('names contacts from the cast', () => {
    const view = { gameId: 'g', story: {}, state: {}, turn: 1, history: [], submission: [] };
    expect(contactsOf(engine, view).map((c) => c.name)).toEqual(['Voss']);
  });

  it('flags senders outside the cast before the Engine’s own findings', async () => {
    expect(unknownSenders(engine, {}, draft)).toEqual([
      { rule: 'unknown_sender', severity: 'error', message: '"stranger" is not in the cast.', letterKey: 'b' },
    ]);
    const ctx = createHookContext({ gameId: 'g', turn: 1, ai: createAiAccess({ provider: new MockProvider(() => ({})), turn: 1 }) });
    const view = { gameId: 'g', story: {}, state: {}, turn: 1, history: [], submission: [] };
    expect((await reviewDraft(engine, ctx, view, draft)).map((f) => f.rule)).toEqual([
      'unknown_sender',
      'engine_rule',
    ]);
  });

  it('holds a closing batch that carries anything but Epilogues and Dispatches', async () => {
    const ctx = createHookContext({ gameId: 'g', turn: 9, ai: createAiAccess({ provider: new MockProvider(() => ({})), turn: 9 }) });
    const view = { gameId: 'g', story: {}, state: {}, turn: 9, history: [], submission: [] };
    const closing: DraftBatch = {
      letters: [
        { key: 'verdetto', kind: 'epilogue', from: 'voss', storyDate: '1988-03-01', body: 'Sentenza', enclosures: [] },
        { key: 'telegramma', kind: 'dispatch', from: 'voss', storyDate: '1988-03-01', body: 'STOP', enclosures: [] },
        { key: 'lettera', kind: 'letter', from: 'voss', storyDate: '1988-03-01', body: 'Mi risponda', enclosures: [] },
      ],
      effects: {},
      adminNotes: [],
    };
    const findings = await reviewDraft(engine, ctx, view, closing, { closing: true });
    expect(findings.filter((f) => f.rule === 'closing_letter_kind')).toEqual([
      {
        rule: 'closing_letter_kind',
        severity: 'error',
        message: 'A closing batch carries only Epilogues and Dispatches, not a "letter".',
        letterKey: 'lettera',
      },
    ]);
    expect((await reviewDraft(engine, ctx, view, closing)).map((f) => f.rule)).toEqual(['engine_rule']);
  });

  it('lets the admin edit bodies only, leaving effects to the Engine', () => {
    const edited = applyLetterEdits(draft, [{ key: 'a', body: 'Caro Lombardo' }]);
    expect(edited.letters[0].body).toBe('Caro Lombardo');
    expect(edited.letters[0].storyDate).toBe('1987-12-01');
    expect(edited.letters[1]).toBe(draft.letters[1]);
    expect(edited.effects).toBe(draft.effects);
  });

  const withEnclosure: DraftBatch = {
    ...draft,
    letters: [
      {
        ...draft.letters[0],
        enclosures: [
          { key: 'cert', kind: 'document', title: 'Certificato', body: 'Famiglia Ferrante' },
          { key: 'ritaglio', kind: 'clipping', title: 'Il Messaggero', body: 'Omicidio a Nomentano' },
        ],
      },
    ],
  };

  it('lets the admin rewrite an Enclosure’s title and body by key, never its kind', () => {
    const edited = applyLetterEdits(withEnclosure, [
      { key: 'a', body: 'ciao', enclosures: [{ key: 'cert', title: 'Stato di famiglia', body: 'Aldo Ferrante' }] },
    ]);
    expect(edited.letters[0].enclosures).toEqual([
      { key: 'cert', kind: 'document', title: 'Stato di famiglia', body: 'Aldo Ferrante' },
      { key: 'ritaglio', kind: 'clipping', title: 'Il Messaggero', body: 'Omicidio a Nomentano' },
    ]);
  });

  it('refuses an edit to an Enclosure the Engine did not enclose', () => {
    expect(() =>
      applyLetterEdits(withEnclosure, [
        { key: 'a', body: 'ciao', enclosures: [{ key: 'nuovo', title: 'x', body: 'y' }] },
      ]),
    ).toThrow(/enclosure "nuovo"/);
  });
});
