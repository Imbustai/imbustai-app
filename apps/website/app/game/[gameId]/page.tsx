import { notFound, redirect } from 'next/navigation';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// /game/[gameId] — Phase 4 builds the player play UI here (owner-only, admin
// read access). Until then: admins go to the admin console, owners to their
// games list.
export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  if (await isCurrentUserAdmin()) {
    redirect(`/admin/game/${gameId}`);
  }

  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/game/${gameId}`);

  const admin = createAdminClient();
  const { data: game } = await admin
    .from('games')
    .select('user_id')
    .eq('id', gameId)
    .single();
  if (!game) notFound();
  if (game.user_id !== user.id) redirect('/');

  // Owner: play UI lands here in Phase 4.
  redirect('/games');
}
