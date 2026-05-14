import { createAdminClient } from '@/lib/supabase/admin';
import { GamesTable, type AdminGameRow } from '@/components/admin/games-table';

export const dynamic = 'force-dynamic';

async function getGames(): Promise<AdminGameRow[]> {
  const supabase = createAdminClient();

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (gamesError || !games) return [];

  const userIds = [...new Set(games.map((g) => g.user_id))];

  const { data: usersData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const emailMap = new Map<string, string>();
  if (usersData?.users) {
    for (const u of usersData.users) {
      if (userIds.includes(u.id)) {
        emailMap.set(u.id, u.email ?? 'unknown');
      }
    }
  }

  const { data: interactions } = await supabase
    .from('interactions')
    .select('game_id');

  const countMap = new Map<string, number>();
  if (interactions) {
    for (const i of interactions) {
      countMap.set(i.game_id, (countMap.get(i.game_id) ?? 0) + 1);
    }
  }

  return games.map((g) => ({
    id: g.id,
    user_id: g.user_id,
    status: g.status,
    created_at: g.created_at,
    completed_at: g.completed_at,
    interaction_count: countMap.get(g.id) ?? 0,
    user_email: emailMap.get(g.user_id) ?? 'unknown',
    questionnaire: g.questionnaire ?? null,
    feedback: g.feedback ?? null,
  }));
}

export default async function AdminGamesPage() {
  const games = await getGames();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Games</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        All games across users ({games.length} total)
      </p>
      <GamesTable games={games} />
    </div>
  );
}
