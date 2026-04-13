import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import type { StoryRow } from '@/lib/types/db';

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

  const { data: story, error: sErr } = await admin
    .from('stories')
    .select('*')
    .eq('id', order.story_id)
    .single();

  if (sErr || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const st = story as StoryRow;
  const firstLetter = st.first_letter?.trim() || '…';

  const { data: game, error: gErr } = await admin
    .from('games')
    .insert({
      user_id: order.user_id,
      order_id: order.id,
      story_id: order.story_id,
      status: 'in_progress',
    })
    .select('id')
    .single();

  if (gErr || !game) {
    console.error(gErr);
    return NextResponse.json({ error: 'Could not create game' }, { status: 500 });
  }

  const { error: iErr } = await admin.from('interactions').insert({
    game_id: game.id,
    role: 'ai',
    content: firstLetter,
    letter_number: 1,
  });

  if (iErr) {
    console.error(iErr);
    await admin.from('games').delete().eq('id', game.id);
    return NextResponse.json(
      { error: 'Could not create first letter' },
      { status: 500 }
    );
  }

  return NextResponse.json({ gameId: game.id });
}
