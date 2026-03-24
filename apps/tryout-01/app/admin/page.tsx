import { createAdminClient } from '@/lib/supabase/admin';
import { ResearchDashboard } from '@/components/admin/dashboard/research-dashboard';
import type { ParticipantRecord } from '@/lib/analytics/types';

export const dynamic = 'force-dynamic'

interface InteractionRow {
  id: string;
  game_id: string;
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
  visible_from: string | null;
}

async function getDashboardData(): Promise<ParticipantRecord[]> {
  const supabase = createAdminClient();

  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .order('created_at', { ascending: false });

  if (gamesError || !games) return [];

  const { data: interactions } = await supabase
    .from('interactions')
    .select('id, game_id, role, content, letter_number, created_at, visible_from');

  const { data: usersData } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });

  const emailMap = new Map<string, string>();
  if (usersData?.users) {
    for (const u of usersData.users) {
      emailMap.set(u.id, u.email ?? 'unknown');
    }
  }

  const interactionsByGame = new Map<string, InteractionRow[]>();
  if (interactions) {
    for (const i of interactions as InteractionRow[]) {
      if (!interactionsByGame.has(i.game_id)) interactionsByGame.set(i.game_id, []);
      interactionsByGame.get(i.game_id)!.push(i);
    }
  }

  return games.map((game): ParticipantRecord => {
    const gameInteractions = interactionsByGame.get(game.id) ?? [];
    const userInteractions = gameInteractions
      .filter((i) => i.role === 'user')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let durationMinutes: number | null = null;
    if (game.completed_at && game.created_at) {
      durationMinutes = Math.round(
        (new Date(game.completed_at).getTime() - new Date(game.created_at).getTime()) / 60000
      );
    }

    let avgTimeBetweenLettersMin: number | null = null;
    if (userInteractions.length >= 2) {
      let totalGap = 0;
      for (let i = 1; i < userInteractions.length; i++) {
        totalGap +=
          new Date(userInteractions[i].created_at).getTime() -
          new Date(userInteractions[i - 1].created_at).getTime();
      }
      avgTimeBetweenLettersMin = Math.round(
        totalGap / ((userInteractions.length - 1) * 60000) * 10
      ) / 10;
    }

    let avgLetterLength: number | null = null;
    if (userInteractions.length > 0) {
      const totalLen = userInteractions.reduce((s, i) => s + (i.content?.length ?? 0), 0);
      avgLetterLength = Math.round(totalLen / userInteractions.length);
    }

    return {
      gameId: game.id,
      userId: game.user_id,
      userEmail: emailMap.get(game.user_id) ?? 'unknown',
      status: game.status,
      createdAt: game.created_at,
      completedAt: game.completed_at,
      questionnaire: game.questionnaire,
      feedback: game.feedback,
      interactionCount: gameInteractions.length,
      userInteractionCount: userInteractions.length,
      durationMinutes,
      avgTimeBetweenLettersMin,
      avgLetterLength,
    };
  });
}

export default async function AdminDashboardPage() {
  const participants = await getDashboardData();
  return <ResearchDashboard participants={participants} />;
}
