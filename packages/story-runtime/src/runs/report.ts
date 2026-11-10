import { z } from 'zod';
import type { HostAiAccess } from '../ai/access';
import { resolveModelChoice, type ModelProfile, type ProfileRole } from '../ai/profile';
import type { PriceOf } from './budget';
import type { PlayerView } from './player';

// What a Run reports beyond its Ending: a score for each complaint the July
// playthrough raised ("Why did the July Voss playthrough feel generic and
// scripted?", Imbustai/imbustai-app#10), read from the correspondence alone,
// and — before the Run starts — an estimate of what it will cost.

/** The five complaints a Run scores a Story against. */
export const COMPLAINTS = [
  {
    key: 'vague',
    title: 'Vague answers',
    question:
      'Do the correspondents give concrete, usable details (names, dates, places, facts the Lead can act on), ' +
      'or do they stay vague, defer and withhold?',
  },
  {
    key: 'echo',
    title: 'Praise and paraphrase',
    question:
      "Do the replies open by praising the Lead and paraphrasing the Lead's own letter back, or does each " +
      'correspondent speak in a voice of their own and bring something of their own?',
  },
  {
    key: 'scripted',
    title: 'Scripted events',
    question:
      'Are the replies caused by what the Lead actually wrote (questions answered, theories engaged, actions ' +
      'followed up), or does the story deliver scheduled beats whatever the Lead wrote?',
  },
  {
    key: 'contacts',
    title: 'Unreachable contacts',
    question:
      'Could the Lead reach the people and offices the story pointed to, and did promised sources actually ' +
      'write, or were leads named that could never be contacted?',
  },
  {
    key: 'bond',
    title: 'No bond',
    question:
      'Do the correspondents have a life of their own (tastes, memories, moods) and personal continuity ' +
      'across letters that makes the Lead care about them, or are they flat information sources?',
  },
] as const;

/** Key of one of the scored complaints. */
export type ComplaintKey = (typeof COMPLAINTS)[number]['key'];

/** One complaint's score: 1 = the complaint fully applies, 5 = no trace of it. */
export interface ComplaintScore {
  complaint: ComplaintKey;
  score: number;
  /** One or two sentences pointing at the Letters that justify the score. */
  evidence: string;
}

const scoresSchema = z.object({
  scores: z.array(
    z.object({
      complaint: z.enum(COMPLAINTS.map((c) => c.key) as [ComplaintKey, ...ComplaintKey[]]),
      score: z.number().int().min(1).max(5),
      evidence: z.string(),
    }),
  ),
});

/**
 * Score a finished Run's correspondence against each complaint with one
 * `analyst` call. The judge reads only what the Player read.
 * @category Utilities
 */
export async function scoreRun(ai: HostAiAccess, view: Pick<PlayerView, 'lead' | 'letters'>): Promise<ComplaintScore[]> {
  const transcript = view.letters
    .map((l) => {
      const who = l.direction === 'in' ? `${l.correspondent} → ${view.lead.name}` : `${view.lead.name} → ${l.correspondent}`;
      const enclosures = l.enclosures.map((e) => `\n[Enclosed: ${e.title}]\n${e.body}`).join('');
      return `--- Turn ${l.turn} · ${who} · ${l.storyDate || 'undated'} ---\n${l.body}${enclosures}`;
    })
    .join('\n\n');
  const rubric = COMPLAINTS.map((c) => `- ${c.key}: ${c.question}`).join('\n');

  const reply = await ai.structured('analyst', {
    purpose: 'run:judge',
    system:
      'You review a finished playthrough of an epistolary mystery game: a player wrote letters as ' +
      `${view.lead.name} and the story's characters replied. Judge only the characters' letters, ` +
      'not the player\'s. Be a demanding reader; quote or point at specific letters.',
    user:
      `The correspondence:\n\n${transcript}\n\n` +
      'Score the playthrough on each of these complaints from 1 to 5, where 1 means the complaint fully ' +
      `applies and 5 means there is no trace of it. Give every complaint exactly once.\n${rubric}`,
    schema: scoresSchema,
    maxTokens: 6000,
  });

  return COMPLAINTS.map((c) => {
    const found = reply.scores.find((s) => s.complaint === c.key);
    if (!found) throw new Error(`The Run judge gave no score for "${c.key}".`);
    return found;
  });
}

// ─── Preflight estimate ─────────────────────────────────────────────────────

/** One kind of model call an Engine makes while a Turn is played. */
export interface CallShape {
  role: ProfileRole;
  /** e.g. "orchestrator", "npc_letter". */
  purpose: string;
  /** How many of these one Turn makes at most. */
  callsPerTurn: number;
  /** Expected input of one call late in the Game, uncached. */
  inputTokens: number;
  /** Expected output of one call, thinking included. */
  outputTokens: number;
}

/**
 * What a Turn costs on an Engine that has not said: per Player Letter, one
 * writer call and a reader and a checker on the analyst.
 */
export function defaultTurnShape(lettersPerTurn: number): CallShape[] {
  return [
    { role: 'writer', purpose: 'reply', callsPerTurn: lettersPerTurn, inputTokens: 20_000, outputTokens: 5_000 },
    { role: 'analyst', purpose: 'reader', callsPerTurn: lettersPerTurn, inputTokens: 8_000, outputTokens: 1_500 },
    { role: 'analyst', purpose: 'checker', callsPerTurn: lettersPerTurn, inputTokens: 12_000, outputTokens: 2_000 },
  ];
}

/** The Run's own calls: the player every Turn, the judge once. */
const PLAYER_SHAPE = { inputTokens: 15_000, outputTokens: 4_000 };
const JUDGE_SHAPE = { inputTokens: 40_000, outputTokens: 4_000 };

/** A Run's expected cost before it starts. */
export interface RunEstimate {
  totalUsd: number;
  lines: { role: ProfileRole; purpose: string; model: string; calls: number; usd: number }[];
}

/**
 * Estimate a whole Run from the models it will call: the Engine's calls for
 * every Turn, the AI player's, and the judge's. A model without a price
 * throws here, before anything is spent.
 * @category Utilities
 */
export function estimateRun(input: {
  profile: ModelProfile;
  priceOf: PriceOf;
  turns: number;
  /** The Engine's calls per Turn. */
  turnShape: CallShape[];
}): RunEstimate {
  const { profile, priceOf, turns } = input;
  const line = (role: ProfileRole, purpose: string, calls: number, inputTokens: number, outputTokens: number) => {
    const { model } = resolveModelChoice(profile, role);
    const price = priceOf(model);
    const usd = (calls * (inputTokens * price.input + outputTokens * price.output)) / 1_000_000;
    return { role, purpose, model, calls, usd };
  };
  const lines = [
    ...input.turnShape.map((s) => line(s.role, s.purpose, s.callsPerTurn * turns, s.inputTokens, s.outputTokens)),
    line('player', 'run:player', turns, PLAYER_SHAPE.inputTokens, PLAYER_SHAPE.outputTokens),
    line('analyst', 'run:judge', 1, JUDGE_SHAPE.inputTokens, JUDGE_SHAPE.outputTokens),
  ];
  return { totalUsd: lines.reduce((sum, l) => sum + l.usd, 0), lines };
}
