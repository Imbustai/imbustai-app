/**
 * Syncs the Voss Story to a database: validates the Story document, then
 * upserts the stories row (engine-voss, testing, unpublished) and its
 * story_engine_data document. Idempotent; keyed on the slug.
 *
 *   pnpm --filter @imbustai/engine-voss seed
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
 * environment, falling back to apps/website/.env (the dev database).
 * Needs the story_engine_data migration applied first.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { modelProfilePatchSchema } from '@imbustai/story-runtime';
import { STORY_SCHEMA_VERSION, vossStorySchema } from '../src/schema';
import { VOSS_ENGINE_ID } from '../src/engine';
import { buildVossStory } from './story';

const here = dirname(fileURLToPath(import.meta.url));

/** The final title is still open (Imbustai/imbustai-app#34): a plain working name meanwhile. */
const STORY_ROW = {
  slug: 'voss-roma-1987',
  title_it: 'Voss — Roma, 1987',
  title_en: 'Voss — Rome, 1987',
  description_it: 'Giallo epistolare. Roma, 1987: un agente scrive al suo vecchio commissario, esiliato su un\'isola.',
  description_en: 'An epistolary mystery. Rome, 1987: a policeman writes to his old inspector, exiled to an island.',
  price_cents: 0,
  is_published: false,
  lifecycle: 'testing',
  engine: VOSS_ENGINE_ID,
  settings: { max_letters_per_turn: 3, max_turns: 8, locale: 'it' },
  time_config: { date_locale: 'it-IT' },
  // Voss's checker on the stronger model (#25, #29); every other role keeps the platform default.
  model_profile: modelProfilePatchSchema.parse({
    characters: { voss: { analyst: { model: 'claude-opus-5-5', effort: 'high' } } },
  }),
};

function websiteEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  try {
    for (const line of readFileSync(resolve(here, '../../../apps/website/.env'), 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // rely on process.env
  }
  return vars;
}

async function main() {
  const story = vossStorySchema.parse(buildVossStory());

  const env = websiteEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env or apps/website/.env).');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: row, error: rowError } = await db
    .from('stories')
    .upsert(STORY_ROW, { onConflict: 'slug' })
    .select('id')
    .single();
  if (rowError) throw new Error(`stories: ${rowError.message}`);

  const { error: docError } = await db.from('story_engine_data').upsert(
    { story_id: row.id, engine: VOSS_ENGINE_ID, schema_version: STORY_SCHEMA_VERSION, data: story },
    { onConflict: 'story_id' },
  );
  if (docError) throw new Error(`story_engine_data: ${docError.message}`);

  console.log(
    `Synced ${STORY_ROW.slug} (${row.id}): ${story.correspondents.length} correspondents, ` +
      `${story.documents.length} documents, ${story.clues.length} clues, ${story.evidence.length} pieces of evidence.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
