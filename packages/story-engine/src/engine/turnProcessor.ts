import type {
  LetterRecord,
  PlayerTurnLetter,
  RuntimeState,
  StoryConfig,
  ValidationWarning,
} from '../types';
import { turnPlanSchema, TURN_PLAN_TOOL, type GameStateUpdates, type TurnPlan } from '../schema/turnPlan';
import { npcLetterSchema, NPC_LETTER_TOOL, type BatchLetter } from '../schema/npcLetter';
import { buildNpcContext, buildOrchestratorContext } from '../context/scopedContext';
import { addDays, advanceStoryDate, resolveBatchDates } from '../time/timeService';
import { validateDraft } from '../validator';
import { normalizeCharacterSlug } from './normalize';
import type { AiProvider } from '../ai/provider';

// The generate step (architecture §1): orchestrator call → scoped per-NPC
// calls → merged, validated, reviewable batch. NEVER writes to the DB and
// NEVER sends anything — callers persist the result as an ai_drafts version.

export interface GenerateTurnInput {
  story: StoryConfig;
  state: RuntimeState;
  /** Full game history (all characters) — used by the orchestrator only. */
  history: LetterRecord[];
  playerLetters: PlayerTurnLetter[];
  provider: AiProvider;
  /** Deterministic seed for dates, e.g. `${gameId}:${turnNumber}`. */
  seed: string;
  /** Regenerate a single NPC: skip orchestration for others, reuse this plan. */
  reusePlan?: TurnPlan;
  onlyCharacter?: string;
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

export async function generateTurnBatch(input: GenerateTurnInput): Promise<TurnDraftBatch> {
  const { story, state, history, playerLetters, provider, seed } = input;
  const turnDate = state.story_date;

  // 1. Orchestrator → turn plan (or reuse it for single-NPC regenerate).
  let plan: TurnPlan;
  if (input.reusePlan) {
    plan = input.reusePlan;
  } else {
    const context = buildOrchestratorContext({ story, state, history, playerLetters });
    const raw = await provider.generateStructured({
      system: context.system,
      user: context.user,
      tool: TURN_PLAN_TOOL,
      maxTokens: 4096,
    });
    plan = turnPlanSchema.parse(raw);
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
  plan = { ...plan, replies };

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
        state,
        character,
        brief: reply,
        history,
        playerLetters,
        replyWindow,
      });
      const raw = await provider.generateStructured({
        system: context.system,
        user: context.user,
        tool: NPC_LETTER_TOOL,
        maxTokens: 4096,
      });
      const letter = npcLetterSchema.parse(raw);
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

/** Initial runtime state when a game starts. */
export function initialRuntimeState(story: StoryConfig): RuntimeState {
  return {
    current_turn: 0,
    current_act: story.acts.length > 0 ? Math.min(...story.acts.map((a) => a.act_number)) : 1,
    story_date: story.time_config.story_start_date,
    unlocked_npcs: story.characters.filter((c) => c.contactable_from_start).map((c) => c.slug),
    clues_found: [],
  };
}
