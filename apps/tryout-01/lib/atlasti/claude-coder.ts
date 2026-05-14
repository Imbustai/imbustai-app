import Anthropic from '@anthropic-ai/sdk';
import {
  BASELINE_CODES,
  buildCodeNameIndex,
  flattenCodes,
} from './codebook';
import { quotePreview } from './text-builder';
import type {
  ClaudeCodingProposal,
  CodingSelection,
  CodeNode,
  GameInput,
  LetterSpan,
  SampleFewshot,
} from './types';
import { v4 as uuidv4 } from 'uuid';
import { SYSTEM_PROMPT } from './system-prompt';
import fewshotsJson from './sample-fewshots.json';
import conceptualCatalogJson from './codici_tesi_atlasti.json';

/**
 * Prompt assets are statically imported so the Next.js / Turbopack server
 * bundle ships them as part of the module graph. Earlier versions used
 * `readFileSync(__dirname/…)` which silently failed under Next.js because
 * Turbopack rewrites `__dirname` to a virtual `/ROOT/…` path.
 */
const FEWSHOTS = fewshotsJson as SampleFewshot[];
const CONCEPTUAL_CATALOG = conceptualCatalogJson as unknown;

/**
 * Selects a representative subset of fewshots to keep the prompt small but
 * cover the codebook breadth. We pick up to N examples ensuring each distinct
 * code appears at least once if it has a fewshot.
 */
function pickRepresentativeFewshots(all: SampleFewshot[], max: number): SampleFewshot[] {
  const seenCodes = new Set<string>();
  const picked: SampleFewshot[] = [];
  for (const f of all) {
    const isNovel = f.codeNames.some((n) => !seenCodes.has(n));
    if (isNovel) {
      picked.push(f);
      for (const n of f.codeNames) seenCodes.add(n);
      if (picked.length >= max) break;
    }
  }
  // Fill remaining slots with additional examples for richness.
  if (picked.length < max) {
    for (const f of all) {
      if (picked.length >= max) break;
      if (!picked.includes(f)) picked.push(f);
    }
  }
  return picked;
}

interface BuildPromptInput {
  gameId: string;
  text: string;
  letters: LetterSpan[];
  baselineCodes: CodeNode[];
  sampleFewshots: SampleFewshot[];
  conceptualCatalog: unknown;
}

export interface ClaudeCoderDeps {
  /** Anthropic client. Injectable so tests can mock it. */
  anthropic?: Pick<Anthropic, 'messages'>;
  /** Model id. Defaults to claude-sonnet-4-6. */
  model?: string;
  /** Max representative few-shot examples embedded in the prompt. */
  maxFewshots?: number;
}

let _defaultClient: Anthropic | undefined;
function defaultAnthropic(): Anthropic {
  if (!_defaultClient) {
    _defaultClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _defaultClient;
}

/**
 * Builds the full system+user prompt pair for one game.
 * Exported so tests can assert ordering/content without calling the API.
 */
export function buildClaudePrompt(input: BuildPromptInput): { system: string; user: string } {
  const codes = flattenCodes(input.baselineCodes);

  const codebookSection = [
    '## BASELINE CODEBOOK',
    '',
    'Reuse these codes whenever they reasonably fit. Names are case-sensitive.',
    '',
    ...codes.map((c) =>
      `- **${c.name}**${c.description ? ` — ${c.description}` : ''}`
    ),
  ].join('\n');

  const fewshotsSection = [
    '## SAMPLE ANNOTATIONS (mirror this style)',
    '',
    'Real human-coded annotations from documents `12 f` and `13 f`. Match this granularity (typically a single sentence or coherent fragment), this multi-coding pattern (often 1–3 codes per quotation), and this judgment of what is worth coding.',
    '',
    ...input.sampleFewshots.map((f, i) => {
      const codes = f.codeNames.map((n) => `\`${n}\``).join(', ');
      return `${i + 1}. (${f.doc}) ${JSON.stringify(f.quoteText)} → ${codes}`;
    }),
  ].join('\n');

  const conceptualSection = [
    '## CONCEPTUAL CATALOG (secondary, consult only as a fallback)',
    '',
    'Use only if no baseline code fits. Prefer adapting an existing baseline code over inventing a new one. Cap: at most 1 proposed-new code per game.',
    '',
    '```json',
    JSON.stringify(input.conceptualCatalog, null, 2),
    '```',
  ].join('\n');

  const lettersSummary = [
    '## LETTERS IN THIS DOCUMENT',
    '',
    'Use `letterNumber` exactly as listed below; map each quotation to the letter that contains it.',
    '',
    ...input.letters.map(
      (l) =>
        `- letterNumber=${l.letterNumber}, role=${l.role === 'ai' ? 'AI' : 'umano'}, char-range=[${l.startPosition}, ${l.endPosition})`
    ),
  ].join('\n');

  const docSection = [
    '## DOCUMENT TO CODE',
    '',
    'Treat this as the canonical text. Quotations must be verbatim substrings of it.',
    '',
    '```',
    input.text,
    '```',
  ].join('\n');

  const system = SYSTEM_PROMPT;

  const user = [
    `Game id: ${input.gameId}`,
    '',
    codebookSection,
    '',
    fewshotsSection,
    '',
    conceptualSection,
    '',
    lettersSummary,
    '',
    docSection,
    '',
    'Now produce the JSON object as specified in the system prompt. Output ONLY the JSON.',
  ].join('\n');

  return { system, user };
}

/**
 * Extracts the first JSON object found in Claude's text response. Claude
 * sometimes wraps JSON in code fences despite instructions; we strip both.
 */
function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

/**
 * Resolve a proposal's `quoteText` to a (startPosition, endPosition) range in
 * the document. We prefer the first occurrence that lies entirely within a
 * single letter body (header lines excluded).
 */
function reconcileOffsets(
  text: string,
  letters: LetterSpan[],
  letterNumber: number,
  quoteText: string
): { startPosition: number; endPosition: number } | null {
  if (!quoteText) return null;

  const matches: number[] = [];
  let from = 0;
  while (from <= text.length) {
    const i = text.indexOf(quoteText, from);
    if (i === -1) break;
    matches.push(i);
    from = i + Math.max(1, quoteText.length);
  }
  if (matches.length === 0) return null;

  // Prefer matches inside the announced letter's body (header excluded).
  const candidateLetters = letters.filter((l) => l.letterNumber === letterNumber);
  for (const idx of matches) {
    const end = idx + quoteText.length;
    const containing = candidateLetters.find(
      (l) => idx >= l.headerEnd && end <= l.endPosition
    );
    if (containing) return { startPosition: idx, endPosition: end };
  }

  // Fallback: any letter body — be lenient when Claude misattributes letterNumber.
  for (const idx of matches) {
    const end = idx + quoteText.length;
    const containing = letters.find(
      (l) => idx >= l.headerEnd && end <= l.endPosition
    );
    if (containing) return { startPosition: idx, endPosition: end };
  }

  return null;
}

export interface AnalyzeGameInput {
  game: GameInput;
  text: string;
  letters: LetterSpan[];
}

export interface AnalyzeGameOutput {
  selections: CodingSelection[];
  /** Codes proposed by Claude that are NOT in the baseline. */
  newCodes: CodeNode[];
  /** Raw proposals returned by Claude (for logging/debug). */
  raw: ClaudeCodingProposal[];
}

/**
 * Calls Claude on a single game and returns reconciled selections + any new
 * codes. Defensive: drops proposals whose `quoteText` can't be located in the
 * document, drops empty/whitespace quotes, dedups codeNames per selection, and
 * caps proposed-new codes at 1 per game.
 */
export async function analyzeGame(
  input: AnalyzeGameInput,
  deps: ClaudeCoderDeps = {}
): Promise<AnalyzeGameOutput> {
  const anthropic = deps.anthropic ?? defaultAnthropic();
  const model = deps.model ?? 'claude-sonnet-4-6';
  const maxFewshots = deps.maxFewshots ?? 40;

  const allFewshots = FEWSHOTS;
  const conceptualCatalog = CONCEPTUAL_CATALOG;
  const sampleFewshots = pickRepresentativeFewshots(allFewshots, maxFewshots);

  const { system, user } = buildClaudePrompt({
    gameId: input.game.id,
    text: input.text,
    letters: input.letters,
    baselineCodes: BASELINE_CODES,
    sampleFewshots,
    conceptualCatalog,
  });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8192,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const textBlock = response.content.find((b: { type: string }) => b.type === 'text') as
    | { type: 'text'; text: string }
    | undefined;
  if (!textBlock) {
    throw new Error('Claude returned no text block');
  }

  let parsed: { codings?: ClaudeCodingProposal[] };
  try {
    parsed = extractJson(textBlock.text) as { codings?: ClaudeCodingProposal[] };
  } catch (err) {
    throw new Error(`Claude returned non-JSON output: ${(err as Error).message}`);
  }
  const raw = Array.isArray(parsed.codings) ? parsed.codings : [];

  const nameIndex = buildCodeNameIndex(BASELINE_CODES);
  const fewshotCodeNames = new Set(allFewshots.flatMap((f) => f.codeNames));
  const newCodes: CodeNode[] = [];
  const newCodesByName = new Map<string, CodeNode>();
  const selections: CodingSelection[] = [];

  for (const proposal of raw) {
    if (typeof proposal.quoteText !== 'string' || !proposal.quoteText.trim()) continue;
    if (typeof proposal.letterNumber !== 'number') continue;
    if (!Array.isArray(proposal.codeNames) || proposal.codeNames.length === 0) continue;

    const range = reconcileOffsets(
      input.text,
      input.letters,
      proposal.letterNumber,
      proposal.quoteText
    );
    if (!range) continue;

    const codeGuids: string[] = [];
    const seenInThisSelection = new Set<string>();

    for (const name of proposal.codeNames) {
      if (typeof name !== 'string') continue;
      const trimmed = name.trim();
      if (!trimmed) continue;
      const existing = nameIndex.get(trimmed.toLowerCase());
      if (existing) {
        if (!seenInThisSelection.has(existing)) {
          codeGuids.push(existing);
          seenInThisSelection.add(existing);
        }
        continue;
      }
      // Not in baseline → handle as proposed-new (also includes fewshot-only
      // names not present in the baseline, which shouldn't happen in practice).
      if (fewshotCodeNames.has(trimmed)) {
        // It was in the few-shots but our baseline lacks it — skip to be safe.
        continue;
      }

      // Honor the cap: at most one proposed-new code per game.
      if (newCodes.length >= 1 && !newCodesByName.has(trimmed.toLowerCase())) continue;

      let newCode = newCodesByName.get(trimmed.toLowerCase());
      if (!newCode) {
        newCode = {
          guid: uuidv4().toUpperCase(),
          name: trimmed,
          isCodable: true,
          description:
            proposal.proposedNewCode?.description ??
            `Codice proposto automaticamente — ${trimmed}`,
        };
        newCodes.push(newCode);
        newCodesByName.set(trimmed.toLowerCase(), newCode);
      }
      if (!seenInThisSelection.has(newCode.guid)) {
        codeGuids.push(newCode.guid);
        seenInThisSelection.add(newCode.guid);
      }
    }

    if (codeGuids.length === 0) continue;

    selections.push({
      guid: uuidv4().toUpperCase(),
      startPosition: range.startPosition,
      endPosition: range.endPosition,
      name: quotePreview(proposal.quoteText),
      codeGuids,
    });
  }

  return { selections, newCodes, raw };
}
