import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { generateDraft, WorkflowError } from '@/lib/reply-workflow';

// POST /api/admin/turns/[turnId]/regenerate — new draft version.
// Body: { character_slug?: string, admin_guidance?: string }
//  - character_slug: regenerate only that NPC letter, reusing the stored plan
//  - admin_guidance: free-text steer passed to the orchestrator
export async function POST(
  request: Request,
  { params }: { params: Promise<{ turnId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { turnId } = await params;
  const body = await request.json().catch(() => ({}));
  try {
    const draft = await generateDraft(turnId, {
      onlyCharacter:
        typeof body.character_slug === 'string' && body.character_slug
          ? body.character_slug
          : undefined,
      adminGuidance: typeof body.admin_guidance === 'string' ? body.admin_guidance : undefined,
    });
    return NextResponse.json({ draftId: draft.id, version: draft.version });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 });
  }
}
