// Scripted reader outputs for the mechanics tests: what the reader would
// report about each Player Letter, with every signal off unless set.
import { createHookContext, seededRandom, type AiAccess, type DraftBatch, type Json } from '@imbustai/story-runtime';
import { buildVossStory } from '../../seed/story';
import { vossEngine } from '../engine';
import type { AdelaideSignals, AuthoritySignals, ClueReading, ReadLetter, VossSignals } from '../mechanics/signals';
import { initialState, type VossState } from '../mechanics/state';
import { playTurn, type TurnPlan } from '../mechanics/turn';
import { vossStorySchema } from '../schema';

export const story = vossStorySchema.parse(buildVossStory());

export function voss(p: Partial<VossSignals> = {}): ReadLetter {
  return {
    to: 'voss',
    kind: 'voss',
    signals: {
      shares: false,
      takesFearSeriously: false,
      accuses: false,
      asksAbout1977: false,
      asksAboutCareer: false,
      doubtsLineups: false,
      asksToWarnBenvenuti: false,
      tellsTheDate: false,
      ladderArguments: [],
      clues: [],
      ...p,
    },
  };
}

/** A warm Letter to Voss: shares, takes the fear seriously. */
export const warm = (p: Partial<VossSignals> = {}) => voss({ shares: true, takesFearSeriously: true, ...p });

export function adelaide(p: Partial<AdelaideSignals> = {}): ReadLetter {
  return {
    to: 'adelaide',
    kind: 'adelaide',
    signals: {
      deducesPanorama: false,
      accusesOneTenant: false,
      asksAboutTheAria: false,
      asksAboutTheMan: false,
      clues: [],
      ...p,
    },
  };
}

export function office(to: string, p: Partial<AuthoritySignals> = {}): ReadLetter {
  return {
    to,
    kind: 'authority',
    signals: {
      requestKeys: [],
      namesAldo: false,
      statesDate: false,
      vossAsTarget: false,
      calendarReasoning: false,
      citesEvidence: [],
      linksToLuca: false,
      reportsBenvenuti: false,
      reportsCancellations: false,
      joinsAriaAndRigoletto: false,
      passesTheBulb: false,
      reportsVossConfession: false,
      clues: [],
      ...p,
    },
  };
}

export const understood = (...keys: string[]): ClueReading[] =>
  keys.map((key) => ({ key, status: 'understood', wrongLead: '' }));
export const misread = (key: string, wrongLead: string): ClueReading => ({ key, status: 'misread', wrongLead });

export const random = (gameId: string, turn: number) => (label: string) => seededRandom(`${gameId}:${turn}:${label}`);

export interface Played {
  plans: TurnPlan[];
  states: VossState[];
  final: VossState;
}

/** Plays Turns 1…n from a new Game, one array of read Letters per Turn. */
export function play(turns: ReadLetter[][], from: VossState = initialState(story)): Played {
  const plans: TurnPlan[] = [];
  const states: VossState[] = [];
  let state = from;
  turns.forEach((letters) => {
    const turn = state.batch + 1;
    const out = playTurn(story, state, { turn, letters, random: random('g', turn) });
    plans.push(out.plan);
    states.push(out.state);
    state = out.state;
  });
  return { plans, states, final: state };
}

const noAi = {
  structured: () => Promise.reject(new Error('no AI in this test')),
  text: () => Promise.reject(new Error('no AI in this test')),
  converse: () => Promise.reject(new Error('no AI in this test')),
} as unknown as AiAccess;

/**
 * Plays a whole Game through the Engine's Hooks, as the platform would: each
 * Turn's draft carries `playTurn`'s state in `effects`, `applyTurn` returns
 * it on approve, and `resolveEnding` runs after every applied Turn.
 */
export async function playThroughHooks(turns: ReadLetter[][]) {
  const ctx = createHookContext({ ai: noAi, gameId: 'g', turn: 0, locale: 'it-IT' });
  let { state } = await vossEngine.startGame(ctx, { gameId: 'g', story, realStartDate: '2026-10-14' });
  const endings: (string | null)[] = [];
  let ending = null;
  for (const [i, letters] of turns.entries()) {
    const turn = i + 1;
    const view = { gameId: 'g', story, state, turn, history: [], submission: letters.map((l) => ({ to: l.to, body: '' })) };
    const errors = vossEngine.validateSubmission(view, view.submission).filter((f) => f.severity === 'error');
    if (errors.length) throw new Error(`Turn ${turn}: ${errors.map((e) => e.message).join('; ')}`);
    const out = playTurn(story, state, { turn, letters, random: random('g', turn) });
    const draft: DraftBatch = {
      letters: [],
      submissionDate: out.plan.submissionDate,
      effects: JSON.parse(JSON.stringify({ state: out.state, plan: out.plan })) as Json,
      adminNotes: out.plan.adminNotes,
    };
    state = vossEngine.schema.state.parse(await vossEngine.applyTurn(ctx, view, draft));
    ending = vossEngine.resolveEnding({ ...view, state });
    endings.push(ending?.key ?? null);
  }
  return { state, ending, endings };
}
