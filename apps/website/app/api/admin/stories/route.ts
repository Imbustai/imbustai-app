import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { SLUG_RE } from '@/lib/story-editor/schemas';

// POST /api/admin/stories — create an empty draft story shell (story #2 proof:
// new stories are created entirely from the UI, no code changes).
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const slug = typeof body.slug === 'string' ? body.slug.trim() : '';
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : 'Untitled story';
  if (!SLUG_RE.test(slug)) {
    return NextResponse.json({ error: 'invalid_slug' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('stories')
    .insert({
      slug,
      title_en: title,
      title_it: title,
      description_en: '',
      description_it: '',
      price_cents: 0,
      is_published: false,
      lifecycle: 'draft',
      first_letter: '',
      settings: { max_letters_per_turn: 4 },
      time_config: { start_mode: 'fixed', story_start_date: new Date().toISOString().slice(0, 10) },
    })
    .select('id')
    .single();

  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'slug_taken' : error.message },
      { status },
    );
  }
  return NextResponse.json({ storyId: data.id });
}
