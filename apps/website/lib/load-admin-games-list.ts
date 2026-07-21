import { createAdminClient } from '@/lib/supabase/admin';
import type { GameRow, StoryRow } from '@/lib/types/db';

export type AdminGamesListRow = {
  game: GameRow;
  story: StoryRow | undefined;
  interactionCount: number;
  userEmail: string;
  /** Real AI spend for the game: sum of every ai_drafts version's cost (admin-only). */
  totalCostUsd: number;
  /** Distinct models used across the game's drafts. */
  models: string[];
};

export async function loadAdminGamesListRows(): Promise<AdminGamesListRow[]> {
  const admin = createAdminClient();
  const { data: games } = await admin
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  const gameRows = (games ?? []) as GameRow[];
  const storyIds = [...new Set(gameRows.map((g) => g.story_id))];
  let stories: Pick<StoryRow, 'id' | 'slug' | 'title_en' | 'title_it'>[] = [];
  if (storyIds.length) {
    const { data } = await admin
      .from('stories')
      .select('id, slug, title_en, title_it')
      .in('id', storyIds);
    stories = (data ?? []) as typeof stories;
  }

  const storyById = new Map(stories.map((s) => [s.id, s as StoryRow]));

  const { data: usersData } = await admin.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  const gameIds = gameRows.map((g) => g.id);
  const counts: Record<string, number> = {};
  const costByGame: Record<string, number> = {};
  const modelsByGame: Record<string, Set<string>> = {};
  if (gameIds.length) {
    const { data: ints } = await admin
      .from('interactions')
      .select('game_id')
      .in('game_id', gameIds);
    for (const row of ints ?? []) {
      const gid = row.game_id as string;
      counts[gid] = (counts[gid] ?? 0) + 1;
    }

    // AI spend per game: turn → draft join. Sum across every draft version
    // (real spend, regenerations included). Admin-only data.
    const { data: turns } = await admin
      .from('interaction_turns')
      .select('id, game_id')
      .in('game_id', gameIds);
    const turnToGame = new Map((turns ?? []).map((t) => [t.id as string, t.game_id as string]));
    const turnIds = [...turnToGame.keys()];
    if (turnIds.length) {
      const { data: drafts } = await admin
        .from('ai_drafts')
        .select('turn_id, cost_usd, model')
        .in('turn_id', turnIds);
      for (const d of drafts ?? []) {
        const gid = turnToGame.get(d.turn_id as string);
        if (!gid) continue;
        costByGame[gid] = (costByGame[gid] ?? 0) + Number(d.cost_usd ?? 0);
        if (d.model) (modelsByGame[gid] ??= new Set()).add(d.model as string);
      }
    }
  }

  return gameRows.map((g) => ({
    game: g,
    story: storyById.get(g.story_id),
    interactionCount: counts[g.id] ?? 0,
    userEmail: emailById.get(g.user_id) ?? g.user_id,
    totalCostUsd: costByGame[g.id] ?? 0,
    models: [...(modelsByGame[g.id] ?? [])],
  }));
}
