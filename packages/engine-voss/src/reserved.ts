import type { VossStory } from './schema';

export interface ReservedHit {
  /** The pattern that matched, as the Story lists it. */
  pattern: string;
  plotKey: string;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The Plot-key names, streets and objects in `text` that `from` may not
 * write: a collision plants a false clue the sender cannot mean (#25, the
 * invented lady «di via Carini»). Whole words, any case. A term the Player
 * has already written is the caller's to allow.
 */
export function reservedTermsIn(story: VossStory, from: string, text: string): ReservedHit[] {
  const hits: ReservedHit[] = [];
  for (const term of story.reserved) {
    if (term.allowedFor.includes(from)) continue;
    for (const pattern of term.patterns) {
      const re = new RegExp(`(?<!\\p{L})${escape(pattern)}(?!\\p{L})`, 'iu');
      if (re.test(text)) hits.push({ pattern, plotKey: term.plotKey });
    }
  }
  return hits;
}
