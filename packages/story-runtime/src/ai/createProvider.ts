import { ClaudeProvider } from './claudeProvider';
import { OpenAiProvider } from './openAiProvider';
import type { AiProvider, ProviderId } from './provider';

// One client per vendor, created on first use so a Game that never calls
// OpenAI needs no OpenAI key. Which vendor serves a model is the platform's
// call (the price table's `provider` column), not the Engine's.

export const PROVIDER_IDS = ['anthropic', 'openai'] as const satisfies readonly ProviderId[];

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as readonly string[]).includes(value);
}

export function createProviders(): (id: ProviderId) => AiProvider {
  const cache = new Map<ProviderId, AiProvider>();
  return (id) => {
    let provider = cache.get(id);
    if (!provider) {
      provider = id === 'anthropic' ? new ClaudeProvider() : new OpenAiProvider();
      cache.set(id, provider);
    }
    return provider;
  };
}
