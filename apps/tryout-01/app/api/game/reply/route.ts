import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateLetter, type Message } from '@/lib/claude';
import { STORYLINE_CONTENT } from '@/lib/storyline';

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

    const { gameId, content } = await request.json();

    if (!gameId || !content) {
      return NextResponse.json(
        { error: 'Missing gameId or content' },
        { status: 400 }
      );
    }

    const { data: game } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .eq('user_id', user.id)
      .single();

    if (!game || game.status === 'completed') {
      return NextResponse.json(
        { error: 'Game not found or already completed' },
        { status: 404 }
      );
    }

    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('game_id', gameId)
      .order('letter_number', { ascending: true })
      .order('created_at', { ascending: true });

    if (!interactions) {
      return NextResponse.json(
        { error: 'Failed to fetch interactions' },
        { status: 500 }
      );
    }

    const userLetterCount = interactions.filter((i) => i.role === 'user').length;
    const userLetterNumber = userLetterCount + 1;

    if (userLetterNumber > 4) {
      return NextResponse.json(
        { error: 'Maximum user replies reached' },
        { status: 400 }
      );
    }

    const { error: userInteractionError } = await supabase
      .from('interactions')
      .insert({
        game_id: gameId,
        role: 'user',
        content,
        letter_number: userLetterNumber,
      });

    if (userInteractionError) {
      return NextResponse.json(
        { error: 'Failed to save user reply' },
        { status: 500 }
      );
    }

    const conversationHistory: Message[] = [];

    conversationHistory.push({
      role: 'user',
      content: 'Inizia la storia scrivendomi la prima lettera.',
    });

    for (const interaction of interactions) {
      conversationHistory.push({
        role: interaction.role === 'ai' ? 'assistant' : 'user',
        content: interaction.content,
      });
    }

    conversationHistory.push({ role: 'user', content });

    const aiLetterNumber = userLetterNumber + 1;
    const aiLetter = await generateLetter(
      STORYLINE_CONTENT,
      conversationHistory,
      aiLetterNumber
    );

    const { error: aiInteractionError } = await supabase
      .from('interactions')
      .insert({
        game_id: gameId,
        role: 'ai',
        content: aiLetter,
        letter_number: aiLetterNumber,
      });

    if (aiInteractionError) {
      return NextResponse.json(
        { error: 'Failed to save AI reply' },
        { status: 500 }
      );
    }

    const isGameComplete = aiLetterNumber >= 5;

    if (isGameComplete) {
      await supabase
        .from('games')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', gameId);
    }

    return NextResponse.json({
      letter: aiLetter,
      letterNumber: aiLetterNumber,
      isComplete: isGameComplete,
    });
  } catch (error) {
    console.error('Game reply error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
