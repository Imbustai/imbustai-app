import { NextResponse } from 'next/server';
import type { LetterEdit } from '@imbustai/story-runtime';
import { requireAdmin } from '@/lib/require-admin';
import { saveDraftEdits, WorkflowError } from '@/lib/reply-workflow';

// PATCH /api/admin/drafts/[draftId] — save the admin's inline edits as a new
// draft version (source='edited'); full history is preserved and the Engine's
// validateDraft re-runs on the edited letters. Body: { letters: [{ key, body }] }
// — only Letter bodies are editable.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ draftId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { draftId } = await params;
  const body = await request.json().catch(() => null);
  const letters = Array.isArray(body?.letters) ? (body.letters as LetterEdit[]) : null;
  if (
    !letters ||
    letters.some((l) => typeof l?.key !== 'string' || typeof l.body !== 'string' || !l.body.trim())
  ) {
    return NextResponse.json({ error: 'invalid_letters' }, { status: 400 });
  }

  try {
    const draft = await saveDraftEdits(draftId, {
      letters: letters.map((l) => ({ key: l.key, body: l.body })),
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
