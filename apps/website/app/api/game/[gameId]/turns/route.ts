import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { submitPlayerTurn, WorkflowError } from '@/lib/reply-workflow';

// POST /api/game/[gameId]/turns — the player submits a turn (1+ letters).
// Inserts the turn + user interactions only; NEVER inserts AI rows directly.
// Released stories continue server-side through the shared pipeline
// (generate → validate → maybe auto-approve). Admins may also submit, as the
// Phase 3 test harness for games they don't own.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gameId } = await params;
  const admin = createAdminClient();
  const { data: game } = await admin
    .from('games')
    .select('user_id')
    .eq('id', gameId)
    .single();
  if (!game) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (game.user_id !== user.id && !(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const letters = Array.isArray(body?.letters)
    ? body.letters
        .filter(
          (l: unknown): l is { recipient_slug: string; content: string } =>
            !!l &&
            typeof (l as { recipient_slug?: unknown }).recipient_slug === 'string' &&
            typeof (l as { content?: unknown }).content === 'string',
        )
        .map((l: { recipient_slug: string; content: string }) => ({
          recipient_slug: l.recipient_slug,
          content: l.content,
        }))
    : [];

  try {
    const result = await submitPlayerTurn(gameId, letters);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
