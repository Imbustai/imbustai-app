import type { SupabaseClient } from '@supabase/supabase-js';
import type { Engine } from '@imbustai/story-runtime';
import type { StoryRow } from '@/lib/types/db';
import { classicEntry } from './classic';
import { vossEntry } from './voss';

// The Engines this website can play, keyed by stories.engine. Each entry says
// where its Stories' data lives; the platform validates it with the Engine's
// schema before any Hook runs.

export interface EngineEntry {
  engine: Engine<unknown, unknown>;
  /** The Story's raw data, before `engine.schema.data` validates it. */
  loadStory(admin: SupabaseClient, row: StoryRow): Promise<unknown>;
  /** Raw games.runtime_state before `engine.schema.state`, for old Games. */
  readState?(raw: unknown, story: unknown): unknown;
}

const ENGINES: Record<string, EngineEntry> = {
  [classicEntry.engine.id]: classicEntry,
  [vossEntry.engine.id]: vossEntry,
};

export function engineEntryFor(engineId: string): EngineEntry {
  const entry = ENGINES[engineId];
  if (!entry) throw new Error(`Unknown engine "${engineId}"`);
  return entry;
}
