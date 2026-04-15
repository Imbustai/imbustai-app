'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { HiEnvelope, HiMiniPlus } from 'react-icons/hi2';
import { IconSwapper } from '@/components/ui/icon-swapper';
import { cn } from '@/lib/utils';

/** Grid cell size (px). Icons use 24×24 at scale 1, centered in the cell. */
const CELL_PX = 48;

/**
 * Tweak these values to change hover halo and timing (grid density is derived from 48px cells).
 */
export const SECTION_HEADING_GRID_BG_LAYOUT = {
  cellPx: CELL_PX,
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
  columns: number,
  rows: number
): number {
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  const col = Math.min(
    columns - 1,
    Math.max(0, Math.floor((x / rect.width) * columns))
  );
  const row = Math.min(
    rows - 1,
    Math.max(0, Math.floor((y / rect.height) * rows))
  );
  return row * columns + col;
}

/** Smoothstep: 0 at t≤0, 1 at t≥1, smooth in between */
function smoothstep01(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function scaleForCell(
  cellIndex: number,
  focusIndex: number | null,
  columns: number,
  layout: Layout
): number {
  if (focusIndex === null) return 1;
  const col = cellIndex % columns;
  const row = Math.floor(cellIndex / columns);
  const fc = focusIndex % columns;
  const fr = Math.floor(focusIndex / columns);
  const dist = Math.hypot(col - fc, row - fr);
  const t = 1 - dist / layout.influenceRadius;
  const falloff = smoothstep01(t);
  return 1 + (layout.hoverPeakScale - 1) * falloff;
}

function GridCell({
  active,
  scale,
  scaleTransitionMs,
}: {
  active: boolean;
  scale: number;
  scaleTransitionMs: number;
}) {
  return (
    <span
      className="flex size-12 items-center justify-center will-change-transform"
      style={{
        transform: `scale(${scale})`,
        transition: `transform ${scaleTransitionMs}ms cubic-bezier(0.33, 1, 0.68, 1)`,
      }}
    >
      <IconSwapper>
        {active ? (
          <HiEnvelope className="size-6 shrink-0 text-landing-hero-fg/20" />
        ) : (
          <HiMiniPlus className="size-6 shrink-0 text-landing-hero-fg/20" />
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
      layoutOverrides?.cellPx,
      layoutOverrides?.hoverPeakScale,
      layoutOverrides?.influenceRadius,
      layoutOverrides?.leaveDelayMs,
      layoutOverrides?.maxWidthClass,
      layoutOverrides?.paddingClass,
      layoutOverrides?.scaleTransitionMs,
    ]
  );

  const cellPx = layout.cellPx;

  const gridRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const [columns, setColumns] = useState(1);
  const [rows, setRows] = useState(1);

  useLayoutEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      const nextCols = Math.max(1, Math.floor(width / cellPx));
      const nextRows = Math.max(1, Math.floor(height / cellPx));
      setColumns((c) => (c === nextCols ? c : nextCols));
      setRows((r) => (r === nextRows ? r : nextRows));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cellPx]);

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
      setFocusIndex(
        pickCellIndex(clientX, clientY, rect, columns, rows)
      );
    },
    [columns, rows]
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

  useEffect(() => {
    setFocusIndex((i) => {
      if (i === null) return null;
      const max = columns * rows - 1;
      return Math.min(i, max);
    });
  }, [columns, rows]);

  const cellCount = columns * rows;

  return (
    <div
      className={cn(
        'pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] w-[100svw] max-w-none shrink-0 overflow-hidden',
        'ml-[calc(50%-50svw)]'
      )}
      aria-hidden
    >
      <div
        ref={gridRef}
        className={cn(
          'pointer-events-auto grid h-full w-full cursor-default select-none place-content-center',
          layout.maxWidthClass,
          layout.paddingClass
        )}
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellPx}px)`,
          gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
          gap: 0,
        }}
        onMouseEnter={handlePointerOnGrid}
        onMouseMove={handlePointerOnGrid}
        onMouseLeave={handleLeave}
      >
        {Array.from({ length: cellCount }, (_, i) => (
          <GridCell
            key={`${columns}x${rows}-${i}`}
            active={focusIndex === i}
            scale={scaleForCell(i, focusIndex, columns, layout)}
            scaleTransitionMs={layout.scaleTransitionMs}
          />
        ))}
      </div>
    </div>
  );
}
