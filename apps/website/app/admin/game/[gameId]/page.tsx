import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { AdminGameDetailClient } from '@/components/games/admin-game-detail-client';
import { GameCostBreakdown } from '@/components/games/game-cost-breakdown';
import {
  ReplyWorkflowPanel,
  TestHarnessCard,
} from '@/components/games/reply-workflow-panel';
import { Box } from '@imbustai/ds';
import type {
  AiDraftRow,
  GameRow,
  InteractionRow,
  InteractionTurnRow,
  StoryCharacterRow,
  StoryRow,
} from '@/lib/types/db';

export const dynamic = 'force-dynamic';

export default async function AdminGameDetailPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
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

  const { data: allTurns } = await admin
    .from('interaction_turns')
    .select('id, turn_number')
    .eq('game_id', gameId);
  const turnNumbers: Record<string, number> = {};
  for (const tr of (allTurns ?? []) as Pick<InteractionTurnRow, 'id' | 'turn_number'>[]) {
    turnNumbers[tr.id] = tr.turn_number;
  }
  const turnIds = Object.keys(turnNumbers);
  let costDrafts: AiDraftRow[] = [];
  if (turnIds.length) {
    const { data: drafts } = await admin
      .from('ai_drafts')
      .select('*')
      .in('turn_id', turnIds);
    costDrafts = (drafts ?? []) as AiDraftRow[];
  }

  const interactionList = (interactions ?? []) as InteractionRow[];
  const characterList = (characters ?? []) as StoryCharacterRow[];
  const turnRow = (openTurn as InteractionTurnRow | null) ?? null;

  return (
    <Box maxWidth="4xl" marginX="auto">
      <ReplyWorkflowPanel
        gameId={gameId}
        game={g}
        story={(story as StoryRow | null) ?? null}
        characters={characterList}
        openTurn={turnRow}
        latestDraft={latestDraft}
        turnLetters={
          turnRow ? interactionList.filter((i) => i.turn_id === turnRow.id) : []
        }
      />
      <Box marginTop="8">
        <GameCostBreakdown
          drafts={costDrafts}
          turnNumbers={turnNumbers}
          characters={characterList}
        />
      </Box>
      <Box marginTop="8">
        <AdminGameDetailClient
          gameId={gameId}
          game={g}
          interactions={interactionList}
          story={(story as StoryRow | null) ?? undefined}
          userEmail={userEmail}
        />
      </Box>
      <TestHarnessCard
        gameId={gameId}
        game={g}
        characters={characterList}
        hasOpenTurn={turnRow !== null}
      />
    </Box>
  );
}
