import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { WorkflowError, hookContextFor, loadStory } from '@/lib/game-host';

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

  let loaded;
  try {
    loaded = await loadStory(admin, order.story_id);
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }
    throw err;
  }

  // The Engine gives the Game its first state and the opening envelope, which
  // is authored, so it is delivered without review.
  const gameId = randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const { state, opening } = await loaded.engine.startGame(
    hookContextFor(loaded, gameId, 0),
    { gameId, story: loaded.story, realStartDate: today },
  );
  const runtimeState = loaded.engine.schema.state.parse(state);

  const { data: game, error: gErr } = await admin
    .from('games')
    .insert({
      id: gameId,
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
    opening.map((letter, index) => ({
      game_id: game.id,
      role: 'ai' as const,
      content: letter.body,
      letter_number: index + 1,
      // An unsigned letter (no sender) is stored without a character.
      character_slug: letter.from || null,
      story_date: letter.storyDate,
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
