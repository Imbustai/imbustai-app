'use client';

import type { DotVisualState } from './timeline-config';

export function TimelineDot({
  id,
  cx,
  cy,
  state,
  reducedMotion,
  filterId,
}: {
  id: string;
  cx: number;
  cy: number;
  state: DotVisualState;
  reducedMotion: boolean;
  filterId: string;
}) {
  const transition = reducedMotion ? 'none' : 'opacity 520ms ease';
  const opacity = state.visible ? state.reveal : 0;

  return (
    <g id={id} transform={`translate(${cx} ${cy})`}>
      <rect
        x={-5}
        y={-5}
        width={10}
        height={10}
        rx={2}
        fill="var(--primary)"
        filter={`url(#${filterId})`}
        style={{ opacity, transition }}
      />
    </g>
  );
}
