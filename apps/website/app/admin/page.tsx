import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminPageTitle } from '@/components/admin/admin-page-title';
import { ClientSectionTitle } from '@/components/admin/client-section-title';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type {
  GameRow,
  InteractionTurnRow,
  OrderRow,
  StoryRow,
} from '@/lib/types/db';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from('orders')
    .select('*')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false, nullsFirst: false })
    .limit(15);

  const { data: games } = await admin
    .from('games')
    .select('*')
    .eq('status', 'in_progress')
    .order('created_at', { ascending: false });

  const gameList = (games ?? []) as GameRow[];
  const gameIds = gameList.map((g) => g.id);
  const interactionCounts: Record<string, number> = {};
  if (gameIds.length) {
    const { data: ints } = await admin
      .from('interactions')
      .select('game_id')
      .in('game_id', gameIds);
    for (const row of ints ?? []) {
      const gid = row.game_id as string;
      interactionCounts[gid] = (interactionCounts[gid] ?? 0) + 1;
    }
  }

  const { data: usersData } = await admin.auth.admin.listUsers({
    perPage: 1000,
    page: 1,
  });
  const emailById = new Map(
    (usersData?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  // Turns waiting on the admin: pending generation or draft awaiting review.
  const { data: waitingTurns } = await admin
    .from('interaction_turns')
    .select('*')
    .neq('status', 'sent')
    .order('user_submitted_at', { ascending: true });
  const waiting = (waitingTurns ?? []) as InteractionTurnRow[];
  const waitingGameIds = [...new Set(waiting.map((t) => t.game_id))];
  const gamesById = new Map<string, GameRow>();
  const storiesById = new Map<string, StoryRow>();
  if (waitingGameIds.length) {
    const { data: wGames } = await admin
      .from('games')
      .select('*')
      .in('id', waitingGameIds);
    for (const g of (wGames ?? []) as GameRow[]) gamesById.set(g.id, g);
    const storyIds = [...new Set([...gamesById.values()].map((g) => g.story_id))];
    const { data: wStories } = await admin.from('stories').select('*').in('id', storyIds);
    for (const s of (wStories ?? []) as StoryRow[]) storiesById.set(s.id, s);
  }

  return (
    <div>
      <AdminPageTitle
        titleKey="admin.dashboardTitle"
        subtitleKey="admin.dashboardSubtitle"
      />

      <section className="mt-10">
        <h2 className="font-heading text-lg font-semibold">
          <ClientSectionTitle titleKey="admin.waitingReview" />
        </h2>
        {!waiting.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <ClientSectionTitle titleKey="admin.noWaitingReview" asSpan />
          </p>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Story</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Turn</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {waiting.map((turn) => {
                const game = gamesById.get(turn.game_id);
                const story = game ? storiesById.get(game.story_id) : undefined;
                return (
                  <TableRow key={turn.id}>
                    <TableCell>{story?.title_it ?? story?.title_en ?? '—'}</TableCell>
                    <TableCell>
                      {game ? (emailById.get(game.user_id) ?? game.user_id) : '—'}
                    </TableCell>
                    <TableCell>#{turn.turn_number}</TableCell>
                    <TableCell>
                      <Badge variant={turn.status === 'draft_ready' ? 'default' : 'secondary'}>
                        <ClientSectionTitle
                          titleKey={`replyAdmin.status.${turn.status}`}
                          asSpan
                        />
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(turn.user_submitted_at)}</TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/game/${turn.game_id}`}
                        className="text-primary underline"
                      >
                        Open
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-semibold">
          <ClientSectionTitle titleKey="admin.recentOrders" />
        </h2>
        <Table className="mt-4">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((orders ?? []) as OrderRow[]).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-xs">
                  {o.id.slice(0, 8)}…
                </TableCell>
                <TableCell>{emailById.get(o.user_id) ?? o.user_id}</TableCell>
                <TableCell>{formatDate(o.paid_at)}</TableCell>
                <TableCell>
                  <Link
                    href={`/admin/order/${o.id}`}
                    className="text-primary underline"
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {!(orders ?? []).length ? (
          <p className="mt-2 text-sm text-muted-foreground">—</p>
        ) : null}
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-lg font-semibold">
          <ClientSectionTitle titleKey="admin.gamesNeedUpdate" />
        </h2>
        {!gameList.length ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <ClientSectionTitle titleKey="admin.noGamesWaiting" asSpan />
          </p>
        ) : (
          <Table className="mt-4">
            <TableHeader>
              <TableRow>
                <TableHead>Game</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Interactions</TableHead>
                <TableHead>Started</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {gameList.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">
                    {g.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    {emailById.get(g.user_id) ?? g.user_id}
                  </TableCell>
                  <TableCell>{interactionCounts[g.id] ?? 0}</TableCell>
                  <TableCell>{formatDate(g.created_at)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/game/${g.id}`}
                      className="text-primary underline"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  );
}
