import type { SupabaseClient } from '@supabase/supabase-js';
import {
  contactsOf,
  createAiAccess,
  createHookContext,
  createProvider,
  type AiAccess,
  type DeliveredLetter,
  type DraftBatch,
  type Engine,
  type Finding,
  type GameView,
  type HookContext,
  type UsageRecord,
} from '@imbustai/story-runtime';
import { engineEntryFor } from '@/lib/engines';
import type {
  AiDraftRow,
  GameRow,
  InteractionRow,
  InteractionTurnRow,
  StoryRow,
} from '@/lib/types/db';

// The platform side of the Engine contract: loads a Game through its Story's
// Engine and hands Hooks what they may see. Nothing here knows how any one
// Engine plays — that stays behind the Hooks.

export class WorkflowError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export interface LoadedStory {
  row: StoryRow;
  engine: Engine<unknown, unknown>;
  /** Validated by `engine.schema.data`. */
  story: unknown;
  readState(raw: unknown): unknown;
}

export async function loadStory(admin: SupabaseClient, storyId: string): Promise<LoadedStory> {
  const { data } = await admin.from('stories').select('*').eq('id', storyId).single();
  if (!data) throw new WorkflowError('story_not_found', 404);
  const row = data as StoryRow;
  const entry = engineEntryFor(row.engine);
  const story = entry.engine.schema.data.parse(await entry.loadStory(admin, row));
  return {
    row,
    engine: entry.engine,
    story,
    readState: (raw) =>
      entry.engine.schema.state.parse(entry.readState ? entry.readState(raw, story) : raw),
  };
}

export interface GameHost extends LoadedStory {
  admin: SupabaseClient;
  game: GameRow;
  /** Validated by `engine.schema.state`. */
  state: unknown;
  /** Every Letter of the Game, oldest first. */
  interactions: InteractionRow[];
  turns: InteractionTurnRow[];
}

export async function loadGameHost(
  admin: SupabaseClient,
  gameOrId: string | GameRow,
): Promise<GameHost> {
  let game: GameRow;
  if (typeof gameOrId === 'string') {
    const { data } = await admin.from('games').select('*').eq('id', gameOrId).single();
    if (!data) throw new WorkflowError('game_not_found', 404);
    game = data as GameRow;
  } else {
    game = gameOrId;
  }

  const loaded = await loadStory(admin, game.story_id);
  const [{ data: interactions }, { data: turns }] = await Promise.all([
    admin
      .from('interactions')
      .select('*')
      .eq('game_id', game.id)
      .order('letter_number', { ascending: true }),
    admin.from('interaction_turns').select('*').eq('game_id', game.id),
  ]);

  return {
    ...loaded,
    admin,
    game,
    state: loaded.readState(game.runtime_state ?? {}),
    interactions: (interactions ?? []) as InteractionRow[],
    turns: (turns ?? []) as InteractionTurnRow[],
  };
}

/** The last Turn whose replies were sent; 0 before the first. */
export function currentTurn(host: GameHost): number {
  return host.turns
    .filter((t) => t.status === 'sent')
    .reduce((max, t) => Math.max(max, t.turn_number), 0);
}

/**
 * The Game's in-fiction "today": the latest date on any of its Letters. The
 * Player's Letters carry it until the Engine dates them on approve.
 */
export function storyDateOf(host: GameHost): string | null {
  return host.interactions.reduce<string | null>(
    (latest, i) => (i.story_date && (!latest || i.story_date > latest) ? i.story_date : latest),
    null,
  );
}

function delivered(row: InteractionRow, turnOf: Map<string, number>): DeliveredLetter {
  const turn = row.turn_id ? (turnOf.get(row.turn_id) ?? 0) : 0;
  // Rows without a character or a date predate the engine; Engines decide what to do with them.
  const slug = row.character_slug ?? '';
  const storyDate = row.story_date ?? '';
  if (row.role === 'user') {
    return { direction: 'out', turn, to: slug, body: row.content, storyDate };
  }
  return {
    direction: 'in',
    turn,
    key: row.id,
    kind: row.kind,
    from: slug,
    storyDate,
    body: row.content,
    enclosures: row.enclosures,
  };
}

/** What the Hooks see while `turn` is being played; `openTurnId` holds the Player's Letters. */
export function viewOf(
  host: GameHost,
  opts: { turn: number; openTurnId?: string },
): GameView<unknown, unknown> {
  const turnOf = new Map(host.turns.map((t) => [t.id, t.turn_number]));
  const isOpen = (i: InteractionRow) => opts.openTurnId !== undefined && i.turn_id === opts.openTurnId;
  return {
    gameId: host.game.id,
    story: host.story,
    state: host.state,
    turn: opts.turn,
    history: host.interactions.filter((i) => !isOpen(i)).map((i) => delivered(i, turnOf)),
    submission: host.interactions
      .filter((i) => isOpen(i) && i.role === 'user' && i.character_slug)
      .map((i) => ({ to: i.character_slug as string, body: i.content })),
  };
}

/** The provider is created on the first AI call, so Hooks that never call AI need no key. */
function lazyAi(make: () => AiAccess): AiAccess {
  let ai: AiAccess | undefined;
  const get = () => (ai ??= make());
  return {
    structured(role, request) {
      return get().structured(role, request);
    },
    text(role, request) {
      return get().text(role, request);
    },
  };
}

export function hookContextFor(
  story: Pick<LoadedStory, 'row'>,
  gameId: string,
  turn: number,
  onUsage?: (record: UsageRecord) => void,
): HookContext {
  return createHookContext({
    gameId,
    turn,
    ai: lazyAi(() => createAiAccess({ provider: createProvider(), turn, onUsage })),
    locale: story.row.time_config?.date_locale,
  });
}

/** What the Player's UI shows: contacts named from the cast, the date, the limit. */
export function playerStatus(host: GameHost) {
  const open = host.turns.find((t) => t.status !== 'sent');
  const view = viewOf(host, { turn: currentTurn(host) + 1, openTurnId: open?.id });
  const card = (c: { slug: string; name: string; role?: string }) => ({
    slug: c.slug,
    name: c.name,
    role: c.role ?? '',
  });
  return {
    contacts: contactsOf(host.engine, view).map(card),
    /** Everyone who may sign a Letter, for naming senders. */
    correspondents: host.engine.cast(host.story).correspondents.map(card),
    storyDate: storyDateOf(host),
    currentTurn: currentTurn(host),
    maxLettersPerTurn: host.engine.maxLettersPerTurn,
  };
}

// ─── Drafts ↔ ai_drafts rows ────────────────────────────────────────────────

export function draftFromRow(row: AiDraftRow): DraftBatch {
  return {
    letters: row.responses ?? [],
    submissionDate: row.submission_date ?? undefined,
    effects: row.effects ?? {},
    adminNotes: row.narrator_notes ? [row.narrator_notes] : [],
  };
}

export function draftColumns(batch: DraftBatch, findings: Finding[]) {
  return {
    responses: batch.letters,
    effects: batch.effects,
    submission_date: batch.submissionDate ?? null,
    narrator_notes: batch.adminNotes.join('\n\n'),
    validation_warnings: findings,
  } satisfies Partial<AiDraftRow>;
}
