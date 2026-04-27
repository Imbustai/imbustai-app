'use client';

import { cn } from '@/lib/utils';
import type { PathVisualState } from './timeline-config';

export function TimelinePath({
  id,
  d,
  state,
  reducedMotion,
  filterId,
}: {
  id: string;
  d: string;
  state: PathVisualState;
  reducedMotion: boolean;
  filterId?: string;
}) {
  const dashOffset = 1 - Math.min(1, Math.max(0, state.reveal));
  const transition = reducedMotion
    ? 'none'
    : 'stroke-dashoffset 900ms cubic-bezier(0.33, 1, 0.68, 1), opacity 520ms ease, stroke 520ms ease, stroke-width 520ms ease';

  const pathOpacity = state.visible ? (state.strokeOpacity ?? 1) : 0;

  return (
    <path
      id={id}
      d={d}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray={1}
      strokeDashoffset={dashOffset}
      strokeWidth={state.strokeWidth}
      filter={filterId ? `url(#${filterId})` : undefined}
      className={cn(
        state.variant === 'primary'
          ? 'text-background'
          : 'text-landing-band-olive-accent',
      )}
      style={{
        opacity: pathOpacity,
        transition,
        pointerEvents: 'none',
      }}
    />
  );
}
