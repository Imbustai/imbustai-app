import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildVossStory } from '../../../../../packages/engine-voss/seed/story';
import { engineEntryFor } from '@/lib/engines';
import type { StoryRow } from '@/lib/types/db';
import { FakeSupabase } from '../../__tests__/fake-supabase';

const row = { id: 's1', slug: 'voss-roma-1987', engine: 'engine-voss' } as StoryRow;

function dbWith(documents: Record<string, unknown>[]) {
  const db = new FakeSupabase();
  db.table('story_engine_data').push(...documents);
  return db as unknown as SupabaseClient;
}

describe('the website plays engine-voss', () => {
  it('loads a Voss Story from its Story document and validates it', async () => {
    const entry = engineEntryFor('engine-voss');
    const db = dbWith([{ story_id: 's1', engine: 'engine-voss', schema_version: 1, data: buildVossStory() }]);
    const story = entry.engine.schema.data.parse(await entry.loadStory(db, row)) as {
      opening: { letter: { from: string } };
    };
    expect(story.opening.letter.from).toBe('voss');
  });

  it('refuses a Voss Story that was never seeded', async () => {
    const entry = engineEntryFor('engine-voss');
    await expect(entry.loadStory(dbWith([]), row)).rejects.toThrow(/no engine-voss Story document/);
  });

  it('refuses a document written by another Engine', async () => {
    const entry = engineEntryFor('engine-voss');
    const db = dbWith([{ story_id: 's1', engine: 'engine-classic', schema_version: 1, data: {} }]);
    await expect(entry.loadStory(db, row)).rejects.toThrow(/no engine-voss Story document/);
  });
});
