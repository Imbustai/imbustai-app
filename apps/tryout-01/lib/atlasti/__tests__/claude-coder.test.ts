import { describe, it, expect, vi } from 'vitest';
import { analyzeGame, buildClaudePrompt } from '../claude-coder';
import { buildGameText } from '../text-builder';
import { BASELINE_CODES, AI_CODE_GUID, flattenCodes } from '../codebook';
import type { ClaudeCodingProposal, GameInput } from '../types';

function fixtureGame(): GameInput {
  return {
    id: 'g1',
    userEmail: 'a@b.it',
    createdAt: '2026-03-27T12:00:00Z',
    completedAt: '2026-03-27T13:00:00Z',
    interactions: [
      {
        letter_number: 1,
        role: 'ai',
        content:
          'Cara amica, ho trovato una vecchia foto della prima elementare. Siamo seduti sul gradino davanti alla scuola.',
        created_at: '2026-03-27T12:06:00Z',
      },
      {
        letter_number: 1,
        role: 'user',
        content: 'Ti abbraccio forte, mi fa tenerezza ricordare quei tempi.',
        created_at: '2026-03-27T12:16:00Z',
      },
    ],
  };
}

function makeMockClient(textPayload: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: textPayload }],
      }),
    },
  };
}

describe('buildClaudePrompt', () => {
  it('orders BASELINE CODEBOOK before SAMPLE ANNOTATIONS before CONCEPTUAL CATALOG', () => {
    const { text, letters } = buildGameText(fixtureGame());
    const { user } = buildClaudePrompt({
      gameId: 'g1',
      text,
      letters,
      baselineCodes: BASELINE_CODES,
      sampleFewshots: [
        { doc: '13 f', quoteText: 'esempio', codeNames: ['empatia'] },
      ],
      conceptualCatalog: { x: 1 },
    });

    const idxCodebook = user.indexOf('## BASELINE CODEBOOK');
    const idxFewshots = user.indexOf('## SAMPLE ANNOTATIONS');
    const idxConcept = user.indexOf('## CONCEPTUAL CATALOG');
    const idxDoc = user.indexOf('## DOCUMENT TO CODE');

    expect(idxCodebook).toBeGreaterThan(-1);
    expect(idxFewshots).toBeGreaterThan(idxCodebook);
    expect(idxConcept).toBeGreaterThan(idxFewshots);
    expect(idxDoc).toBeGreaterThan(idxConcept);
  });

  it('embeds every baseline code name', () => {
    const { text, letters } = buildGameText(fixtureGame());
    const { user } = buildClaudePrompt({
      gameId: 'g1',
      text,
      letters,
      baselineCodes: BASELINE_CODES,
      sampleFewshots: [],
      conceptualCatalog: {},
    });
    for (const c of flattenCodes(BASELINE_CODES)) {
      expect(user).toContain(`**${c.name}**`);
    }
  });
});

describe('analyzeGame', () => {
  it('drops proposals whose quoteText is not present in the document', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const proposals: ClaudeCodingProposal[] = [
      { letterNumber: 1, quoteText: 'this string is not in the document', codeNames: ['empatia'] },
    ];
    const client = makeMockClient(JSON.stringify({ codings: proposals }));

    const out = await analyzeGame(
      { game, text, letters },
      { anthropic: client as never }
    );
    expect(out.selections).toHaveLength(0);
  });

  it('resolves quoteText to character offsets and reuses baseline codes', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const proposals: ClaudeCodingProposal[] = [
      {
        letterNumber: 1,
        quoteText: 'mi fa tenerezza ricordare quei tempi',
        codeNames: ['empatia'],
      },
    ];
    const client = makeMockClient(JSON.stringify({ codings: proposals }));

    const out = await analyzeGame(
      { game, text, letters },
      { anthropic: client as never }
    );
    expect(out.selections).toHaveLength(1);
    const sel = out.selections[0];
    expect(text.slice(sel.startPosition, sel.endPosition)).toBe(
      'mi fa tenerezza ricordare quei tempi'
    );
    const empatia = flattenCodes(BASELINE_CODES).find((c) => c.name === 'empatia')!;
    expect(sel.codeGuids).toContain(empatia.guid);
    expect(out.newCodes).toHaveLength(0);
  });

  it('caps proposed-new codes at 1 per game and dedups by name', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const proposals: ClaudeCodingProposal[] = [
      {
        letterNumber: 1,
        quoteText: 'vecchia foto',
        codeNames: ['memoria visiva', 'memoria visiva'],
        proposedNewCode: { name: 'memoria visiva', description: 'desc 1' },
      },
      {
        letterNumber: 1,
        quoteText: 'gradino davanti alla scuola',
        codeNames: ['un altro nuovo codice'],
        proposedNewCode: { name: 'un altro nuovo codice', description: 'desc 2' },
      },
    ];
    const client = makeMockClient(JSON.stringify({ codings: proposals }));

    const out = await analyzeGame(
      { game, text, letters },
      { anthropic: client as never }
    );
    expect(out.newCodes).toHaveLength(1);
    expect(out.newCodes[0].name).toBe('memoria visiva');

    const firstSel = out.selections[0];
    const memoriaGuid = out.newCodes[0].guid;
    expect(firstSel.codeGuids.filter((g) => g === memoriaGuid)).toHaveLength(1);
  });

  it('handles JSON wrapped in code fences', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const fenced =
      '```json\n' +
      JSON.stringify({
        codings: [
          { letterNumber: 1, quoteText: 'vecchia foto', codeNames: ['nostalgia'] },
        ],
      }) +
      '\n```';
    const client = makeMockClient(fenced);

    const out = await analyzeGame(
      { game, text, letters },
      { anthropic: client as never }
    );
    expect(out.selections).toHaveLength(1);
    const nostalgia = flattenCodes(BASELINE_CODES).find((c) => c.name === 'nostalgia')!;
    expect(out.selections[0].codeGuids).toContain(nostalgia.guid);
  });

  it('rejects quotes that overlap with letter headers', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const proposals: ClaudeCodingProposal[] = [
      // The header substring exists in `text` but never inside a body span.
      { letterNumber: 1, quoteText: '[Letter 1] AI (Apaya)', codeNames: ['empatia'] },
    ];
    const client = makeMockClient(JSON.stringify({ codings: proposals }));

    const out = await analyzeGame(
      { game, text, letters },
      { anthropic: client as never }
    );
    expect(out.selections).toHaveLength(0);
  });

  it('uses the supplied model and forwards system/user content', async () => {
    const game = fixtureGame();
    const { text, letters } = buildGameText(game);
    const client = makeMockClient(JSON.stringify({ codings: [] }));

    await analyzeGame(
      { game, text, letters },
      { anthropic: client as never, model: 'claude-sonnet-4-6' }
    );
    expect(client.messages.create).toHaveBeenCalledTimes(1);
    const call = client.messages.create.mock.calls[0][0];
    expect(call.model).toBe('claude-sonnet-4-6');
    expect(typeof call.system).toBe('string');
    expect(call.system).toContain('OUTPUT FORMAT');
    expect(call.messages[0].role).toBe('user');
    expect(call.messages[0].content).toContain('BASELINE CODEBOOK');
  });
});

describe('analyzeGame sanity: AI_CODE_GUID is a valid baseline', () => {
  it('contains the ai code in baseline', () => {
    const all = flattenCodes(BASELINE_CODES);
    expect(all.some((c) => c.guid === AI_CODE_GUID && c.name === 'ai')).toBe(true);
  });
});
