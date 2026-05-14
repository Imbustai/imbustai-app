import { describe, it, expect, vi } from 'vitest';
import {
  generateQdpxForGames,
  unpackQdpx,
  AI_CODE_GUID,
  UMANO_CODE_GUID,
} from '..';
import { flattenCodes, BASELINE_CODES } from '../codebook';
import type { GameInput } from '../types';

function fixtureGame(id = 'game-1'): GameInput {
  return {
    id,
    userEmail: 'alice@example.com',
    createdAt: '2026-03-27T11:00:00Z',
    completedAt: '2026-03-27T15:00:00Z',
    interactions: [
      {
        letter_number: 1,
        role: 'ai',
        content: 'Cara amica, ti scrivo da una stanza piena di luce.',
        created_at: '2026-03-27T12:06:00Z',
      },
      {
        letter_number: 1,
        role: 'user',
        content: 'Mi fa molto piacere sentirti, ho pensato spesso a te.',
        created_at: '2026-03-27T12:16:00Z',
      },
    ],
  };
}

function makeStubClient(textPayload: string) {
  return {
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: textPayload }],
      }),
    },
  };
}

describe('generateQdpxForGames (integration)', () => {
  it('produces a valid qdpx zip with deterministic ai/umano codings and stubbed Claude codings', async () => {
    const game = fixtureGame();
    const claudeStub = makeStubClient(
      JSON.stringify({
        codings: [
          {
            letterNumber: 1,
            quoteText: 'ho pensato spesso a te',
            codeNames: ['affetto'],
          },
        ],
      })
    );

    const out = await generateQdpxForGames([game], {
      now: '2026-04-28T08:27:55Z',
      claudeDeps: { anthropic: claudeStub as never },
    });
    expect(out.buffer.length).toBeGreaterThan(0);
    expect(out.filename).toMatch(/^imbustai-.*\.qdpx$/);

    const { qdeXml, sources } = await unpackQdpx(out.buffer);

    // Plain text source written.
    expect(sources.size).toBe(1);
    const [sourceGuid] = sources.keys();
    const text = sources.get(sourceGuid)!;
    expect(text).toContain('[Letter 1] AI (Apaya) \u2014 27 Mar 2026, 12:06');
    expect(text).toContain('[Letter 1] User \u2014 27 Mar 2026, 12:16');

    // QDE references all baseline codes.
    for (const c of flattenCodes(BASELINE_CODES)) {
      expect(qdeXml).toContain(`name="${escapeXml(c.name)}"`);
    }

    // Deterministic codings: one ai, one umano CodeRef each.
    const aiRefs = countOccurrences(qdeXml, `targetGUID="${AI_CODE_GUID}"`);
    const umanoRefs = countOccurrences(qdeXml, `targetGUID="${UMANO_CODE_GUID}"`);
    expect(aiRefs).toBeGreaterThanOrEqual(1);
    expect(umanoRefs).toBeGreaterThanOrEqual(1);

    // Stubbed Claude coding got reconciled to char offsets and added with affetto.
    const affettoGuid = flattenCodes(BASELINE_CODES).find((c) => c.name === 'affetto')!.guid;
    expect(qdeXml).toContain(`targetGUID="${affettoGuid}"`);
  });

  it('caps games at maxGames', async () => {
    const games = Array.from({ length: 15 }, (_, i) => fixtureGame(`g-${i}`));
    const claudeStub = makeStubClient(JSON.stringify({ codings: [] }));

    const out = await generateQdpxForGames(games, {
      now: '2026-04-28T08:27:55Z',
      claudeDeps: { anthropic: claudeStub as never },
      maxGames: 3,
    });
    const { sources } = await unpackQdpx(out.buffer);
    expect(sources.size).toBe(3);
  });

  it('does not call Claude when skipClaude is set', async () => {
    const game = fixtureGame();
    const claudeStub = makeStubClient('{"codings":[]}');

    await generateQdpxForGames([game], {
      now: '2026-04-28T08:27:55Z',
      claudeDeps: { anthropic: claudeStub as never },
      skipClaude: true,
    });
    expect(claudeStub.messages.create).not.toHaveBeenCalled();
  });

  it('reports per-game errors via summary instead of aborting the export', async () => {
    const games = [fixtureGame('ok'), fixtureGame('bad')];
    const create = vi.fn();
    create.mockResolvedValueOnce({ content: [{ type: 'text', text: '{"codings":[]}' }] });
    create.mockRejectedValueOnce(new Error('Claude down'));
    const stub = { messages: { create } };

    const out = await generateQdpxForGames(games, {
      now: '2026-04-28T08:27:55Z',
      claudeDeps: { anthropic: stub as never },
    });
    expect(out.summary).toHaveLength(2);
    expect(out.summary.find((s) => s.gameId === 'bad')?.error).toContain('Claude down');
    expect(out.summary.find((s) => s.gameId === 'ok')?.error).toBeUndefined();
  });
});

function countOccurrences(haystack: string, needle: string): number {
  let count = 0;
  let from = 0;
  while (true) {
    const i = haystack.indexOf(needle, from);
    if (i === -1) return count;
    count++;
    from = i + needle.length;
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
