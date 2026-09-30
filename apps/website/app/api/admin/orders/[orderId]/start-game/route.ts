import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { modelProfilePatchSchema } from '@imbustai/story-runtime';
import { UnpricedModelError } from '@/lib/ai-pricing';
import { WorkflowError, hookSession, loadStory, modelProfileFor } from '@/lib/game-host';

// Body (optional): { model_profile?: ModelProfilePatch } — overrides the
// Story's default models for this Game only, role by role and per Character.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { orderId } = await params;
  const body = await request.json().catch(() => ({}));
  const override = modelProfilePatchSchema.safeParse(body?.model_profile ?? {});
  if (!override.success) {
    return NextResponse.json({ error: 'invalid_model_profile', issues: override.error.issues }, { status: 400 });
  }
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
  // The Game keeps the profile it starts with: later edits to the Story's
  // default never change a Game already running.
  const profile = modelProfileFor(loaded.row, null, override.data);
  const gameId = randomUUID();
  let session;
  try {
    session = await hookSession(admin, loaded, { gameId, turn: 0, hook: 'startGame', profile });
  } catch (err) {
    if (err instanceof UnpricedModelError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
  const today = new Date().toISOString().slice(0, 10);
  const { state, opening } = await loaded.engine.startGame(session.ctx, {
    gameId,
    story: loaded.story,
    realStartDate: today,
  });
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
      model_profile: profile,
    })
    .select('id')
    .single();

  if (gErr || !game) {
    console.error(gErr);
    return NextResponse.json({ error: 'Could not create game' }, { status: 500 });
  }
  await session.persist();

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
