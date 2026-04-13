'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HiEnvelope, HiMiniPlus } from 'react-icons/hi2';
import { IconSwapper } from '@/components/ui/icon-swapper';
import { cn } from '@/lib/utils';

/**
 * Tweak these values to change grid density, spacing, and icon size.
 */
export const SECTION_HEADING_GRID_BG_LAYOUT = {
  /** Horizontal icon count */
  columns: 42,
  /** Vertical icon count */
  rows: 24,
  /** Gap between columns (px) — lower = denser */
  gapXPx: 4,
  /** Gap between rows (px) — lower = denser */
  gapYPx: 4,
  /** Base icon size in rem (hovered cell reaches hoverPeakScale × this) */
  iconRem: 1,
  /** Scale at the cell under the cursor */
  hoverPeakScale: 1.6,
  /**
   * Euclidean distance in “grid cells” at which neighbor scale returns to 1.
   * Larger = wider halo of enlarged icons.
   */
  influenceRadius: 8,
  /** After pointer leaves the grid, keep focus (envelope + neighbor scales) this long so swaps can finish */
  leaveDelayMs: 1500,
  /** How long size changes animate (CSS transition) */
  scaleTransitionMs: 280,
  /** Max width of the icon field (Tailwind max-width class) */
  maxWidthClass: '' as const,
  /** Inset from section edges */
  paddingClass: '' as const,
} as const;

type Layout = typeof SECTION_HEADING_GRID_BG_LAYOUT;

function pickCellIndex(
  clientX: number,
  clientY: number,
  rect: DOMRectReadOnly,
  layout: Layout
): number {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.min(
    layout.columns - 1,
    Math.max(0, Math.floor((x / rect.width) * layout.columns))
  );
  const row = Math.min(
    layout.rows - 1,
    Math.max(0, Math.floor((y / rect.height) * layout.rows))
  );
  return row * layout.columns + col;
}

/** Smoothstep: 0 at t≤0, 1 at t≥1, smooth in between */
function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function scaleForCell(
  cellIndex: number,
  focusIndex: number | null,
  layout: Layout
): number {
  if (focusIndex === null) return 1;
  const cols = layout.columns;
  const col = cellIndex % cols;
  const row = Math.floor(cellIndex / cols);
  const fc = focusIndex % cols;
  const fr = Math.floor(focusIndex / cols);
  const dist = Math.hypot(col - fc, row - fr);
  const t = 1 - dist / layout.influenceRadius;
  const falloff = smoothstep01(t);
  return 1 + (layout.hoverPeakScale - 1) * falloff;
}

function GridCell({
  active,
  iconRem,
  scale,
  scaleTransitionMs,
}: {
  active: boolean;
  iconRem: number;
  scale: number;
  scaleTransitionMs: number;
}) {
  const sizeStyle = { width: `${iconRem}rem`, height: `${iconRem}rem` };
  return (
    <span
      className="flex items-center justify-center will-change-transform"
      style={{
        transform: `scale(${scale})`,
        transition: `transform ${scaleTransitionMs}ms cubic-bezier(0.33, 1, 0.68, 1)`,
      }}
    >
      <IconSwapper>
        {active ? (
          <HiEnvelope
            className="shrink-0 text-landing-hero-fg/20"
            style={sizeStyle}
          />
        ) : (
          <HiMiniPlus
            className="shrink-0 text-landing-hero-fg/20"
            style={sizeStyle}
          />
        )}
      </IconSwapper>
    </span>
  );
}

export function SectionHeadingGridBG({
  layout: layoutOverrides,
}: {
  /** Override any field of `SECTION_HEADING_GRID_BG_LAYOUT` without copying the whole object. */
  layout?: Partial<Layout>;
} = {}) {
  const layout = useMemo(
    () => ({
      ...SECTION_HEADING_GRID_BG_LAYOUT,
      ...layoutOverrides,
    }),
    [
      layoutOverrides?.columns,
      layoutOverrides?.gapXPx,
      layoutOverrides?.gapYPx,
      layoutOverrides?.hoverPeakScale,
      layoutOverrides?.iconRem,
      layoutOverrides?.influenceRadius,
      layoutOverrides?.leaveDelayMs,
      layoutOverrides?.maxWidthClass,
      layoutOverrides?.paddingClass,
      layoutOverrides?.rows,
      layoutOverrides?.scaleTransitionMs,
    ]
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  const clearLeaveTimer = useCallback(() => {
    if (leaveTimerRef.current !== null) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearLeaveTimer(), [clearLeaveTimer]);

  const updateFocusFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = gridRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setFocusIndex(pickCellIndex(clientX, clientY, rect, layout));
    },
    [layout]
  );

  const handlePointerOnGrid = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      clearLeaveTimer();
      updateFocusFromEvent(e.clientX, e.clientY);
    },
    [clearLeaveTimer, updateFocusFromEvent]
  );

  const handleLeave = useCallback(() => {
    clearLeaveTimer();
    leaveTimerRef.current = setTimeout(() => {
      setFocusIndex(null);
      leaveTimerRef.current = null;
    }, layout.leaveDelayMs);
  }, [clearLeaveTimer, layout.leaveDelayMs]);

  const cellCount = layout.columns * layout.rows;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <div
        ref={gridRef}
        className={cn(
          'pointer-events-auto mx-auto grid h-full min-h-[50vh] w-full cursor-default select-none',
          layout.maxWidthClass,
          layout.paddingClass
        )}
        style={{
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${layout.rows}, minmax(0, 1fr))`,
          gap: `${layout.gapYPx}px ${layout.gapXPx}px`,
          alignContent: 'start',
        }}
        onMouseEnter={handlePointerOnGrid}
        onMouseMove={handlePointerOnGrid}
        onMouseLeave={handleLeave}
      >
        {Array.from({ length: cellCount }, (_, i) => (
          <GridCell
            key={i}
            active={focusIndex === i}
            iconRem={layout.iconRem}
            scale={scaleForCell(i, focusIndex, layout)}
            scaleTransitionMs={layout.scaleTransitionMs}
          />
        ))}
      </div>
    </div>
  );
}
