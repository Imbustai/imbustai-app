import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    const { gameId, rating } = await request.json();

    if (!gameId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Missing gameId or invalid rating (1-5)' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('games')
      .update({ rating })
      .eq('id', gameId)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to save rating' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Rate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
