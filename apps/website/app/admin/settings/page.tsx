import { DEFAULT_MODEL_PROFILE, PROFILE_ROLES, PROVIDER_IDS, type ProviderId } from '@imbustai/story-runtime';
import { createAdminClient } from '@/lib/supabase/admin';
import { AiCostSettings } from '@/components/admin/ai-cost-settings';
import type { AiModelPricingRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

const KEY_ENV: Record<ProviderId, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
};

// Admin Settings: the platform's default model profile (a Story can patch it,
// and each Game keeps the profile it started with), which provider keys are
// configured, and the editable per-model price table. Auth enforced by the
// /admin layout.
export default async function AdminSettingsPage() {
  const profile = PROFILE_ROLES.map((role) => ({ role, ...DEFAULT_MODEL_PROFILE.roles[role] }));
  const keys = PROVIDER_IDS.map((provider) => ({
    provider,
    configured: Boolean(process.env[KEY_ENV[provider]]),
  }));

  const admin = createAdminClient();
  const { data } = await admin
    .from('ai_model_pricing')
    .select('*')
    .order('provider', { ascending: true })
    .order('model', { ascending: true });
  const rows = (data ?? []) as AiModelPricingRow[];

  return <AiCostSettings profile={profile} keys={keys} rows={rows} />;
}
