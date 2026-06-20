import { createAdminClient } from '@/lib/supabase/admin';
import { StoriesListClient } from '@/components/admin/stories/stories-list-client';
import type { GameRow, StoryRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

export default async function AdminStoriesPage() {
  const admin = createAdminClient();

  const { data: stories } = await admin
    .from('stories')
    .select('*')
    .order('updated_at', { ascending: false });

  const { data: games } = await admin
    .from('games')
    .select('story_id,status');

  const gamesByStory: Record<string, { total: number; inProgress: number }> = {};
  for (const g of (games ?? []) as Pick<GameRow, 'story_id' | 'status'>[]) {
    const entry = (gamesByStory[g.story_id] ??= { total: 0, inProgress: 0 });
    entry.total += 1;
    if (g.status === 'in_progress') entry.inProgress += 1;
  }

  return (
    <StoriesListClient
      stories={(stories ?? []) as StoryRow[]}
      gamesByStory={gamesByStory}
    />
  );
}
