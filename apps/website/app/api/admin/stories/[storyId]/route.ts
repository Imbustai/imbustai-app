import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { storyPatchSchema } from '@/lib/story-editor/schemas';
import type { StoryCharacterRow, StoryRow } from '@/lib/types/db';

// PATCH /api/admin/stories/[storyId] — story metadata, settings, time config,
// lifecycle. Enforces the publish rules: only released stories can be
// published, and a publishable story needs a playable starting setup.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ storyId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { storyId } = await params;
  const parsed = storyPatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_payload', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const patch = parsed.data;
  if (
    patch.time_config?.visible_delay &&
    patch.time_config.visible_delay.max_minutes < patch.time_config.visible_delay.min_minutes
  ) {
    return NextResponse.json({ error: 'visible_delay_max_lt_min' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing, error: sErr } = await admin
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();
  if (sErr || !existing) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const story = existing as StoryRow;

  const lifecycle = patch.lifecycle ?? story.lifecycle;
  let isPublished = patch.is_published ?? story.is_published;

  // Only released stories may be listed in the shop.
  if (lifecycle !== 'released' && isPublished) {
    if (patch.is_published === true) {
      return NextResponse.json({ error: 'publish_requires_released' }, { status: 400 });
    }
    isPublished = false; // lifecycle moved back → auto-unpublish
  }

  if (isPublished && !story.is_published) {
    // Publishing now: the story must be playable from the start.
    const { data: chars } = await admin
      .from('story_characters')
      .select('contactable_from_start,opening_letter')
      .eq('story_id', storyId);
    const characters = (chars ?? []) as Pick<
      StoryCharacterRow,
      'contactable_from_start' | 'opening_letter'
    >[];
    const hasContact = characters.some((c) => c.contactable_from_start);
    const hasOpening =
      characters.some((c) => c.opening_letter.trim() !== '') ||
      (patch.first_letter ?? story.first_letter).trim() !== '';
    if (!hasContact || !hasOpening) {
      return NextResponse.json(
        { error: !hasContact ? 'publish_needs_contactable_character' : 'publish_needs_opening_letter' },
        { status: 400 },
      );
    }
  }

  const { error } = await admin
    .from('stories')
    .update({ ...patch, lifecycle, is_published: isPublished })
    .eq('id', storyId);
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json(
      { error: status === 409 ? 'slug_taken' : error.message },
      { status },
    );
  }
  return NextResponse.json({ ok: true });
}
