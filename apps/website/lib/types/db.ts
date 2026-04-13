export type OrderStatus = 'pending_payment' | 'paid' | 'cancelled';
export type OrderSource = 'stripe' | 'admin';
export type GameStatus = 'in_progress' | 'completed';
export type InteractionRole = 'ai' | 'user';

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
  created_at: string;
  updated_at: string;
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
  created_at: string;
}
