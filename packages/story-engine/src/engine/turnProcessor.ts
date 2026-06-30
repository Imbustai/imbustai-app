import type {
  LetterRecord,
  PlayerTurnLetter,
  RuntimeState,
  StoryConfig,
  UsageRecord,
  ValidationWarning,
} from '../types';
import { turnPlanSchema, TURN_PLAN_TOOL, type GameStateUpdates, type TurnPlan } from '../schema/turnPlan';
import { npcLetterSchema, NPC_LETTER_TOOL, type BatchLetter } from '../schema/npcLetter';
import { buildNpcContext, buildOrchestratorContext, factsForCharacter } from '../context/scopedContext';
import { addDays, advanceStoryDate, resolveBatchDates } from '../time/timeService';
import { validateDraft } from '../validator';
import { normalizeCharacterSlug } from './normalize';
import { resolveStartDate } from './gameStart';
import type { AiProvider, CallUsage } from '../ai/provider';

import type { z } from 'zod';
import type { StructuredRequest } from '../ai/provider';

/**
 * Generate a structured response and validate it, retrying on the occasional
 * malformed tool output (truncation, leaked tool syntax, a field serialized as
 * a string). These glitches are transient, so a couple of retries reliably
 * recovers — far better than failing the whole turn.
 */
async function generateValidated<S extends z.ZodTypeAny>(
  provider: AiProvider,
  request: StructuredRequest,
  schema: S,
  label: string,
  retries = 2,
  onUsage?: (usage: CallUsage) => void,
): Promise<z.infer<S>> {
  const repairNote =
    '\n\nIMPORTANT: your previous tool call was malformed. Call the tool again with every argument as valid JSON of the correct type — arrays as real JSON arrays (not strings), objects as objects — and NEVER use XML or <parameter ...> tags inside the arguments.';
  let lastError = '';
  for (let attempt = 0; attempt <= retries; attempt++) {
    // Escalate after the first failure so retries differ from the (failing) call.
    const req = attempt === 0 ? request : { ...request, user: request.user + repairNote };
    const { output, usage } = await provider.generateStructured(req);
    // Record usage for EVERY attempt — retries cost real tokens too.
    onUsage?.(usage);
    const parsed = schema.safeParse(coerceStructured(output));
    if (parsed.success) return parsed.data;
    lastError = `${parsed.error.issues.map((i) => `${i.path.join('.')}:${i.message}`).join('; ')} | raw=${JSON.stringify(output).slice(0, 300)}`;
  }
  throw new Error(`${label} parse failed after ${retries + 1} attempts: ${lastError}`);
}

/**
 * Tool-use inputs occasionally arrive with a nested field serialized as a JSON
 * string instead of a real array/object (model quirk). Parse those back before
 * zod validation so generation never crashes on an otherwise-valid response.
 */
function coerceStructured(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          obj[key] = JSON.parse(trimmed);
        } catch {
          /* leave as-is; zod will report it */
        }
      }
    }
  }
  return obj;
}

// The generate step (architecture §1): orchestrator call → scoped per-NPC
// calls → merged, validated, reviewable batch. NEVER writes to the DB and
// NEVER sends anything — callers persist the result as an ai_drafts version.

/**
 * The act a given (1-based) turn belongs to, by the acts' turn ranges. This lets
 * the engine advance the story on schedule instead of depending on the model to
 * propose act_progression — without it, a cautious orchestrator can stall the
 * plot, because gated facts/clues (reveal_act / act_available) never unlock and
 * no new events surface. Clamps to the last act past the final range and to the
 * first act before it; returns 1 for a story with no acts module.
 */
export function actForTurn(story: StoryConfig, turnNumber: number): number {
  if (story.acts.length === 0) return 1;
  const acts = [...story.acts].sort((a, b) => a.act_number - b.act_number);
  for (const a of acts) {
    const max = a.turn_max ?? Infinity;
    if (turnNumber >= a.turn_min && turnNumber <= max) return a.act_number;
  }
  const first = acts[0];
  if (turnNumber < first.turn_min) return first.act_number;
  return acts[acts.length - 1].act_number;
}

export interface GenerateTurnInput {
  story: StoryConfig;
  state: RuntimeState;
  /** Full game history (all characters) — used by the orchestrator only. */
  history: LetterRecord[];
  playerLetters: PlayerTurnLetter[];
  provider: AiProvider;
  /** Deterministic seed for dates, e.g. `${gameId}:${turnNumber}`. */
  seed: string;
  /**
   * 1-based number of the turn being generated. When set (and the story has an
   * acts module), the engine derives the effective act from it so facts/clues
   * for the scheduled act are available even if the orchestrator doesn't propose
   * act_progression. Omit to keep the legacy behavior (act = state.current_act).
   */
  turnNumber?: number;
  /** Regenerate a single NPC: skip orchestration for others, reuse this plan. */
  reusePlan?: TurnPlan;
  onlyCharacter?: string;
  /** Collects per-call token usage (orchestrator + each NPC letter, retries included). */
  usageSink?: UsageRecord[];
}

export interface TurnDraftBatch {
  plan: TurnPlan;
  responses: BatchLetter[];
  gameStateUpdates: GameStateUpdates;
  narratorNotes: string;
  warnings: ValidationWarning[];
  /** In-fiction date of the player turn (replies answer this date). */
  turnDate: string;
}

/**
 * Deterministically reconcile the orchestrator's proposal against canon BEFORE
 * writers run: the model proposes, the engine enforces. This prevents whole
 * classes of model slips from ever reaching a letter (and keeps unattended
 * generation clean). The letter-level validator still audits the actual output,
 * so this is canon hygiene, not a replacement for validation.
 *
 *  - act_progression: monotonic and gradual (never regress, at most +1, must be
 *    a defined act) — stops the "jump to finale then regress" failure.
 *  - facts_to_use: only facts the character actually knows at the effective act.
 *  - clues (release + found): only real clue keys available by the effective act
 *    (drops fact keys mistakenly used as clues).
 *  - npcs_to_unlock: only characters that exist (unless dynamic NPCs are on).
 */
export function sanitizePlan(story: StoryConfig, state: RuntimeState, plan: TurnPlan): TurnPlan {
  const gsu = plan.game_state_updates;

  const definedActs = new Set(story.acts.map((a) => a.act_number));
  let act = gsu.act_progression;
  if (act != null) {
    if (act < state.current_act) act = undefined;
    else if (story.acts.length > 0 && !definedActs.has(act)) act = undefined;
    else if (act > state.current_act + 1) act = state.current_act + 1;
  }
  const effectiveAct = Math.max(state.current_act, act ?? 0);

  const factScope = (slug: string) =>
    new Set(factsForCharacter(story, slug, effectiveAct).map((f) => f.fact_key));
  const clueByKey = new Map(story.clues.map((c) => [c.clue_key, c]));
  const clueOk = (key: string) => {
    const clue = clueByKey.get(key);
    return Boolean(clue) && clue!.act_available <= effectiveAct;
  };
  const slugs = new Set(story.characters.map((c) => c.slug));

  const replies = plan.replies.map((r) => {
    const scope = factScope(r.character_slug);
    return {
      ...r,
      facts_to_use: r.facts_to_use.filter((k) => scope.has(k)),
      clues_to_release: r.clues_to_release.filter(clueOk),
    };
  });

  return {
    ...plan,
    replies,
    game_state_updates: {
      ...gsu,
      act_progression: act,
      clues_found: gsu.clues_found.filter(clueOk),
      npcs_to_unlock: gsu.npcs_to_unlock.filter((s) => slugs.has(s) || story.allow_dynamic_npcs),
    },
  };
}

export async function generateTurnBatch(input: GenerateTurnInput): Promise<TurnDraftBatch> {
  const { story, state, history, playerLetters, provider, seed, usageSink } = input;
  const turnDate = state.story_date;

  // Advance the act on schedule from the turn number so the plot can't stall on
  // a cautious orchestrator: the scheduled act gates which facts/clues are in
  // scope for both the orchestrator and the writers. With no turnNumber (unit
  // sims) we keep the legacy behavior (act = state.current_act).
  const derivedAct =
    input.turnNumber != null ? actForTurn(story, input.turnNumber) : state.current_act;
  const effectiveState: RuntimeState =
    derivedAct > state.current_act ? { ...state, current_act: derivedAct } : state;

  // 1. Orchestrator → turn plan (or reuse it for single-NPC regenerate).
  let plan: TurnPlan;
  if (input.reusePlan) {
    plan = input.reusePlan;
  } else {
    const context = buildOrchestratorContext({ story, state: effectiveState, history, playerLetters });
    plan = await generateValidated(
      provider,
      { system: context.system, user: context.user, tool: TURN_PLAN_TOOL, maxTokens: 8000 },
      turnPlanSchema,
      'turn_plan',
      2,
      (usage) => usageSink?.push({ call_type: 'orchestrator', ...usage }),
    );
  }

  // 2. Normalize plan slugs against the story's characters.
  const slugWarnings: ValidationWarning[] = [];
  const replies = plan.replies.flatMap((reply) => {
    const slug = normalizeCharacterSlug(reply.character_slug, story.characters);
    if (!slug) {
      slugWarnings.push({
        rule: 'state_sanity',
        severity: 'error',
        character_slug: reply.character_slug,
        message: `Turn plan addresses unknown character "${reply.character_slug}" — reply skipped.`,
      });
      return [];
    }
    return [{ ...reply, character_slug: slug }];
  });
  plan = sanitizePlan(story, effectiveState, { ...plan, replies });

  // 3. One scoped writer call per replying NPC (single-NPC regen filters here).
  const targets = input.onlyCharacter
    ? replies.filter((r) => r.character_slug === input.onlyCharacter)
    : replies;
  const charactersBySlug = new Map(story.characters.map((c) => [c.slug, c]));

  const letters = await Promise.all(
    targets.map(async (reply) => {
      const character = charactersBySlug.get(reply.character_slug)!;
      const replyWindow = {
        earliest: addDays(turnDate, character.reply_delay_min_days),
        latest: addDays(turnDate, character.reply_delay_max_days),
      };
      const context = buildNpcContext({
        story,
        state: effectiveState,
        character,
        brief: reply,
        history,
        playerLetters,
        replyWindow,
      });
      const letter = await generateValidated(
        provider,
        { system: context.system, user: context.user, tool: NPC_LETTER_TOOL, maxTokens: 6000 },
        npcLetterSchema,
        `npc_letter(${reply.character_slug})`,
        2,
        (usage) =>
          usageSink?.push({
            call_type: 'npc_letter',
            character_slug: reply.character_slug,
            ...usage,
          }),
      );
      // The writer speaks for exactly one character; trust the brief over the model.
      return { ...letter, character_slug: reply.character_slug };
    }),
  );

  // 4. Authoritative in-fiction dates (deterministic; fixes the dateSent bug).
  const { letters: dated } = resolveBatchDates({
    letters,
    charactersBySlug,
    turnDate,
    seed,
  });

  // 5. Canon validation on the merged batch.
  const warnings = [
    ...slugWarnings,
    ...validateDraft({ story, state, plan, letters: dated, turnDate }),
  ];

  return {
    plan,
    responses: dated,
    gameStateUpdates: plan.game_state_updates,
    narratorNotes: plan.narrator_notes,
    warnings,
    turnDate,
  };
}

/**
 * Pure state transition applied at (auto-)approve time. Callers persist the
 * result to games.runtime_state via service role.
 */
export function applyGameStateUpdates(
  state: RuntimeState,
  updates: GameStateUpdates,
  letters: Array<{ story_date: string }>,
): RuntimeState {
  const next: RuntimeState = {
    ...state,
    current_turn: state.current_turn + 1,
    story_date: advanceStoryDate(state, letters),
    clues_found: [...new Set([...state.clues_found, ...updates.clues_found])],
    unlocked_npcs: [...new Set([...state.unlocked_npcs, ...updates.npcs_to_unlock])],
  };
  if (updates.act_progression != null && updates.act_progression > state.current_act) {
    next.current_act = updates.act_progression;
  }
  if (updates.psych_profile_updates) {
    next.psych_profile = { ...state.psych_profile, ...updates.psych_profile_updates };
  }
  if (updates.victim_saved != null) next.victim_saved = updates.victim_saved;
  if (updates.killer_identified != null) next.killer_identified = updates.killer_identified;
  return next;
}

/**
 * Initial runtime state when a game starts. Pass actualStartDate (the real
 * date the game is created) so stories with time_config.start_mode='actual'
 * begin at it; fixed-mode stories ignore it.
 */
export function initialRuntimeState(story: StoryConfig, actualStartDate?: string): RuntimeState {
  return {
    current_turn: 0,
    current_act: story.acts.length > 0 ? Math.min(...story.acts.map((a) => a.act_number)) : 1,
    story_date: resolveStartDate(story, actualStartDate),
    unlocked_npcs: story.characters.filter((c) => c.contactable_from_start).map((c) => c.slug),
    clues_found: [],
  };
}
