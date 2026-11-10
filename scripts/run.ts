/**
 * Runs from the command line: an AI player plays a Story under a cost cap.
 *
 *   pnpm run:story --story <slug> [--persona methodical|warm|impulsive]
 *                  [--cap 12] [--turns 8]
 *                  [--writer <model>[:effort]] [--clerk …] [--analyst …] [--player …]
 *                  [--estimate]        only print the preflight estimate, spend nothing
 *   pnpm run:story --resume <gameId>   go on with a Run that was interrupted
 *
 * The Run is a real Game in the database of apps/website/.env: it shows up in
 * /admin/game/<id> with its Letters, its report and every call's cost. The
 * Game belongs to the first admin user. Model keys and the service role key
 * are read from apps/website/.env unless the environment already has them.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const here = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(resolve(here, '../apps/website/.env'), 'utf8').split('\n')) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
}

const { values } = parseArgs({
  options: {
    story: { type: 'string' },
    persona: { type: 'string', default: 'methodical' },
    cap: { type: 'string' },
    turns: { type: 'string' },
    writer: { type: 'string' },
    clerk: { type: 'string' },
    analyst: { type: 'string' },
    player: { type: 'string' },
    estimate: { type: 'boolean', default: false },
    resume: { type: 'string' },
  },
});

const usd = (n: number) => `$${n.toFixed(4)}`;

async function main() {
  // Imported after the environment is set: the admin client reads it.
  const { PERSONAS, modelProfilePatchSchema } = await import('@imbustai/story-runtime');
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { DEFAULT_RUN_CAP_USD, RunPreflightError, estimateRunFor, playRunToEnd, startRun } = await import('@/lib/runs');
  const admin = createAdminClient();

  let gameId = values.resume;
  if (!gameId) {
    if (!values.story) throw new Error('Pass --story <slug> or --resume <gameId>.');
    if (!(values.persona in PERSONAS)) throw new Error(`Unknown persona "${values.persona}".`);
    const { data: story } = await admin.from('stories').select('id,slug').eq('slug', values.story).maybeSingle();
    if (!story) throw new Error(`No Story with slug "${values.story}".`);

    const roles: Record<string, { model: string; effort?: string }> = {};
    for (const role of ['writer', 'clerk', 'analyst', 'player'] as const) {
      const choice = values[role];
      if (!choice) continue;
      const [model, effort] = choice.split(':');
      roles[role] = effort ? { model, effort } : { model };
    }
    const modelProfile = modelProfilePatchSchema.parse({ roles });
    const capUsd = values.cap ? Number(values.cap) : DEFAULT_RUN_CAP_USD;
    const maxTurns = values.turns ? Number(values.turns) : undefined;

    const printEstimate = (estimate: { totalUsd: number; lines: { purpose: string; role: string; model: string; calls: number; usd: number }[] }) => {
      for (const l of estimate.lines) {
        console.log(`  ${l.purpose.padEnd(14)} ${l.role.padEnd(8)} ${l.model.padEnd(20)} ${String(l.calls).padStart(3)} calls  ${usd(l.usd)}`);
      }
      console.log(`  estimate ${usd(estimate.totalUsd)} · cap ${usd(capUsd)}`);
    };

    if (values.estimate) {
      const { estimate, profile, maxTurns: turns } = await estimateRunFor(admin, { storyId: story.id, maxTurns, modelProfile });
      console.log(`Run on "${story.slug}", ${turns} Turns, models:`, JSON.stringify(profile.roles));
      printEstimate(estimate);
      return;
    }

    const { data: owner } = await admin.from('profiles').select('id').eq('role', 'admin').limit(1).maybeSingle();
    if (!owner) throw new Error('No admin user to own the Run\'s Game.');
    try {
      const started = await startRun(admin, {
        storyId: story.id,
        userId: owner.id,
        persona: values.persona as keyof typeof PERSONAS,
        capUsd,
        maxTurns,
        modelProfile,
      });
      gameId = started.gameId;
      console.log(`Run started on "${story.slug}" as ${values.persona}: Game ${gameId}`);
      printEstimate(started.estimate);
    } catch (err) {
      if (err instanceof RunPreflightError) printEstimate(err.estimate);
      throw err;
    }
  }

  const run = await playRunToEnd(gameId, (current, step) => {
    if (step) console.log(`  Turn ${step.turnsPlayed} played${step.done ? ` · ${step.outcome}` : ''}`);
    else console.log(`  Run already ${current.status}`);
  });

  const report = run.report;
  console.log(`\nRun ${run.status}: ${run.outcome}${report?.error ? ` — ${report.error}` : ''}`);
  if (report) {
    console.log(`Turns played: ${report.turns_played} · Ending: ${report.ending?.key ?? 'none'} · draft errors sent anyway: ${report.draft_errors}`);
    for (const score of report.scores ?? []) console.log(`  ${score.complaint.padEnd(9)} ${score.score}/5  ${score.evidence}`);
    if (!report.scores) console.log(`  not scored${report.scores_error ? `: ${report.scores_error}` : ''}`);
    for (const line of report.spend) {
      console.log(`  ${line.role.padEnd(8)} ${line.model.padEnd(20)} ${String(line.calls).padStart(3)} calls  ${usd(line.usd)}`);
    }
    console.log(`Spent ${usd(report.spent_usd)} of the ${usd(Number(run.cap_usd))} cap (estimate ${usd(Number(run.estimate_usd))}).`);
  }
  console.log(`Game: /admin/game/${gameId}`);
  if (run.status === 'failed') process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
