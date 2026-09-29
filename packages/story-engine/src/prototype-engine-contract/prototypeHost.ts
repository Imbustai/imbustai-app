// PROTOTYPE — throwaway. An in-memory stand-in for the platform side of the
// contract: the order the Hooks run in, the review gate, the closing batch.
// No DB, no provider: `answer` plays the models.

import type { z } from 'zod';
import type {
  AdminNote,
  DeliveredLetter,
  DraftBatch,
  Ending,
  Engine,
  Finding,
  GameView,
  HookContext,
  IsoDate,
  Json,
  ModelRole,
  PlayerLetter,
} from './contract';
import { addDays, daysBetween, seededRandom } from '../time/timeService';

export type GameStatus = 'awaiting_player' | 'turn_draft' | 'epilogue_draft' | 'completed';

export interface UsageEntry {
  role: ModelRole;
  model: string;
  purpose: string;
  turn: number;
}

/** Plays the models: given a role and a purpose, returns the raw output. */
export type FakeAnswer = (role: ModelRole, purpose: string, prompt: { system: string; user: string }) => unknown;

export interface Game<Data, State extends Json> {
  id: string;
  lifecycle: 'testing' | 'released';
  status: GameStatus;
  story: Data;
  state: State;
  turn: number;
  history: DeliveredLetter[];
  submission: PlayerLetter[];
  draft: DraftBatch | null;
  findings: Finding[];
  ending: Ending | null;
  adminNotes: AdminNote[];
  usage: UsageEntry[];
}

const PROFILE: Record<ModelRole, string> = { writer: 'claude-fable-5-1', clerk: 'claude-sonnet-5-5', analyst: 'claude-haiku-4-5' };

export class PrototypeHost<Data, State extends Json> {
  constructor(
    private readonly engine: Engine<Data, State>,
    private readonly answer: FakeAnswer,
  ) {}

  private context(game: Game<Data, State>): HookContext {
    const call = (role: ModelRole, purpose: string, system: string, user: string) => {
      // The real runtime reserves against the cost cap here, then meters the call.
      game.usage.push({ role, model: PROFILE[role], purpose, turn: game.turn });
      return this.answer(role, purpose, { system, user });
    };
    return {
      ai: {
        structured: async <S extends z.ZodTypeAny>(role: ModelRole, r: { purpose: string; system: string; user: string; schema: S }) =>
          r.schema.parse(call(role, r.purpose, r.system, r.user)) as z.infer<S>,
        text: async (role, r) => String(call(role, r.purpose, r.system, r.user)),
      },
      dates: {
        addDays,
        daysBetween,
        format: (d: IsoDate) => new Date(`${d}T00:00:00Z`).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
      },
      adminNotes: game.adminNotes,
      random: (label) => seededRandom(`${game.id}:${game.turn}:${label}`),
    };
  }

  private view(game: Game<Data, State>): GameView<Data, State> {
    return { gameId: game.id, story: game.story, state: game.state, turn: game.turn, history: game.history, submission: game.submission };
  }

  async start(id: string, storyDocument: unknown, lifecycle: Game<Data, State>['lifecycle']): Promise<Game<Data, State>> {
    const story = this.engine.schema.data.parse(storyDocument);
    const game: Game<Data, State> = {
      id, lifecycle, status: 'awaiting_player', story, state: null as unknown as State, turn: 0,
      history: [], submission: [], draft: null, findings: [], ending: null, adminNotes: [], usage: [],
    };
    const { state, opening } = await this.engine.startGame(this.context(game), { gameId: id, story, realStartDate: '2026-09-29' });
    game.state = this.engine.schema.state.parse(state);
    game.history.push(...opening.map((l) => ({ ...l, direction: 'in' as const, turn: 0 })));
    game.turn = 1;
    return game;
  }

  /** Contacts as the Player UI shows them: named from the cast. */
  contacts(game: Game<Data, State>) {
    const { correspondents } = this.engine.cast(game.story);
    return this.engine.contacts(this.view(game)).map((slug) => {
      const found = correspondents.find((c) => c.slug === slug);
      if (!found) throw new Error(`Contact ${slug} is not in the cast`);
      return found;
    });
  }

  /** How the platform names any sender on an envelope. */
  sender(game: Game<Data, State>, slug: string) {
    return this.engine.cast(game.story).correspondents.find((c) => c.slug === slug);
  }

  /** Player submits a Turn; the draft is generated right away (in production: by the admin, or a job). */
  async submit(game: Game<Data, State>, letters: PlayerLetter[]): Promise<Finding[]> {
    if (game.status !== 'awaiting_player') throw new Error(`Cannot submit while ${game.status}`);
    const rejected = this.engine.validateSubmission(this.view(game), letters).filter((f) => f.severity === 'error');
    if (rejected.length > 0) return rejected;
    game.submission = letters;
    game.draft = await this.engine.generateTurn(this.context(game), this.view(game), { kind: 'batch' });
    game.status = 'turn_draft';
    await this.review(game);
    return [];
  }

  async regenerate(game: Game<Data, State>, letterKey: string, guidance: string) {
    if (game.status !== 'turn_draft' || !game.draft) throw new Error('Nothing to regenerate');
    game.draft = await this.engine.generateTurn(this.context(game), this.view(game), {
      kind: 'letter', draft: game.draft, letterKey, guidance,
    });
    await this.review(game);
  }

  async edit(game: Game<Data, State>, letterKey: string, body: string) {
    if (!game.draft) throw new Error('Nothing to edit');
    game.draft = { ...game.draft, letters: game.draft.letters.map((l) => (l.key === letterKey ? { ...l, body } : l)) };
    await this.review(game);
  }

  /** Re-validate; a released Story auto-sends a clean draft. */
  private async review(game: Game<Data, State>) {
    const known = new Set(this.engine.cast(game.story).correspondents.map((c) => c.slug));
    const unknown = game.draft!.letters.filter((l) => !known.has(l.from));
    if (unknown.length > 0) throw new Error(`Unknown sender: ${unknown.map((l) => l.from).join(', ')}`);
    game.findings = await this.engine.validateDraft(this.context(game), this.view(game), game.draft!);
    if (game.lifecycle === 'released' && !game.findings.some((f) => f.severity === 'error')) await this.approve(game);
  }

  async approve(game: Game<Data, State>) {
    const draft = game.draft;
    if (!draft) throw new Error('Nothing to approve');
    // The Player's Letters enter history dated by the Engine, then the replies.
    game.history.push(...game.submission.map((l) => ({ ...l, direction: 'out' as const, turn: game.turn, storyDate: draft.submissionDate! })));
    game.history.push(...draft.letters.map((l) => ({ ...l, direction: 'in' as const, turn: game.turn })));
    game.draft = null;

    if (game.status === 'epilogue_draft') {
      game.status = 'completed';
      return;
    }
    if (game.status !== 'turn_draft') throw new Error(`Cannot approve while ${game.status}`);

    const next = await this.engine.applyTurn(this.context(game), this.view(game), draft);
    game.state = this.engine.schema.state.parse(next);
    game.submission = [];

    const ending = this.engine.resolveEnding(this.view(game));
    if (!ending) {
      game.turn += 1;
      game.status = 'awaiting_player';
      return;
    }
    game.ending = ending;
    game.status = 'epilogue_draft';
    game.draft = await this.engine.generateEpilogue(this.context(game), this.view(game), ending);
    await this.review(game);
  }
}
