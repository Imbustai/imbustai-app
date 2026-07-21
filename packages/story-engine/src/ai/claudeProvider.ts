import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, CallUsage, StructuredRequest, StructuredResult } from './provider';

// Server-only. The API key must never reach a client bundle — this module is
// imported exclusively from Route Handlers / scripts.

export const DEFAULT_MODEL = 'claude-opus-4-8';

export interface ClaudeProviderOptions {
  apiKey?: string;
  model?: string;
}

export class ClaudeProvider implements AiProvider {
  private readonly client: Anthropic;
  public readonly model: string;

  constructor(options: ClaudeProviderOptions = {}) {
    if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
      throw new Error('ClaudeProvider is server-only: never instantiate it in client code.');
    }
    this.client = new Anthropic({ apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY });
    this.model = options.model ?? process.env.STORY_ENGINE_MODEL ?? DEFAULT_MODEL;
  }

  async generateStructured(request: StructuredRequest): Promise<StructuredResult> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: request.maxTokens ?? 4096,
      system: request.system,
      messages: [{ role: 'user', content: request.user }],
      tools: [
        {
          name: request.tool.name,
          description: request.tool.description,
          input_schema: request.tool.input_schema as Anthropic.Tool['input_schema'],
        },
      ],
      tool_choice: { type: 'tool', name: request.tool.name },
    });

    const usage = this.toCallUsage(response.usage);

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      throw new Error(
        `Claude did not return the expected ${request.tool.name} tool call (stop_reason: ${response.stop_reason}).`,
      );
    }
    return { output: toolUse.input, usage };
  }

  private toCallUsage(usage: Anthropic.Usage): CallUsage {
    return {
      provider: 'anthropic',
      model: this.model,
      input_tokens: usage.input_tokens ?? 0,
      output_tokens: usage.output_tokens ?? 0,
      cache_creation_input_tokens: usage.cache_creation_input_tokens ?? 0,
      cache_read_input_tokens: usage.cache_read_input_tokens ?? 0,
    };
  }
}
