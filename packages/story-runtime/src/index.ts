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
  MockHandler,
  ModelRequest,
  CallUsage,
  ProviderId,
  StructuredRequest,
  StructuredResult,
  TextRequest,
  TextResult,
} from './ai/provider';
export { IncompleteOutputError, MockProvider, ZERO_USAGE } from './ai/provider';
export { ClaudeProvider, type ClaudeProviderOptions } from './ai/claudeProvider';
export { OpenAiProvider, type OpenAiProviderOptions } from './ai/openAiProvider';
export { createProviders, isProviderId, PROVIDER_IDS } from './ai/createProvider';

// Shared writing tools any Engine may use: the reader, the Plot-key collision
// check, the reply-rule checker with its one rewrite, the editing pass and the
// Ledger ("Reader, reply-rule checker and Ledger as runtime utilities",
// Imbustai/imbustai-app#30).
export {
  readPlayerLetter,
  renderReaderNotes,
  type ReadInput,
  type ReaderNotes,
  type ReaderResult,
} from './writing/reader';
export {
  findPlotKeyCollisions,
  reservedTermSchema,
  type CollisionCheck,
  type PlotKeyCollision,
  type ReservedTerm,
} from './writing/plotKeys';
export {
  checkLetter,
  COLLISION_RULE,
  DOORS_RULE,
  MAX_CHECK_ISSUES,
  type CheckInput,
  type CheckIssue,
  type LetterCheck,
  type QuestionAnswered,
} from './writing/checker';
export { editLetter, hasEditingPass, type EditInput } from './writing/editor';
export { composeLetter, type ComposedLetter, type ComposeInput } from './writing/compose';
export {
  ledgerFor,
  ledgerFromReader,
  ledgerSchema,
  recordTexture,
  renderLedger,
  type Ledger,
  type LedgerEntry,
  type TextureInput,
} from './writing/ledger';
