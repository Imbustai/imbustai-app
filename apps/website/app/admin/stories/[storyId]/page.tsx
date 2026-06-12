import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { StoryEditorClient } from '@/components/admin/stories/story-editor-client';
import type {
  StoryActRow,
  StoryCharacterRow,
  StoryClueRow,
  StoryEndingRow,
  StoryFactRow,
  StoryRow,
} from '@/lib/types/db';

export const dynamic = 'force-dynamic';

export default async function AdminStoryEditorPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const admin = createAdminClient();

  const { data: story } = await admin.from('stories').select('*').eq('id', storyId).single();
  if (!story) notFound();

  const [characters, facts, acts, clues, endings, activeGames] = await Promise.all([
    admin.from('story_characters').select('*').eq('story_id', storyId).order('sort_order'),
    admin.from('story_facts').select('*').eq('story_id', storyId).order('fact_key'),
    admin.from('story_acts').select('*').eq('story_id', storyId).order('act_number'),
    admin.from('story_clues').select('*').eq('story_id', storyId).order('clue_key'),
    admin.from('story_endings').select('*').eq('story_id', storyId).order('ending_key'),
    admin
      .from('games')
      .select('id', { count: 'exact', head: true })
      .eq('story_id', storyId)
      .eq('status', 'in_progress'),
  ]);

  return (
    <StoryEditorClient
      story={story as StoryRow}
      characters={(characters.data ?? []) as StoryCharacterRow[]}
      facts={(facts.data ?? []) as StoryFactRow[]}
      acts={(acts.data ?? []) as StoryActRow[]}
      clues={(clues.data ?? []) as StoryClueRow[]}
      endings={(endings.data ?? []) as StoryEndingRow[]}
      activeGamesCount={activeGames.count ?? 0}
    />
  );
}
