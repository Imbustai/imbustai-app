// Provider abstraction: one client per vendor (Claude, OpenAI), model-agnostic
// — each request names its model and effort, resolved from the Game's model
// profile. Tests: MockProvider. Engines never see a provider: they reach AI
// through the hook context (ai/access.ts). Every call reports its token usage
// so the app can price it (the APIs return tokens, never dollars).

import type { Effort } from '../contract';
import type { JsonSchema } from './jsonSchema';

export type ProviderId = 'anthropic' | 'openai';

interface ModelRequest {
  model: string;
  effort?: Effort;
  /** Stable across calls (a Character's writer view): sent first and cached. */
  cachedPrefix?: string;
  system: string;
  user: string;
  /** Upper bound on output, thinking/reasoning included. */
  maxTokens?: number;
}

export interface StructuredRequest extends ModelRequest {
  /** Named strict JSON schema the reply must match (see jsonSchema.ts). */
  format: { name: string; schema: JsonSchema };
}

export type TextRequest = ModelRequest;

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

export interface TextResult {
  output: string;
  usage: CallUsage;
}

export interface AiProvider {
  readonly id: ProviderId | 'mock';
  generateStructured(request: StructuredRequest): Promise<StructuredResult>;
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

export const ZERO_USAGE = (provider: string, model: string): CallUsage => ({
  provider,
  model,
  input_tokens: 0,
  output_tokens: 0,
  cache_creation_input_tokens: 0,
  cache_read_input_tokens: 0,
});

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

  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    this.requests.push(request);
    return { output: this.handler(request), usage: ZERO_USAGE('mock', request.model) };
  }

  async generateText(request: TextRequest): Promise<TextResult> {
    this.textRequests.push(request);
    return { output: this.textHandler(request), usage: ZERO_USAGE('mock', request.model) };
  }
}
