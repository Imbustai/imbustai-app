// Provider abstraction: one method, structured output via a forced tool call.
// Production: ClaudeProvider (+ future OpenAI/DeepSeek). Tests: MockProvider.
// The interface exists for testability AND the multi-provider seam; it also
// reports token usage per call so the app can attribute cost (cost in dollars
// is computed app-side from a DB price table — the API only returns tokens).

export interface StructuredToolDefinition {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

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

export interface AiProvider {
  generateStructured(request: StructuredRequest): Promise<StructuredResult>;
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

/** Test/simulation provider: route by tool name, or queue canned outputs. */
export class MockProvider implements AiProvider {
  private readonly handler: MockHandler;
  public readonly requests: StructuredRequest[] = [];

  constructor(handler: MockHandler) {
    this.handler = handler;
  }

  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    this.requests.push(request);
    return { output: this.handler(request), usage: ZERO_USAGE('mock', 'mock') };
  }
}
