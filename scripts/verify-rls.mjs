/**
 * Phase 4 RLS verification (architecture §2, draft-phases Phase 4).
 * Creates a throwaway player + game against the LIVE linked project, then
 * proves with an authenticated (non-admin) client that:
 *   1. letters with a future visible_from are invisible
 *   2. ai_drafts are unreadable
 *   3. story content tables (facts, characters w/ hidden agendas) are unreadable
 *   4. inserting role='ai' interactions is impossible
 *   5. inserting interaction_turns directly is impossible
 * Cleans up after itself. Run: node scripts/verify-rls.mjs
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
for (const line of readFileSync('apps/website/.env', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const service = createClient(url, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const results = [];
function check(name, pass, detail = '') {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

const email = `rls-probe-${Date.now()}@example.com`;
const password = `Probe-${Math.random().toString(36).slice(2)}-9x`;
let userId, orderId, gameId, turnId;

try {
  // --- Setup via service role -------------------------------------------
  const { data: created, error: uErr } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (uErr) throw uErr;
  userId = created.user.id;

  const { data: story } = await service
    .from('stories')
    .select('id')
    .eq('slug', 'voss')
    .single();

  const { data: order } = await service
    .from('orders')
    .insert({
      user_id: userId,
      story_id: story.id,
      status: 'paid',
      source: 'admin',
      amount_cents: 0,
    })
    .select('id')
    .single();
  orderId = order.id;

  const { data: game } = await service
    .from('games')
    .insert({
      user_id: userId,
      order_id: orderId,
      story_id: story.id,
      status: 'in_progress',
      runtime_state: { current_turn: 0, story_date: '2025-08-02', unlocked_npcs: ['voss'] },
    })
    .select('id')
    .single();
  gameId = game.id;

  const future = new Date(Date.now() + 3600_000).toISOString();
  await service.from('interactions').insert([
    {
      game_id: gameId,
      role: 'ai',
      content: 'VISIBLE-LETTER',
      letter_number: 1,
      character_slug: 'voss',
      story_date: '2025-08-02',
    },
    {
      game_id: gameId,
      role: 'ai',
      content: 'FUTURE-SECRET-LETTER',
      letter_number: 2,
      character_slug: 'voss',
      story_date: '2025-08-03',
      visible_from: future,
    },
  ]);

  const { data: turn } = await service
    .from('interaction_turns')
    .insert({ game_id: gameId, turn_number: 99, status: 'draft_ready' })
    .select('id')
    .single();
  turnId = turn.id;
  await service.from('ai_drafts').insert({
    turn_id: turnId,
    version: 1,
    responses: [{ character_slug: 'voss', content: 'UNAPPROVED-DRAFT' }],
  });

  // --- Probe as the authenticated player --------------------------------
  const player = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error: signInErr } = await player.auth.signInWithPassword({ email, password });
  if (signInErr) throw signInErr;

  const { data: visible } = await player
    .from('interactions')
    .select('content')
    .eq('game_id', gameId);
  const contents = (visible ?? []).map((r) => r.content);
  check(
    'future visible_from letters hidden',
    contents.includes('VISIBLE-LETTER') && !contents.includes('FUTURE-SECRET-LETTER'),
    `sees ${contents.length} letter(s)`,
  );

  const { data: drafts } = await player.from('ai_drafts').select('*');
  check('ai_drafts unreadable', (drafts ?? []).length === 0);

  const { data: facts } = await player.from('story_facts').select('*');
  check('story_facts unreadable', (facts ?? []).length === 0);

  const { data: chars } = await player.from('story_characters').select('hidden_agenda');
  check('story_characters (hidden agendas) unreadable', (chars ?? []).length === 0);

  const { error: aiInsertErr } = await player.from('interactions').insert({
    game_id: gameId,
    role: 'ai',
    content: 'FORGED-AI-LETTER',
    letter_number: 50,
  });
  check('cannot insert AI interactions', Boolean(aiInsertErr), aiInsertErr?.code ?? '');

  const { error: turnInsertErr } = await player
    .from('interaction_turns')
    .insert({ game_id: gameId, turn_number: 100 });
  check('cannot insert interaction_turns directly', Boolean(turnInsertErr), turnInsertErr?.code ?? '');

  await player.auth.signOut();
} finally {
  // --- Cleanup -----------------------------------------------------------
  if (gameId) await service.from('games').delete().eq('id', gameId); // cascades turns/drafts/interactions
  if (orderId) await service.from('orders').delete().eq('id', orderId);
  if (userId) await service.auth.admin.deleteUser(userId);
}

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} RLS checks passed`);
process.exit(failed.length > 0 ? 1 : 0);
