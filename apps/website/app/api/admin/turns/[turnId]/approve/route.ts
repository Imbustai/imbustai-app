import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { approveDraft, WorkflowError } from '@/lib/reply-workflow';

// POST /api/admin/turns/[turnId]/approve — body { draft_id }. The only path
// that writes AI interactions: dates via TimeService, visible_from via story
// config, runtime_state update, turn → sent.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ turnId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { turnId } = await params;
  const body = await request.json().catch(() => ({}));
  if (typeof body.draft_id !== 'string' || !body.draft_id) {
    return NextResponse.json({ error: 'draft_id_required' }, { status: 400 });
  }
  try {
    await approveDraft(turnId, body.draft_id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'approve_failed' }, { status: 500 });
  }
}
