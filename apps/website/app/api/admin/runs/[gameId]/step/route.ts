import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { WorkflowError, stepRun } from '@/lib/runs';

// One Turn of a Run takes several model calls.
export const maxDuration = 300;

// POST /api/admin/runs/[gameId]/step — play one Turn of a Run: the AI player
// writes, the batch is generated and approved automatically. The caller
// repeats until `status` is no longer "running". A Run that stops — on an
// Ending, its Turn limit, its cost cap or an error — answers 200 with its
// report: a failed Run is a result, not a failed request.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { gameId } = await params;
  try {
    const { run, step } = await stepRun(gameId);
    return NextResponse.json({
      status: run.status,
      outcome: run.outcome,
      turns_played: step?.turnsPlayed ?? run.report?.turns_played ?? 0,
      report: run.report,
    });
  } catch (err) {
    if (err instanceof WorkflowError) {
      return NextResponse.json({ error: err.code }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: 'run_step_failed' }, { status: 500 });
  }
}
