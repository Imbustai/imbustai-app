import {
  IncompleteOutputError,
  type AiProvider,
  type CallUsage,
  type StructuredRequest,
  type TextRequest,
} from '../ai/provider';

// The Run cost cap (ADR 0002): a Run reserves the worst case of every model
// call before making it and is refused the call when the cap cannot cover it,
// so the metered spend never passes the cap. The budget sits around the
// provider, below the Hooks: whatever an Engine does, every call it makes goes
// through here.

/** USD per million tokens, as ai_model_pricing stores them. */
export interface ModelPrice {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

/** The price of a model; must throw for a model with no price (never $0). */
export type PriceOf = (model: string) => ModelPrice;

/**
 * Dollar cost of one call's metered usage.
 * @category Utilities
 */
export function costOf(usage: CallUsage, price: ModelPrice): number {
  return (
    (usage.input_tokens * price.input +
      usage.output_tokens * price.output +
      usage.cache_read_input_tokens * price.cacheRead +
      usage.cache_creation_input_tokens * price.cacheWrite) /
    1_000_000
  );
}

/**
 * Output allowance assumed for a request that sets none: the larger of the
 * providers' own defaults.
 */
export const DEFAULT_RESERVED_OUTPUT_TOKENS = 25_000;

/**
 * No tokenizer runs before the call, so input is bounded from its length: one
 * token per two characters is above what Italian or English prose costs on
 * any current model (about three to four characters per token).
 */
const CHARS_PER_TOKEN_FLOOR = 2;

/**
 * The most a request can cost: all of its input at the dearest input rate
 * (a cache write) and its whole output allowance, thinking included.
 * @category Utilities
 */
export function worstCaseCost(request: TextRequest | StructuredRequest, price: ModelPrice): number {
  const chars =
    (request.cachedPrefix?.length ?? 0) +
    request.system.length +
    request.user.length +
    ('history' in request && request.history ? JSON.stringify(request.history).length : 0) +
    ('format' in request ? JSON.stringify(request.format.schema).length : 0);
  const inputTokens = Math.ceil(chars / CHARS_PER_TOKEN_FLOOR);
  const outputTokens = request.maxTokens ?? DEFAULT_RESERVED_OUTPUT_TOKENS;
  const inputRate = Math.max(price.input, price.cacheWrite);
  return (inputTokens * inputRate + outputTokens * price.output) / 1_000_000;
}

/** A model call was refused because the Run's cap could not cover its worst case. */
export class RunCapError extends Error {
  constructor(
    public readonly capUsd: number,
    public readonly committedUsd: number,
    public readonly neededUsd: number,
  ) {
    super(
      `Run cost cap reached: $${committedUsd.toFixed(4)} of $${capUsd.toFixed(2)} committed, ` +
        `the next call may cost up to $${neededUsd.toFixed(4)}.`,
    );
  }
}

/** Money set aside for one call in flight. */
export interface Reservation {
  usd: number;
}

/**
 * What a Run has spent and may still spend. `spentUsd` starts from the spend
 * already metered for the Game, so a Run resumed in another process keeps its
 * cap.
 */
export class RunBudget {
  readonly capUsd: number;
  private spent: number;
  private reserved = 0;
  private refusal: RunCapError | null = null;

  constructor(options: { capUsd: number; spentUsd?: number }) {
    this.capUsd = options.capUsd;
    this.spent = options.spentUsd ?? 0;
  }

  /** Metered spend: calls that completed or were billed without usable output. */
  get spentUsd(): number {
    return this.spent;
  }

  /** Set aside for calls in flight or whose billing is unknown. */
  get reservedUsd(): number {
    return this.reserved;
  }

  /** Spent plus reserved: what the cap is checked against. */
  get committedUsd(): number {
    return this.spent + this.reserved;
  }

  /** The first refusal, once the cap has stopped a call; an Engine may have swallowed the throw. */
  get capError(): RunCapError | null {
    return this.refusal;
  }

  /** Set `usd` aside for a call about to be made, or throw: the call must not happen. */
  reserve(usd: number): Reservation {
    if (this.committedUsd + usd > this.capUsd) {
      const error = new RunCapError(this.capUsd, this.committedUsd, usd);
      this.refusal ??= error;
      throw error;
    }
    this.reserved += usd;
    return { usd };
  }

  /** The call was metered: its reservation becomes its real cost. */
  settle(reservation: Reservation, actualUsd: number): void {
    this.reserved -= reservation.usd;
    this.spent += actualUsd;
  }
}

/**
 * Wrap a provider so that every call reserves its worst case first. A call
 * that fails without reporting usage keeps its reservation: unknown billing
 * is never treated as free.
 * @category Utilities
 */
export function budgetedProvider(provider: AiProvider, budget: RunBudget, priceOf: PriceOf): AiProvider {
  async function guarded<T extends { usage: CallUsage }>(
    request: TextRequest | StructuredRequest,
    call: () => Promise<T>,
  ): Promise<T> {
    const price = priceOf(request.model);
    const reservation = budget.reserve(worstCaseCost(request, price));
    try {
      const result = await call();
      budget.settle(reservation, costOf(result.usage, price));
      return result;
    } catch (err) {
      if (err instanceof IncompleteOutputError) budget.settle(reservation, costOf(err.usage, price));
      throw err;
    }
  }

  return {
    id: provider.id,
    generateStructured: (request) => guarded(request, () => provider.generateStructured(request)),
    generateText: (request) => guarded(request, () => provider.generateText(request)),
  };
}
