import { vossEngine } from '@imbustai/engine-voss';
import type { StoryEngineDataRow } from '@/lib/types/db';
import type { EngineEntry } from './index';

// engine-voss keeps its whole Story document in story_engine_data (admin-only:
// it holds the solution), synced from the package's seed
// (`pnpm --filter @imbustai/engine-voss seed`).

export const vossEntry: EngineEntry = {
  engine: vossEngine as EngineEntry['engine'],
  async loadStory(admin, row) {
    const { data, error } = await admin
      .from('story_engine_data')
      .select('*')
      .eq('story_id', row.id)
      .eq('engine', vossEngine.id)
      .maybeSingle();
    if (error) throw new Error(`story_engine_data: ${error.message}`);
    if (!data) {
      throw new Error(`Story "${row.slug}" has no engine-voss Story document: run the engine-voss seed.`);
    }
    return (data as StoryEngineDataRow).data;
  },
};
