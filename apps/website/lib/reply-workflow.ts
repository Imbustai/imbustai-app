import {
  DEFAULT_MODEL,
  applyLetterEdits,
  canApprove,
  canGenerate,
  computeVisibleFrom,
  reviewDraft,
  shouldAutoSend,
  type GameView,
  type GenerateRequest,
  type LetterEdit,
  type PlayerLetter,
  type UsageRecord as RuntimeUsageRecord,
} from '@imbustai/story-runtime';
import { computeCostUsd, loadPricingMap } from '@/lib/ai-pricing';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  WorkflowError,
  currentTurn,
  draftColumns,
  draftFromRow,
  hookContextFor,
  loadGameHost,
  storyDateOf,
  viewOf,
  type GameHost,
} from '@/lib/game-host';
import type {
  AiDraftRow,
  GameRow,
  InteractionTurnRow,
  UsageRecord as DbUsageRecord,
} from '@/lib/types/db';

export { WorkflowError };

// The reply workflow core (architecture §3). One pipeline for both
// lifecycles: testing stops after generate; released calls approve
// automatically when shouldAutoSend() agrees. AI interactions are ONLY ever
// inserted by approveDraft() — there is no other code path that writes
// role='ai' rows after game start. Every step that decides anything about
// the story is a Hook of the Story's Engine.

interface TurnContext {
  host: GameHost;
  turn: InteractionTurnRow;
  /** The Hooks' view: history without this turn, its Player letters as the submission. */
  view: GameView<unknown, unknown>;
}

async function loadTurnContext(turnId: string): Promise<TurnContext> {
  const admin = createAdminClient();
  const { data: turn } = await admin
    .from('interaction_turns')
    .select('*')
    .eq('id', turnId)
    .single();
  if (!turn) throw new WorkflowError('turn_not_found', 404);
  const t = turn as InteractionTurnRow;

  const host = await loadGameHost(admin, t.game_id);
  return { host, turn: t, view: viewOf(host, { turn: t.turn_number, openTurnId: t.id }) };
}

async function latestDraft(ctx: TurnContext): Promise<AiDraftRow | null> {
  const { data } = await ctx.host.admin
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
  const { data, error } = await ctx.host.admin
    .from('ai_drafts')
    .insert({ turn_id: ctx.turn.id, version, ...fields })
    .select('*')
    .single();
  if (error || !data) throw new WorkflowError(error?.message ?? 'draft_insert_failed', 500);
  await ctx.host.admin
    .from('interaction_turns')
    .update({ status: 'draft_ready' })
    .eq('id', ctx.turn.id);
  return data as AiDraftRow;
}

/**
 * Generate (or regenerate) the AI batch for a turn → new ai_drafts version.
 * letterKey regenerates that one Letter; the Engine keeps the others.
 */
export async function generateDraft(
  turnId: string,
  opts: { letterKey?: string; adminGuidance?: string } = {},
): Promise<AiDraftRow> {
  const ctx = await loadTurnContext(turnId);
  if (!canGenerate(ctx.turn.status)) throw new WorkflowError('turn_not_generatable', 409);

  const prev = await latestDraft(ctx);
  let request: GenerateRequest;
  if (opts.letterKey) {
    if (!prev) throw new WorkflowError('no_draft_to_regenerate', 409);
    request = {
      kind: 'letter',
      draft: draftFromRow(prev),
      letterKey: opts.letterKey,
      guidance: opts.adminGuidance ?? '',
    };
  } else {
    request = { kind: 'batch', guidance: opts.adminGuidance };
  }

  const { host } = ctx;
  const calls: RuntimeUsageRecord[] = [];
  const hookCtx = hookContextFor(host, host.game.id, ctx.turn.turn_number, (u) => calls.push(u));
  const batch = await host.engine.generateTurn(hookCtx, ctx.view, request);
  const findings = await reviewDraft(host.engine, hookCtx, ctx.view, batch);

  // Cost: price each call's tokens against the admin-managed table, snapshot
  // onto the draft. Every call (retries included) is counted — this is real spend.
  const pricing = await loadPricingMap(host.admin);
  const usage: DbUsageRecord[] = calls.map((u) => ({
    call_type: u.purpose,
    character_slug: u.character,
    provider: u.provider,
    model: u.model,
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens,
    cache_creation_input_tokens: u.cache_creation_input_tokens,
    cache_read_input_tokens: u.cache_read_input_tokens,
    cost_usd: computeCostUsd(u, pricing.get(u.model)),
  }));
  type TokenField =
    | 'input_tokens'
    | 'output_tokens'
    | 'cache_creation_input_tokens'
    | 'cache_read_input_tokens';
  const sumOf = (k: TokenField) => usage.reduce((acc, u) => acc + u[k], 0);
  const cost_usd = usage.reduce((acc, u) => acc + u.cost_usd, 0);
  const draftModel = usage[0]?.model ?? process.env.STORY_ENGINE_MODEL ?? DEFAULT_MODEL;
  const draftProvider = usage[0]?.provider ?? '';

  return insertDraft(ctx, {
    ...draftColumns(batch, findings),
    source: prev ? 'regenerated' : 'generated',
    model: draftModel,
    provider: draftProvider,
    usage,
    input_tokens: sumOf('input_tokens'),
    output_tokens: sumOf('output_tokens'),
    cache_creation_input_tokens: sumOf('cache_creation_input_tokens'),
    cache_read_input_tokens: sumOf('cache_read_input_tokens'),
    cost_usd,
  });
}

/** Admin edited Letter bodies: store as a new version and re-validate. */
export async function saveDraftEdits(
  draftId: string,
  edits: { letters: LetterEdit[]; narrator_notes?: string },
): Promise<AiDraftRow> {
  const admin = createAdminClient();
  const { data: draft } = await admin.from('ai_drafts').select('*').eq('id', draftId).single();
  if (!draft) throw new WorkflowError('draft_not_found', 404);
  const d = draft as AiDraftRow;
  const ctx = await loadTurnContext(d.turn_id);
  if (!canGenerate(ctx.turn.status)) throw new WorkflowError('turn_not_editable', 409);

  const batch = applyLetterEdits(draftFromRow(d), edits.letters);
  if (edits.narrator_notes !== undefined) {
    batch.adminNotes = edits.narrator_notes ? [edits.narrator_notes] : [];
  }
  const { host } = ctx;
  const hookCtx = hookContextFor(host, host.game.id, ctx.turn.turn_number);
  const findings = await reviewDraft(host.engine, hookCtx, ctx.view, batch);

  return insertDraft(ctx, {
    ...draftColumns(batch, findings),
    source: 'edited',
    model: d.model,
  });
}

/**
 * Approve & send: the ONLY writer of role='ai' interactions post-game-start.
 * Inserts the batch with story_date + visible_from, dates the Player's
 * Letters, lets the Engine apply the turn, marks the turn sent.
 */
export async function approveDraft(turnId: string, draftId: string): Promise<void> {
  const ctx = await loadTurnContext(turnId);
  if (!canApprove(ctx.turn.status)) throw new WorkflowError('turn_not_approvable', 409);
  const { host } = ctx;

  const { data: draft } = await host.admin
    .from('ai_drafts')
    .select('*')
    .eq('id', draftId)
    .eq('turn_id', turnId)
    .single();
  if (!draft) throw new WorkflowError('draft_not_found', 404);
  const batch = draftFromRow(draft as AiDraftRow);
  if (batch.letters.length === 0) throw new WorkflowError('empty_draft', 409);

  const { data: maxRow } = await host.admin
    .from('interactions')
    .select('letter_number')
    .eq('game_id', host.game.id)
    .order('letter_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  let letterNumber = (maxRow?.letter_number ?? 0) + 1;

  const now = new Date();
  const rows = batch.letters.map((l) => ({
    game_id: host.game.id,
    role: 'ai' as const,
    content: l.body,
    letter_number: letterNumber++,
    character_slug: l.from || null,
    story_date: l.storyDate,
    turn_id: turnId,
    visible_from: computeVisibleFrom(host.row.time_config.visible_delay, now),
  }));
  const { error: insErr } = await host.admin.from('interactions').insert(rows);
  if (insErr) throw new WorkflowError(insErr.message, 500);

  // The Engine owns the story clock, so it dates the Player's Letters too.
  if (batch.submissionDate) {
    const { error: dateErr } = await host.admin
      .from('interactions')
      .update({ story_date: batch.submissionDate })
      .eq('turn_id', turnId)
      .eq('role', 'user');
    if (dateErr) throw new WorkflowError(dateErr.message, 500);
  }

  const hookCtx = hookContextFor(host, host.game.id, ctx.turn.turn_number);
  const next = host.engine.schema.state.parse(
    await host.engine.applyTurn(hookCtx, ctx.view, batch),
  );
  const { error: gErr } = await host.admin
    .from('games')
    .update({ runtime_state: next })
    .eq('id', host.game.id);
  if (gErr) throw new WorkflowError(gErr.message, 500);

  const ts = new Date().toISOString();
  await host.admin
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

/** A Letter as the Player's UI posts it. */
export interface SubmittedLetter {
  recipient_slug: string;
  content: string;
}

/**
 * Player submits a turn (1+ letters). Inserts the turn + user interactions
 * only. For released stories, runs generate → validate → maybe auto-approve;
 * AI failures or validator errors leave the turn for the admin queue.
 */
export async function submitPlayerTurn(
  gameId: string,
  letters: SubmittedLetter[],
): Promise<SubmitResult> {
  const admin = createAdminClient();

  const { data: game } = await admin.from('games').select('*').eq('id', gameId).single();
  if (!game) throw new WorkflowError('game_not_found', 404);
  const g = game as GameRow;
  if (g.status !== 'in_progress') throw new WorkflowError('game_not_in_progress', 409);

  const host = await loadGameHost(admin, g);
  if (host.row.lifecycle === 'draft') throw new WorkflowError('story_not_playable', 409);

  if (letters.length === 0) throw new WorkflowError('no_letters', 400);
  const turnNumber = currentTurn(host) + 1;
  const submission: PlayerLetter[] = letters.map((l) => ({ to: l.recipient_slug, body: l.content }));
  const rejected = host.engine
    .validateSubmission(viewOf(host, { turn: turnNumber }), submission)
    .find((f) => f.severity === 'error');
  if (rejected) throw new WorkflowError(rejected.rule, 400);

  const { data: open } = await admin
    .from('interaction_turns')
    .select('id')
    .eq('game_id', gameId)
    .neq('status', 'sent')
    .limit(1)
    .maybeSingle();
  if (open) throw new WorkflowError('turn_already_open', 409);

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

  // Dated with the Game's current in-fiction date until the Engine dates them on approve.
  const storyDate = storyDateOf(host);
  const { error: iErr } = await admin.from('interactions').insert(
    submission.map((l) => ({
      game_id: gameId,
      role: 'user' as const,
      content: l.body,
      letter_number: letterNumber++,
      character_slug: l.to,
      story_date: storyDate,
      turn_id: (turn as InteractionTurnRow).id,
    })),
  );
  if (iErr) {
    await admin.from('interaction_turns').delete().eq('id', (turn as InteractionTurnRow).id);
    throw new WorkflowError(iErr.message, 500);
  }

  const turnId = (turn as InteractionTurnRow).id;

  // Released stories: same pipeline, approve step runs automatically.
  if (host.row.lifecycle === 'released') {
    try {
      const draft = await generateDraft(turnId);
      if (shouldAutoSend(host.row.lifecycle, draft.validation_warnings)) {
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
