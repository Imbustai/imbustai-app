/**
 * Phase 5 live simulation harness.
 *
 *   pnpm tsx scripts/simulate-voss.ts [turns]   # default 10
 *
 * Drives the REAL story engine with the REAL Claude API against the Voss story
 * loaded from the linked Supabase project: scripted player letters → orchestrator
 * + scoped NPC calls → canon validation → state update, looping in memory.
 *
 * This is a developer harness, not a production path: it auto-approves every
 * batch (no admin gate) purely to measure quality. Quality bar (draft-phases
 * Phase 5): 3 consecutive turns with zero validator ERRORS; <= 1 minor warning
 * across the run. Exits non-zero if the error bar is missed.
 *
 * Requires ANTHROPIC_API_KEY + Supabase keys in apps/website/.env.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  ClaudeProvider,
  applyGameStateUpdates,
  generateTurnBatch,
  hasErrors,
  initialRuntimeState,
  type LetterRecord,
  type PlayerTurnLetter,
  type StoryConfig,
} from '../packages/story-engine/src/index';

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const line of readFileSync(resolve(__dirname, '../apps/website/.env'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) vars[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return vars;
}

async function loadVoss(env: Record<string, string>): Promise<StoryConfig> {
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const { data: story } = await db.from('stories').select('*').eq('slug', 'voss').single();
  if (!story) throw new Error('Voss story not found — run the seed first.');
  const tables = ['story_characters', 'story_facts', 'story_acts', 'story_clues', 'story_endings'];
  const [characters, facts, acts, clues, endings] = await Promise.all(
    tables.map((t) => db.from(t).select('*').eq('story_id', story.id)),
  );
  return {
    slug: story.slug,
    title: story.title_it || story.title_en,
    first_letter: story.first_letter,
    settings: story.settings ?? {},
    time_config: { start_mode: 'fixed', story_start_date: '2025-08-02', ...story.time_config },
    allow_dynamic_npcs: story.allow_dynamic_npcs,
    lifecycle: story.lifecycle,
    characters: (characters.data ?? []).sort((a, b) => a.sort_order - b.sort_order),
    facts: facts.data ?? [],
    acts: (acts.data ?? []).sort((a, b) => a.act_number - b.act_number),
    clues: clues.data ?? [],
    endings: endings.data ?? [],
  } as StoryConfig;
}

// Scripted player letters (IT), styled after MANUAL_TESTING_LETTERS.md, with
// multi-NPC turns and an arc from trust → evidence → theory → confrontation.
const PLAYER_SCRIPT: PlayerTurnLetter[][] = [
  [{ recipient_slug: 'voss', content: 'Caro Voss, grazie per il primo rapporto. Mi descriva la scena di Bellini: posizione del corpo, oggetti fuori posto, qualsiasi dettaglio peculiare.' }],
  [{ recipient_slug: 'comune', content: 'Spett.le Ufficio, richiedo la verifica anagrafica di Marco Bellini: residenza, stato civile, eventuali precedenti cambi di indirizzo.' }],
  [
    { recipient_slug: 'voss', content: 'Voss, comincio a chiedermi se le vittime abbiano qualcosa in comune. Cosa ne pensa?' },
    { recipient_slug: 'comune', content: 'Aggiungo: potete fornirmi i dati anagrafici delle altre vittime per un confronto?' },
  ],
  [{ recipient_slug: 'voss', content: 'Ho notato dei numeri ricorrenti nelle date. Tre omicidi, tre indizi... o forse mi sfugge qualcosa. Mi aiuti a ragionare.' }],
  [{ recipient_slug: 'voss', content: 'Vorrei parlare con chi conosceva Bellini da vicino. Può mettermi in contatto con la sua coinquilina o i suoi colleghi?' }],
  [
    { recipient_slug: 'voss', content: 'Qualcosa non mi torna nelle sue interpretazioni, Voss. Perché insiste tanto sulla pista della rapina?' },
    { recipient_slug: 'comune', content: 'Richiedo i registri catastali degli indirizzi delle vittime.' },
  ],
  [{ recipient_slug: 'voss', content: 'E se gli omicidi fossero quattro, non tre? Il pattern sembra costruito attorno al numero quattro.' }],
  [{ recipient_slug: 'voss', content: 'Mi dia la sua teoria onesta su chi sia il killer. E mi dica dove pensa colpirà la prossima volta.' }],
  [{ recipient_slug: 'voss', content: 'Credo di aver capito dove avverrà il quarto omicidio. Prima di muovermi, voglio sentire la sua reazione.' }],
  [{ recipient_slug: 'voss', content: 'Voss, ho un sospetto su di lei. Le do una possibilità di spiegarsi prima che agisca.' }],
];

async function main() {
  const env = loadEnv();
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY missing in apps/website/.env');
  const turns = Math.min(Number(process.argv[2] ?? 10) || 10, PLAYER_SCRIPT.length);

  const story = await loadVoss(env);
  // Make the key available to the provider (it reads process.env).
  process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;
  if (env.STORY_ENGINE_MODEL) process.env.STORY_ENGINE_MODEL = env.STORY_ENGINE_MODEL;
  const provider = new ClaudeProvider();
  console.log(`Story: ${story.title} | model: ${provider.model} | turns: ${turns}\n`);

  let state = initialRuntimeState(story);
  const history: LetterRecord[] = [];
  let totalWarnings = 0;
  let totalErrors = 0;
  let consecutiveCleanTurns = 0;
  let bestStreak = 0;

  for (let i = 0; i < turns; i++) {
    const turn = i + 1;
    const playerLetters = PLAYER_SCRIPT[i].filter((l) => state.unlocked_npcs.includes(l.recipient_slug));
    if (playerLetters.length === 0) {
      // Recipient not unlocked yet → fall back to Voss.
      playerLetters.push({ recipient_slug: 'voss', content: PLAYER_SCRIPT[i][0].content });
    }
    for (const l of playerLetters) {
      history.push({ role: 'user', character_slug: l.recipient_slug, content: l.content, story_date: state.story_date, turn_number: turn });
    }

    process.stdout.write(`Turn ${turn} (act ${state.current_act}, ${state.story_date}) → ${playerLetters.map((l) => l.recipient_slug).join(', ')} … `);
    const batch = await generateTurnBatch({
      story,
      state,
      history,
      playerLetters,
      provider,
      seed: `sim:${turn}`,
    });

    const errors = batch.warnings.filter((w) => w.severity === 'error');
    const warns = batch.warnings.filter((w) => w.severity === 'warning');
    totalErrors += errors.length;
    totalWarnings += warns.length;
    if (errors.length === 0) {
      consecutiveCleanTurns++;
      bestStreak = Math.max(bestStreak, consecutiveCleanTurns);
    } else {
      consecutiveCleanTurns = 0;
    }

    console.log(
      `${batch.responses.map((r) => `${r.character_slug}@${r.story_date}`).join(', ')} | ${errors.length} err, ${warns.length} warn`,
    );
    for (const w of batch.warnings) console.log(`    [${w.severity}] ${w.rule}: ${w.message}`);

    for (const r of batch.responses) {
      history.push({ role: 'ai', character_slug: r.character_slug, content: r.content, story_date: r.story_date, turn_number: turn });
    }
    state = applyGameStateUpdates(state, batch.gameStateUpdates, batch.responses);
  }

  console.log('\n─── Quality report ───');
  console.log(`Turns run:              ${turns}`);
  console.log(`Total validator errors: ${totalErrors}`);
  console.log(`Total minor warnings:   ${totalWarnings}`);
  console.log(`Best clean-turn streak: ${bestStreak} (bar: >= 3)`);
  console.log(`Final act:              ${state.current_act}`);
  console.log(`Clues found:            ${state.clues_found.join(', ') || 'none'}`);
  console.log(`Unlocked NPCs:          ${state.unlocked_npcs.join(', ')}`);

  const errorBarOk = totalErrors === 0;
  const streakOk = bestStreak >= 3;
  const warnBarOk = totalWarnings <= 1;
  console.log(
    `\nError bar (0 errors): ${errorBarOk ? 'PASS' : 'FAIL'} | streak (>=3): ${streakOk ? 'PASS' : 'FAIL'} | warning bar (<=1): ${warnBarOk ? 'PASS' : `OVER (${totalWarnings})`}`,
  );
  process.exit(errorBarOk && streakOk ? 0 : 1);
}

main().catch((err) => {
  // Some SDK error objects break util.inspect; print the safe fields only.
  const e = err as { message?: string; status?: number; error?: unknown; stack?: string };
  console.error('\nSIMULATION ERROR');
  if (e?.status) console.error('status:', e.status);
  if (e?.message) console.error('message:', e.message);
  if (e?.error) {
    try {
      console.error('detail:', JSON.stringify(e.error));
    } catch {
      /* ignore */
    }
  }
  if (e?.stack) console.error(e.stack.split('\n').slice(0, 4).join('\n'));
  process.exit(1);
});
