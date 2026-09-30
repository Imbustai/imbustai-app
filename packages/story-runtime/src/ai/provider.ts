// Provider abstraction: one client per vendor (Claude, OpenAI), model-agnostic
// — each request names its model and effort, resolved from the Game's model
// profile. Tests: MockProvider. Engines never see a provider: they reach AI
// through the hook context (ai/access.ts). Every call reports its token usage
// so the app can price it (the APIs return tokens, never dollars).

import type { Effort, Json } from '../contract';
import type { JsonSchema } from './jsonSchema';

/** Production vendor identifier used by provider lookup and the price table. */
export type ProviderId = 'anthropic' | 'openai';

/** Resolved model, prompts, effort and optional cache prefix for a provider call. */
export interface ModelRequest {
  model: string;
  effort?: Effort;
  /** Stable across calls (a Character's writer view): sent first and cached. */
  cachedPrefix?: string;
  system: string;
  user: string;
  /** Upper bound on output, thinking/reasoning included. */
  maxTokens?: number;
}

/** Model request with a named strict JSON schema for structured output. */
export interface StructuredRequest extends ModelRequest {
  /** Named strict JSON schema the reply must match (see jsonSchema.ts). */
  format: { name: string; schema: JsonSchema };
}

/** Provider input for plain-text generation, without a response schema. */
export interface TextRequest extends ModelRequest {
  /**
   * Earlier messages of this conversation, in the provider's own format (a
   * previous `TextResult.transcript`); `user` is appended after them.
   */
  history?: Json[];
}

/**
 * Token usage for a single model call, in four disjoint buckets. Cost ($) is
 * computed app-side from ai_model_pricing.
 */
export interface CallUsage {
  provider: string;
  model: string;
  /** Uncached input only: cache reads and writes are the two buckets below. */
  input_tokens: number;
  /** Thinking/reasoning included. */
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

/** A structured call result: the parsed JSON (callers zod-parse it) plus its usage. */
export interface StructuredResult {
  output: unknown;
  usage: CallUsage;
}

/** Generated text and the completed call's token usage. */
export interface TextResult {
  output: string;
  usage: CallUsage;
  /** `history`, then this call's user message and the model's reply as returned (thinking included). */
  transcript: Json[];
}

/** Server-side vendor boundary; Engines reach it through HookContext.ai. */
export interface AiProvider {
  readonly id: ProviderId | 'mock';
  /** Return parsed JSON and usage; the access adapter validates it with zod. */
  generateStructured(request: StructuredRequest): Promise<StructuredResult>;
  /** Return generated text and usage for the resolved model request. */
  generateText(request: TextRequest): Promise<TextResult>;
}

/**
 * The model ran and was billed but returned nothing usable: truncated at
 * `maxTokens`, refused, or not JSON. Carries the usage so the platform still
 * records the spend; the call is not retried.
 */
export class IncompleteOutputError extends Error {
  constructor(
    public readonly reason: 'max_tokens' | 'refusal' | 'invalid_json' | 'empty',
    public readonly usage: CallUsage,
    detail = '',
  ) {
    super(`${usage.model}: no usable output (${reason})${detail ? `: ${detail}` : ''}`);
  }
}

/**
 * Construct zero-token usage with provider/model attribution for test doubles.
 * @category Utilities
 */
export const ZERO_USAGE = (provider: string, model: string): CallUsage => ({
  provider,
  model,
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
});

/** Test callback producing raw structured output from a captured provider request. */
export type MockHandler = (request: StructuredRequest) => unknown;

/** Test/simulation provider: route by format name, or queue canned outputs. */
export class MockProvider implements AiProvider {
  readonly id = 'mock' as const;
  private readonly handler: MockHandler;
  public readonly requests: StructuredRequest[] = [];
  public readonly textRequests: TextRequest[] = [];

  constructor(
    handler: MockHandler,
    private readonly textHandler: (request: TextRequest) => string = () => '',
  ) {
    this.handler = handler;
  }

  /** Capture the request and return the handler output with zero-token usage. */
  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    this.requests.push(request);
    return { output: this.handler(request), usage: ZERO_USAGE('mock', request.model) };
  }

  /** Capture the text request and return the text handler output with zero-token usage. */
  async generateText(request: TextRequest): Promise<TextResult> {
    this.textRequests.push(request);
    const output = this.textHandler(request);
    return {
      output,
      usage: ZERO_USAGE('mock', request.model),
      transcript: [...(request.history ?? []), { role: 'user', content: request.user }, { role: 'assistant', content: output }],
    };
  }
}
