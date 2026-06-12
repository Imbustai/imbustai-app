import { notFound, redirect } from 'next/navigation';
import { isCurrentUserAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminGameDetailClient } from '@/components/games/admin-game-detail-client';
import { ReplyWorkflowPanel } from '@/components/games/reply-workflow-panel';
import type {
  AiDraftRow,
  GameRow,
  InteractionRow,
  InteractionTurnRow,
  StoryCharacterRow,
  StoryRow,
} from '@/lib/types/db';

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

  const [{ data: interactions }, { data: story }, { data: characters }, { data: openTurn }] =
    await Promise.all([
      admin
        .from('interactions')
        .select('*')
        .eq('game_id', gameId)
        .order('letter_number', { ascending: true })
        .order('created_at', { ascending: true }),
      admin.from('stories').select('*').eq('id', g.story_id).single(),
      admin
        .from('story_characters')
        .select('*')
        .eq('story_id', g.story_id)
        .order('sort_order'),
      admin
        .from('interaction_turns')
        .select('*')
        .eq('game_id', gameId)
        .neq('status', 'sent')
        .maybeSingle(),
    ]);

  let latestDraft: AiDraftRow | null = null;
  if (openTurn) {
    const { data: draft } = await admin
      .from('ai_drafts')
      .select('*')
      .eq('turn_id', (openTurn as InteractionTurnRow).id)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    latestDraft = (draft as AiDraftRow | null) ?? null;
  }

  const { data: userRes } = await admin.auth.admin.getUserById(g.user_id);
  const userEmail = userRes?.user?.email ?? g.user_id;

  const interactionList = (interactions ?? []) as InteractionRow[];
  const turnRow = (openTurn as InteractionTurnRow | null) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <ReplyWorkflowPanel
        gameId={gameId}
        game={g}
        story={(story as StoryRow | null) ?? null}
        characters={(characters ?? []) as StoryCharacterRow[]}
        openTurn={turnRow}
        latestDraft={latestDraft}
        turnLetters={
          turnRow ? interactionList.filter((i) => i.turn_id === turnRow.id) : []
        }
      />
      <div className="mt-8">
        <AdminGameDetailClient
          gameId={gameId}
          game={g}
          interactions={interactionList}
          story={(story as StoryRow | null) ?? undefined}
          userEmail={userEmail}
        />
      </div>
    </div>
  );
}
