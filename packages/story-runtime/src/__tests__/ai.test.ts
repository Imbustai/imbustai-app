import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createAiAccess, type UsageRecord } from '../ai/access';
import { strictJsonSchema, UnsupportedSchemaError } from '../ai/jsonSchema';
import { toCallUsage } from '../ai/openAiProvider';
import {
  DEFAULT_MODEL_PROFILE,
  mergeModelProfile,
  modelProfilePatchSchema,
  modelsOf,
  resolveModelChoice,
} from '../ai/profile';
import { IncompleteOutputError, MockProvider, ZERO_USAGE, type AiProvider } from '../ai/provider';

// Voss's checker runs on a stronger model than the offices' (decided in
// "One real Voss Turn, end to end", Imbustai/imbustai-app#25).
const VOSS_PATCH = { characters: { voss: { analyst: { model: 'claude-opus-5-5', effort: 'high' as const } } } };

describe('model profiles', () => {
  it('gives one Character a stronger model for one role, and nobody else', () => {
    const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, VOSS_PATCH);
    expect(resolveModelChoice(profile, 'analyst', 'voss')).toEqual({ model: 'claude-opus-5-5', effort: 'high' });
    expect(resolveModelChoice(profile, 'analyst', 'mobile')).toEqual(DEFAULT_MODEL_PROFILE.roles.analyst);
    expect(resolveModelChoice(profile, 'writer', 'voss')).toEqual(DEFAULT_MODEL_PROFILE.roles.writer);
  });

  it('layers the Story default, then the start override, role by role', () => {
    const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, VOSS_PATCH, {
      roles: { writer: { model: 'gpt-6-astra', effort: 'medium' } },
      characters: { voss: { writer: { model: 'claude-opus-5-5' } } },
    });
    expect(profile.roles.writer.model).toBe('gpt-6-astra');
    expect(profile.roles.clerk).toEqual(DEFAULT_MODEL_PROFILE.roles.clerk);
    expect(profile.characters?.voss).toEqual({
      analyst: { model: 'claude-opus-5-5', effort: 'high' },
      writer: { model: 'claude-opus-5-5' },
    });
    expect(modelsOf(profile).sort()).toEqual(['claude-opus-5-5', 'claude-sonnet-5-5', 'gpt-6-astra']);
  });

  it('rejects unknown roles and efforts in a patch', () => {
    expect(modelProfilePatchSchema.safeParse({ roles: { narrator: { model: 'x' } } }).success).toBe(false);
    expect(modelProfilePatchSchema.safeParse({ roles: { writer: { model: 'x', effort: 'extreme' } } }).success).toBe(false);
    expect(modelProfilePatchSchema.safeParse(VOSS_PATCH).success).toBe(true);
  });
});

describe('strictJsonSchema', () => {
  it('closes objects, requires every property and makes optional ones nullable', () => {
    const schema = z.object({
      body: z.string().min(1),
      tone: z.string().optional(),
      clues: z.array(z.string()).default([]),
      meta: z.object({ n: z.number().int().positive() }).optional(),
    });
    expect(strictJsonSchema(schema)).toEqual({
      type: 'object',
      properties: {
        body: { type: 'string' },
        tone: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        clues: { anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] },
        meta: {
          anyOf: [
            { type: 'object', properties: { n: { type: 'integer' } }, required: ['n'], additionalProperties: false },
            { type: 'null' },
          ],
        },
      },
      required: ['body', 'tone', 'clues', 'meta'],
      additionalProperties: false,
    });
  });

  it('refuses shapes no strict schema can express', () => {
    expect(() => strictJsonSchema(z.object({ free: z.record(z.string()) }))).toThrow(UnsupportedSchemaError);
    expect(() => strictJsonSchema(z.object({ any: z.unknown() }))).toThrow(UnsupportedSchemaError);
  });
});

describe('createAiAccess', () => {
  const schema = z.object({ items: z.array(z.string()).min(2), tone: z.string().optional() });
  const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, VOSS_PATCH);

  it('routes by the profile, meters every attempt and retries what only zod checks', async () => {
    const outputs: unknown[] = [{ items: ['a'], tone: null }, { items: ['a', 'b'], tone: null }];
    const provider = new MockProvider(() => outputs.shift());
    const usage: UsageRecord[] = [];
    const ai = createAiAccess({ profile, providerFor: () => provider, turn: 4, onUsage: (u) => usage.push(u) });

    const result = await ai.structured('analyst', {
      purpose: 'check:voss',
      character: 'voss',
      cachedPrefix: 'rules',
      system: 's',
      user: 'u',
      schema,
    });

    expect(result).toEqual({ items: ['a', 'b'] });
    expect(provider.requests[0]).toMatchObject({
      model: 'claude-opus-5-5',
      effort: 'high',
      cachedPrefix: 'rules',
      format: { name: 'check_voss' },
    });
    expect(provider.requests[1].user).toContain('items: Array must contain at least 2');
    expect(usage.map((u) => [u.role, u.purpose, u.character, u.turn, u.attempt, u.outcome, u.model])).toEqual([
      ['analyst', 'check:voss', 'voss', 4, 1, 'invalid', 'claude-opus-5-5'],
      ['analyst', 'check:voss', 'voss', 4, 2, 'ok', 'claude-opus-5-5'],
    ]);
  });

  it('lets a request lower the effort without changing the model', async () => {
    const provider = new MockProvider(() => ({}), () => 'Caro Giacomo');
    const ai = createAiAccess({ profile, providerFor: () => provider, turn: 1 });
    await ai.text('writer', { purpose: 'edit:voss', character: 'voss', system: 's', user: 'u', effort: 'low' });
    expect(provider.textRequests[0]).toMatchObject({ model: 'claude-fable-5-1', effort: 'low' });
  });

  it('asks the platform for the provider of each model', async () => {
    const asked: string[] = [];
    const provider = new MockProvider(() => ({ items: ['a', 'b'] }));
    const ai = createAiAccess({
      profile: mergeModelProfile(profile, { roles: { clerk: { model: 'gpt-6-luna' } } }),
      providerFor: (model) => (asked.push(model), provider),
      turn: 1,
    });
    await ai.structured('clerk', { purpose: 'reply:mobile', character: 'mobile', system: 's', user: 'u', schema });
    expect(asked).toEqual(['gpt-6-luna']);
  });

  it('records a billed call that returned nothing usable, and does not retry it', async () => {
    const usage: UsageRecord[] = [];
    let calls = 0;
    const truncating: AiProvider = {
      id: 'mock',
      async generateStructured(request) {
        calls++;
        throw new IncompleteOutputError('max_tokens', { ...ZERO_USAGE('anthropic', request.model), output_tokens: 6000 });
      },
      async generateText() {
        throw new Error('unused');
      },
    };
    const ai = createAiAccess({ profile, providerFor: () => truncating, turn: 2, onUsage: (u) => usage.push(u) });
    await expect(
      ai.structured('writer', { purpose: 'reply:voss', character: 'voss', system: 's', user: 'u', schema }),
    ).rejects.toThrow(/max_tokens/);
    expect(calls).toBe(1);
    expect(usage).toMatchObject([{ attempt: 1, outcome: 'incomplete', output_tokens: 6000, model: 'claude-fable-5-1' }]);
  });

  it('gives up after the retries with the purpose in the error', async () => {
    const ai = createAiAccess({
      profile,
      providerFor: () => new MockProvider(() => ({ items: [] })),
      turn: 1,
      retries: 1,
    });
    await expect(ai.structured('writer', { purpose: 'orchestrator', system: 's', user: 'u', schema })).rejects.toThrow(
      /orchestrator parse failed after 2 attempts/,
    );
  });
});

describe('OpenAI usage accounting', () => {
  it('takes cache reads and writes out of input, which includes both', () => {
    expect(
      toCallUsage('gpt-6-sol', {
        input_tokens: 10_000,
        input_tokens_details: { cached_tokens: 6_000, cache_write_tokens: 3_000 },
        output_tokens: 2_000,
        output_tokens_details: { reasoning_tokens: 1_500 },
        total_tokens: 12_000,
      }),
    ).toEqual({
      provider: 'openai',
      model: 'gpt-6-sol',
      input_tokens: 1_000,
      output_tokens: 2_000,
      cache_creation_input_tokens: 3_000,
      cache_read_input_tokens: 6_000,
    });
  });
});
