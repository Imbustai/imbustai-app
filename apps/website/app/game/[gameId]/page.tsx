import { notFound, redirect } from 'next/navigation';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PlayClient, type PlayContact } from '@/components/play/play-client';
import { Box } from '@imbustai/ds';
import { WorkflowError, loadGameHost, playerStatus } from '@/lib/game-host';
import type { GameRow, InteractionRow } from '@/lib/types/db';

export const dynamic = 'force-dynamic';

// /game/[gameId] — the player play page (Phase 4). Owner only; admins use
// their console at /admin/game/[gameId] (full read access there).
export default async function PlayPage({
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
  const { data: game } = await admin.from('games').select('*').eq('id', gameId).single();
  if (!game) notFound();
  const g = game as GameRow;
  if (g.user_id !== user.id) redirect('/');

  // Story chrome and contacts through the Story's Engine, on the server: only
  // names and roles from its cast reach this page — hidden agendas never do.
  let host;
  try {
    host = await loadGameHost(admin, g);
  } catch (err) {
    if (err instanceof WorkflowError) notFound();
    throw err;
  }
  const storyRow = host.row;
  const status = playerStatus(host);
  const contacts: PlayContact[] = status.contacts;
  // Everyone who may sign a letter, for attribution (includes non-contactable senders).
  const allCharacters = status.correspondents;

  // Letters through the USER's client: RLS hides future-visible_from letters
  // and everything that isn't theirs — defense in depth over UI filtering.
  const supabase = await createClient();
  const { data: letters } = await supabase
    .from('interactions')
    .select('*')
    .eq('game_id', gameId)
    .order('letter_number', { ascending: true });

  return (
    <Box maxWidth="5xl" marginX="auto" paddingX="4" paddingY="10">
      <PlayClient
        gameId={gameId}
        gameStatus={g.status}
        storyTitleEn={storyRow.title_en}
        storyTitleIt={storyRow.title_it}
        dateLocale={storyRow.time_config?.date_locale ?? 'it-IT'}
        maxLettersPerTurn={status.maxLettersPerTurn}
        initialStoryDate={status.storyDate}
        contacts={contacts}
        lockedCount={0}
        initialLetters={(letters ?? []) as InteractionRow[]}
        allCharacters={allCharacters}
      />
    </Box>
  );
}
