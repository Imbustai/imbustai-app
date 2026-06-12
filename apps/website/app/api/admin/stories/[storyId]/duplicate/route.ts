import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { STORY_RESOURCES } from '@/lib/story-editor/schemas';

// POST /api/admin/stories/[storyId]/duplicate — deep copy (story + all module
// rows) as a new draft. Decision R3: writers iterate on a copy instead of
// editing a story with games in progress.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { storyId } = await params;
  const admin = createAdminClient();

  const { data: story, error: sErr } = await admin
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
  if (sErr || !story) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  // Find a free slug: <slug>_copy, <slug>_copy_2, ...
  const { data: slugRows } = await admin
    .from('stories')
    .select('slug')
    .like('slug', `${story.slug}_copy%`);
  const taken = new Set((slugRows ?? []).map((r) => r.slug));
  let newSlug = `${story.slug}_copy`;
  for (let n = 2; taken.has(newSlug); n++) newSlug = `${story.slug}_copy_${n}`;

  const { id: _id, created_at: _c, updated_at: _u, ...storyFields } = story;
  const { data: copy, error: cErr } = await admin
    .from('stories')
    .insert({
      ...storyFields,
      slug: newSlug,
      title_en: `${story.title_en} (copy)`,
      title_it: `${story.title_it} (copia)`,
      is_published: false,
      lifecycle: 'draft',
    })
    .select('id')
    .single();
  if (cErr || !copy) {
    return NextResponse.json({ error: cErr?.message ?? 'copy_failed' }, { status: 500 });
  }

  for (const { table } of Object.values(STORY_RESOURCES)) {
    const { data: rows, error } = await admin.from(table).select('*').eq('story_id', storyId);
    if (error) {
      await admin.from('stories').delete().eq('id', copy.id);
      return NextResponse.json({ error: `${table}: ${error.message}` }, { status: 500 });
    }
    if (!rows || rows.length === 0) continue;
    const clones = rows.map(({ id: _rid, created_at: _rc, updated_at: _ru, ...rest }) => ({
      ...rest,
      story_id: copy.id,
    }));
    const { error: insErr } = await admin.from(table).insert(clones);
    if (insErr) {
      await admin.from('stories').delete().eq('id', copy.id); // cascades to copied rows
      return NextResponse.json({ error: `${table}: ${insErr.message}` }, { status: 500 });
    }
  }

  return NextResponse.json({ storyId: copy.id, slug: newSlug });
}
