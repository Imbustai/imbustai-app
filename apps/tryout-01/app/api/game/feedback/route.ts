import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { QUESTION_KEYS } from '@/lib/questionnaire';

function isValidQuestionnaire(obj: unknown): obj is Record<string, number> {
  if (!obj || typeof obj !== 'object') return false;
  const record = obj as Record<string, unknown>;
  return QUESTION_KEYS.every(
    (key) => key in record && typeof record[key] === 'number' && record[key] >= 0 && record[key] <= 5
  );
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gameId, feedback, questionnaire } = await request.json();

    if (!gameId || !isValidQuestionnaire(questionnaire)) {
      return NextResponse.json(
        { error: 'Missing gameId or invalid questionnaire' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { questionnaire };
    if (typeof feedback === 'string' && feedback.trim().length > 0) {
      updateData.feedback = feedback.trim();
    }

    const { error: updateError } = await supabase
      .from('games')
      .update(updateData)
      .eq('id', gameId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
