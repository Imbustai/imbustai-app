import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  LetterRecord,
  RuntimeState,
  StoryConfig,
} from '@imbustai/story-engine';
import { initialRuntimeState } from '@imbustai/story-engine';
import type {
  GameRow,
  InteractionRow,
  StoryActRow,
  StoryCharacterRow,
  StoryClueRow,
  StoryEndingRow,
  StoryFactRow,
  StoryRow,
} from '@/lib/types/db';

// Maps DB rows into the engine's StoryConfig. The engine package never talks
// to the DB itself — this is the single bridge.

export async function loadStoryConfig(
  admin: SupabaseClient,
  storyId: string,
): Promise<{ story: StoryConfig; row: StoryRow } | null> {
  const { data: storyRow } = await admin.from('stories').select('*').eq('id', storyId).single();
  if (!storyRow) return null;
  const row = storyRow as StoryRow;

  const [characters, facts, acts, clues, endings] = await Promise.all([
    admin.from('story_characters').select('*').eq('story_id', storyId).order('sort_order'),
    admin.from('story_facts').select('*').eq('story_id', storyId),
    admin.from('story_acts').select('*').eq('story_id', storyId).order('act_number'),
    admin.from('story_clues').select('*').eq('story_id', storyId),
    admin.from('story_endings').select('*').eq('story_id', storyId),
  ]);

  const story: StoryConfig = {
    slug: row.slug,
    title: row.title_it || row.title_en,
    first_letter: row.first_letter,
    settings: row.settings ?? {},
    time_config: {
      start_mode: row.time_config.start_mode ?? 'fixed',
      story_start_date:
        row.time_config.story_start_date ?? new Date().toISOString().slice(0, 10),
      visible_delay: row.time_config.visible_delay,
      date_locale: row.time_config.date_locale,
    },
    allow_dynamic_npcs: row.allow_dynamic_npcs,
    lifecycle: row.lifecycle,
    characters: ((characters.data ?? []) as StoryCharacterRow[]).map((c) => ({
      slug: c.slug,
      name: c.name,
      role: c.role,
      personality: c.personality,
      backstory: c.backstory,
      hidden_agenda: c.hidden_agenda,
      knowledge_notes: c.knowledge_notes,
      responsiveness: c.responsiveness,
      reply_delay_min_days: c.reply_delay_min_days,
      reply_delay_max_days: c.reply_delay_max_days,
      contactable_from_start: c.contactable_from_start,
      unlock_rules: c.unlock_rules,
      opening_letter: c.opening_letter,
      opening_letter_day_offset: c.opening_letter_day_offset,
      sort_order: c.sort_order,
    })),
    facts: ((facts.data ?? []) as StoryFactRow[]).map((f) => ({
      fact_key: f.fact_key,
      content: f.content,
      category: f.category,
      known_by: f.known_by,
      is_public: f.is_public,
      reveal_act: f.reveal_act,
    })),
    acts: ((acts.data ?? []) as StoryActRow[]).map((a) => ({
      act_number: a.act_number,
      title: a.title,
      goals: a.goals,
      turn_min: a.turn_min,
      turn_max: a.turn_max,
      reveal_rules: a.reveal_rules,
    })),
    clues: ((clues.data ?? []) as StoryClueRow[]).map((c) => ({
      clue_key: c.clue_key,
      description: c.description,
      reliability: c.reliability,
      category: c.category,
      act_available: c.act_available,
      source_character_slug: c.source_character_slug,
    })),
    endings: ((endings.data ?? []) as StoryEndingRow[]).map((e) => ({
      ending_key: e.ending_key,
      title: e.title,
      conditions: e.conditions,
      narrative_guidance: e.narrative_guidance,
    })),
  };

  return { story, row };
}

/** runtime_state with sane defaults for games created before the engine. */
export function runtimeStateOf(game: GameRow, story: StoryConfig): RuntimeState {
  const rs = game.runtime_state ?? {};
  if (rs.story_date && rs.unlocked_npcs) return rs as RuntimeState;
  return { ...initialRuntimeState(story), ...rs } as RuntimeState;
}

/** interactions → engine LetterRecords (skips legacy rows without a character). */
export function toLetterRecords(
  interactions: InteractionRow[],
  fallbackDate: string,
): LetterRecord[] {
  return interactions
    .filter((i) => i.character_slug)
    .map((i) => ({
      role: i.role,
      character_slug: i.character_slug as string,
      content: i.content,
      story_date: i.story_date ?? fallbackDate,
      turn_number: 0,
    }));
}
