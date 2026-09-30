import type { Finding } from '../contract';

// Turn state machine guards (architecture §3). Single source of truth used by
// both the admin routes and the released-story auto-send path — there is no
// separate pipeline for auto-send, just this module deciding to call approve.

/** Publication stage controlling playability and automatic approval. */
export type StoryLifecycle = 'draft' | 'testing' | 'released';
/** Persisted Turn progression from submission through draft, approval and delivery. */
export type TurnStatus = 'pending_ai' | 'draft_ready' | 'approved' | 'sent';

/**
 * Whether any Finding blocks automatic approval; warnings alone do not.
 * @category Utilities
 */
export function hasErrors(findings: Pick<Finding, 'severity'>[]): boolean {
  return findings.some((f) => f.severity === 'error');
}

/**
 * Generate / regenerate is allowed before the turn is approved.
 * @category Utilities
 */
export function canGenerate(status: TurnStatus): boolean {
  return status === 'pending_ai' || status === 'draft_ready';
}

/**
 * Approve requires a reviewed draft; sent turns are immutable.
 * @category Utilities
 */
export function canApprove(status: TurnStatus): boolean {
  return status === 'draft_ready';
}

/**
 * A player may submit a new turn only when no turn is open.
 * @category Utilities
 */
export function isOpen(status: TurnStatus): boolean {
  return status !== 'sent';
}

/**
 * Released stories auto-send when canon validation finds no ERRORS
 * (warnings pass through — they are advisory). Testing stories never
 * auto-send; draft stories are not playable at all.
 * @category Utilities
 */
export function shouldAutoSend(
  lifecycle: StoryLifecycle,
  findings: Pick<Finding, 'severity'>[],
): boolean {
  return lifecycle === 'released' && !hasErrors(findings);
}
