import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateQdpxForGames } from '@/lib/atlasti';
import type { GameInput, InteractionInput, LetterRole } from '@/lib/atlasti';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_GAMES = 10;
const CONCURRENCY = 2;

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user || user.app_metadata?.role !== 'admin') {
    return null;
  }
  return user;
}

export async function POST(request: Request) {
  const user = await requireAdmin();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { gameIds?: unknown };
  try {
    body = (await request.json()) as { gameIds?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.gameIds) || body.gameIds.length === 0) {
    return NextResponse.json(
      { error: 'gameIds must be a non-empty array' },
      { status: 400 }
    );
  }
  if (body.gameIds.length > MAX_GAMES) {
    return NextResponse.json(
      { error: `At most ${MAX_GAMES} games per export. Received ${body.gameIds.length}.` },
      { status: 400 }
    );
  }
  if (body.gameIds.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'gameIds must be strings' }, { status: 400 });
  }
  const gameIds = body.gameIds as string[];

  const supabase = createAdminClient();

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, user_id, status, created_at, completed_at')
    .in('id', gameIds);

  if (gamesError) {
    return NextResponse.json(
      { error: `Failed to load games: ${gamesError.message}` },
      { status: 500 }
    );
  }
  if (!games || games.length === 0) {
    return NextResponse.json({ error: 'No matching games found' }, { status: 404 });
  }

  const completed = games.filter((g) => g.status === 'completed');
  if (completed.length === 0) {
    return NextResponse.json(
      { error: 'No completed games among the selection' },
      { status: 400 }
    );
  }

  const completedIds = completed.map((g) => g.id);
  const { data: interactions, error: intError } = await supabase
    .from('interactions')
    .select('game_id, role, content, letter_number, created_at')
    .in('game_id', completedIds)
    .order('letter_number', { ascending: true })
    .order('created_at', { ascending: true });

  if (intError) {
    return NextResponse.json(
      { error: `Failed to load interactions: ${intError.message}` },
      { status: 500 }
    );
  }

  const interactionsByGame = new Map<string, InteractionInput[]>();
  for (const i of interactions ?? []) {
    const role: LetterRole = i.role === 'ai' ? 'ai' : 'user';
    const list = interactionsByGame.get(i.game_id) ?? [];
    list.push({
      role,
      content: i.content as string,
      letter_number: i.letter_number as number,
      created_at: i.created_at as string,
    });
    interactionsByGame.set(i.game_id, list);
  }

  const { data: usersData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailById = new Map<string, string>();
  for (const u of usersData?.users ?? []) {
    if (u.email) emailById.set(u.id, u.email);
  }

  const gameInputs: GameInput[] = completed.map((g) => ({
    id: g.id as string,
    userEmail: emailById.get(g.user_id as string) ?? 'unknown',
    createdAt: g.created_at as string,
    completedAt: (g.completed_at as string | null) ?? null,
    interactions: interactionsByGame.get(g.id as string) ?? [],
  }));

  // Skip games with zero interactions to avoid an empty document.
  const usable = gameInputs.filter((g) => g.interactions.length > 0);
  if (usable.length === 0) {
    return NextResponse.json(
      { error: 'No interactions found for the selected games' },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await generateQdpxForGames(usable, {
      concurrency: CONCURRENCY,
      maxGames: MAX_GAMES,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to generate qdpx: ${message}` },
      { status: 500 }
    );
  }

  if (result.summary.some((s) => s.error)) {
    console.warn('[atlasti-export] Some games encountered errors during Claude coding:', result.summary);
  }

  return new Response(new Uint8Array(result.buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'Cache-Control': 'no-store',
      'X-Atlasti-Export-Summary': encodeURIComponent(
        JSON.stringify(
          result.summary.map((s) => ({
            gameId: s.gameId,
            claudeCodings: s.claudeCodings,
            newCodes: s.newCodes,
            error: s.error,
          }))
        )
      ),
    },
  });
}
