import type { AdminNote, AiAccess, HookContext } from '../contract';
import { dateTools, seededRandom } from '../time/dates';

// Builds the context every Hook receives. `random` is seeded by Game, Turn and
// label, so the same Game replays the same way.

export interface HookContextInput {
  gameId: string;
  /** The Turn being played; 0 at game start. */
  turn: number;
  ai: AiAccess;
  adminNotes?: AdminNote[];
  locale?: string;
}

export function createHookContext(input: HookContextInput): HookContext {
  return {
    ai: input.ai,
    dates: dateTools(input.locale),
    adminNotes: input.adminNotes ?? [],
    random: (label) => seededRandom(`${input.gameId}:${input.turn}:${label}`),
  };
}
