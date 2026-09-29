// @imbustai/engine-classic — the July planner→writer engine behind the Engine
// contract. The website plugs in `classicEngine`; the rest is exported for the
// simulation script and the admin story editor's types.

export { classicEngine, CLASSIC_ENGINE_ID, upgradeLegacyState } from './engine';
export { storyConfigSchema, runtimeStateSchema } from './schemas';
export * from './types';
export * from './schema/turnPlan';
export * from './schema/npcLetter';
export {
  factsForCharacter,
  gmOnlyFacts,
  correspondenceFor,
  buildNpcContext,
  buildOrchestratorContext,
} from './context/scopedContext';
export { orchestratorSystemPrompt, npcWriterSystemPrompt } from './prompts/templates';
export {
  resolveStoryDate,
  resolveBatchDates,
  advanceStoryDate,
  type LabelledRandom,
} from './time/storyDates';
export { validateDraft, hasErrors, type ValidateDraftInput } from './validator';
export { normalizeCharacterSlug } from './engine/normalize';
export { resolveStartDate, openingLetters, type OpeningLetter } from './engine/gameStart';
export {
  generateTurnBatch,
  sanitizePlan,
  applyGameStateUpdates,
  initialRuntimeState,
  actForTurn,
  type GenerateTurnInput,
  type TurnDraftBatch,
} from './engine/turnProcessor';
