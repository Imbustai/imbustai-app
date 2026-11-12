import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import { modelProfilePatchSchema } from '@imbustai/story-runtime';
import { UnpricedModelError } from '@/lib/ai-pricing';
import { WorkflowError, loadStory, modelProfileFor } from '@/lib/game-host';
import { createGame } from '@/lib/start-game';

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

  // The Game keeps the profile it starts with: later edits to the Story's
  // default never change a Game already running.
  const profile = modelProfileFor(loaded.row, null, override.data);
  try {
    const gameId = await createGame(admin, { order, loaded, profile });
    return NextResponse.json({ gameId });
  } catch (err) {
    if (err instanceof UnpricedModelError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    throw err;
  }
}
