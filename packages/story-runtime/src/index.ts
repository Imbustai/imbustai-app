// @imbustai/story-runtime — the host every Engine plugs into: the Engine
// contract, the hook context, the platform's review rules, AI providers and
// date utilities. Engines depend on this package, never the other way round.

export type * from './contract';

export { createHookContext, type HookContextInput } from './host/context';
export {
  applyLetterEdits,
  closingLetterKinds,
  contactsOf,
  reviewDraft,
  unknownSenders,
  UnknownEnclosureError,
  type EnclosureEdit,
  type LetterEdit,
} from './host/game';
export {
  canApprove,
  canGenerate,
  hasErrors,
  isOpen,
  shouldAutoSend,
  type StoryLifecycle,
  type TurnStatus,
} from './host/workflow';

export {
  addDays,
  daysBetween,
  dateTools,
  formatStoryDate,
  seededRandom,
} from './time/dates';
export { computeVisibleFrom, type VisibleFromConfig } from './time/visibleFrom';

export {
  createAiAccess,
  type AiAccessOptions,
  type CallOutcome,
  type UsageRecord,
} from './ai/access';
export {
  DEFAULT_MODEL_PROFILE,
  EFFORTS,
  PROFILE_ROLES,
  mergeModelProfile,
  modelProfilePatchSchema,
  modelProfileSchema,
  modelsOf,
  resolveModelChoice,
  type ModelChoice,
  type ModelProfile,
  type ModelProfilePatch,
  type ProfileRole,
} from './ai/profile';
export { strictJsonSchema, UnsupportedSchemaError, type JsonSchema } from './ai/jsonSchema';
export type {
  AiProvider,
  CallUsage,
  ProviderId,
  StructuredRequest,
  StructuredResult,
  TextRequest,
  TextResult,
} from './ai/provider';
export { IncompleteOutputError, MockProvider, ZERO_USAGE } from './ai/provider';
export { ClaudeProvider } from './ai/claudeProvider';
export { OpenAiProvider } from './ai/openAiProvider';
export { createProviders, isProviderId, PROVIDER_IDS } from './ai/createProvider';
