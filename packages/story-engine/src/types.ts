// Engine domain types. Mirrors the DB schema (supabase/migrations/
// 20260611120000_story_engine_draft.sql) but the package never imports from
// the app — callers map rows into these shapes via loadStoryConfig helpers.

export type StoryLifecycle = 'draft' | 'testing' | 'released';
export type CharacterResponsiveness = 'immediate' | 'slow' | 'unreliable' | 'expert';
export type ClueReliability =
  | 'true_useful'
  | 'true_misleading'
  | 'false_coherent'
  | 'red_herring';
export type ClueCategory = 'physical' | 'testimonial' | 'documentary' | 'subtle';

export interface CharacterPersonality {
  traits?: string[];
  speech_pattern?: string;
  voice?: string;
  letter_format?: string;
  techniques?: string[];
}

export interface StoryCharacter {
  slug: string;
  name: string;
  role: string;
  personality: CharacterPersonality;
  backstory: string;
  hidden_agenda: string;
  knowledge_notes: string;
  responsiveness: CharacterResponsiveness;
  reply_delay_min_days: number;
  reply_delay_max_days: number;
  contactable_from_start: boolean;
  unlock_rules: Record<string, unknown>;
  sort_order: number;
}

export interface StoryFact {
  fact_key: string;
  content: string;
  category: string;
  /** Character slugs that know this fact. Empty + not public = GM-only secret. */
  known_by: string[];
  is_public: boolean;
  reveal_act: number | null;
}

export interface StoryClue {
  clue_key: string;
  description: string;
  reliability: ClueReliability;
  category: ClueCategory;
  act_available: number;
  source_character_slug: string | null;
}

export interface StoryAct {
  act_number: number;
  title: string;
  goals: Record<string, unknown>;
  turn_min: number;
  turn_max: number | null;
  reveal_rules: Record<string, unknown>;
}

export interface StoryEnding {
  ending_key: string;
  title: string;
  conditions: Record<string, unknown>;
  narrative_guidance: string;
}

export interface StoryTimeConfig {
  story_start_date: string;
  visible_delay?: {
    enabled: boolean;
    min_minutes: number;
    max_minutes: number;
  };
  date_locale?: string;
}

export interface StorySettings {
  max_letters_per_turn?: number;
  max_turns?: number;
  locale?: string;
}

/**
 * A fully loaded story. Only `characters` (≥1 contactable) and `first_letter`
 * are required for a playable story; facts/acts/clues/endings are optional
 * modules and may be empty arrays (architecture §2).
 */
export interface StoryConfig {
  slug: string;
  title: string;
  first_letter: string;
  settings: StorySettings;
  time_config: StoryTimeConfig;
  allow_dynamic_npcs: boolean;
  lifecycle: StoryLifecycle;
  characters: StoryCharacter[];
  facts: StoryFact[];
  acts: StoryAct[];
  clues: StoryClue[];
  endings: StoryEnding[];
}

/** games.runtime_state — server-managed, updated only at game start and turn approve. */
export interface RuntimeState {
  current_turn: number;
  current_act: number;
  /** ISO date (YYYY-MM-DD), in-fiction. */
  story_date: string;
  unlocked_npcs: string[];
  clues_found: string[];
  psych_profile?: Record<string, unknown>;
  victim_saved?: boolean;
  killer_identified?: boolean;
}

/** One letter in the game history (maps to an interactions row). */
export interface LetterRecord {
  role: 'ai' | 'user';
  /** AI letters: sender slug. User letters: recipient slug. */
  character_slug: string;
  content: string;
  /** ISO date (YYYY-MM-DD), in-fiction. */
  story_date: string;
  turn_number: number;
}

/** A letter the player submits in the current turn. */
export interface PlayerTurnLetter {
  recipient_slug: string;
  content: string;
}

export type WarningSeverity = 'warning' | 'error';

export interface ValidationWarning {
  rule: string;
  severity: WarningSeverity;
  message: string;
  character_slug?: string;
}
