import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DEFAULT_MODEL,
  applyGameStateUpdates,
  canApprove,
  canGenerate,
  computeVisibleFrom,
  createProvider,
  generateTurnBatch,
  shouldAutoSend,
  turnPlanSchema,
  validateDraft,
  type BatchLetter,
  type LetterRecord,
  type PlayerTurnLetter,
  type RuntimeState,
  type StoryConfig,
  type TurnPlan,
  type UsageRecord as EngineUsageRecord,
} from '@imbustai/story-engine';
import { computeCostUsd, loadPricingMap } from '@/lib/ai-pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadStoryConfig, runtimeStateOf, toLetterRecords } from '@/lib/story-engine/load';
import type {
  AiDraftRow,
  GameRow,
  InteractionRow,
  InteractionTurnRow,
  StoryRow,
  UsageRecord as DbUsageRecord,
} from '@/lib/types/db';

// The reply workflow core (architecture §3). One pipeline for both
// lifecycles: testing stops after generate; released calls approve
// automatically when shouldAutoSend() agrees. AI interactions are ONLY ever
// inserted by approveDraft() — there is no other code path that writes
// role='ai' rows after game start.

export class WorkflowError extends Error {
  constructor(
    public code: string,
    public status: number,
  ) {
    super(code);
  }
}

export interface TurnContext {
  admin: SupabaseClient;
  turn: InteractionTurnRow;
  game: GameRow;
  story: StoryConfig;
  storyRow: StoryRow;
  state: RuntimeState;
  /** History excluding the open turn's player letters (they're passed separately). */
  history: LetterRecord[];
  playerLetters: PlayerTurnLetter[];
}

export async function loadTurnContext(turnId: string): Promise<TurnContext> {
  const admin = createAdminClient();
  const { data: turn } = await admin
    .from('interaction_turns')
    .select('*')
    .eq('id', turnId)
    .single();
  if (!turn) throw new WorkflowError('turn_not_found', 404);

  const { data: game } = await admin
    .from('games')
    .select('*')
    .eq('id', (turn as InteractionTurnRow).game_id)
    .single();
  if (!game) throw new WorkflowError('game_not_found', 404);

  const loaded = await loadStoryConfig(admin, (game as GameRow).story_id);
  if (!loaded) throw new WorkflowError('story_not_found', 404);

  const { data: interactions } = await admin
    .from('interactions')
    .select('*')
    .eq('game_id', (game as GameRow).id)
    .order('letter_number', { ascending: true });

  const all = (interactions ?? []) as InteractionRow[];
  const state = runtimeStateOf(game as GameRow, loaded.story);
  const history = toLetterRecords(
    all.filter((i) => i.turn_id !== turnId),
    state.story_date,
  );
  const playerLetters: PlayerTurnLetter[] = all
    .filter((i) => i.turn_id === turnId && i.role === 'user' && i.character_slug)
    .map((i) => ({ recipient_slug: i.character_slug as string, content: i.content }));

  return {
    admin,
    turn: turn as InteractionTurnRow,
    game: game as GameRow,
    story: loaded.story,
    storyRow: loaded.row,
    state,
    history,
    playerLetters,
  };
}

async function latestDraft(ctx: TurnContext): Promise<AiDraftRow | null> {
  const { data } = await ctx.admin
    .from('ai_drafts')
    .select('*')
    .eq('turn_id', ctx.turn.id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as AiDraftRow | null) ?? null;
}

async function insertDraft(
  ctx: TurnContext,
  fields: Omit<Partial<AiDraftRow>, 'id' | 'turn_id' | 'version'>,
): Promise<AiDraftRow> {
  const prev = await latestDraft(ctx);
  const version = (prev?.version ?? 0) + 1;
  const { data, error } = await ctx.admin
    .from('ai_drafts')
    .insert({ turn_id: ctx.turn.id, version, ...fields })
    .select('*')
    .single();
  if (error || !data) throw new WorkflowError(error?.message ?? 'draft_insert_failed', 500);
  await ctx.admin
    .from('interaction_turns')
    .update({ status: 'draft_ready' })
    .eq('id', ctx.turn.id);
  return data as AiDraftRow;
}

/**
 * Generate (or regenerate) the AI batch for a turn → new ai_drafts version.
 * onlyCharacter regenerates a single NPC letter reusing the stored plan.
 */
export async function generateDraft(
  turnId: string,
  opts: { onlyCharacter?: string; adminGuidance?: string } = {},
): Promise<AiDraftRow> {
  const ctx = await loadTurnContext(turnId);
  if (!canGenerate(ctx.turn.status)) throw new WorkflowError('turn_not_generatable', 409);

  const prev = await latestDraft(ctx);
  let reusePlan: TurnPlan | undefined;
  if (opts.onlyCharacter) {
    if (!prev) throw new WorkflowError('no_draft_to_regenerate', 409);
    reusePlan = turnPlanSchema.parse((prev as unknown as { plan: unknown }).plan);
  }

  let playerLetters = ctx.playerLetters;
  if (opts.adminGuidance?.trim()) {
    // Steering note rides along as operator context for the orchestrator.
    playerLetters = [
      ...playerLetters,
      {
        recipient_slug: '__admin_note__',
        content: `[ADMIN GUIDANCE — not a player letter; follow these instructions for this turn]\n${opts.adminGuidance.trim()}`,
      },
    ];
  }

  const provider = createProvider();
  const usageSink: EngineUsageRecord[] = [];
  const batch = await generateTurnBatch({
    story: ctx.story,
    state: ctx.state,
    history: ctx.history,
    playerLetters,
    provider,
    seed: `${ctx.game.id}:${ctx.turn.turn_number}`,
    reusePlan,
    onlyCharacter: opts.onlyCharacter,
    usageSink,
  });

  let responses = batch.responses;
  let warnings = batch.warnings;
  if (opts.onlyCharacter && prev) {
    // Merge the regenerated letter into the previous batch, re-validate whole.
    const kept = (prev.responses as BatchLetter[]).filter(
      (r) => r.character_slug !== opts.onlyCharacter,
    );
    responses = [...kept, ...batch.responses];
    warnings = validateDraft({
      story: ctx.story,
      state: ctx.state,
      plan: batch.plan,
      letters: responses,
      turnDate: ctx.state.story_date,
    });
  }

  // Cost: price each call's tokens against the admin-managed table, snapshot
  // onto the draft. Every call (orchestrator + each NPC letter, retries
  // included) is counted — this is real spend.
  const pricing = await loadPricingMap(ctx.admin);
  const usage: DbUsageRecord[] = usageSink.map((u) => ({
    ...u,
    cost_usd: computeCostUsd(u, pricing.get(u.model)),
  }));
  const sumOf = (k: keyof EngineUsageRecord) =>
    usage.reduce((acc, u) => acc + (u[k] as number), 0);
  const cost_usd = usage.reduce((acc, u) => acc + u.cost_usd, 0);
  const draftModel = usage[0]?.model ?? process.env.STORY_ENGINE_MODEL ?? DEFAULT_MODEL;
  const draftProvider = usage[0]?.provider ?? '';

  return insertDraft(ctx, {
    responses: responses as unknown as AiDraftRow['responses'],
    game_state_updates: batch.gameStateUpdates as unknown as AiDraftRow['game_state_updates'],
    narrator_notes: batch.narratorNotes,
    validation_warnings: warnings as unknown as AiDraftRow['validation_warnings'],
    source: prev ? 'regenerated' : 'generated',
    model: draftModel,
    provider: draftProvider,
    usage,
    input_tokens: sumOf('input_tokens'),
    output_tokens: sumOf('output_tokens'),
    cache_creation_input_tokens: sumOf('cache_creation_input_tokens'),
    cache_read_input_tokens: sumOf('cache_read_input_tokens'),
    cost_usd,
    ...({ plan: batch.plan } as object),
  });
}

/** Admin edited the letters: store as a new version and re-validate. */
export async function saveDraftEdits(
  draftId: string,
  edits: { responses: BatchLetter[]; narrator_notes?: string },
): Promise<AiDraftRow> {
  const admin = createAdminClient();
  const { data: draft } = await admin.from('ai_drafts').select('*').eq('id', draftId).single();
  if (!draft) throw new WorkflowError('draft_not_found', 404);
  const ctx = await loadTurnContext((draft as AiDraftRow).turn_id);
  if (!canGenerate(ctx.turn.status)) throw new WorkflowError('turn_not_editable', 409);

  const plan = turnPlanSchema.parse((draft as unknown as { plan: unknown }).plan ?? { replies: [{ character_slug: 'x', brief: 'x' }] });
  const warnings = validateDraft({
    story: ctx.story,
    state: ctx.state,
    plan,
    letters: edits.responses,
    turnDate: ctx.state.story_date,
  });

  return insertDraft(ctx, {
    responses: edits.responses as unknown as AiDraftRow['responses'],
    game_state_updates: (draft as AiDraftRow).game_state_updates,
    narrator_notes: edits.narrator_notes ?? (draft as AiDraftRow).narrator_notes,
    validation_warnings: warnings as unknown as AiDraftRow['validation_warnings'],
    source: 'edited',
    model: (draft as AiDraftRow).model,
    ...({ plan: (draft as unknown as { plan: unknown }).plan } as object),
  });
}

/**
 * Approve & send: the ONLY writer of role='ai' interactions post-game-start.
 * Inserts the batch with story_date + visible_from, applies state updates,
 * marks the turn sent.
 */
export async function approveDraft(turnId: string, draftId: string): Promise<void> {
  const ctx = await loadTurnContext(turnId);
  if (!canApprove(ctx.turn.status)) throw new WorkflowError('turn_not_approvable', 409);

  const { data: draft } = await ctx.admin
    .from('ai_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('turn_id', turnId)
    .single();
  if (!draft) throw new WorkflowError('draft_not_found', 404);
  const d = draft as AiDraftRow;
  const responses = d.responses as BatchLetter[];
  if (responses.length === 0) throw new WorkflowError('empty_draft', 409);

  const { data: maxRow } = await ctx.admin
    .from('interactions')
    .select('letter_number')
    .eq('game_id', ctx.game.id)
    .order('letter_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  let letterNumber = (maxRow?.letter_number ?? 0) + 1;

  const now = new Date();
  const rows = responses.map((r) => ({
    game_id: ctx.game.id,
    role: 'ai' as const,
    content: r.content,
    letter_number: letterNumber++,
    character_slug: r.character_slug,
    story_date: r.story_date,
    turn_id: turnId,
    visible_from: computeVisibleFrom(ctx.story.time_config.visible_delay, now),
  }));
  const { error: insErr } = await ctx.admin.from('interactions').insert(rows);
  if (insErr) throw new WorkflowError(insErr.message, 500);

  const newState = applyGameStateUpdates(
    ctx.state,
    {
      clues_found: [],
      npcs_to_unlock: [],
      dynamic_npc_proposals: [],
      ...(d.game_state_updates as object),
    },
    responses,
  );
  const { error: gErr } = await ctx.admin
    .from('games')
    .update({ runtime_state: newState })
    .eq('id', ctx.game.id);
  if (gErr) throw new WorkflowError(gErr.message, 500);

  const ts = new Date().toISOString();
  await ctx.admin
    .from('interaction_turns')
    .update({ status: 'sent', approved_at: ts, sent_at: ts })
    .eq('id', turnId);
}

export interface SubmitResult {
  turnId: string;
  turnNumber: number;
  autoSent: boolean;
  heldForReview: boolean;
}

/**
 * Player submits a turn (1+ letters). Inserts the turn + user interactions
 * only. For released stories, runs generate → validate → maybe auto-approve;
 * AI failures or validator errors leave the turn for the admin queue.
 */
export async function submitPlayerTurn(
  gameId: string,
  letters: PlayerTurnLetter[],
): Promise<SubmitResult> {
  const admin = createAdminClient();

  const { data: game } = await admin.from('games').select('*').eq('id', gameId).single();
  if (!game) throw new WorkflowError('game_not_found', 404);
  const g = game as GameRow;
  if (g.status !== 'in_progress') throw new WorkflowError('game_not_in_progress', 409);

  const loaded = await loadStoryConfig(admin, g.story_id);
  if (!loaded) throw new WorkflowError('story_not_found', 404);
  if (loaded.story.lifecycle === 'draft') throw new WorkflowError('story_not_playable', 409);

  const state = runtimeStateOf(g, loaded.story);
  const maxLetters = loaded.story.settings.max_letters_per_turn ?? 4;
  if (letters.length === 0) throw new WorkflowError('no_letters', 400);
  if (letters.length > maxLetters) throw new WorkflowError('too_many_letters', 400);
  for (const letter of letters) {
    if (!letter.content.trim() || letter.content.length > 8000) {
      throw new WorkflowError('invalid_letter', 400);
    }
    if (!state.unlocked_npcs.includes(letter.recipient_slug)) {
      throw new WorkflowError('recipient_locked', 400);
    }
  }

  const { data: open } = await admin
    .from('interaction_turns')
    .select('id')
    .eq('game_id', gameId)
    .neq('status', 'sent')
    .limit(1)
    .maybeSingle();
  if (open) throw new WorkflowError('turn_already_open', 409);

  const turnNumber = state.current_turn + 1;
  const { data: turn, error: tErr } = await admin
    .from('interaction_turns')
    .insert({ game_id: gameId, turn_number: turnNumber, status: 'pending_ai' })
    .select('*')
    .single();
  if (tErr || !turn) throw new WorkflowError(tErr?.message ?? 'turn_insert_failed', 500);

  const { data: maxRow } = await admin
    .from('interactions')
    .select('letter_number')
    .eq('game_id', gameId)
    .order('letter_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  let letterNumber = (maxRow?.letter_number ?? 0) + 1;

  const { error: iErr } = await admin.from('interactions').insert(
    letters.map((l) => ({
      game_id: gameId,
      role: 'user' as const,
      content: l.content,
      letter_number: letterNumber++,
      character_slug: l.recipient_slug,
      story_date: state.story_date,
      turn_id: (turn as InteractionTurnRow).id,
    })),
  );
  if (iErr) {
    await admin.from('interaction_turns').delete().eq('id', (turn as InteractionTurnRow).id);
    throw new WorkflowError(iErr.message, 500);
  }

  const turnId = (turn as InteractionTurnRow).id;

  // Released stories: same pipeline, approve step runs automatically.
  if (loaded.story.lifecycle === 'released') {
    try {
      const draft = await generateDraft(turnId);
      const warnings = draft.validation_warnings as never;
      if (shouldAutoSend(loaded.story.lifecycle, warnings)) {
        await approveDraft(turnId, draft.id);
        return { turnId, turnNumber, autoSent: true, heldForReview: false };
      }
      return { turnId, turnNumber, autoSent: false, heldForReview: true };
    } catch (err) {
      // AI/transient failure: turn stays open for the admin queue.
      console.error('auto-send failed, turn held for review', err);
      return { turnId, turnNumber, autoSent: false, heldForReview: true };
    }
  }

  return { turnId, turnNumber, autoSent: false, heldForReview: false };
}
