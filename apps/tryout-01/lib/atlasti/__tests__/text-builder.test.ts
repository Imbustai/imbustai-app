import { describe, it, expect } from 'vitest';
import { buildGameText, formatLetterDate, quotePreview } from '../text-builder';
import type { GameInput } from '../types';

function makeGame(): GameInput {
  return {
    id: 'g1',
    userEmail: 'alice@example.com',
    createdAt: '2026-03-27T12:00:00Z',
    completedAt: '2026-03-27T13:00:00Z',
    interactions: [
      {
        letter_number: 1,
        role: 'ai',
        content: 'Ciao!\n\nnon so nemmeno se questo arriverà davvero.',
        created_at: '2026-03-27T12:06:00Z',
      },
      {
        letter_number: 1,
        role: 'user',
        content: 'Grazie, mi fa molto piacere.',
        created_at: '2026-03-27T12:16:00Z',
      },
    ],
  };
}

describe('formatLetterDate', () => {
  it('matches the human-coded sample format', () => {
    expect(formatLetterDate('2026-03-27T12:06:00Z')).toBe('27 Mar 2026, 12:06');
  });

  it('zero-pads day and time components', () => {
    expect(formatLetterDate('2026-01-05T03:04:00Z')).toBe('05 Jan 2026, 03:04');
  });
});

describe('buildGameText', () => {
  it('produces a header per letter and round-trips the bodies', () => {
    const { text, letters } = buildGameText(makeGame());

    expect(letters).toHaveLength(2);
    expect(text.startsWith('\n[Letter 1] AI (Apaya)')).toBe(true);

    for (const span of letters) {
      const slice = text.slice(span.startPosition, span.endPosition);
      expect(slice).toMatch(/^\[Letter \d+\] /);
      const header = text.slice(span.startPosition, span.headerEnd);
      expect(header).toMatch(/^\[Letter \d+\] (AI \(Apaya\)|User) — /);
    }
  });

  it('uses the en-dash "User" label for the user role (matches the sample)', () => {
    const { text } = buildGameText(makeGame());
    expect(text).toContain('[Letter 1] User — 27 Mar 2026, 12:16');
  });

  it('sorts interactions by letter_number then created_at', () => {
    const out = buildGameText({
      ...makeGame(),
      interactions: [
        {
          letter_number: 2,
          role: 'ai',
          content: 'second AI',
          created_at: '2026-03-28T10:00:00Z',
        },
        {
          letter_number: 1,
          role: 'ai',
          content: 'first AI',
          created_at: '2026-03-27T12:00:00Z',
        },
      ],
    });
    expect(out.letters.map((l) => l.letterNumber)).toEqual([1, 2]);
  });

  it('body slices contain the original content', () => {
    const game = makeGame();
    const { text, letters } = buildGameText(game);
    const aiBody = text.slice(letters[0].headerEnd, letters[0].endPosition);
    expect(aiBody).toContain('Ciao!');
    expect(aiBody).toContain('non so nemmeno');
    const userBody = text.slice(letters[1].headerEnd, letters[1].endPosition);
    expect(userBody).toContain('Grazie, mi fa molto piacere.');
  });
});

describe('quotePreview', () => {
  it('collapses whitespace and truncates with an ellipsis', () => {
    const long = 'a'.repeat(200);
    const out = quotePreview(long, 50);
    expect(out).toHaveLength(50);
    expect(out.endsWith('\u2026')).toBe(true);
  });

  it('returns the original string when shorter than the limit', () => {
    expect(quotePreview('short text', 50)).toBe('short text');
  });
});
