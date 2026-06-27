import { ClaudeProvider } from './claudeProvider';
import type { AiProvider } from './provider';

// Multi-provider seam. Selects the AI provider from STORY_ENGINE_PROVIDER
// (default 'claude'). Claude is the only implemented provider today; OpenAI and
// DeepSeek are intentionally stubbed so the switch is a config change, not a
// rewrite — both are OpenAI tool-calling compatible and will implement the same
// AiProvider interface (returning token usage for cost attribution).

export type ProviderKind = 'claude' | 'openai' | 'deepseek';

export function resolveProviderKind(env: NodeJS.ProcessEnv = process.env): ProviderKind {
  const raw = (env.STORY_ENGINE_PROVIDER ?? 'claude').toLowerCase();
  if (raw === 'claude' || raw === 'anthropic') return 'claude';
  if (raw === 'openai' || raw === 'chatgpt') return 'openai';
  if (raw === 'deepseek') return 'deepseek';
  throw new Error(`Unknown STORY_ENGINE_PROVIDER "${raw}" (expected claude | openai | deepseek).`);
}

export function createProvider(env: NodeJS.ProcessEnv = process.env): AiProvider {
  const kind = resolveProviderKind(env);
  switch (kind) {
    case 'claude':
      return new ClaudeProvider();
    case 'openai':
    case 'deepseek':
      // TODO: implement OpenAiProvider / DeepSeekProvider (OpenAI SDK + tool
      // calling), returning CallUsage from response.usage. Pricing rows for
      // these models already exist in ai_model_pricing.
      throw new Error(`STORY_ENGINE_PROVIDER="${kind}" is not implemented yet (seam ready).`);
  }
}
