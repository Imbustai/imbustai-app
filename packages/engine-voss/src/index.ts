// @imbustai/engine-voss — plays the Voss story (Rome, 1987). The website
// plugs in `vossEngine`; the Story document's schema and the Plot-key
// collision check are exported for the seed and the writing pipeline.

export {
  vossEngine,
  vossEffectsSchema,
  vossStateSchema,
  VOSS_ENGINE_ID,
  type VossEffects,
  type VossState,
} from './engine';
export { initialState } from './mechanics/state';
export {
  playTurn,
  markShowpiece,
  type TurnPlan,
  type TurnInput,
  type VossPlan,
  type AdelaidePlan,
  type OfficePlan,
  type FixedText,
  type SignatureAllowance,
} from './mechanics/turn';
export { decideEnding, endingDetail, heldEvidence, verdict, type Verdict } from './mechanics/december';
export {
  signalsSchemas,
  signalsKindFor,
  vossSignalsSchema,
  adelaideSignalsSchema,
  authoritySignalsSchema,
  otherSignalsSchema,
  type ReadLetter,
  type VossSignals,
  type AdelaideSignals,
  type AuthoritySignals,
  type OtherSignals,
  type ClueReading,
  type LadderArgument,
} from './mechanics/signals';
export {
  vossStorySchema,
  STORY_SCHEMA_VERSION,
  type VossStory,
  type VossCorrespondent,
  type VossDocument,
} from './schema';
export { reservedTermsIn, type ReservedHit } from './reserved';
