import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import {
  STORY_RESOURCES,
  isStoryResource,
  validateCharacterRow,
} from '@/lib/story-editor/schemas';

// POST /api/admin/stories/[storyId]/{characters|facts|acts|clues|endings}
// Creates one row of an (optional) story module. Whitelisted tables only.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyId: string; resource: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { storyId, resource } = await params;
  if (!isStoryResource(resource)) {
    return NextResponse.json({ error: 'unknown_resource' }, { status: 404 });
  }
  const { table, schema } = STORY_RESOURCES[resource];

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (resource === 'characters') {
    const errors = validateCharacterRow(parsed.data as never);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors[0] }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .insert({ ...parsed.data, story_id: storyId })
    .select('id')
    .single();
  if (error) {
    const status = error.code === '23505' ? 409 : error.code === '23503' ? 404 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'key_taken' : error.message },
      { status },
    );
  }
  return NextResponse.json({ id: data.id });
}
