import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ModelProfile } from '@imbustai/story-runtime';
import { WorkflowError, hookSession, openingRows, type LoadedStory } from '@/lib/game-host';

// Starting a Game, for a paid order or for a Run: the Engine gives it its
// first state and the opening envelope, which is authored, so it is delivered
// without review. The Game keeps the profile it starts with: later edits to
// the Story's default never change a Game already running.

export async function createGame(
  admin: SupabaseClient,
  input: {
    order: { id: string; user_id: string; story_id: string };
    loaded: LoadedStory;
    profile: ModelProfile;
    /** A Run's cap: it covers the Engine's calls at game start too. */
    capUsd?: number;
  },
): Promise<string> {
  const { order, loaded, profile } = input;
  const gameId = randomUUID();
  const session = await hookSession(admin, loaded, {
    gameId,
    turn: 0,
    hook: 'startGame',
    profile,
    capUsd: input.capUsd,
  });
  const today = new Date().toISOString().slice(0, 10);
  const { state, opening } = await loaded.engine.startGame(session.ctx, {
    gameId,
    story: loaded.story,
    realStartDate: today,
  });
  const runtimeState = loaded.engine.schema.state.parse(state);

  const { data: game, error: gErr } = await admin
    .from('games')
    .insert({
      id: gameId,
      user_id: order.user_id,
      order_id: order.id,
      story_id: order.story_id,
      status: 'in_progress',
      runtime_state: runtimeState,
      model_profile: profile,
    })
    .select('id')
    .single();
  if (gErr || !game) {
    console.error(gErr);
    throw new WorkflowError('Could not create game', 500);
  }
  await session.persist();

  const { error: iErr } = await admin.from('interactions').insert(openingRows(gameId, opening));
  if (iErr) {
    console.error(iErr);
    await admin.from('games').delete().eq('id', gameId);
    throw new WorkflowError('Could not create opening letters', 500);
  }
  return gameId;
}
