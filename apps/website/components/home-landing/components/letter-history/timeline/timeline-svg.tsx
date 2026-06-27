'use client';

import { useId, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  BRANCH_PATHS,
  KEY_EVENT_DOTS,
  MAIN_PATH_D,
  MERGE_PATHS,
  SUB_BRANCH_PATHS,
  TIMELINE_VIEWBOX,
  getTimelineStepState,
} from './timeline-config';
import { TimelineDot } from './timeline-dot';
import { TimelinePath } from './timeline-path';
import { TimelineRails } from './timeline-rails';

/** React `useId()` may include `:` which breaks `url(#id)` references in SVG filters. */
function useSafeSvgFilterIds() {
  const reactId = useId();
  return useMemo(() => {
    const safe = reactId.replace(/[^a-zA-Z0-9_-]/g, '') || 'id';
    return {
      glow: `lh-glow-${safe}`,
      glowStrong: `lh-glow-strong-${safe}`,
      dot: `lh-dot-${safe}`,
    };
  }, [reactId]);
}

export function TimelineSvg({
  step,
  reducedMotion,
  ariaLabel,
}: {
  step: number;
  reducedMotion: boolean;
  ariaLabel: string;
}) {
  const safeStep = (step <= 0 ? 0 : step >= 2 ? 2 : step) as 0 | 1 | 2;
  const state = useMemo(() => getTimelineStepState(safeStep), [safeStep]);
  const { glow: glowId, glowStrong: glowStrongId, dot: dotGlowId } =
    useSafeSvgFilterIds();

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-md border border-border',
        'aspect-[9/16] sm:aspect-[29/9]',
        'bg-foreground text-background',
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        className="block h-full w-full"
        viewBox={`0 0 ${TIMELINE_VIEWBOX.w} ${TIMELINE_VIEWBOX.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter
            id={glowId}
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id={glowStrongId}
            x="-25%"
            y="-25%"
            width="150%"
            height="150%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="3.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id={dotGlowId}
            x="-80%"
            y="-80%"
            width="260%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="text-background/12">
          {Array.from({ length: 48 }, (_, i) => (
            <line
              key={i}
              x1={(i + 0.5) * (TIMELINE_VIEWBOX.w / 48)}
              y1={0}
              x2={(i + 0.5) * (TIMELINE_VIEWBOX.w / 48)}
              y2={TIMELINE_VIEWBOX.h}
              stroke="currentColor"
              strokeWidth={0.6}
            />
          ))}
        </g>

        {BRANCH_PATHS.map((b) => (
          <TimelinePath
            key={b.id}
            id={b.id}
            d={b.d}
            state={state.branches[b.id]!}
            reducedMotion={reducedMotion}
          />
        ))}

        {SUB_BRANCH_PATHS.map((s) => (
          <TimelinePath
            key={s.id}
            id={s.id}
            d={s.d}
            state={state.subs[s.id]!}
            reducedMotion={reducedMotion}
          />
        ))}

        {MERGE_PATHS.map((m) => (
          <TimelinePath
            key={m.id}
            id={m.id}
            d={m.d}
            state={state.merges[m.id]!}
            reducedMotion={reducedMotion}
          />
        ))}

        <TimelinePath
          id="letter-history-main"
          d={MAIN_PATH_D}
          state={state.main}
          reducedMotion={reducedMotion}
          filterId={safeStep >= 2 ? glowStrongId : glowId}
        />

        {KEY_EVENT_DOTS.map((k) => (
          <TimelineDot
            key={k.id}
            id={k.id}
            cx={k.cx}
            cy={k.cy}
            state={state.dots[k.id]!}
            reducedMotion={reducedMotion}
            filterId={dotGlowId}
          />
        ))}

        <TimelineRails
          state={state.rails}
          reducedMotion={reducedMotion}
          viewW={TIMELINE_VIEWBOX.w}
          viewH={TIMELINE_VIEWBOX.h}
        />
      </svg>
    </div>
  );
}
