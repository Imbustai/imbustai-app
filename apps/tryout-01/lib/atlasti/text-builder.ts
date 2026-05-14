import type { GameInput, LetterSpan, InteractionInput } from './types';

/**
 * Builds the plain-text document that will be stored under `sources/<guid>.txt`
 * and referenced by character offsets in `<PlainTextSelection>`.
 *
 * The format mirrors the human-coded sample (see `atlasti-generator-samples/
 * imbustai-sample2-qdpx-uncompressed/sources/...`):
 *
 *     \n[Letter 1] AI (Apaya) — 27 Mar 2026, 12:06\n\n<body>\n\n[Letter 1] User — 27 Mar 2026, 12:16\n\n<body>\n\n...
 *
 * Mirroring the sample matters because (a) the `sample-fewshots` examples we
 * embed in Claude's prompt rely on this style and (b) deterministic `ai`/`umano`
 * codings derived from `LetterSpan.headerEnd` must align with the body of each
 * letter, not the header.
 */

export interface BuildGameTextResult {
  text: string;
  letters: LetterSpan[];
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * Formats an ISO timestamp like the en-GB toLocaleDateString output used elsewhere
 * in the app (e.g. `27 Mar 2026, 12:06`), without depending on the host's
 * locale/timezone for reproducibility. UTC offsets are intentionally not shown.
 */
export function formatLetterDate(iso: string): string {
  const d = new Date(iso);
  const day = pad2(d.getUTCDate());
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hh = pad2(d.getUTCHours());
  const mm = pad2(d.getUTCMinutes());
  return `${day} ${month} ${year}, ${hh}:${mm}`;
}

function letterHeader(interaction: InteractionInput): string {
  const sender = interaction.role === 'ai' ? 'AI (Apaya)' : 'User';
  const date = formatLetterDate(interaction.created_at);
  return `[Letter ${interaction.letter_number}] ${sender} \u2014 ${date}`;
}

/**
 * Sort by letter number first, then created_at. Matches the admin UI ordering.
 */
function sortInteractions(interactions: InteractionInput[]): InteractionInput[] {
  return [...interactions].sort((a, b) => {
    if (a.letter_number !== b.letter_number) return a.letter_number - b.letter_number;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Builds the plain text and per-letter `LetterSpan` map. The character offsets in
 * the returned spans are valid for the JavaScript `string` semantics (UTF-16 code
 * units), which is what REFI-QDA `<PlainTextSelection startPosition>` expects.
 */
export function buildGameText(game: GameInput): BuildGameTextResult {
  const sorted = sortInteractions(game.interactions);
  const letters: LetterSpan[] = [];

  // Leading newline mirrors the sample.
  let text = '\n';

  for (const interaction of sorted) {
    const startPosition = text.length;
    const header = letterHeader(interaction);
    text += header;
    const headerEnd = text.length; // exclusive end of header line (no trailing newline yet)
    text += '\n\n';
    text += interaction.content.replace(/\r\n/g, '\n');
    text += '\n\n';
    const endPosition = text.length;

    letters.push({
      letterNumber: interaction.letter_number,
      role: interaction.role,
      startPosition,
      endPosition,
      headerEnd,
    });
  }

  return { text, letters };
}

/** Produce a short, single-line preview for `<PlainTextSelection name="…">`. */
export function quotePreview(text: string, max = 120): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= max) return collapsed;
  return collapsed.slice(0, max - 1) + '\u2026';
}
