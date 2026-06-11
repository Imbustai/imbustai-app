import type { RuntimeState, StoryConfig, ValidationWarning } from '../types';
import type { TurnPlan } from '../schema/turnPlan';
import type { BatchLetter } from '../schema/npcLetter';
import { factsForCharacter } from '../context/scopedContext';
import { addDays } from '../time/timeService';

// Canon validator (architecture §6). Deterministic rules; results are stored
// on the draft and shown to the reviewer. Rules run ONLY for the modules the
// story uses — a story without facts/clues/acts/endings gets just
// timeline_order and state_sanity. Severity 'error' blocks auto-send for
// released stories; it never blocks a human approve.

export interface ValidateDraftInput {
  story: StoryConfig;
  state: RuntimeState;
  plan: TurnPlan;
  letters: BatchLetter[];
  /** In-fiction date of the player turn the batch answers. */
  turnDate: string;
}

export function validateDraft(input: ValidateDraftInput): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  checkKnowledgeScope(input, warnings);
  checkTimelineOrder(input, warnings);
  checkClueAct(input, warnings);
  checkFactConsistency(input, warnings);
  checkStateSanity(input, warnings);
  checkEndingConditions(input, warnings);
  return warnings;
}

export function hasErrors(warnings: ValidationWarning[]): boolean {
  return warnings.some((w) => w.severity === 'error');
}

/** First ~40 chars of a fact, used as a leak heuristic in letter prose. */
function distinctiveSnippet(content: string): string | null {
  const trimmed = content.trim();
  if (trimmed.length < 12) return null;
  return trimmed.slice(0, 40).toLowerCase();
}

function checkKnowledgeScope(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, state, plan, letters } = input;
  if (story.facts.length === 0) return;

  const effectiveAct = Math.max(state.current_act, plan.game_state_updates.act_progression ?? 0);

  for (const letter of letters) {
    const scope = new Set(
      factsForCharacter(story, letter.character_slug, effectiveAct).map((f) => f.fact_key),
    );
    for (const key of letter.metadata.facts_referenced) {
      if (!scope.has(key)) {
        const exists = story.facts.some((f) => f.fact_key === key);
        warnings.push({
          rule: 'knowledge_scope',
          severity: 'error',
          character_slug: letter.character_slug,
          message: exists
            ? `Letter from "${letter.character_slug}" references fact "${key}" outside their knowledge scope.`
            : `Letter from "${letter.character_slug}" references unknown fact key "${key}".`,
        });
      }
    }
    // Heuristic: distinctive prose of out-of-scope facts leaking verbatim.
    const text = letter.content.toLowerCase();
    for (const fact of story.facts) {
      if (scope.has(fact.fact_key)) continue;
      const snippet = distinctiveSnippet(fact.content);
      if (snippet && text.includes(snippet)) {
        warnings.push({
          rule: 'knowledge_scope',
          severity: 'error',
          character_slug: letter.character_slug,
          message: `Letter from "${letter.character_slug}" appears to contain the content of out-of-scope fact "${fact.fact_key}".`,
        });
      }
    }
  }

  // Orchestrator briefs must respect scope too (caught before letters are even written).
  for (const reply of plan.replies) {
    const scope = new Set(
      factsForCharacter(story, reply.character_slug, effectiveAct).map((f) => f.fact_key),
    );
    for (const key of reply.facts_to_use) {
      if (!scope.has(key)) {
        warnings.push({
          rule: 'knowledge_scope',
          severity: 'error',
          character_slug: reply.character_slug,
          message: `Game Master brief assigns fact "${key}" to "${reply.character_slug}", who does not know it.`,
        });
      }
    }
  }
}

function checkTimelineOrder(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, state, letters, turnDate } = input;
  const charactersBySlug = new Map(story.characters.map((c) => [c.slug, c]));

  for (const letter of letters) {
    if (letter.story_date < turnDate) {
      warnings.push({
        rule: 'timeline_order',
        severity: 'error',
        character_slug: letter.character_slug,
        message: `Letter from "${letter.character_slug}" is dated ${letter.story_date}, before the player's letters (${turnDate}).`,
      });
    }
    if (letter.story_date < state.story_date) {
      warnings.push({
        rule: 'timeline_order',
        severity: 'error',
        character_slug: letter.character_slug,
        message: `Letter from "${letter.character_slug}" is dated ${letter.story_date}, before the current in-fiction date (${state.story_date}).`,
      });
    }
    const character = charactersBySlug.get(letter.character_slug);
    if (character) {
      const latest = addDays(turnDate, character.reply_delay_max_days);
      if (letter.story_date > latest) {
        warnings.push({
          rule: 'timeline_order',
          severity: 'warning',
          character_slug: letter.character_slug,
          message: `Letter from "${letter.character_slug}" is dated ${letter.story_date}, after their reply window (max ${latest}).`,
        });
      }
    }
  }
}

function checkClueAct(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, state, plan, letters } = input;
  if (story.clues.length === 0) return;

  const effectiveAct = Math.max(state.current_act, plan.game_state_updates.act_progression ?? 0);
  const cluesByKey = new Map(story.clues.map((c) => [c.clue_key, c]));

  const released = [
    ...plan.game_state_updates.clues_found,
    ...letters.flatMap((l) => l.metadata.clues_revealed),
  ];
  for (const key of new Set(released)) {
    const clue = cluesByKey.get(key);
    if (!clue) {
      warnings.push({
        rule: 'state_sanity',
        severity: 'error',
        message: `Released clue "${key}" does not exist in the story's clue catalog.`,
      });
      continue;
    }
    if (clue.act_available > effectiveAct) {
      warnings.push({
        rule: 'clue_act',
        severity: 'warning',
        message: `Clue "${key}" is released in act ${effectiveAct} but only becomes available in act ${clue.act_available}.`,
      });
    }
  }
}

function checkFactConsistency(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, plan } = input;
  if (story.facts.length === 0) return;
  const factKeys = new Set(story.facts.map((f) => f.fact_key));
  for (const reply of plan.replies) {
    for (const key of reply.facts_to_use) {
      if (!factKeys.has(key)) {
        warnings.push({
          rule: 'fact_consistency',
          severity: 'error',
          character_slug: reply.character_slug,
          message: `Brief for "${reply.character_slug}" references unknown fact key "${key}".`,
        });
      }
    }
  }
}

function checkStateSanity(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, state, plan, letters } = input;
  const slugs = new Set(story.characters.map((c) => c.slug));

  for (const letter of letters) {
    if (!slugs.has(letter.character_slug)) {
      warnings.push({
        rule: 'state_sanity',
        severity: 'error',
        character_slug: letter.character_slug,
        message: `Letter from unknown character "${letter.character_slug}".`,
      });
    }
  }

  for (const slug of plan.game_state_updates.npcs_to_unlock) {
    if (!slugs.has(slug)) {
      warnings.push({
        rule: 'state_sanity',
        severity: story.allow_dynamic_npcs ? 'warning' : 'error',
        message: story.allow_dynamic_npcs
          ? `Unlocking "${slug}" which does not exist — should this be a dynamic NPC proposal instead?`
          : `Cannot unlock "${slug}": character does not exist and dynamic NPCs are disabled for this story.`,
      });
    }
  }

  if (plan.game_state_updates.dynamic_npc_proposals.length > 0 && !story.allow_dynamic_npcs) {
    warnings.push({
      rule: 'state_sanity',
      severity: 'error',
      message: 'Dynamic NPC proposals present but allow_dynamic_npcs is disabled for this story.',
    });
  }

  const act = plan.game_state_updates.act_progression;
  if (act != null) {
    if (act < state.current_act) {
      warnings.push({
        rule: 'state_sanity',
        severity: 'error',
        message: `Act regression: ${state.current_act} → ${act}.`,
      });
    }
    if (story.acts.length > 0 && !story.acts.some((a) => a.act_number === act)) {
      warnings.push({
        rule: 'state_sanity',
        severity: 'error',
        message: `Act ${act} does not exist in the story's act structure.`,
      });
    }
  }
}

function checkEndingConditions(input: ValidateDraftInput, warnings: ValidationWarning[]): void {
  const { story, state, plan } = input;
  if (story.endings.length === 0 || story.acts.length === 0) return;

  const finalAct = Math.max(...story.acts.map((a) => a.act_number));
  const effectiveAct = Math.max(state.current_act, plan.game_state_updates.act_progression ?? 0);
  if (effectiveAct < finalAct) return;

  const flags: Record<string, unknown> = {
    victim_saved: plan.game_state_updates.victim_saved ?? state.victim_saved,
    killer_identified: plan.game_state_updates.killer_identified ?? state.killer_identified,
  };
  const decided = Object.values(flags).every((v) => typeof v === 'boolean');
  if (!decided) return;

  const matches = story.endings.filter((e) =>
    Object.entries(e.conditions).every(([k, v]) => flags[k] === v),
  );
  if (matches.length !== 1) {
    warnings.push({
      rule: 'ending_conditions',
      severity: 'warning',
      message: `Final-act state matches ${matches.length} endings (expected exactly 1). Flags: ${JSON.stringify(flags)}.`,
    });
  }
}
