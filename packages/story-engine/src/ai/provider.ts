// Provider abstraction: one method, structured output via a forced tool call.
// Production: ClaudeProvider. Tests: MockProvider. Single AI vendor (Claude)
// by design — this interface exists for testability, not multi-provider.

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

export interface AiProvider {
  /** Returns the raw tool input — callers zod-parse it. */
  generateStructured(request: StructuredRequest): Promise<unknown>;
}

export type MockHandler = (request: StructuredRequest) => unknown;

/** Test/simulation provider: route by tool name, or queue canned outputs. */
export class MockProvider implements AiProvider {
  private readonly handler: MockHandler;
  public readonly requests: StructuredRequest[] = [];

  constructor(handler: MockHandler) {
    this.handler = handler;
  }

  async generateStructured(request: StructuredRequest): Promise<unknown> {
    this.requests.push(request);
    return this.handler(request);
  }
}
