/**
 * Idempotent Voss seed runner (Phase 1).
 *
 *   pnpm --filter @imbustai/story-engine seed:voss
 *
 * Requires the story-engine migration to be applied first. Reads
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from the environment,
 * falling back to apps/website/.env. Upserts are keyed on (story_id, slug/key)
 * so re-running is safe and editor changes to OTHER rows are preserved.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { VOSS_STORY } from './voss';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadWebsiteEnv(): Record<string, string> {
  const envPath = resolve(__dirname, '../../../apps/website/.env');
  const vars: Record<string, string> = {};
  try {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) vars[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // fine — rely on process.env
  }
  return vars;
}

async function main() {
  const fileEnv = loadWebsiteEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (env or apps/website/.env).');
  }
  const db = createClient(url, key, { auth: { persistSession: false } });

  // Story row: update the existing shop story with slug 'voss' if present,
  // otherwise create it (unpublished — pricing/publishing stays an admin task).
  const { data: existing, error: findErr } = await db
    .from('stories')
    .select('id')
    .eq('slug', VOSS_STORY.slug)
    .maybeSingle();
  if (findErr) throw findErr;

  const storyPatch = {
    first_letter: VOSS_STORY.first_letter,
    settings: VOSS_STORY.settings,
    time_config: VOSS_STORY.time_config,
    allow_dynamic_npcs: VOSS_STORY.allow_dynamic_npcs,
    lifecycle: VOSS_STORY.lifecycle,
  };

  let storyId: string;
  if (existing) {
    storyId = existing.id;
    const { error } = await db.from('stories').update(storyPatch).eq('id', storyId);
    if (error) throw error;
    console.log(`Updated existing story ${VOSS_STORY.slug} (${storyId})`);
  } else {
    const { data, error } = await db
      .from('stories')
      .insert({
        slug: VOSS_STORY.slug,
        title_en: VOSS_STORY.title,
        title_it: VOSS_STORY.title,
        description_en: 'Interactive epistolary detective mystery.',
        description_it: 'Giallo epistolare interattivo.',
        price_cents: 0,
        is_published: false,
        ...storyPatch,
      })
      .select('id')
      .single();
    if (error) throw error;
    storyId = data.id;
    console.log(`Created story ${VOSS_STORY.slug} (${storyId})`);
  }

  async function upsert(table: string, rows: Record<string, unknown>[], conflict: string) {
    if (rows.length === 0) return;
    const { error } = await db
      .from(table)
      .upsert(rows.map((r) => ({ ...r, story_id: storyId })), { onConflict: `story_id,${conflict}` });
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`Upserted ${rows.length} rows into ${table}`);
  }

  await upsert(
    'story_characters',
    VOSS_STORY.characters.map((c) => ({ ...c })),
    'slug',
  );
  await upsert(
    'story_acts',
    VOSS_STORY.acts.map((a) => ({ ...a })),
    'act_number',
  );
  await upsert(
    'story_facts',
    VOSS_STORY.facts.map((f) => ({ ...f })),
    'fact_key',
  );
  await upsert(
    'story_clues',
    VOSS_STORY.clues.map((c) => ({ ...c })),
    'clue_key',
  );
  await upsert(
    'story_endings',
    VOSS_STORY.endings.map((e) => ({ ...e })),
    'ending_key',
  );

  console.log('Voss seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
