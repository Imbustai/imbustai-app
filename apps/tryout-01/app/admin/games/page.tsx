import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface GameRow {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  completed_at: string | null;
  interaction_count: number;
  user_email: string;
}

async function getGames(): Promise<GameRow[]> {
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
  }));
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminGamesPage() {
  const games = await getGames();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Games</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        All games across users ({games.length} total)
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No games found.
                </TableCell>
              </TableRow>
            ) : (
              games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell className="font-medium">{game.user_email}</TableCell>
                  <TableCell>
                    {game.status === 'completed' ? (
                      <Badge variant="default">Completed</Badge>
                    ) : (
                      <Badge variant="secondary">
                        In Progress ({game.interaction_count} interactions)
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(game.created_at)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(game.completed_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/admin/game/${game.id}`}
                      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
