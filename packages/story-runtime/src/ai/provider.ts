// Provider abstraction: one method, structured output via a forced tool call.
// Production: ClaudeProvider (+ future OpenAI). Tests: MockProvider. Engines
// never see a provider: they reach AI through the hook context (ai/access.ts).
// The interface exists for testability AND the multi-provider seam; it also
// reports token usage per call so the app can attribute cost (cost in dollars
// is computed app-side from a DB price table — the API only returns tokens).

import type { StructuredTool } from '../contract';

/** Provider-facing alias for the forced tool call definition. */
export type StructuredToolDefinition = StructuredTool;

/** System and user prompts plus a forced tool schema and optional output-token limit. */
export interface StructuredRequest {
  system: string;
  user: string;
  tool: StructuredToolDefinition;
  maxTokens?: number;
}

/** Token usage for a single model call. Cost ($) is computed app-side. */
export interface CallUsage {
  provider: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

/** A structured call result: the raw tool input plus that call's token usage. */
export interface StructuredResult {
  /** Raw tool input — callers zod-parse it. */
  output: unknown;
  usage: CallUsage;
}

/** Prompts and an optional output-token limit for a plain-text call. */
export interface TextRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

/** Generated plain text and usage for the completed call. */
export interface TextResult {
  output: string;
  usage: CallUsage;
}

/** Server-side model boundary; Engines use HookContext.ai rather than this interface. */
export interface AiProvider {
  /** Return raw tool input and token usage; validation belongs to the AI access adapter. */
  generateStructured(request: StructuredRequest): Promise<StructuredResult>;
  /** Plain text output; a provider without it cannot serve `ai.text`. */
  generateText?(request: TextRequest): Promise<TextResult>;
}

/**
 * Construct an all-zero usage record with provider and model attribution for mocks.
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

/** Synchronous test callback returning raw structured output for a captured request. */
export type MockHandler = (request: StructuredRequest) => unknown;

/** Test/simulation provider: route by tool name, or queue canned outputs. */
export class MockProvider implements AiProvider {
  private readonly handler: MockHandler;
  public readonly requests: StructuredRequest[] = [];

  constructor(handler: MockHandler) {
    this.handler = handler;
  }

  /** Capture the request and return the handler output with zero-cost mock usage. */
  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    this.requests.push(request);
    return { output: this.handler(request), usage: ZERO_USAGE('mock', 'mock') };
  }
}
