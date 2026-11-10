import { NextResponse } from 'next/server';
import { PERSONAS, modelProfilePatchSchema, type PersonaKey } from '@imbustai/story-runtime';
import { UnpricedModelError } from '@/lib/ai-pricing';
import { requireAdmin } from '@/lib/require-admin';
import { RunPreflightError, WorkflowError, startRun } from '@/lib/runs';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/runs — start a Run: a QA Game an AI player plays under a
// cost cap. Body: { story_id, persona, cap_usd?, max_turns?, model_profile? }.
// Nothing is played here; the Game is played Turn by Turn through
// /api/admin/runs/[gameId]/step. A Run whose estimate does not fit under its
// cap is refused with the estimate, and nothing is created or spent.
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => ({}));
  const profile = modelProfilePatchSchema.safeParse(body?.model_profile ?? {});
  if (!profile.success) {
    return NextResponse.json({ error: 'invalid_model_profile', issues: profile.error.issues }, { status: 400 });
  }
  if (typeof body?.story_id !== 'string' || !(String(body?.persona) in PERSONAS)) {
    return NextResponse.json({ error: 'story_id_and_persona_required' }, { status: 400 });
  }
  const positive = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : undefined;

  try {
    const { gameId, estimate } = await startRun(createAdminClient(), {
      storyId: body.story_id,
      userId: gate.user.id,
      persona: body.persona as PersonaKey,
      capUsd: positive(body.cap_usd),
      maxTurns: positive(body.max_turns) && Math.floor(body.max_turns),
      modelProfile: profile.data,
    });
    return NextResponse.json({ gameId, estimate });
  } catch (err) {
    if (err instanceof RunPreflightError) {
      return NextResponse.json({ error: err.message, estimate: err.estimate }, { status: 400 });
    }
    if (err instanceof UnpricedModelError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'run_start_failed' }, { status: 500 });
  }
}
