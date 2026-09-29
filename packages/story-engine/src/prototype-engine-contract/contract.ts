// PROTOTYPE — throwaway. Answers "What exactly is the Engine contract?"
// (Imbustai/imbustai-app#20). Once approved, these types move into
// @imbustai/story-runtime (Extract the story runtime and the classic engine).

import type { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

/** In-fiction date, YYYY-MM-DD. */
export type IsoDate = string;
export type CharacterSlug = string;
/** Plain JSON: what may be persisted in games.runtime_state and ai_drafts. */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

// ─── Letters and Enclosures ─────────────────────────────────────────────────

/**
 * Something slipped inside an envelope: a document (a certificate, the court's
 * dispositivo) or a clipping. Text only — it must be printable as paper.
 */
export interface Enclosure {
  /** Stable within its Letter; admin edits and the Ledger refer to it. */
  key: string;
  kind: 'document' | 'clipping';
  /** Shown on the enclosure itself, e.g. "Certificato di stato di famiglia". */
  title: string;
  /** Markdown. */
  body: string;
}

/**
 * - letter: an ordinary Letter from a Character; the Player may reply.
 * - dispatch: a telegram or clipping sent on its own; never counts as a
 *   Character's reply.
 * - epilogue: sent after the Game has ended; needs no reply.
 */
export type OutgoingKind = 'letter' | 'dispatch' | 'epilogue';

/** A piece of correspondence the Engine sends to the Lead. */
export interface OutgoingLetter {
  /** Stable within its batch; regeneration targets a Letter by key. */
  key: string;
  kind: OutgoingKind;
  from: CharacterSlug;
  /** The in-fiction date on the letterhead; the Engine owns the story clock. */
  storyDate: IsoDate;
  /** Markdown, without a date line. */
  body: string;
  enclosures: Enclosure[];
}

/** One Letter the Player writes as the Lead. The Player never encloses anything. */
export interface PlayerLetter {
  to: CharacterSlug;
  body: string;
}

/** A Letter already delivered, in either direction, as Engines see history. */
export type DeliveredLetter =
  | ({ direction: 'in'; turn: number } & OutgoingLetter)
  | ({ direction: 'out'; turn: number; storyDate: IsoDate } & PlayerLetter);

// ─── Batches ────────────────────────────────────────────────────────────────

/**
 * One reviewable batch: every Letter one Turn triggers, or the closing batch.
 * The platform stores it as an ai_drafts version; the admin may edit Letter
 * bodies and Enclosures, never `effects`.
 */
export interface DraftBatch {
  letters: OutgoingLetter[];
  /**
   * The in-fiction date the Lead's Letters of this Turn bear. The Engine owns
   * the clock, so it dates the Player's Letters too. Absent in a closing batch.
   */
  submissionDate?: IsoDate;
  /**
   * Engine-owned, opaque to the platform: what this batch does to the Game
   * (evidence revealed, Voss's doubt moved…). Handed back to `applyTurn` on
   * approve. The platform only persists it.
   */
  effects: Json;
  /** Shown to the admin beside the draft (the Engine's reasoning). Never to the Player. */
  adminNotes: string[];
}

/** What `validateDraft` and `validateSubmission` report. */
export interface Finding {
  rule: string;
  /** error holds a released Game's Turn for review; warning is advisory. */
  severity: 'error' | 'warning';
  message: string;
  letterKey?: string;
}

// ─── The hook context: everything an Engine may reach outside itself ────────

export type ModelRole = 'writer' | 'clerk' | 'analyst';

export interface AiRequest<S extends z.ZodTypeAny> {
  /**
   * Why this call happens, for the usage log and the Run report,
   * e.g. "reply:voss", "ledger", "epilogue:pm".
   */
  purpose: string;
  /** Stable across Turns — cached by the provider (the Character prefix). */
  cachedPrefix?: string;
  system: string;
  user: string;
  /** The reply's shape; the platform turns it into JSON-schema structured output. */
  schema: S;
  maxTokens?: number;
}

/**
 * AI by role. The model comes from the Game's model profile; every call is
 * metered, retried on malformed output, and reserved against the Run's cost
 * cap before it is sent. Engines never see a provider, a key or a price.
 */
export interface AiAccess {
  structured<S extends z.ZodTypeAny>(role: ModelRole, request: AiRequest<S>): Promise<z.infer<S>>;
  text(role: ModelRole, request: Omit<AiRequest<never>, 'schema'>): Promise<string>;
}

/** Pure date helpers in the Story's locale. */
export interface DateTools {
  addDays(date: IsoDate, days: number): IsoDate;
  daysBetween(from: IsoDate, to: IsoDate): number;
  /** "12 marzo 1987" — for prose, never for storage. */
  format(date: IsoDate): string;
}

/** A note the admin left on the Game, e.g. "Voss is getting too warm too fast". */
export interface AdminNote {
  text: string;
  /** The Turn it was written during; undefined = about the whole Game. */
  turn?: number;
}

export interface HookContext {
  ai: AiAccess;
  dates: DateTools;
  adminNotes: AdminNote[];
  /**
   * Deterministic per Game, Turn and label: the same Game replays the same
   * way. Engines never call Math.random.
   */
  random(label: string): number;
}

// ─── What each Hook sees of the Game ────────────────────────────────────────

export interface GameView<Data, State> {
  gameId: string;
  /** The Story's Engine data, already validated by `schema.data`. */
  story: Data;
  /** The Engine's per-Game state, already validated by `schema.state`. */
  state: State;
  /** The Turn being played: 1 for the first Player submission. */
  turn: number;
  /** Delivered Letters, both directions, oldest first. */
  history: DeliveredLetter[];
  /** The Player's Letters of the Turn being played; empty at start and while closing. */
  submission: PlayerLetter[];
}

export interface Contact {
  slug: CharacterSlug;
  name: string;
  /** Where a Letter would be posted — keeps the Game playable as paper. */
  address?: string;
}

export interface Ending {
  /** One of the Story's Ending keys, e.g. "saved_caught". */
  key: string;
  /** Engine-owned detail the Epilogue needs (the evidence score, the verdict). */
  detail: Json;
}

/** What `generateTurn` is asked for: the whole batch, or one Letter again. */
export type GenerateRequest =
  | { kind: 'batch'; guidance?: string }
  | {
      kind: 'letter';
      /** The current draft; every other Letter in it is kept as it is. */
      draft: DraftBatch;
      letterKey: string;
      guidance: string;
    };

// ─── The Engine ─────────────────────────────────────────────────────────────

export interface Engine<Data, State extends Json> {
  /** Matches stories.engine, e.g. "engine-voss". */
  id: string;

  /** Validates the Story document (seed sync) and the per-Game state (every load). */
  schema: { data: z.ZodType<Data>; state: z.ZodType<State> };

  /** Static, so the Player UI can show it before any Hook runs. */
  maxLettersPerTurn: number;

  /**
   * A new Game: its first state and the opening envelope. The opening batch
   * is authored, not generated, so it is delivered without review.
   */
  startGame(
    ctx: HookContext,
    input: { gameId: string; story: Data; realStartDate: IsoDate },
  ): Promise<{ state: State; opening: OutgoingLetter[] }>;

  /** Who the Player may write to now. */
  contacts(view: GameView<Data, State>): Contact[];

  /** Checked before a submission is accepted; any error rejects it. */
  validateSubmission(view: GameView<Data, State>, submission: PlayerLetter[]): Finding[];

  /**
   * The Turn's replies, or one reply again with admin guidance. Always
   * returns the whole batch so `effects` stays consistent with its Letters.
   */
  generateTurn(
    ctx: HookContext,
    view: GameView<Data, State>,
    request: GenerateRequest,
  ): Promise<DraftBatch>;

  /**
   * Re-run after every generation and every admin edit. In a released Story,
   * no errors = auto-send.
   */
  validateDraft(ctx: HookContext, view: GameView<Data, State>, draft: DraftBatch): Promise<Finding[]>;

  /**
   * On approve, with the Letters as the Player will read them (admin edits
   * included); `view.submission` still holds the Player's Letters. Returns
   * the next state. May use AI (the Ledger reads the sent Letters), so it is
   * async.
   */
  applyTurn(
    ctx: HookContext,
    view: GameView<Data, State>,
    approved: DraftBatch,
  ): Promise<State>;

  /** After every applied Turn: null = the Game goes on. Pure code, no AI. */
  resolveEnding(view: GameView<Data, State>): Ending | null;

  /**
   * The closing batch: no Player letters, reviewed like any draft, and the
   * Game is completed once it is sent. Only `epilogue` and `dispatch` Letters.
   */
  generateEpilogue(
    ctx: HookContext,
    view: GameView<Data, State>,
    ending: Ending,
  ): Promise<DraftBatch>;
}
