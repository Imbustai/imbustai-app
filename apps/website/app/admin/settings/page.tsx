import { DEFAULT_MODEL, resolveProviderKind, type ProviderKind } from '@imbustai/story-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { AiCostSettings } from '@/components/admin/ai-cost-settings';
import type { AiModelPricingRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

const KEY_ENV: Record<ProviderKind, string> = {
  claude: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  deepseek: 'DEEPSEEK_API_KEY',
};

// Admin Settings: active AI provider/model (from env, read-only for now) and the
// editable per-model price table. Auth enforced by the /admin layout.
export default async function AdminSettingsPage() {
  let provider: ProviderKind = 'claude';
  try {
    provider = resolveProviderKind(process.env);
  } catch {
    provider = 'claude';
  }
  const model = process.env.STORY_ENGINE_MODEL ?? DEFAULT_MODEL;
  const keyConfigured = Boolean(process.env[KEY_ENV[provider]]);

  const admin = createAdminClient();
  const { data } = await admin
    .from('ai_model_pricing')
    .select('*')
    .order('provider', { ascending: true })
    .order('model', { ascending: true });
  const rows = (data ?? []) as AiModelPricingRow[];

  return <AiCostSettings active={{ provider, model, keyConfigured }} rows={rows} />;
}
