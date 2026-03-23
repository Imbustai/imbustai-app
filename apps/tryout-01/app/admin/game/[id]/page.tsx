import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { InteractionsDrawer } from '@/components/admin/interactions-drawer';
import { FeedbackDrawer } from '@/components/admin/feedback-drawer';
import { SessionAnalytics } from '@/components/admin/session-analytics';
import { ExportButton } from '@/components/admin/export-button';
import { ArrowLeft } from 'lucide-react';

async function getGame(id: string) {
  const supabase = createAdminClient();

  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !game) return null;

  const { data: interactions } = await supabase
    .from('interactions')
    .select('*')
    .eq('game_id', id)
    .order('letter_number', { ascending: true })
    .order('created_at', { ascending: true });

  const { data: usersData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  const user = usersData?.users?.find((u) => u.id === game.user_id);

  return {
    ...game,
    user_email: user?.email ?? 'unknown',
    interactions: interactions ?? [],
  };
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

export default async function AdminGameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) notFound();

  const userInteractions = game.interactions.filter(
    (i: { role: string }) => i.role === 'user'
  );
  const aiInteractions = game.interactions.filter(
    (i: { role: string }) => i.role === 'ai'
  );

  return (
    <div>
      <Link
        href="/admin/games"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Games
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Game Detail</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Game ID: {game.id}
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">User</p>
            <p className="mt-1 text-sm font-semibold">{game.user_email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">Status</p>
            <div className="mt-1">
              {game.status === 'completed' ? (
                <Badge variant="default">Completed</Badge>
              ) : (
                <Badge variant="secondary">In Progress</Badge>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">
              Interactions
            </p>
            <p className="mt-1 text-sm font-semibold">
              {game.interactions.length} total ({aiInteractions.length} AI,{' '}
              {userInteractions.length} user)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-muted-foreground">Dates</p>
            <p className="mt-1 text-xs">
              Started: {formatDate(game.created_at)}
            </p>
            <p className="text-xs">
              Completed: {formatDate(game.completed_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <InteractionsDrawer interactions={game.interactions} />
        <FeedbackDrawer
          questionnaire={game.questionnaire}
          feedback={game.feedback}
        />
        <ExportButton
          questionnaire={game.questionnaire}
          feedback={game.feedback}
          interactions={game.interactions}
          gameId={game.id}
        />
      </div>

      <SessionAnalytics
        questionnaire={game.questionnaire}
        feedback={game.feedback}
      />
    </div>
  );
}
