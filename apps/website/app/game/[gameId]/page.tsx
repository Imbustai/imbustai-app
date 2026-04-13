import { notFound, redirect } from 'next/navigation';
import { isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminGameDetailClient } from '@/components/games/admin-game-detail-client';
import type { GameRow, InteractionRow, StoryRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  if (!(await isCurrentUserAdmin())) {
    redirect('/');
  }

  const { gameId } = await params;
  const admin = createAdminClient();

  const { data: game, error } = await admin
    .from('games')
    .select('*')
    .eq('id', gameId)
    .single();

  if (error || !game) notFound();

  const g = game as GameRow;

  const { data: interactions } = await admin
    .from('interactions')
    .select('*')
    .eq('game_id', gameId)
    .order('letter_number', { ascending: true })
    .order('created_at', { ascending: true });

  const { data: story } = await admin
    .from('stories')
    .select('*')
    .eq('id', g.story_id)
    .single();

  const { data: userRes } = await admin.auth.admin.getUserById(g.user_id);
  const userEmail = userRes?.user?.email ?? g.user_id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <AdminGameDetailClient
        gameId={gameId}
        game={g}
        interactions={(interactions ?? []) as InteractionRow[]}
        story={(story as StoryRow | null) ?? undefined}
        userEmail={userEmail}
      />
    </div>
  );
}
