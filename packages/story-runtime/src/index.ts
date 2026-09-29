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

export { createAiAccess, type AiAccessOptions, type UsageRecord } from './ai/access';
export type {
  AiProvider,
  CallUsage,
  StructuredRequest,
  StructuredResult,
  StructuredToolDefinition,
  TextRequest,
  TextResult,
} from './ai/provider';
export { MockProvider, ZERO_USAGE } from './ai/provider';
export { ClaudeProvider, DEFAULT_MODEL } from './ai/claudeProvider';
export { createProvider, resolveProviderKind, type ProviderKind } from './ai/createProvider';
