import type { StoryLifecycle, ValidationWarning } from '../types';
import { hasErrors } from '../validator';

// Turn state machine guards (architecture §3). Single source of truth used by
// both the admin routes and the released-story auto-send path — there is no
// separate pipeline for auto-send, just this module deciding to call approve.

export type TurnStatus = 'pending_ai' | 'draft_ready' | 'approved' | 'sent';

/** Generate / regenerate is allowed before the turn is approved. */
export function canGenerate(status: TurnStatus): boolean {
  return status === 'pending_ai' || status === 'draft_ready';
}

/** Approve requires a reviewed draft; sent turns are immutable. */
export function canApprove(status: TurnStatus): boolean {
  return status === 'draft_ready';
}

/** A player may submit a new turn only when no turn is open. */
export function isOpen(status: TurnStatus): boolean {
  return status !== 'sent';
}

/**
 * Released stories auto-send when canon validation finds no ERRORS
 * (warnings pass through — they are advisory). Testing stories never
 * auto-send; draft stories are not playable at all.
 */
export function shouldAutoSend(
  lifecycle: StoryLifecycle,
  warnings: ValidationWarning[],
): boolean {
  return lifecycle === 'released' && !hasErrors(warnings);
}
