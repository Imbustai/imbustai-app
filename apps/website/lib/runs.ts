import type { SupabaseClient } from '@supabase/supabase-js';
import {
  PERSONAS,
  contactsOf,
  defaultTurnShape,
  estimateRun,
  hasErrors,
  playRunTurn,
  scoreRun,
  type ComplaintScore,
  type Correspondent,
  type Finding,
  type ModelProfilePatch,
  type PersonaKey,
  type RunEstimate,
  type RunGame,
  type RunGameView,
  type RunStep,
  type VisibleLetter,
} from '@imbustai/story-runtime';
import { assertProfilePriced, loadPricingMap, priceOf } from '@/lib/ai-pricing';
import { engineEntryFor } from '@/lib/engines';
import {
  WorkflowError,
  currentTurn,
  gameSpendUsd,
  hookSession,
  loadGameHost,
  loadStory,
  modelProfileFor,
  viewOf,
  type GameHost,
} from '@/lib/game-host';
import { approveDraft, generateDraft, submitPlayerTurn } from '@/lib/reply-workflow';
import { createGame } from '@/lib/start-game';
import { createAdminClient } from '@/lib/supabase/admin';
import type { AiCallRow, AiDraftRow, RunReport, RunRow } from '@/lib/types/db';

// Runs on the platform: a QA Game an AI player plays under a cost cap
// (ADR 0002; "Runs: an AI player that plays any Engine under a cost cap",
// Imbustai/imbustai-app#31). The loop, the player, the budget and the judge
// are the runtime's; this file gives them a real Game. A Run's Turns go
// through the same pipeline as a Player's — submit, generate, validate,
// approve — with the approve step always automatic, and every model call
// first reserved against the cap (game-host.ts hookSession).

/** The first Run is capped at $12; lowered afterwards (the map, #9). */
export const DEFAULT_RUN_CAP_USD = 12;
const DEFAULT_RUN_TURNS = 8;

/** The estimate does not fit under the cap: the Run is not started and nothing is spent. */
export class RunPreflightError extends Error {
  constructor(
    public readonly estimate: RunEstimate,
    public readonly capUsd: number,
  ) {
    super(
      `The Run is estimated at $${estimate.totalUsd.toFixed(2)}, above its cap of $${capUsd.toFixed(2)}. ` +
        'Pick cheaper models, fewer Turns or a higher cap.',
    );
  }
}

export interface StartRunInput {
  storyId: string;
  /** The admin the Run's Game belongs to. */
  userId: string;
  persona: PersonaKey;
  capUsd?: number;
  /** Defaults to the Story's max_turns setting, then 8. */
  maxTurns?: number;
  /** The Run's models, over the Story's default profile. */
  modelProfile?: ModelProfilePatch | null;
}

/** What a Run would cost on these models, without starting it. */
export async function estimateRunFor(
  admin: SupabaseClient,
  input: Pick<StartRunInput, 'storyId' | 'maxTurns' | 'modelProfile'>,
) {
  const loaded = await loadStory(admin, input.storyId);
  const profile = modelProfileFor(loaded.row, null, input.modelProfile);
  const pricing = await loadPricingMap(admin);
  assertProfilePriced(profile, pricing);

  const maxTurns = input.maxTurns ?? loaded.row.settings?.max_turns ?? DEFAULT_RUN_TURNS;
  const lettersPerTurn = loaded.row.settings?.max_letters_per_turn ?? loaded.engine.maxLettersPerTurn;
  const entry = engineEntryFor(loaded.row.engine);
  const estimate = estimateRun({
    profile,
    priceOf: (model) => priceOf(model, pricing),
    turns: maxTurns,
    turnShape: entry.runTurnShape?.(loaded.story, lettersPerTurn) ?? defaultTurnShape(lettersPerTurn),
  });
  return { loaded, profile, maxTurns, estimate };
}

/**
 * Start a Run: preflight estimate against the cap, then a flagged Game on its
 * own free order. Nothing is played yet — `stepRun` plays it Turn by Turn.
 */
export async function startRun(
  admin: SupabaseClient,
  input: StartRunInput,
): Promise<{ gameId: string; estimate: RunEstimate }> {
  if (!(input.persona in PERSONAS)) throw new WorkflowError('unknown_persona', 400);
  const capUsd = input.capUsd ?? DEFAULT_RUN_CAP_USD;
  const { loaded, profile, maxTurns, estimate } = await estimateRunFor(admin, input);
  if (loaded.row.lifecycle === 'draft') throw new WorkflowError('story_not_playable', 409);
  if (estimate.totalUsd > capUsd) throw new RunPreflightError(estimate, capUsd);

  // A Game hangs off an order; a Run's is free and the admin's own.
  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      user_id: input.userId,
      story_id: loaded.row.id,
      status: 'paid',
      source: 'admin',
      shipping_snapshot: { label: 'Run', line1: '-', city: '-', postal_code: '-', country: '-' },
      amount_cents: 0,
      currency: loaded.row.currency,
      paid_at: new Date().toISOString(),
    })
    .select('id,user_id,story_id')
    .single();
  if (oErr || !order) throw new WorkflowError(oErr?.message ?? 'order_insert_failed', 500);

  const gameId = await createGame(admin, { order, loaded, profile, capUsd });
  const { error: rErr } = await admin.from('runs').insert({
    game_id: gameId,
    persona: input.persona,
    cap_usd: capUsd,
    max_turns: maxTurns,
    estimate_usd: estimate.totalUsd,
    status: 'running',
  });
  if (rErr) throw new WorkflowError(rErr.message, 500);
  return { gameId, estimate };
}

// ─── The Game as the Run loop plays it ──────────────────────────────────────

function runGameView(host: GameHost): RunGameView {
  const { lead, correspondents } = host.engine.cast(host.story);
  const nameOf = (slug: string | null) =>
    (slug && correspondents.find((c: Correspondent) => c.slug === slug)?.name) || slug || 'Unsigned';
  const turnOf = new Map(host.turns.map((t) => [t.id, t.turn_number]));
  const open = host.turns.find((t) => t.status !== 'sent');
  const closing = host.turns.find((t) => t.ending);
  const turnsPlayed = host.turns.filter((t) => t.status === 'sent' && !t.ending).length;
  const now = new Date().toISOString();

  // Exactly the Player's inbox and outbox: nothing still in the post.
  const letters: VisibleLetter[] = host.interactions
    .filter((i) => i.role === 'user' || !i.visible_from || i.visible_from <= now)
    .map((i) => ({
      direction: i.role === 'user' ? ('out' as const) : ('in' as const),
      turn: i.turn_id ? (turnOf.get(i.turn_id) ?? 0) : 0,
      correspondent: nameOf(i.character_slug),
      kind: i.kind ?? 'letter',
      storyDate: i.story_date ?? '',
      body: i.content,
      enclosures: (i.enclosures ?? []).map((e) => ({ title: e.title, body: e.body })),
    }));

  return {
    lead,
    contacts: contactsOf(host.engine, viewOf(host, { turn: currentTurn(host) + 1, openTurnId: open?.id })),
    letters,
    turn: turnsPlayed + 1,
    maxLettersPerTurn: host.row.settings?.max_letters_per_turn ?? host.engine.maxLettersPerTurn,
    turnsPlayed,
    awaitingReplies: open !== undefined,
    completed: host.game.status === 'completed',
    ending: closing?.ending ?? null,
  };
}

/**
 * `flush` records the player's calls in ai_calls before a batch is generated:
 * each session's budget starts from the spend metered there.
 */
function runGame(admin: SupabaseClient, gameId: string, flush: () => Promise<void>): RunGame {
  return {
    async view() {
      return runGameView(await loadGameHost(admin, gameId));
    },

    async submit(letters) {
      const host = await loadGameHost(admin, gameId);
      // Asked first so that the player is told why, not just a rule code.
      const findings: Finding[] = host.engine.validateSubmission(
        viewOf(host, { turn: currentTurn(host) + 1 }),
        letters,
      );
      if (hasErrors(findings)) return findings;
      await submitPlayerTurn(
        gameId,
        letters.map((l) => ({ recipient_slug: l.to, content: l.body })),
      );
      return findings;
    },

    // Runs auto-approve: the reply batch, then the closing batch if the
    // Engine resolved an Ending. Error findings do not hold a Run's Turn —
    // there is no admin to release it — they are counted in the report.
    async resolve() {
      await flush();
      for (let batches = 0; batches < 3; batches++) {
        const host = await loadGameHost(admin, gameId);
        const open = host.turns.find((t) => t.status !== 'sent');
        if (!open) return;
        let draft: Pick<AiDraftRow, 'id'> | null = null;
        if (open.status === 'draft_ready') {
          // Generated and paid for before an interruption: send that one.
          const { data } = await admin
            .from('ai_drafts')
            .select('id,version')
            .eq('turn_id', open.id)
            .order('version', { ascending: false })
            .limit(1)
            .maybeSingle();
          draft = data as Pick<AiDraftRow, 'id'> | null;
        }
        draft ??= await generateDraft(open.id);
        await approveDraft(open.id, draft.id);
      }
    },
  };
}

// ─── Playing and reporting ──────────────────────────────────────────────────

async function loadRun(admin: SupabaseClient, gameId: string): Promise<RunRow> {
  const { data } = await admin.from('runs').select('*').eq('game_id', gameId).maybeSingle();
  if (!data) throw new WorkflowError('run_not_found', 404);
  return data as RunRow;
}

/** Spend by role and model, from the Game's metered calls. */
async function spendByRole(admin: SupabaseClient, gameId: string): Promise<RunReport['spend']> {
  const { data } = await admin.from('ai_calls').select('role,model,cost_usd').eq('game_id', gameId);
  const lines = new Map<string, RunReport['spend'][number]>();
  for (const call of (data ?? []) as Pick<AiCallRow, 'role' | 'model' | 'cost_usd'>[]) {
    const key = `${call.role}:${call.model}`;
    const line = lines.get(key) ?? { role: call.role, model: call.model, calls: 0, usd: 0 };
    line.calls += 1;
    line.usd += Number(call.cost_usd);
    lines.set(key, line);
  }
  return [...lines.values()];
}

/** Error findings on the batches a Run sent anyway: each Turn's last draft. */
async function draftErrors(admin: SupabaseClient, host: GameHost): Promise<number> {
  let errors = 0;
  for (const turn of host.turns) {
    const { data } = await admin
      .from('ai_drafts')
      .select('validation_warnings,version')
      .eq('turn_id', turn.id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    const findings = (data as Pick<AiDraftRow, 'validation_warnings'> | null)?.validation_warnings ?? [];
    errors += findings.filter((f) => f.severity === 'error').length;
  }
  return errors;
}

function runSession(admin: SupabaseClient, host: GameHost, run: RunRow) {
  return hookSession(admin, host, {
    gameId: host.game.id,
    turn: currentTurn(host) + 1,
    hook: 'run',
    profile: host.profile,
    capUsd: run.cap_usd,
  });
}

/**
 * Play one Turn of a Run. When the Run stops — an Ending, the Turn limit, the
 * cap or an error — it is scored (if it did not fail) and its report stored.
 * A finished Run is returned as it is.
 */
export async function stepRun(gameId: string): Promise<{ run: RunRow; step: RunStep | null }> {
  const admin = createAdminClient();
  const run = await loadRun(admin, gameId);
  if (run.status !== 'running') return { run, step: null };
  const persona = PERSONAS[run.persona as PersonaKey];
  if (!persona) throw new WorkflowError('unknown_persona', 400);

  const host = await loadGameHost(admin, gameId);
  const session = await runSession(admin, host, run);
  const game = runGame(admin, gameId, () => session.persist());
  const step = await playRunTurn({ game, ai: session.ai, persona, maxTurns: run.max_turns });
  await session.persist();
  if (!step.done) return { run, step };

  const played = await loadGameHost(admin, gameId);
  let scores: ComplaintScore[] | null = null;
  let scoresError: string | undefined;
  if (!step.failed) {
    // A new session: its budget counts what the Turn just spent.
    const judge = await runSession(admin, played, run);
    try {
      scores = await scoreRun(judge.ai, runGameView(played));
    } catch (err) {
      // The Game was played; a judge the cap refused leaves the Run unscored, not failed.
      scoresError = err instanceof Error ? err.message : String(err);
    }
    await judge.persist();
  }

  const report: RunReport = {
    outcome: step.outcome,
    ...(step.error ? { error: step.error } : {}),
    ending: step.ending,
    turns_played: step.turnsPlayed,
    scores,
    ...(scoresError ? { scores_error: scoresError } : {}),
    draft_errors: await draftErrors(admin, played),
    spent_usd: await gameSpendUsd(admin, gameId),
    spend: await spendByRole(admin, gameId),
  };
  const patch = {
    status: step.failed ? ('failed' as const) : ('completed' as const),
    outcome: step.outcome,
    report,
    finished_at: new Date().toISOString(),
  };
  const { error } = await admin.from('runs').update(patch).eq('game_id', gameId);
  if (error) throw new WorkflowError(error.message, 500);
  return { run: { ...run, ...patch }, step };
}

/** Play a Run to its end, Turn by Turn. */
export async function playRunToEnd(
  gameId: string,
  onStep?: (run: RunRow, step: RunStep | null) => void,
): Promise<RunRow> {
  for (;;) {
    const { run, step } = await stepRun(gameId);
    onStep?.(run, step);
    if (run.status !== 'running') return run;
  }
}
