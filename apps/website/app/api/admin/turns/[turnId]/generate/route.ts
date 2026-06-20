import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { generateDraft, WorkflowError } from '@/lib/reply-workflow';

// POST /api/admin/turns/[turnId]/generate — server-side Claude calls
// (orchestrator + scoped per-NPC), saves a new ai_drafts version.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ turnId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { turnId } = await params;
  try {
    const draft = await generateDraft(turnId);
    return NextResponse.json({ draftId: draft.id, version: draft.version });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
