import Anthropic from '@anthropic-ai/sdk';
import {
  BASELINE_CODES,
  buildCodeNameIndex,
  flattenCodes,
} from './codebook';
import {
  buildConceptualCodeIndex,
  listConceptualCodeNames,
  type ConceptualCatalog,
} from './conceptual-catalog';
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
const CONCEPTUAL_CATALOG = conceptualCatalogJson as ConceptualCatalog;
const CONCEPTUAL_CODE_INDEX = buildConceptualCodeIndex(CONCEPTUAL_CATALOG);

/** Human sample averages ~140–200 characters per coding on `12 f` / `13 f`. */
const CHARS_PER_CODING_TARGET = 150;

/** Distinct invented codes (not in baseline or catalog) allowed per game. */
const MAX_PROPOSED_NEW_CODES_PER_GAME = 1;

/**
 * Selects a representative subset of fewshots to keep the prompt bounded but
 * show codebook breadth and annotation density.
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
  if (picked.length < max) {
    for (const f of all) {
      if (picked.length >= max) break;
      if (!picked.includes(f)) picked.push(f);
    }
  }
  return picked;
}

/** Minimum codings entries Claude should return for this document. */
export function estimateCodingTarget(letters: LetterSpan[]): number {
  const bodyChars = letters.reduce(
    (sum, l) => sum + Math.max(0, l.endPosition - l.headerEnd),
    0
  );
  return Math.max(15, Math.round(bodyChars / CHARS_PER_CODING_TARGET));
}

interface BuildPromptInput {
  gameId: string;
  text: string;
  letters: LetterSpan[];
  baselineCodes: CodeNode[];
  sampleFewshots: SampleFewshot[];
  conceptualCatalog: ConceptualCatalog;
  codingTarget: number;
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
  const conceptualNames = listConceptualCodeNames(input.conceptualCatalog);

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
    '## SAMPLE ANNOTATIONS (mirror density and style)',
    '',
    'Real human-coded annotations from documents `12 f` and `13 f`. Match this granularity (typically one sentence per quotation), this multi-coding pattern (often 1–3 baseline codes per quotation), and this **coverage**: most of the letter body is coded, with overlapping quotations when needed.',
    '',
    ...input.sampleFewshots.map((f, i) => {
      const codes = f.codeNames.map((n) => `\`${n}\``).join(', ');
      return `${i + 1}. (${f.doc}) ${JSON.stringify(f.quoteText)} → ${codes}`;
    }),
  ].join('\n');

  const conceptualSection = [
    '## CONCEPTUAL CATALOG (use via `conceptualCodeNames`)',
    '',
    'Apply these **in addition to** baseline codes when they sharpen the analysis. Names must match `code_name` exactly (case-sensitive).',
    '',
    'Allowed `conceptualCodeNames` values:',
    ...conceptualNames.map((n) => `- \`${n}\``),
    '',
    'Full catalog (concepts, descriptions, theoretical references):',
    '',
    '```json',
    JSON.stringify(input.conceptualCatalog, null, 2),
    '```',
  ].join('\n');

  const coverageSection = [
    '## COVERAGE TARGET',
    '',
    `Produce **at least ${input.codingTarget}** entries in \`codings\` for this document (~one coding per sentence in letter bodies). Include \`conceptualCodeNames\` on a substantial share of entries (roughly one third or more when concepts apply).`,
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
    coverageSection,
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

  const candidateLetters = letters.filter((l) => l.letterNumber === letterNumber);
  for (const idx of matches) {
    const end = idx + quoteText.length;
    const containing = candidateLetters.find(
      (l) => idx >= l.headerEnd && end <= l.endPosition
    );
    if (containing) return { startPosition: idx, endPosition: end };
  }

  for (const idx of matches) {
    const end = idx + quoteText.length;
    const containing = letters.find(
      (l) => idx >= l.headerEnd && end <= l.endPosition
    );
    if (containing) return { startPosition: idx, endPosition: end };
  }

  return null;
}

interface CodeResolutionContext {
  baselineIndex: Map<string, string>;
  conceptualIndex: Map<string, import('./conceptual-catalog').ConceptualCodeMeta>;
  fewshotCodeNames: Set<string>;
  newCodes: CodeNode[];
  newCodesByName: Map<string, CodeNode>;
  inventedNewCodeCount: number;
}

function resolveCodeName(
  rawName: string,
  proposal: ClaudeCodingProposal,
  ctx: CodeResolutionContext
): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) return null;

  const baselineGuid = ctx.baselineIndex.get(trimmed.toLowerCase());
  if (baselineGuid) return baselineGuid;

  const conceptual = ctx.conceptualIndex.get(trimmed.toLowerCase());
  if (conceptual) {
    const key = conceptual.name.toLowerCase();
    let node = ctx.newCodesByName.get(key);
    if (!node) {
      node = {
        guid: uuidv4().toUpperCase(),
        name: conceptual.name,
        isCodable: true,
        description: conceptual.description,
      };
      ctx.newCodes.push(node);
      ctx.newCodesByName.set(key, node);
    }
    return node.guid;
  }

  if (ctx.fewshotCodeNames.has(trimmed)) return null;

  const key = trimmed.toLowerCase();
  let node = ctx.newCodesByName.get(key);
  if (!node) {
    if (ctx.inventedNewCodeCount >= MAX_PROPOSED_NEW_CODES_PER_GAME) {
      return null;
    }
    const proposed = proposal.proposedNewCode;
    const description =
      proposed &&
      proposed.name.toLowerCase() === key
        ? proposed.description
        : `Codice proposto automaticamente — ${trimmed}`;
    node = {
      guid: uuidv4().toUpperCase(),
      name: trimmed,
      isCodable: true,
      description,
    };
    ctx.newCodes.push(node);
    ctx.newCodesByName.set(key, node);
    ctx.inventedNewCodeCount += 1;
  }
  return node.guid;
}

export interface AnalyzeGameInput {
  game: GameInput;
  text: string;
  letters: LetterSpan[];
}

export interface AnalyzeGameOutput {
  selections: CodingSelection[];
  /** Codes created from the conceptual catalog or invented proposals. */
  newCodes: CodeNode[];
  raw: ClaudeCodingProposal[];
}

/**
 * Calls Claude on a single game and returns reconciled selections + any new
 * codes. Drops proposals whose `quoteText` can't be located; dedups code GUIDs
 * per selection; caps invented (non-catalog) new codes at 1 per game.
 */
export async function analyzeGame(
  input: AnalyzeGameInput,
  deps: ClaudeCoderDeps = {}
): Promise<AnalyzeGameOutput> {
  const anthropic = deps.anthropic ?? defaultAnthropic();
  const model = deps.model ?? 'claude-sonnet-4-6';
  const maxFewshots = deps.maxFewshots ?? 80;

  const sampleFewshots = pickRepresentativeFewshots(FEWSHOTS, maxFewshots);
  const codingTarget = estimateCodingTarget(input.letters);

  const { system, user } = buildClaudePrompt({
    gameId: input.game.id,
    text: input.text,
    letters: input.letters,
    baselineCodes: BASELINE_CODES,
    sampleFewshots,
    conceptualCatalog: CONCEPTUAL_CATALOG,
    codingTarget,
  });

  const response = await anthropic.messages.create({
    model,
    max_tokens: 16384,
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

  const ctx: CodeResolutionContext = {
    baselineIndex: buildCodeNameIndex(BASELINE_CODES),
    conceptualIndex: CONCEPTUAL_CODE_INDEX,
    fewshotCodeNames: new Set(FEWSHOTS.flatMap((f) => f.codeNames)),
    newCodes: [],
    newCodesByName: new Map(),
    inventedNewCodeCount: 0,
  };
  const selections: CodingSelection[] = [];

  for (const proposal of raw) {
    if (typeof proposal.quoteText !== 'string' || !proposal.quoteText.trim()) continue;
    if (typeof proposal.letterNumber !== 'number') continue;

    const baselineNames = Array.isArray(proposal.codeNames) ? proposal.codeNames : [];
    const conceptualNames = Array.isArray(proposal.conceptualCodeNames)
      ? proposal.conceptualCodeNames
      : [];
    if (baselineNames.length === 0 && conceptualNames.length === 0) continue;

    const range = reconcileOffsets(
      input.text,
      input.letters,
      proposal.letterNumber,
      proposal.quoteText
    );
    if (!range) continue;

    const codeGuids: string[] = [];
    const seenInThisSelection = new Set<string>();

    for (const name of [...baselineNames, ...conceptualNames]) {
      const guid = resolveCodeName(name, proposal, ctx);
      if (guid && !seenInThisSelection.has(guid)) {
        codeGuids.push(guid);
        seenInThisSelection.add(guid);
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

  return { selections, newCodes: ctx.newCodes, raw };
}
