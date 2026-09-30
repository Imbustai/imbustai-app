// The Engine contract: what an Engine implements and what the platform hands
// it. Approved in "What exactly is the Engine contract?"
// (Imbustai/imbustai-app#20); see docs/adr/0001-engines-as-plug-in-packages.md.

import type { z } from 'zod';

// ─── Primitives ─────────────────────────────────────────────────────────────

/** In-fiction date, YYYY-MM-DD. */
export type IsoDate = string;
/** Stable authored identifier shared by cast, contacts and Letters. */
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

/** The purpose of an Engine model call; provider selection belongs to the platform. */
export type ModelRole = 'writer' | 'clerk' | 'analyst';

/** How hard the model thinks; the Game's model profile sets it per role. */
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

/** Prompts, validation schema and attribution for one structured AI call. */
export interface AiRequest<S extends z.ZodTypeAny> {
  /**
   * Why this call happens, for the usage log and the Run report,
   * e.g. "reply:voss", "ledger", "epilogue:pm".
   */
  purpose: string;
  /**
   * The Character this call writes or reads for: per-Character cost in the
   * Run report, and the profile's per-Character model override.
   */
  character?: CharacterSlug;
  /** Stable across Turns — cached by the provider (the Character prefix). */
  cachedPrefix?: string;
  system: string;
  user: string;
  /**
   * The reply's shape; the platform turns it into strict JSON-schema
   * structured output. Must be a closed object (no z.record, z.unknown).
   */
  schema: S;
  /** Upper bound on output, thinking included. */
  maxTokens?: number;
  /**
   * This call's effort, over the profile's for the role — for a task that is
   * lighter than the role's usual work (e.g. the Italian editing pass).
   */
  effort?: Effort;
}

/**
 * AI by role. The Game model profile and optional Character override choose
 * the model. The adapter meters completed and billed-incomplete attempts and
 * retries zod validation failures. Engines never see a provider, key or price.
 * Run budget enforcement belongs to the host; createAiAccess does not reserve it.
 */
export interface AiAccess {
  /** Generate a schema-validated reply with role/Character model selection and metered attempts. */
  structured<S extends z.ZodTypeAny>(role: ModelRole, request: AiRequest<S>): Promise<z.infer<S>>;
  /** Generate plain text through the role/Character model choice and record its usage. */
  text(role: ModelRole, request: Omit<AiRequest<never>, 'schema'>): Promise<string>;
  /**
   * A text call that can be continued: the one rewrite of a Letter goes back
   * into the writer's own conversation, append-only, so the cached prefix
   * and the draft's thinking stay valid. Pass the `conversation` a previous
   * reply returned and, as `request.user`, only the new message; resend the
   * same `system` and `cachedPrefix`. A continuation stays on the model that
   * started the conversation.
   */
  converse(
    role: ModelRole,
    request: Omit<AiRequest<never>, 'schema'>,
    conversation?: Conversation,
  ): Promise<{ text: string; conversation: Conversation }>;
}

/**
 * An exchange with one model, in its provider's own message format (thinking
 * blocks included). Opaque to Engines; plain JSON, so it can be persisted.
 */
export interface Conversation {
  model: string;
  messages: Json[];
}

/** Pure date helpers in the Story's locale. */
export interface DateTools {
  /** Shift an ISO date by a signed number of calendar days in UTC. */
  addDays(date: IsoDate, days: number): IsoDate;
  /** Signed number of days from the first ISO date to the second. */
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

/**
 * Platform capabilities passed to Hooks: metered AI, dates, admin notes and seeded random.
 * @category Hooks
 */
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

/**
 * Validated Story and state plus correspondence for the Turn a Hook is handling.
 * @category Hooks
 */
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

/**
 * Anyone who can appear on an envelope: the Lead, a Character, an office, a
 * newspaper. The cast is authored — no Correspondent is invented at runtime.
 * (Later, additive: `stationery?: string`, a key naming how their Letters look.)
 */
export interface Correspondent {
  slug: CharacterSlug;
  name: string;
  /** Shown under the name in the Player's contacts, e.g. "Medico legale". */
  role?: string;
  /** Letterhead and envelope — keeps the Game playable as paper. */
  address?: string;
  kind: 'person' | 'office' | 'newspaper';
}

/** Authored Lead and every possible sender, including unavailable Contacts. */
export interface Cast {
  lead: Correspondent;
  correspondents: Correspondent[];
}

/** Code-decided outcome plus Engine-owned detail for the closing batch. */
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

/**
 * The nine Hooks an Engine implements, with its Story and state schemas.
 *
 * `State` must be plain JSON: it is persisted in games.runtime_state. That is
 * enforced by `schema.state` on every load rather than by the type, so an
 * Engine may use optional fields.
 * @category Hooks
 */
export interface Engine<Data, State> {
  /** Matches stories.engine, e.g. "engine-voss". */
  id: string;

  /** Validates the Story document (seed sync) and the per-Game state (every load). */
  schema: { data: z.ZodType<Data, z.ZodTypeDef, unknown>; state: z.ZodType<State, z.ZodTypeDef, unknown> };

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

  /**
   * Everyone who can appear on an envelope, from the Story document alone.
   * The platform names every sender from it and rejects a draft whose `from`
   * is not in it.
   */
  cast(story: Data): Cast;

  /** Who the Player may write to now: slugs, each one in `cast`. */
  contacts(view: GameView<Data, State>): CharacterSlug[];

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
