import Anthropic from '@anthropic-ai/sdk';
import {
  IncompleteOutputError,
  type AiProvider,
  type CallUsage,
  type StructuredRequest,
  type StructuredResult,
  type TextRequest,
  type TextResult,
} from './provider';

// Server-only. The API key must never reach a client bundle — this module is
// imported exclusively from Route Handlers / scripts.
//
// Structured output goes through `output_config.format` (JSON schema), not a
// forced tool call: Fable 5.1, Opus 5.5 and Sonnet 5.5 reject forced
// `tool_choice`. Thinking is left to each model's default (adaptive, always on
// for Fable 5.1 and Opus 5.5); effort is the only depth control. The cached
// prefix is its own system block with a 5-minute cache breakpoint — the TTL
// ai_model_pricing's cache-write column prices.

const DEFAULT_MAX_TOKENS = 16000;

/** Haiku 4.5 rejects the effort parameter; every current larger model takes it. */
function acceptsEffort(model: string): boolean {
  return !model.startsWith('claude-haiku-');
}

/** Server-side credentials; omitted API key falls back to ANTHROPIC_API_KEY. */
export interface ClaudeProviderOptions {
  apiKey?: string;
}

/** Server-only Anthropic adapter for schema-constrained JSON and plain-text output. */
export class ClaudeProvider implements AiProvider {
  readonly id = 'anthropic' as const;
  private readonly client: Anthropic;

  constructor(options: ClaudeProviderOptions = {}) {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      throw new Error('ClaudeProvider is server-only: never instantiate it in client code.');
    }
    this.client = new Anthropic({ apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY });
  }

  /** Parse a schema-constrained response; billed unusable output throws IncompleteOutputError. */
  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    const { text, usage } = await this.send(request, { type: 'json_schema', schema: request.format.schema });
    try {
      return { output: JSON.parse(text), usage };
    } catch {
      throw new IncompleteOutputError('invalid_json', usage, text.slice(0, 200));
    }
  }

  /** Generate text with the requested model, effort and optional cached prefix. */
  async generateText(request: TextRequest): Promise<TextResult> {
    const { text, usage } = await this.send(request);
    return { output: text, usage };
  }

  private async send(
    request: TextRequest,
    format?: Anthropic.JSONOutputFormat,
  ): Promise<{ text: string; usage: CallUsage }> {
    const system: Anthropic.TextBlockParam[] = [];
    if (request.cachedPrefix) {
      system.push({ type: 'text', text: request.cachedPrefix, cache_control: { type: 'ephemeral' } });
    }
    system.push({ type: 'text', text: request.system });

    const outputConfig: Anthropic.OutputConfig = {};
    if (format) outputConfig.format = format;
    if (request.effort && acceptsEffort(request.model)) outputConfig.effort = request.effort;

    // Streamed so long thinking plus a long Letter never hits the HTTP timeout.
    const message = await this.client.messages
      .stream({
        model: request.model,
        max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: request.user }],
        ...(Object.keys(outputConfig).length > 0 ? { output_config: outputConfig } : {}),
      })
      .finalMessage();

    const usage = toCallUsage(request.model, message.usage);
    if (message.stop_reason === 'refusal') {
      throw new IncompleteOutputError('refusal', usage, message.stop_details?.category ?? '');
    }
    if (message.stop_reason === 'max_tokens') throw new IncompleteOutputError('max_tokens', usage);
    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');
    if (!text.trim()) throw new IncompleteOutputError('empty', usage);
    return { text, usage };
  }
}

function toCallUsage(model: string, usage: Anthropic.Usage): CallUsage {
  return {
    provider: 'anthropic',
    model,
    input_tokens: usage.input_tokens ?? 0,
    output_tokens: usage.output_tokens ?? 0,
    cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
    cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
  };
}
