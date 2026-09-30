import { z } from 'zod';
import type { CharacterSlug } from '../contract';

// The deterministic Plot-key collision check, run on every Letter before the
// model checker. A writer that only sees one Character's view cannot know
// that the street it invents for a lady at the counter is where the killer
// lives (the via Carini case in "One real Voss Turn, end to end",
// Imbustai/imbustai-app#25), and the model checker missed it once in two.
// So the Story lists the names, streets and phrases its Plot keys hang on,
// and a Letter that uses one its writer does not know gets a rewrite.

/**
 * A name, street or phrase a Plot key hangs on, listed in the Story document.
 * Matched as whole words, ignoring case and accents: list a street by its
 * distinctive word ("Carini", not "via Giacomo Carini") so every way of
 * writing it is caught.
 */
export interface ReservedTerm {
  term: string;
  /** Characters who know it and may write it. */
  knownBy: CharacterSlug[];
  /** Why it is reserved, shown to the rewrite and the admin. */
  note?: string;
}

/** For an Engine's Story schema: `reserved: z.array(reservedTermSchema)`. */
export const reservedTermSchema = z.object({
  term: z.string().trim().min(2),
  knownBy: z.array(z.string().min(1)).default([]),
  note: z.string().optional(),
}) satisfies z.ZodType<ReservedTerm, z.ZodTypeDef, unknown>;

export interface PlotKeyCollision {
  term: string;
  note?: string;
  /** The sentence of the Letter that uses it, as written. */
  quote: string;
}

export interface CollisionCheck {
  /** The Character whose Letter this is. */
  character: CharacterSlug;
  reserved: ReservedTerm[];
  /**
   * What the Character has read or written so far (the Lead's Letters to it,
   * its own earlier Letters): a term that appears there is known.
   */
  knownText?: string[];
}

/** Every reserved term the Letter uses that its Character does not know, one hit per term. */
export function findPlotKeyCollisions(letter: string, check: CollisionCheck): PlotKeyCollision[] {
  const text = foldWithMap(letter);
  const known = check.knownText?.map((t) => foldWithMap(t).folded) ?? [];
  const hits: PlotKeyCollision[] = [];
  for (const reserved of check.reserved) {
    if (reserved.knownBy.includes(check.character)) continue;
    const pattern = termPattern(reserved.term);
    if (known.some((t) => pattern.test(t))) continue;
    const match = pattern.exec(text.folded);
    if (!match) continue;
    hits.push({
      term: reserved.term,
      ...(reserved.note ? { note: reserved.note } : {}),
      quote: sentenceAround(letter, text.origin[match.index]),
    });
  }
  return hits;
}

/** Lower case, no accents, keeping for each folded character its index in the original. */
function foldWithMap(original: string): { folded: string; origin: number[] } {
  let folded = '';
  const origin: number[] = [];
  for (let i = 0; i < original.length; i++) {
    const part = fold(original[i]);
    folded += part;
    for (let k = 0; k < part.length; k++) origin.push(i);
  }
  return { folded, origin };
}

function fold(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function termPattern(term: string): RegExp {
  const words = fold(term).trim().split(/\s+/).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(?<!\\p{L})${words.join('\\s+')}(?!\\p{L})`, 'u');
}

function sentenceAround(text: string, index: number): string {
  const before = text.slice(0, index);
  const start = Math.max(before.lastIndexOf('. '), before.lastIndexOf('\n'), before.lastIndexOf('? '), before.lastIndexOf('! '));
  const rest = text.slice(index);
  const end = rest.search(/[.?!](\s|$)|\n/);
  return text.slice(start < 0 ? 0 : start + 1, end < 0 ? text.length : index + end + 1).trim();
}
