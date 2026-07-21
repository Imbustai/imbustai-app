import { notFound, redirect } from 'next/navigation';
import { getSessionUser, isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { PlayClient, type PlayContact } from '@/components/play/play-client';
import { Box } from '@imbustai/ds';
import type {
  GameRow,
  InteractionRow,
  StoryCharacterRow,
  StoryRow,
} from '@/lib/types/db';

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

  // Story chrome via service role with SAFE columns only (story tables are
  // admin-only under RLS — hidden agendas etc. never reach this page).
  const [{ data: story }, { data: characters }] = await Promise.all([
    admin
      .from('stories')
      .select('id,slug,title_en,title_it,settings,time_config')
      .eq('id', g.story_id)
      .single(),
    admin
      .from('story_characters')
      .select('slug,name,role,sort_order,contactable_from_start')
      .eq('story_id', g.story_id)
      .order('sort_order'),
  ]);
  if (!story) notFound();
  const storyRow = story as Pick<
    StoryRow,
    'id' | 'slug' | 'title_en' | 'title_it' | 'settings' | 'time_config'
  >;
  const unlocked: string[] = (g.runtime_state?.unlocked_npcs as string[] | undefined) ?? [];
  const characterRows = (characters ?? []) as Pick<
    StoryCharacterRow,
    'slug' | 'name' | 'role' | 'sort_order' | 'contactable_from_start'
  >[];
  const contacts: PlayContact[] = characterRows
    .filter((c) => unlocked.includes(c.slug))
    .map((c) => ({ slug: c.slug, name: c.name, role: c.role }));
  // Only count characters that were designed to be contactable (contactable_from_start
  // or already unlocked) but aren't unlocked yet. Passive/automatic senders that are
  // never meant to be player contacts should not appear as locked mystery slots.
  const potentiallyContactable = characterRows.filter((c) => c.contactable_from_start);
  const lockedCount = potentiallyContactable.filter((c) => !unlocked.includes(c.slug)).length;
  // All character names for letter attribution (includes non-contactable senders).
  const allCharacters = characterRows.map((c) => ({ slug: c.slug, name: c.name, role: c.role }));

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
        maxLettersPerTurn={storyRow.settings?.max_letters_per_turn ?? 4}
        initialStoryDate={(g.runtime_state?.story_date as string | undefined) ?? null}
        contacts={contacts}
        lockedCount={lockedCount}
        initialLetters={(letters ?? []) as InteractionRow[]}
        allCharacters={allCharacters}
      />
    </Box>
  );
}
