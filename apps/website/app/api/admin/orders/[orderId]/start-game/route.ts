import { NextResponse } from 'next/server';
import {
  initialRuntimeState,
  openingLetters,
  resolveStartDate,
} from '@imbustai/story-engine';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { loadStoryConfig } from '@/lib/story-engine/load';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { orderId } = await params;
  const admin = createAdminClient();

  const { data: order, error: oErr } = await admin
    .from('orders')
    .select('id,user_id,story_id,status')
    .eq('id', orderId)
    .single();

  if (oErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status !== 'paid') {
    return NextResponse.json(
      { error: 'Order must be paid before starting a game' },
      { status: 400 }
    );
  }

  const { data: existing } = await admin
    .from('games')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle();

  if (existing?.id) {
    return NextResponse.json({ gameId: existing.id, already: true });
  }

  const loaded = await loadStoryConfig(admin, order.story_id);
  if (!loaded) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
  const { story } = loaded;

  // In-fiction start (fixed date or the real date the game starts) and the
  // per-character opening letters; legacy single first_letter as fallback.
  const today = new Date().toISOString().slice(0, 10);
  const startDate = resolveStartDate(story, today);
  const runtimeState = initialRuntimeState(story, today);
  let letters = openingLetters(story, startDate).map((l) => ({
    character_slug: l.character_slug as string | null,
    content: l.content,
    story_date: l.story_date,
  }));
  if (letters.length === 0) {
    letters = [
      {
        character_slug: null,
        content: story.first_letter.trim() || '…',
        story_date: startDate,
      },
    ];
  }

  const { data: game, error: gErr } = await admin
    .from('games')
    .insert({
      user_id: order.user_id,
      order_id: order.id,
      story_id: order.story_id,
      status: 'in_progress',
      runtime_state: runtimeState,
    })
    .select('id')
    .single();

  if (gErr || !game) {
    console.error(gErr);
    return NextResponse.json({ error: 'Could not create game' }, { status: 500 });
  }

  const { error: iErr } = await admin.from('interactions').insert(
    letters.map((letter, index) => ({
      game_id: game.id,
      role: 'ai' as const,
      content: letter.content,
      letter_number: index + 1,
      character_slug: letter.character_slug,
      story_date: letter.story_date,
    })),
  );

  if (iErr) {
    console.error(iErr);
    await admin.from('games').delete().eq('id', game.id);
    return NextResponse.json(
      { error: 'Could not create opening letters' },
      { status: 500 }
    );
  }

  return NextResponse.json({ gameId: game.id });
}
