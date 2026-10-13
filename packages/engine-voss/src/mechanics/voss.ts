import type { VossStory } from '../schema';
import type { LadderArgument, VossSignals } from './signals';
import type { LadderKey, VossState } from './state';

// Voss's state (§4): trust 0–10, the five layers, the three doubt ladders,
// the cold Turn and the doors. Each function moves a draft state for one
// Turn N, whose Letters Voss answers in batch N.

export type TrustBand = 'low' | 'medium' | 'high';

export function trustBand(story: VossStory, trust: number): TrustBand {
  const t = story.voss.trust;
  return trust >= t.high ? 'high' : trust >= t.medium ? 'medium' : 'low';
}

function delta(story: VossStory, key: string): number {
  const rule = story.voss.trust.rules.find((r) => r.key === key);
  if (!rule) throw new Error(`engine-voss: no trust rule "${key}"`);
  return rule.delta;
}

/**
 * Trust after Turn N (§4.1): +1 shares, +1 takes the fear seriously, at most
 * +2 a Turn; an accusation before layer 4 costs −3 and makes batch N cold;
 * the second Turn in a row without a Letter to Voss (and every one after it)
 * costs −1. Returns whether batch N is cold.
 */
export function moveTrust(story: VossStory, s: VossState, letters: VossSignals[]): { cold: boolean } {
  const t = story.voss.trust;
  let cold = false;
  if (letters.length === 0) {
    s.silentTurns += 1;
    if (s.silentTurns >= 2) s.trust += delta(story, 'silence');
  } else {
    s.silentTurns = 0;
    let gain = 0;
    if (letters.some((l) => l.shares)) gain += delta(story, 'shares');
    if (letters.some((l) => l.takesFearSeriously)) gain += delta(story, 'takes_fear_seriously');
    s.trust += Math.min(gain, t.maxGainPerTurn);
    if (letters.some((l) => l.accuses) && s.layers['4'] === undefined) {
      s.trust += delta(story, 'accuses');
      cold = true;
    }
  }
  s.trust = Math.max(t.min, Math.min(t.max, s.trust));
  return { cold };
}

/** The gate question each layer waits for, as `VossState['asked']` keys. */
const LAYER_QUESTION: Record<number, keyof VossState['asked']> = {
  1: 'about1977',
  2: 'aboutCareer',
  4: 'doubtsLineups',
};

export interface LayerResult {
  /** The layer Voss tells in batch N, if any (one per batch at most). */
  granted: number | null;
  /** Layer 4's door is open but trust is short: he circles layer 3 («non ancora, Giacomo»). */
  circling: boolean;
}

/**
 * The layer Voss may tell in batch N (§4.2): the lowest untold layer whose
 * gates all hold — trust, the question (asked in any Turn so far: Voss
 * remembers it), the event, the previous layer told in an earlier batch, the
 * first batch. Never in a cold batch. Layer 4 brings the Luca ladder to its
 * top, since its step 2 is the confession itself.
 */
export function tellLayer(story: VossStory, s: VossState, batch: number, events: Set<string>, cold: boolean): LayerResult {
  if (cold) return { granted: null, circling: false };
  let circling = false;
  for (const layer of story.voss.layers) {
    if (s.layers[String(layer.layer)] !== undefined) continue;
    const q = LAYER_QUESTION[layer.layer];
    const otherGates =
      batch >= layer.fromBatch &&
      (q === undefined || s.asked[q]) &&
      (layer.afterEvent === null || events.has(layer.afterEvent)) &&
      (layer.afterLayer === null || (s.layers[String(layer.afterLayer)] ?? Infinity) < batch);
    if (!otherGates) continue;
    if (layer.minTrust !== null && s.trust < layer.minTrust) {
      if (layer.layer === 4) circling = true;
      continue;
    }
    s.layers[String(layer.layer)] = batch;
    if (layer.layer === 4) s.ladders.luca = 2;
    return { granted: layer.layer, circling: false };
  }
  return { granted: null, circling };
}

export interface LadderMove {
  ladder: LadderKey;
  from: number;
  to: number;
  basis: string;
}

/** Whether the target ladder has lit up: from the murder of the teacher on. */
export function targetLit(events: Set<string>): boolean {
  return events.has('murder_3');
}

/**
 * The ladder steps Voss climbs in batch N (§4.3): one step per ladder at
 * most, never in a cold batch, only to the next step, only with a reason, and
 * only once the step's first batch and its facts are there:
 * - target: lit after the murder of the teacher; step 2 needs layer 4
 *   (Pierangeli dismantled) or the Lead telling him the date, with a why;
 * - killer: step 1 needs K1 understood (someone lived in Rosa's house);
 *   step 2 needs the Player to hold P1, P2, P3 or P9, or K6 understood;
 * - luca: step 2 comes only with layer 4.
 * Bare assertions are returned apart: Voss answers «perché?» and stays.
 */
export function climbLadders(
  story: VossStory,
  s: VossState,
  batch: number,
  events: Set<string>,
  cold: boolean,
  letters: VossSignals[],
): { moves: LadderMove[]; bare: LadderKey[] } {
  const moves: LadderMove[] = [];
  const bare = new Set<LadderKey>();
  if (cold) return { moves, bare: [] };
  const all: LadderArgument[] = letters.flatMap((l) => l.ladderArguments);
  const tellsDate = letters.some((l) => l.tellsTheDate);

  for (const ladder of story.voss.ladders) {
    const key = ladder.key;
    const from = s.ladders[key];
    const to = from + 1;
    if (to > 2) continue;
    const args = all.filter((a) => a.ladder === key && a.toStep === to);
    const argued = args.find((a) => a.basis.trim() !== '');
    if (!argued) {
      if (args.length > 0) bare.add(key);
      continue;
    }
    const step = ladder.steps[to];
    if (step.fromBatch !== null && batch < step.fromBatch) continue;
    if (!factsAllow(s, key, to, events, tellsDate)) continue;
    s.ladders[key] = to;
    moves.push({ ladder: key, from, to, basis: argued.basis });
  }
  return { moves, bare: [...bare] };
}

const KILLER_PROOFS = ['P1', 'P2', 'P3', 'P9'];

function factsAllow(s: VossState, key: LadderKey, to: number, events: Set<string>, tellsDate: boolean): boolean {
  switch (key) {
    case 'target':
      if (!targetLit(events)) return false;
      return to === 1 || s.layers['4'] !== undefined || tellsDate;
    case 'killer':
      if (to === 1) return s.clues.K1?.status === 'understood';
      return s.evidence.some((p) => KILLER_PROOFS.includes(p)) || s.clues.K6?.status === 'understood';
    case 'luca':
      return to === 1;
  }
}

/**
 * Lattanzi's arrest (§4.3), the one event that lowers a ladder: every ladder
 * on step 1 goes back to 0; step 2 never does. Applied before Voss reads the
 * Letters of the Turn after it.
 */
export function applyLattanzi(s: VossState): void {
  for (const key of ['target', 'killer', 'luca'] as const) {
    if (s.ladders[key] === 1) s.ladders[key] = 0;
  }
}

/**
 * The door Voss points at in batch N when the Lead wrote to no office in
 * Turn N (§4.4): the first door, in order, already open by batch, whose
 * office the Lead has never written to. The office and the document, never
 * the field to read.
 */
export function nextDoor(story: VossStory, s: VossState, batch: number): VossStory['voss']['doors'][number] | null {
  return story.voss.doors.find((d) => d.fromBatch <= batch && !s.officesWritten.includes(d.office)) ?? null;
}
