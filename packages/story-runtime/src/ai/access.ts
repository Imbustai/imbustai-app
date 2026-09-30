import type { z } from 'zod';
import type { AiAccess, AiRequest, CharacterSlug, ModelRole } from '../contract';
import type { AiProvider, CallUsage, StructuredRequest } from './provider';

// The `ai` half of the hook context: how an Engine reaches a model. Engines
// never see the provider, the model or a price — they name a role and a
// purpose, and every call (retries included) is reported to `onUsage` so the
// platform can price it. One provider serves every role until model profiles
// arrive.

/** One model call's token usage, tagged with who asked for it and why. */
export interface UsageRecord extends CallUsage {
  role: ModelRole;
  /** The Engine's reason for the call, e.g. "orchestrator", "npc_letter". */
  purpose: string;
  character?: CharacterSlug;
  /** The Turn being played; 0 at game start. */
  turn: number;
}

/** Provider, Turn attribution and retry policy for the current single-provider adapter. */
export interface AiAccessOptions {
  provider: AiProvider;
  turn: number;
  /** Receives usage for every completed attempt, including schema-validation retries. */
  onUsage?: (record: UsageRecord) => void;
  /** Extra attempts after a malformed structured reply. */
  retries?: number;
}

const REPAIR_NOTE =
  '\n\nIMPORTANT: your previous tool call was malformed. Call the tool again with every argument as valid JSON of the correct type — arrays as real JSON arrays (not strings), objects as objects — and NEVER use XML or <parameter ...> tags inside the arguments.';

/**
 * Adapt a provider to role-attributed Hook AI access. Structured calls require
 * a tool definition, coerce stringified JSON fields, then validate with zod;
 * malformed output gets two extra attempts by default. Provider/network errors
 * propagate. All roles use the same provider; model profiles, cached prefixes
 * and cost-cap reservation are not implemented here yet.
 * @category Utilities
 */
export function createAiAccess(options: AiAccessOptions): AiAccess {
  const { provider, turn, onUsage, retries = 2 } = options;
  const record = (role: ModelRole, request: { purpose: string; character?: string }, usage: CallUsage) =>
    onUsage?.({ role, purpose: request.purpose, character: request.character, turn, ...usage });

  return {
    /**
     * Generate a structured response and validate it, retrying on the
     * occasional malformed tool output (truncation, leaked tool syntax, a
     * field serialized as a string). These glitches are transient, so a couple
     * of retries reliably recovers — far better than failing the whole turn.
     */
    async structured<S extends z.ZodTypeAny>(role: ModelRole, request: AiRequest<S>): Promise<z.infer<S>> {
      if (!request.tool) {
        throw new Error(`ai.structured(${request.purpose}): a tool definition is required until model profiles derive one from the schema.`);
      }
      const base: StructuredRequest = {
        system: request.system,
        user: request.user,
        tool: request.tool,
        maxTokens: request.maxTokens,
      };
      const label = request.character ? `${request.purpose}(${request.character})` : request.purpose;
      let lastError = '';
      for (let attempt = 0; attempt <= retries; attempt++) {
        // Escalate after the first failure so retries differ from the (failing) call.
        const req = attempt === 0 ? base : { ...base, user: base.user + REPAIR_NOTE };
        const { output, usage } = await provider.generateStructured(req);
        // Record usage for EVERY attempt — retries cost real tokens too.
        record(role, request, usage);
        const parsed = request.schema.safeParse(coerceStructured(output));
        if (parsed.success) return parsed.data;
        lastError = `${parsed.error.issues.map((i) => `${i.path.join('.')}:${i.message}`).join('; ')} | raw=${JSON.stringify(output).slice(0, 300)}`;
      }
      throw new Error(`${label} parse failed after ${retries + 1} attempts: ${lastError}`);
    },

    async text(role, request) {
      if (!provider.generateText) {
        throw new Error(`ai.text(${request.purpose}): the configured provider has no text output.`);
      }
      const { output, usage } = await provider.generateText({
        system: request.system,
        user: request.user,
        maxTokens: request.maxTokens,
      });
      record(role, request, usage);
      return output;
    },
  };
}

/**
 * Tool-use inputs occasionally arrive with a nested field serialized as a JSON
 * string instead of a real array/object (model quirk). Parse those back before
 * zod validation so generation never crashes on an otherwise-valid response.
 */
function coerceStructured(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw;
  const obj = raw as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          obj[key] = JSON.parse(trimmed);
        } catch {
          /* leave as-is; zod will report it */
        }
      }
    }
  }
  return obj;
}
