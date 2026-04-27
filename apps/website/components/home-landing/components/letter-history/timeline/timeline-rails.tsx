'use client';

import type { RailsVisualState } from './timeline-config';

export function TimelineRails({
  state,
  reducedMotion,
  viewW,
  viewH,
}: {
  state: RailsVisualState;
  reducedMotion: boolean;
  viewW: number;
  viewH: number;
}) {
  const margin = 22;
  const yTop = margin;
  const yBottom = viewH - margin;
  const x0 = 18;
  const x1 = viewW - 18;
  const lineOpacity = state.visible ? state.reveal : 0;
  const transition = reducedMotion ? 'none' : 'opacity 600ms ease';

  return (
    <g aria-hidden>
      <line
        x1={x0}
        y1={yTop}
        x2={x1}
        y2={yTop}
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ opacity: lineOpacity, transition }}
      />
      <line
        x1={x0}
        y1={yBottom}
        x2={x1}
        y2={yBottom}
        stroke="var(--primary)"
        strokeWidth={2.5}
        strokeLinecap="round"
        style={{ opacity: lineOpacity, transition }}
      />
    </g>
  );
}
