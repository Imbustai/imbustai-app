import { NextResponse } from 'next/server';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { loadStoryConfig, runtimeStateOf } from '@/lib/story-engine/load';
import type { GameRow, InteractionTurnRow } from '@/lib/types/db';

// GET /api/game/[gameId]/state — player-safe game state: unlocked contacts
// (safe fields only — no hidden agendas, no facts), in-fiction date, open
// turn status. Served via service role with explicit column selection
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

  const loaded = await loadStoryConfig(admin, g.story_id);
  if (!loaded) return NextResponse.json({ error: 'story_not_found' }, { status: 404 });
  const state = runtimeStateOf(g, loaded.story);

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

  const contacts = loaded.story.characters
    .filter((c) => state.unlocked_npcs.includes(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, role: c.role }));
  // Only count characters designed to be player-contactable but not yet unlocked.
  // Passive senders (contactable_from_start = false) must never show as locked slots.
  const potentiallyContactable = loaded.story.characters.filter((c) => c.contactable_from_start);
  const lockedCount = potentiallyContactable.filter((c) => !state.unlocked_npcs.includes(c.slug)).length;

  const transit = (inTransit ?? []) as Array<{ visible_from: string }>;

  return NextResponse.json({
    game_status: g.status,
    story_date: state.story_date,
    current_turn: state.current_turn,
    max_letters_per_turn: loaded.story.settings.max_letters_per_turn ?? 4,
    contacts,
    locked_count: lockedCount,
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
