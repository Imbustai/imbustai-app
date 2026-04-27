/**
 * SVG scene in viewBox units (wide canvas, ~29:9 friendly).
 * Paths use `pathLength={1}` in components so reveal is normalized without DOM measurement.
 */
export const TIMELINE_VIEWBOX = { w: 1160, h: 360 } as const;

/** Central “sacred timeline” trunk */
export const MAIN_PATH_D =
  'M 24 182 C 160 118 320 248 480 178 S 760 112 920 184 S 1040 238 1136 178';

export type BranchDef = {
  id: string;
  d: string;
  /** Step 1: treat as promoted (white) vs accent */
  promotedInStep1?: boolean;
};

/** First-order branches off the main flow */
export const BRANCH_PATHS: BranchDef[] = [
  {
    id: 'b0',
    d: 'M 132 176 Q 150 92 228 44',
    promotedInStep1: true,
  },
  {
    id: 'b1',
    d: 'M 198 186 Q 214 268 268 322',
  },
  {
    id: 'b2',
    d: 'M 312 168 Q 338 78 402 36',
    promotedInStep1: true,
  },
  {
    id: 'b3',
    d: 'M 388 188 Q 418 272 452 318',
  },
  {
    id: 'b4',
    d: 'M 512 172 Q 548 86 628 48',
    promotedInStep1: true,
  },
  {
    id: 'b5',
    d: 'M 596 188 Q 624 268 668 312',
  },
  {
    id: 'b6',
    d: 'M 708 180 Q 742 96 812 52',
  },
  {
    id: 'b7',
    d: 'M 848 186 Q 878 268 918 308',
  },
  {
    id: 'b8',
    d: 'M 968 174 Q 1008 88 1068 42',
    promotedInStep1: true,
  },
  {
    id: 'b9',
    d: 'M 1024 188 Q 1048 252 1088 296',
  },
];

/** Extra twigs that only matter from step 2 onward (shown in step 1 as “growing”). */
export const SUB_BRANCH_PATHS: { id: string; d: string }[] = [
  { id: 's0', d: 'M 210 62 Q 278 48 348 78' },
  { id: 's1', d: 'M 372 48 Q 448 36 518 72' },
  { id: 's2', d: 'M 598 58 Q 672 44 742 82' },
  { id: 's3', d: 'M 772 62 Q 842 52 912 88' },
  { id: 's4', d: 'M 998 58 Q 1068 52 1128 92' },
];

/**
 * Curves that read as “paths folding back” toward the trunk (step 3 only).
 * Coordinates are tuned to the main path band (~y 175–185).
 */
export const MERGE_PATHS: { id: string; d: string }[] = [
  { id: 'm0', d: 'M 228 44 Q 360 120 520 178' },
  { id: 'm1', d: 'M 268 318 Q 400 240 520 182' },
  { id: 'm2', d: 'M 402 36 Q 520 110 620 178' },
  { id: 'm3', d: 'M 452 318 Q 560 240 660 180' },
  { id: 'm4', d: 'M 628 48 Q 720 120 800 178' },
  { id: 'm5', d: 'M 668 312 Q 760 230 840 182' },
  { id: 'm6', d: 'M 1068 42 Q 980 110 900 178' },
  { id: 'm7', d: 'M 918 308 Q 880 230 820 184' },
];

/** Author “beats” along the trunk (step 3). Coordinates sit near the main path. */
export const KEY_EVENT_DOTS: { id: string; cx: number; cy: number }[] = [
  { id: 'k0', cx: 200, cy: 168 },
  { id: 'k1', cx: 420, cy: 172 },
  { id: 'k2', cx: 640, cy: 178 },
  { id: 'k3', cx: 860, cy: 176 },
  { id: 'k4', cx: 1020, cy: 180 },
];

export type PathVisualState = {
  visible: boolean;
  /** 0 = hidden along path, 1 = fully drawn */
  reveal: number;
  variant: 'primary' | 'accent';
  strokeWidth: number;
  /** 0–1 multiplier for stroke alpha when `visible` */
  strokeOpacity?: number;
};

export type DotVisualState = {
  visible: boolean;
  /** 0 = hidden, 1 = full */
  reveal: number;
};

export type RailsVisualState = {
  visible: boolean;
  reveal: number;
};

export type TimelineStepState = {
  main: PathVisualState;
  branches: Record<string, PathVisualState>;
  subs: Record<string, PathVisualState>;
  merges: Record<string, PathVisualState>;
  dots: Record<string, DotVisualState>;
  rails: RailsVisualState;
};

function branchStates(
  step: 0 | 1 | 2,
): Record<string, PathVisualState> {
  const out: Record<string, PathVisualState> = {};
  for (const b of BRANCH_PATHS) {
    const promoted = Boolean(b.promotedInStep1);
    if (step === 0) {
      out[b.id] = {
        visible: true,
        reveal: 0.42,
        variant: 'accent',
        strokeWidth: 1.35,
      };
    } else if (step === 1) {
      out[b.id] = {
        visible: true,
        reveal: promoted ? 0.98 : 0.62,
        variant: promoted ? 'primary' : 'accent',
        strokeWidth: promoted ? 1.85 : 1.35,
      };
    } else {
      out[b.id] = {
        visible: true,
        reveal: 0.62,
        variant: 'accent',
        strokeWidth: 1.15,
        strokeOpacity: 0.34,
      };
    }
  }
  return out;
}

function subStates(step: 0 | 1 | 2): Record<string, PathVisualState> {
  const out: Record<string, PathVisualState> = {};
  for (const s of SUB_BRANCH_PATHS) {
    if (step === 0) {
      out[s.id] = {
        visible: false,
        reveal: 0,
        variant: 'accent',
        strokeWidth: 1.1,
      };
    } else if (step === 1) {
      out[s.id] = {
        visible: true,
        reveal: 0.92,
        variant: 'accent',
        strokeWidth: 1.1,
      };
    } else {
      out[s.id] = {
        visible: true,
        reveal: 0.55,
        variant: 'accent',
        strokeWidth: 0.95,
        strokeOpacity: 0.28,
      };
    }
  }
  return out;
}

function mergeStates(step: 0 | 1 | 2): Record<string, PathVisualState> {
  const out: Record<string, PathVisualState> = {};
  for (const m of MERGE_PATHS) {
    if (step === 2) {
      out[m.id] = {
        visible: true,
        reveal: 1,
        variant: 'accent',
        strokeWidth: 1.2,
        strokeOpacity: 0.52,
      };
    } else {
      out[m.id] = {
        visible: false,
        reveal: 0,
        variant: 'accent',
        strokeWidth: 1,
        strokeOpacity: 0,
      };
    }
  }
  return out;
}

function dotStates(step: 0 | 1 | 2): Record<string, DotVisualState> {
  const out: Record<string, DotVisualState> = {};
  for (const k of KEY_EVENT_DOTS) {
    if (step === 2) {
      out[k.id] = { visible: true, reveal: 1 };
    } else {
      out[k.id] = { visible: false, reveal: 0 };
    }
  }
  return out;
}

export function getTimelineStepState(step: 0 | 1 | 2): TimelineStepState {
  const main: PathVisualState =
    step === 0
      ? { visible: true, reveal: 0.88, variant: 'primary', strokeWidth: 2.6 }
      : step === 1
        ? { visible: true, reveal: 1, variant: 'primary', strokeWidth: 2.85 }
        : { visible: true, reveal: 1, variant: 'primary', strokeWidth: 3.1 };

  const rails: RailsVisualState =
    step === 2
      ? { visible: true, reveal: 1 }
      : { visible: false, reveal: 0 };

  return {
    main,
    branches: branchStates(step),
    subs: subStates(step),
    merges: mergeStates(step),
    dots: dotStates(step),
    rails,
  };
}
