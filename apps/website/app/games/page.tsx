import { redirect } from 'next/navigation';
import { isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { GamesList } from '@/components/games/games-list';
import type { GameRow, StoryRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

export default async function GamesPage() {
  if (!(await isCurrentUserAdmin())) {
    redirect('/');
  }

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
  if (gameIds.length) {
    const { data: ints } = await admin
      .from('interactions')
      .select('game_id')
      .in('game_id', gameIds);
    for (const row of ints ?? []) {
      const gid = row.game_id as string;
      counts[gid] = (counts[gid] ?? 0) + 1;
    }
  }

  const rows = gameRows.map((g) => ({
    game: g,
    story: storyById.get(g.story_id),
    interactionCount: counts[g.id] ?? 0,
    userEmail: emailById.get(g.user_id) ?? g.user_id,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <GamesList rows={rows} />
    </div>
  );
}
