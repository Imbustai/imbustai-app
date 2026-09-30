import { createHash } from 'node:crypto';
import OpenAI from 'openai';
import type { Effort } from '../contract';
import {
  IncompleteOutputError,
  type AiProvider,
  type CallUsage,
  type StructuredRequest,
  type StructuredResult,
  type TextRequest,
  type TextResult,
} from './provider';

// Server-only, like ClaudeProvider. Uses the Responses API: from GPT-5.4 on,
// Chat Completions has no tool calling with reasoning, and structured output
// goes through `text.format` with `strict: true`. Responses are not stored
// (stateless single-shot calls). See Imbustai/imbustai-app#17.
//
// Caching: GPT-5.6 and GPT-6 bill cache writes at 1.25x input, so they run in
// explicit mode with one breakpoint after the cached prefix — nothing else is
// written. Older models cache implicitly with no write surcharge.

const DEFAULT_MAX_TOKENS = 25000;

function hasExplicitCache(model: string): boolean {
  return model.startsWith('gpt-6') || model.startsWith('gpt-5.6');
}

/** GPT-5.5 and earlier stop at `xhigh`. */
function effortFor(model: string, effort: Effort): OpenAI.ReasoningEffort {
  const tops = hasExplicitCache(model) ? 'max' : 'xhigh';
  return effort === 'max' ? tops : effort;
}

/** Server-side credentials; omitted API key falls back to OPENAI_API_KEY. */
export interface OpenAiProviderOptions {
  apiKey?: string;
}

/** Server-only OpenAI Responses adapter; requests are stateless and not stored. */
export class OpenAiProvider implements AiProvider {
  readonly id = 'openai' as const;
  private readonly client: OpenAI;

  constructor(options: OpenAiProviderOptions = {}) {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      throw new Error('OpenAiProvider is server-only: never instantiate it in client code.');
    }
    this.client = new OpenAI({ apiKey: options.apiKey ?? process.env.OPENAI_API_KEY });
  }

  /** Parse strict JSON output; billed unusable replies throw IncompleteOutputError. */
  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    const { text, usage } = await this.send(request, {
      type: 'json_schema',
      name: request.format.name,
      schema: request.format.schema,
      strict: true,
    });
    try {
      return { output: JSON.parse(text), usage };
    } catch {
      throw new IncompleteOutputError('invalid_json', usage, text.slice(0, 200));
    }
  }

  /** Generate text with model, effort and cache settings from the request. */
  async generateText(request: TextRequest): Promise<TextResult> {
    const { text, usage } = await this.send(request);
    return { output: text, usage };
  }

  private async send(
    request: TextRequest,
    format?: OpenAI.Responses.ResponseFormatTextJSONSchemaConfig,
  ): Promise<{ text: string; usage: CallUsage }> {
    const explicit = hasExplicitCache(request.model);
    const input: OpenAI.Responses.ResponseInputItem[] = [];
    if (request.cachedPrefix) {
      input.push({
        role: 'developer',
        content: [
          {
            type: 'input_text',
            text: request.cachedPrefix,
            ...(explicit ? { prompt_cache_breakpoint: { mode: 'explicit' as const } } : {}),
          },
        ],
      });
    }
    input.push({ role: 'developer', content: request.system });
    input.push({ role: 'user', content: request.user });

    const response = await this.client.responses.create({
      model: request.model,
      input,
      store: false,
      max_output_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      ...(request.effort ? { reasoning: { effort: effortFor(request.model, request.effort) } } : {}),
      ...(format ? { text: { format } } : {}),
      ...(explicit ? { prompt_cache_options: { mode: 'explicit' as const } } : {}),
      ...(request.cachedPrefix ? { prompt_cache_key: cacheKey(request.model, request.cachedPrefix) } : {}),
    });

    const usage = toCallUsage(request.model, response.usage);
    if (response.status === 'incomplete') {
      const reason = response.incomplete_details?.reason;
      throw new IncompleteOutputError(reason === 'content_filter' ? 'refusal' : 'max_tokens', usage, reason ?? '');
    }
    const refusal = response.output
      .flatMap((item) => (item.type === 'message' ? item.content : []))
      .find((part) => part.type === 'refusal');
    if (refusal) throw new IncompleteOutputError('refusal', usage, refusal.refusal);
    const text = response.output_text;
    if (!text.trim()) throw new IncompleteOutputError('empty', usage);
    return { text, usage };
  }
}

/** Routes calls sharing a prefix to the same cache. */
function cacheKey(model: string, prefix: string): string {
  return `${model}:${createHash('sha256').update(prefix).digest('hex').slice(0, 32)}`;
}

/**
 * OpenAI's `input_tokens` includes cache reads and writes; the app's buckets
 * are disjoint, so both are subtracted from input.
 */
export function toCallUsage(model: string, usage: OpenAI.Responses.ResponseUsage | undefined): CallUsage {
  const cached = usage?.input_tokens_details?.cached_tokens ?? 0;
  const written = usage?.input_tokens_details?.cache_write_tokens ?? 0;
  return {
    provider: 'openai',
    model,
    input_tokens: Math.max(0, (usage?.input_tokens ?? 0) - cached - written),
    output_tokens: usage?.output_tokens ?? 0,
    cache_creation_input_tokens: written,
    cache_read_input_tokens: cached,
  };
}
