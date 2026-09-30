import type { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Turns an Engine's zod schema into the strict JSON schema both providers
// accept for structured output (Claude `output_config.format`, OpenAI
// `text.format` with `strict: true`): every object closed, every property
// required, optional properties made nullable, and no numeric, length or
// array-size constraints — zod still enforces those after parsing.
// See the research in Imbustai/imbustai-app#17.

export type JsonSchema = Record<string, unknown>;

/** Keywords neither provider accepts in strict mode; zod checks them on the way back. */
const DROPPED_KEYWORDS = [
  '$schema',
  'default',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'minLength',
  'maxLength',
  'pattern',
  'format',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
];

export class UnsupportedSchemaError extends Error {}

export function strictJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  const raw = zodToJsonSchema(schema, { $refStrategy: 'none', target: 'jsonSchema7' }) as JsonSchema;
  const root = strictify(raw, '$');
  if (root.type !== 'object') {
    throw new UnsupportedSchemaError('structured output must be a JSON object at the top level');
  }
  return root;
}

function strictify(node: JsonSchema, path: string): JsonSchema {
  const out: JsonSchema = {};
  for (const [key, value] of Object.entries(node)) {
    if (!DROPPED_KEYWORDS.includes(key)) out[key] = value;
  }

  if (Array.isArray(out.type)) {
    // ["string", "null"] → anyOf, which both providers document.
    const types = out.type as string[];
    delete out.type;
    const rest = out;
    return { anyOf: types.map((type) => strictify({ ...rest, type }, path)) };
  }
  for (const key of ['anyOf', 'oneOf', 'allOf'] as const) {
    if (Array.isArray(out[key])) {
      out[key] = (out[key] as JsonSchema[]).map((sub, i) => strictify(sub, `${path}.${key}[${i}]`));
    }
  }
  if (out.oneOf) {
    out.anyOf = out.oneOf;
    delete out.oneOf;
  }

  if (out.type === 'array') {
    if (!out.items || typeof out.items !== 'object' || Array.isArray(out.items)) {
      throw new UnsupportedSchemaError(`${path}: arrays need a single item schema`);
    }
    out.items = strictify(out.items as JsonSchema, `${path}[]`);
  }

  if (out.type === 'object') {
    const properties = (out.properties ?? {}) as Record<string, JsonSchema>;
    if (out.additionalProperties && out.additionalProperties !== false) {
      throw new UnsupportedSchemaError(`${path}: open objects (z.record, passthrough) have no strict JSON schema`);
    }
    const required = new Set((out.required as string[] | undefined) ?? []);
    const strictProps: Record<string, JsonSchema> = {};
    for (const [name, prop] of Object.entries(properties)) {
      const strict = strictify(prop, `${path}.${name}`);
      strictProps[name] = required.has(name) ? strict : nullable(strict);
    }
    out.properties = strictProps;
    out.required = Object.keys(strictProps);
    out.additionalProperties = false;
  }

  if (!('type' in out) && !out.anyOf && !out.enum && !('const' in out)) {
    throw new UnsupportedSchemaError(`${path}: z.unknown()/z.any() have no strict JSON schema`);
  }
  return out;
}

function nullable(schema: JsonSchema): JsonSchema {
  if (Array.isArray(schema.anyOf)) {
    const options = schema.anyOf as JsonSchema[];
    return options.some((o) => o.type === 'null') ? schema : { ...schema, anyOf: [...options, { type: 'null' }] };
  }
  return { anyOf: [schema, { type: 'null' }] };
}

/**
 * The strict schema sends `null` for a property the model leaves out. Remove
 * those nulls where zod expects "absent" (optional or defaulted fields), so
 * `.optional()` accepts them and `.default()` fills in.
 */
export function dropNullsForOptional(schema: z.ZodTypeAny, value: unknown): unknown {
  const def = schema._def as { typeName?: string } & Record<string, unknown>;
  switch (def.typeName) {
    case 'ZodOptional':
    case 'ZodDefault': {
      const inner = def.innerType as z.ZodTypeAny;
      if (value === null && !inner.safeParse(null).success) return undefined;
      return dropNullsForOptional(inner, value);
    }
    case 'ZodNullable':
      return value === null ? null : dropNullsForOptional(def.innerType as z.ZodTypeAny, value);
    case 'ZodEffects':
      return dropNullsForOptional(def.schema as z.ZodTypeAny, value);
    case 'ZodArray':
      return Array.isArray(value) ? value.map((v) => dropNullsForOptional(def.type as z.ZodTypeAny, v)) : value;
    case 'ZodObject': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
      const shape = (schema as z.AnyZodObject).shape as Record<string, z.ZodTypeAny>;
      const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
      for (const [key, field] of Object.entries(shape)) {
        if (!(key in out)) continue;
        const restored = dropNullsForOptional(field, out[key]);
        if (restored === undefined) delete out[key];
        else out[key] = restored;
      }
      return out;
    }
    default:
      return value;
  }
}
