import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { saveDraftEdits, WorkflowError } from '@/lib/reply-workflow';
import type { BatchLetter } from '@imbustai/story-engine';

// PATCH /api/admin/drafts/[draftId] — save the admin's inline edits as a new
// draft version (source='edited'); full history is preserved and the canon
// validator re-runs on the edited letters.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { draftId } = await params;
  const body = await request.json().catch(() => null);
  const responses = Array.isArray(body?.responses) ? (body.responses as BatchLetter[]) : null;
  if (!responses || responses.some((r) => !r.character_slug || !r.content?.trim())) {
    return NextResponse.json({ error: 'invalid_responses' }, { status: 400 });
  }

  try {
    const draft = await saveDraftEdits(draftId, {
      responses,
      narrator_notes: typeof body.narrator_notes === 'string' ? body.narrator_notes : undefined,
    });
    return NextResponse.json({ draftId: draft.id, version: draft.version });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'edit_failed' }, { status: 500 });
  }
}
