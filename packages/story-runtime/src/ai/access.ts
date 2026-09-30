import type { z } from 'zod';
import type { AiAccess, AiRequest, CharacterSlug, Conversation, Effort, ModelRole } from '../contract';
import { dropNullsForOptional, strictJsonSchema, type JsonSchema } from './jsonSchema';
import { resolveModelChoice, type ModelProfile } from './profile';
import { IncompleteOutputError, type AiProvider, type CallUsage, type TextRequest } from './provider';

// The `ai` half of the hook context: how an Engine reaches a model. Engines
// never see the provider, the model or a price — they name a role and a
// purpose; the Game's model profile picks the model (a Character's override
// first), and every attempt, retries and failures included, is reported to
// `onUsage` so the platform can price and persist it.

/** How one attempt ended. Every attempt is billed, whatever its outcome. */
export type CallOutcome = 'ok' | 'invalid' | 'incomplete';

/** One model call's token usage, tagged with who asked for it and why. */
export interface UsageRecord extends CallUsage {
  role: ModelRole;
  /** The Engine's reason for the call, e.g. "orchestrator", "reply:voss". */
  purpose: string;
  character?: CharacterSlug;
  /** The Turn being played; 0 at game start. */
  turn: number;
  /** 1 for the first try; retries after invalid output count up. */
  attempt: number;
  effort?: Effort;
  outcome: CallOutcome;
}

/** Game model profile, provider lookup, Turn attribution and retry policy. */
export interface AiAccessOptions {
  profile: ModelProfile;
  /** The client that serves a model: the platform maps each model to its vendor. */
  providerFor(model: string): AiProvider;
  turn: number;
  /** Receives usage for every completed attempt, including schema-validation retries. */
  onUsage?: (record: UsageRecord) => void;
  /** Extra attempts after a reply that fails the zod schema. */
  retries?: number;
}

const schemaCache = new WeakMap<z.ZodTypeAny, JsonSchema>();

function jsonSchemaOf(schema: z.ZodTypeAny): JsonSchema {
  let json = schemaCache.get(schema);
  if (!json) {
    json = strictJsonSchema(schema);
    schemaCache.set(schema, json);
  }
  return json;
}

/** Providers want a plain name for the output format; the purpose is the natural one. */
function formatName(purpose: string): string {
  return purpose.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64) || 'reply';
}

function repairNote(issues: string): string {
  return `\n\nIMPORTANT: your previous reply did not satisfy the required schema (${issues}). Reply again with every field valid.`;
}

/**
 * Build role/Character-aware AI access from a Game's model profile. Structured
 * calls derive a strict JSON schema from zod, then validate the reply; zod
 * failures get two extra attempts by default. Incomplete/refused output and
 * provider errors propagate without retries. Reports usage for each completed
 * or billed-incomplete attempt; pricing and Run budget policy belong to the host.
 * @category Utilities
 */
export function createAiAccess(options: AiAccessOptions): AiAccess {
  const { profile, providerFor, turn, onUsage, retries = 2 } = options;

  /** `model` pins a continuation to the model that started it. */
  function prepare(role: ModelRole, request: Omit<AiRequest<never>, 'schema'>, model?: string) {
    const choice = resolveModelChoice(profile, role, request.character);
    const effort = request.effort ?? choice.effort;
    const base: TextRequest = {
      model: model ?? choice.model,
      effort,
      cachedPrefix: request.cachedPrefix,
      system: request.system,
      user: request.user,
      maxTokens: request.maxTokens,
    };
    const record = (attempt: number, outcome: CallOutcome, usage: CallUsage) =>
      onUsage?.({
        role,
        purpose: request.purpose,
        character: request.character,
        turn,
        attempt,
        effort,
        outcome,
        ...usage,
      });
    return { provider: providerFor(choice.model), base, record };
  }

  /** Runs one attempt; a billed failure is recorded before it propagates. */
  async function attemptCall<T extends { usage: CallUsage }>(
    record: (attempt: number, outcome: CallOutcome, usage: CallUsage) => void,
    attempt: number,
    call: () => Promise<T>,
  ): Promise<T> {
    try {
      return await call();
    } catch (err) {
      if (err instanceof IncompleteOutputError) record(attempt, 'incomplete', err.usage);
      throw err;
    }
  }

  return {
    /**
     * Generate a structured response and validate it with zod. The strict JSON
     * schema guarantees the shape; retries cover what only zod checks
     * (lengths, refinements). A truncated or refused reply is not retried.
     */
    async structured<S extends z.ZodTypeAny>(role: ModelRole, request: AiRequest<S>): Promise<z.infer<S>> {
      const { provider, base, record } = prepare(role, request);
      const format = { name: formatName(request.purpose), schema: jsonSchemaOf(request.schema) };
      const label = request.character ? `${request.purpose}(${request.character})` : request.purpose;
      let lastError = '';
      for (let attempt = 1; attempt <= retries + 1; attempt++) {
        const user = attempt === 1 ? base.user : base.user + repairNote(lastError);
        const { output, usage } = await attemptCall(record, attempt, () =>
          provider.generateStructured({ ...base, user, format }),
        );
        const parsed = request.schema.safeParse(dropNullsForOptional(request.schema, output));
        record(attempt, parsed.success ? 'ok' : 'invalid', usage);
        if (parsed.success) return parsed.data;
        lastError = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      }
      throw new Error(`${label} parse failed after ${retries + 1} attempts: ${lastError}`);
    },

    async text(role, request) {
      const { provider, base, record } = prepare(role, request);
      const { output, usage } = await attemptCall(record, 1, () => provider.generateText(base));
      record(1, 'ok', usage);
      return output;
    },

    async converse(role, request, conversation?: Conversation) {
      const { provider, base, record } = prepare(role, request, conversation?.model);
      const { output, usage, transcript } = await attemptCall(record, 1, () =>
        provider.generateText({ ...base, history: conversation?.messages }),
      );
      record(1, 'ok', usage);
      return { text: output, conversation: { model: base.model, messages: transcript } };
    },
  };
}
