import { z } from 'zod';
import type { CharacterSlug, Effort, ModelRole } from '../contract';

// The model profile: which model (and effort) serves each role in a Game.
// Decided in "How are AI models chosen, costed and exercised by Runs?"
// (Imbustai/imbustai-app#14); see docs/adr/0002-per-game-model-profile.md.
//
// A Story stores a *patch* over the platform default; starting a Game merges
// the admin's (or a Run's) patch on top and snapshots the full profile on the
// Game, so later edits to the Story never change a Game already running.

/** Every role a profile maps. `player` serves Runs only; Engines never ask for it. */
export type ProfileRole = ModelRole | 'player';
/** All profile roles; player is reserved for Runs rather than Engine Hooks. */
export const PROFILE_ROLES = ['writer', 'clerk', 'analyst', 'player'] as const satisfies readonly ProfileRole[];

/** Accepted reasoning-effort settings; providers adapt them for the selected model. */
export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'] as const satisfies readonly Effort[];

/** Model identifier and optional reasoning effort for a role. */
export interface ModelChoice {
  /** A model id with a row in ai_model_pricing, which also names its provider. */
  model: string;
  /** Unset = the provider's default for that model. */
  effort?: Effort;
}

/** Complete per-Game role assignments with optional Character-specific overrides. */
export interface ModelProfile {
  roles: Record<ProfileRole, ModelChoice>;
  /**
   * One Character's roles on other models, e.g. Voss's checker on a stronger
   * model than the offices'. Applies to calls whose `character` is that slug.
   */
  characters?: Record<CharacterSlug, Partial<Record<ProfileRole, ModelChoice>>>;
}

/** What a Story stores, and what an admin or a Run passes when starting a Game. */
export interface ModelProfilePatch {
  roles?: Partial<Record<ProfileRole, ModelChoice>>;
  characters?: Record<CharacterSlug, Partial<Record<ProfileRole, ModelChoice>>>;
}

const modelChoiceSchema = z
  .object({ model: z.string().min(1), effort: z.enum(EFFORTS).optional() })
  .strict();
const roleMapSchema = z
  .object({
    writer: modelChoiceSchema.optional(),
    clerk: modelChoiceSchema.optional(),
    analyst: modelChoiceSchema.optional(),
    player: modelChoiceSchema.optional(),
  })
  .strict();

/** Validate a partial Story/admin/Run profile overlay, rejecting unknown keys. */
export const modelProfilePatchSchema: z.ZodType<ModelProfilePatch> = z
  .object({
    roles: roleMapSchema.optional(),
    characters: z.record(z.string().min(1), roleMapSchema).optional(),
  })
  .strict();

/** Validate a complete profile: every role is required, Character overrides are optional. */
export const modelProfileSchema: z.ZodType<ModelProfile> = z
  .object({
    roles: z
      .object({
        writer: modelChoiceSchema,
        clerk: modelChoiceSchema,
        analyst: modelChoiceSchema,
        player: modelChoiceSchema,
      })
      .strict(),
    characters: z.record(z.string().min(1), roleMapSchema).optional(),
  })
  .strict();

/**
 * The testing default (ADR 0002): Fable 5.1 writes at medium effort; offices
 * and the analyst run on Sonnet 5.5. The production default is picked later
 * by blind comparison.
 */
export const DEFAULT_MODEL_PROFILE: ModelProfile = {
  roles: {
    writer: { model: 'claude-fable-5-1', effort: 'medium' },
    clerk: { model: 'claude-sonnet-5-5', effort: 'low' },
    analyst: { model: 'claude-sonnet-5-5', effort: 'medium' },
    player: { model: 'claude-sonnet-5-5', effort: 'medium' },
  },
};

/** Layer patches over a base profile, later patches winning role by role. */
export function mergeModelProfile(base: ModelProfile, ...patches: (ModelProfilePatch | null | undefined)[]): ModelProfile {
  const roles = { ...base.roles };
  const characters: NonNullable<ModelProfile['characters']> = {};
  for (const [slug, map] of Object.entries(base.characters ?? {})) characters[slug] = { ...map };

  for (const patch of patches) {
    if (!patch) continue;
    for (const role of PROFILE_ROLES) {
      const choice = patch.roles?.[role];
      if (choice) roles[role] = choice;
    }
    for (const [slug, map] of Object.entries(patch.characters ?? {})) {
      characters[slug] = { ...characters[slug], ...map };
    }
  }
  return Object.keys(characters).length > 0 ? { roles, characters } : { roles };
}

/** The model a call runs on: the Character's override for the role, else the role's. */
export function resolveModelChoice(profile: ModelProfile, role: ProfileRole, character?: CharacterSlug): ModelChoice {
  return (character && profile.characters?.[character]?.[role]) || profile.roles[role];
}

/** Every model a profile can call, so each can be checked against the price table up front. */
export function modelsOf(profile: ModelProfile): string[] {
  const all = [
    ...Object.values(profile.roles),
    ...Object.values(profile.characters ?? {}).flatMap((map) => Object.values(map)),
  ].map((choice) => choice!.model);
  return [...new Set(all)];
}
