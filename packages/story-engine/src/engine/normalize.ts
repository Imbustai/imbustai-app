import type { StoryCharacter } from '../types';

// Slug normalization, generalized from the prototype's hardcoded alias map
// (aiResponseParser.ts normalizeNPCId): match exact slug, then slugified
// name, then "name contains slug"-style partials — story-agnostic.

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeCharacterSlug(
  raw: string,
  characters: StoryCharacter[],
): string | null {
  const candidate = slugify(raw);
  if (!candidate) return null;

  const exact = characters.find((c) => c.slug === candidate);
  if (exact) return exact.slug;

  const byName = characters.find((c) => slugify(c.name) === candidate);
  if (byName) return byName.slug;

  // Partial: "agente_voss" → "voss", "ufficio_anagrafe_del_comune" → "comune"
  const partial = characters.find(
    (c) =>
      candidate.split('_').includes(c.slug) ||
      slugify(c.name).includes(candidate) ||
      candidate.includes(slugify(c.name)),
  );
  return partial ? partial.slug : null;
}
