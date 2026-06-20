import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { STORY_RESOURCES, isStoryResource } from '@/lib/story-editor/schemas';

type RouteParams = { params: Promise<{ storyId: string; resource: string; rowId: string }> };

// PATCH/DELETE one row of a story module. Row must belong to the story.
export async function PATCH(request: Request, { params }: RouteParams) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { storyId, resource, rowId } = await params;
  if (!isStoryResource(resource)) {
    return NextResponse.json({ error: 'unknown_resource' }, { status: 404 });
  }
  const { table, schema } = STORY_RESOURCES[resource];

  const parsed = schema.partial().safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  if (resource === 'characters') {
    const patch = parsed.data as { reply_delay_min_days?: number; reply_delay_max_days?: number };
    if (
      patch.reply_delay_min_days != null &&
      patch.reply_delay_max_days != null &&
      patch.reply_delay_max_days < patch.reply_delay_min_days
    ) {
      return NextResponse.json({ error: 'delay_max_lt_min' }, { status: 400 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .update(parsed.data)
    .eq('id', rowId)
    .eq('story_id', storyId)
    .select('id');
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'key_taken' : error.message },
      { status },
    );
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { storyId, resource, rowId } = await params;
  if (!isStoryResource(resource)) {
    return NextResponse.json({ error: 'unknown_resource' }, { status: 404 });
  }
  const { table } = STORY_RESOURCES[resource];

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(table)
    .delete()
    .eq('id', rowId)
    .eq('story_id', storyId)
    .select('id');
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
