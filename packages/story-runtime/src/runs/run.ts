import type { HostAiAccess } from '../ai/access';
import type { Ending, Finding, PlayerLetter } from '../contract';
import { hasErrors } from '../host/workflow';
import { RunCapError } from './budget';
import { writePlayerTurn, type Persona, type PlayerView } from './player';

// The Run loop: an AI player plays a Game Turn by Turn until the Engine
// resolves an Ending, the Turn limit is reached, or the cost cap refuses a
// call. It knows no Engine: the platform hands it a Game to play through
// `RunGame`, whose Turns go through the same Hooks as a Player's.

/** The Game a Run plays, as the platform exposes it. */
export interface RunGame {
  /** The Player's view now, plus where the Game stands. */
  view(): Promise<RunGameView>;
  /** Submit the Turn's Letters; error findings mean it was rejected and nothing was stored. */
  submit(letters: PlayerLetter[]): Promise<Finding[]>;
  /**
   * Generate and auto-approve every batch that is due: the open Turn's
   * replies, and the closing batch if the Engine resolved an Ending.
   */
  resolve(): Promise<void>;
}

/** What the player sees and where the Game stands. */
export interface RunGameView extends PlayerView {
  /** Turns whose replies were sent, the closing batch excluded. */
  turnsPlayed: number;
  /** A batch is due: Letters were submitted, or the closing batch is not sent yet. */
  awaitingReplies: boolean;
  /** The Game is completed: its closing batch was sent. */
  completed: boolean;
  /** The Ending the Engine resolved, once it has. */
  ending: Ending | null;
}

/**
 * How a Run stopped. `ending`: the Engine resolved one and its closing batch
 * was sent. `turn_limit`: the Run's last Turn was played with no Ending.
 * `cap` and `error` are failed Runs.
 */
export type RunOutcome = 'ending' | 'turn_limit' | 'cap' | 'error';

/** Where a Run stands after a step. */
export type RunStep =
  | { done: false; turnsPlayed: number }
  | {
      done: true;
      outcome: RunOutcome;
      failed: boolean;
      turnsPlayed: number;
      ending: Ending | null;
      /** Why a failed Run failed. */
      error?: string;
    };

/** What a Run needs to play a Turn. */
export interface RunInput {
  game: RunGame;
  /** AI on the Game's model profile; the `player` role writes the Lead's Letters. */
  ai: HostAiAccess;
  persona: Persona;
  /** The Run stops after this many Turns if the Engine has resolved no Ending. */
  maxTurns: number;
}

function standing(view: RunGameView, maxTurns: number): RunStep {
  if (view.completed) {
    return { done: true, outcome: 'ending', failed: false, turnsPlayed: view.turnsPlayed, ending: view.ending };
  }
  if (!view.awaitingReplies && view.turnsPlayed >= maxTurns) {
    return { done: true, outcome: 'turn_limit', failed: false, turnsPlayed: view.turnsPlayed, ending: null };
  }
  return { done: false, turnsPlayed: view.turnsPlayed };
}

/**
 * Play one Turn of a Run: the AI player writes (once more if the Engine
 * rejects its Letters), then every due batch is generated and auto-approved.
 * A Run interrupted between the two resumes at the batch. Hitting the cost
 * cap or any error ends the Run as failed; nothing is thrown.
 * @category Utilities
 */
export async function playRunTurn(input: RunInput): Promise<RunStep> {
  const { game, ai, persona, maxTurns } = input;
  let turnsPlayed = 0;
  try {
    let view = await game.view();
    turnsPlayed = view.turnsPlayed;
    const before = standing(view, maxTurns);
    if (before.done) return before;

    if (!view.awaitingReplies) {
      let letters = await writePlayerTurn(ai, { view, persona });
      let findings = await game.submit(letters);
      if (hasErrors(findings)) {
        const rejected = findings.filter((f) => f.severity === 'error');
        letters = await writePlayerTurn(ai, { view, persona, rejected });
        findings = await game.submit(letters);
        if (hasErrors(findings)) {
          throw new Error(
            `The Engine rejected the AI player's Letters twice on Turn ${view.turn}: ` +
              findings.map((f) => f.message).join(' '),
          );
        }
      }
    }
    await game.resolve();

    view = await game.view();
    return standing(view, maxTurns);
  } catch (err) {
    const outcome: RunOutcome = err instanceof RunCapError ? 'cap' : 'error';
    return {
      done: true,
      outcome,
      failed: true,
      turnsPlayed,
      ending: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Play a Run to its end, one Turn at a time. `onStep` is told after each.
 * @category Utilities
 */
export async function playRun(
  input: RunInput & { onStep?: (step: RunStep) => void | Promise<void> },
): Promise<Extract<RunStep, { done: true }>> {
  let played = -1;
  for (;;) {
    let step = await playRunTurn(input);
    if (!step.done && step.turnsPlayed <= played) {
      // A step that plays no Turn would loop for ever, spending on the player each time.
      step = {
        done: true,
        outcome: 'error',
        failed: true,
        turnsPlayed: step.turnsPlayed,
        ending: null,
        error: `The Game did not advance past Turn ${step.turnsPlayed}.`,
      };
    }
    await input.onStep?.(step);
    if (step.done) return step;
    played = step.turnsPlayed;
  }
}
