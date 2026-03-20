import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { FIRST_LETTER } from '@/lib/first-letter';

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: existingGame } = await supabase
      .from('games')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingGame) {
      return NextResponse.json(
        { error: 'Game already exists' },
        { status: 409 }
      );
    }

    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({ user_id: user.id })
      .select()
      .single();

    if (gameError || !game) {
      return NextResponse.json(
        { error: 'Failed to create game' },
        { status: 500 }
      );
    }

    const { error: interactionError } = await supabase
      .from('interactions')
      .insert({
        game_id: game.id,
        role: 'ai',
        content: FIRST_LETTER,
        letter_number: 1,
      });

    if (interactionError) {
      return NextResponse.json(
        { error: 'Failed to save interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      gameId: game.id,
      letter: FIRST_LETTER,
      letterNumber: 1,
    });
  } catch (error) {
    console.error('Game start error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
