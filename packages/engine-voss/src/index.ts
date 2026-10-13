// @imbustai/engine-voss — plays the Voss story (Rome, 1987). The website
// plugs in `vossEngine`; the Story document's schema and the Plot-key
// collision check are exported for the seed and the writing pipeline.

export { vossEngine, vossStateSchema, VOSS_ENGINE_ID, type VossState } from './engine';
export {
  vossStorySchema,
  STORY_SCHEMA_VERSION,
  type VossStory,
  type VossCorrespondent,
  type VossDocument,
} from './schema';
export { reservedTermsIn, type ReservedHit } from './reserved';
