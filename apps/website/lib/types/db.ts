export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled';
export type OrderSource = 'stripe' | 'admin';
export type GameStatus = 'in_progress' | 'completed';
export type InteractionRole = 'ai' | 'user';
export type StoryLifecycle = 'draft' | 'testing' | 'released';
export type TurnStatus = 'pending_ai' | 'draft_ready' | 'approved' | 'sent';
export type CharacterResponsiveness = 'immediate' | 'slow' | 'unreliable' | 'expert';
export type ClueReliability =
  | 'true_useful'
  | 'true_misleading'
  | 'false_coherent'
  | 'red_herring';
export type ClueCategory = 'physical' | 'testimonial' | 'documentary' | 'subtle';
export type DraftSource = 'generated' | 'regenerated' | 'edited';

export interface StorySettings {
  max_letters_per_turn?: number;
  max_turns?: number;
  locale?: string;
}

export interface StoryTimeConfig {
  story_start_date?: string;
  visible_delay?: {
    enabled: boolean;
    min_minutes: number;
    max_minutes: number;
  };
  date_locale?: string;
}

export interface GameRuntimeState {
  current_turn?: number;
  current_act?: number;
  story_date?: string;
  unlocked_npcs?: string[];
  clues_found?: string[];
  psych_profile?: Record<string, unknown>;
  victim_saved?: boolean;
  killer_identified?: boolean;
}

export interface ProfileRow {
  id: string;
  role: 'user' | 'admin';
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryRow {
  id: string;
  slug: string;
  title_en: string;
  title_it: string;
  description_en: string;
  description_it: string;
  price_cents: number;
  currency: string;
  is_published: boolean;
  first_letter: string;
  settings: StorySettings;
  time_config: StoryTimeConfig;
  allow_dynamic_npcs: boolean;
  lifecycle: StoryLifecycle;
  created_at: string;
  updated_at: string;
}

export interface StoryCharacterRow {
  id: string;
  story_id: string;
  slug: string;
  name: string;
  role: string;
  personality: Record<string, unknown>;
  backstory: string;
  hidden_agenda: string;
  knowledge_notes: string;
  responsiveness: CharacterResponsiveness;
  reply_delay_min_days: number;
  reply_delay_max_days: number;
  contactable_from_start: boolean;
  unlock_rules: Record<string, unknown>;
  created_dynamically: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface StoryActRow {
  id: string;
  story_id: string;
  act_number: number;
  title: string;
  goals: Record<string, unknown>;
  turn_min: number;
  turn_max: number | null;
  reveal_rules: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StoryFactRow {
  id: string;
  story_id: string;
  fact_key: string;
  content: string;
  category: string;
  known_by: string[];
  is_public: boolean;
  reveal_act: number | null;
  created_at: string;
  updated_at: string;
}

export interface StoryClueRow {
  id: string;
  story_id: string;
  clue_key: string;
  description: string;
  reliability: ClueReliability;
  category: ClueCategory;
  act_available: number;
  source_character_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface StoryEndingRow {
  id: string;
  story_id: string;
  ending_key: string;
  title: string;
  conditions: Record<string, unknown>;
  narrative_guidance: string;
  created_at: string;
  updated_at: string;
}

export interface InteractionTurnRow {
  id: string;
  game_id: string;
  turn_number: number;
  status: TurnStatus;
  user_submitted_at: string;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiDraftRow {
  id: string;
  turn_id: string;
  version: number;
  responses: unknown[];
  game_state_updates: Record<string, unknown>;
  narrator_notes: string;
  validation_warnings: unknown[];
  source: DraftSource;
  model: string;
  created_at: string;
}

export interface AddressRow {
  id: string;
  user_id: string;
  label: string | null;
  line1: string;
  line2: string | null;
  city: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingSnapshot {
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  postal_code: string;
  country: string;
}

export interface OrderRow {
  id: string;
  user_id: string;
  story_id: string;
  status: OrderStatus;
  source: OrderSource;
  shipping_snapshot: ShippingSnapshot;
  amount_cents: number;
  currency: string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameRow {
  id: string;
  user_id: string;
  order_id: string;
  story_id: string;
  status: GameStatus;
  questionnaire: Record<string, unknown> | null;
  feedback: string | null;
  runtime_state: GameRuntimeState;
  created_at: string;
  completed_at: string | null;
}

export interface InteractionRow {
  id: string;
  game_id: string;
  role: InteractionRole;
  content: string;
  letter_number: number;
  visible_from: string | null;
  character_slug: string | null;
  story_date: string | null;
  turn_id: string | null;
  created_at: string;
}
