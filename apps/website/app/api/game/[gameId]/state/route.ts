import { NextResponse } from 'next/server';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { WorkflowError, loadGameHost, playerStatus } from '@/lib/game-host';
import type { GameRow, InteractionTurnRow } from '@/lib/types/db';

// GET /api/game/[gameId]/state — player-safe game state: contacts from the
// Engine's cast (name and role only — no hidden agendas, no facts), in-fiction
// date, open turn status. Served via service role with explicit column selection
// because story tables are admin-only under RLS by design.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { gameId } = await params;
  const admin = createAdminClient();
  const { data: game } = await admin.from('games').select('*').eq('id', gameId).single();
  if (!game) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const g = game as GameRow;

  if (g.user_id !== user.id && !(await isCurrentUserAdmin())) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let status;
  try {
    status = playerStatus(await loadGameHost(admin, g));
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    throw err;
  }

  const [{ data: openTurn }, { data: inTransit }] = await Promise.all([
    admin
      .from('interaction_turns')
      .select('id,turn_number,status,user_submitted_at')
      .eq('game_id', gameId)
      .neq('status', 'sent')
      .maybeSingle(),
    // Approved letters still in (real-world) transit: count + next arrival.
    admin
      .from('interactions')
      .select('visible_from')
      .eq('game_id', gameId)
      .eq('role', 'ai')
      .gt('visible_from', new Date().toISOString())
      .order('visible_from', { ascending: true }),
  ]);

  const transit = (inTransit ?? []) as Array<{ visible_from: string }>;

  return NextResponse.json({
    game_status: g.status,
    story_date: status.storyDate,
    current_turn: status.currentTurn,
    max_letters_per_turn: status.maxLettersPerTurn,
    contacts: status.contacts,
    // No Hook reports locked contacts; engine-classic never had any once a
    // Game started (every contactable_from_start character is unlocked then).
    locked_count: 0,
    open_turn: openTurn
      ? {
          id: (openTurn as InteractionTurnRow).id,
          turn_number: (openTurn as InteractionTurnRow).turn_number,
          // Players see a single "awaiting reply" state — internal workflow
          // statuses (draft_ready etc.) are not exposed.
          awaiting_reply: true,
        }
      : null,
    pending_reveal:
      transit.length > 0
        ? { count: transit.length, next_visible_from: transit[0].visible_from }
        : null,
  });
}
