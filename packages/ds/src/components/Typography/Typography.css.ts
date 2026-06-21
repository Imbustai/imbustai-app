import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';
import { TYPOGRAPHY_SCALE } from './typography-scale';
import type { StyleRule } from '@vanilla-extract/css';

const t = vars.typography;

type ScaleEntry = (typeof TYPOGRAPHY_SCALE)[keyof typeof TYPOGRAPHY_SCALE];

function toStyle(entry: ScaleEntry): StyleRule {
  return {
    fontFamily: t.fontFamily[entry.font],
    fontSize: t.fontSize[entry.size],
    lineHeight: t.lineHeight[entry.lineHeight],
    fontWeight: t.fontWeight[entry.weight],
    ...(entry.transform ? { textTransform: entry.transform } : {}),
    ...(entry.tracking ? { letterSpacing: t.letterSpacing[entry.tracking] } : {}),
  };
}

const variantStyles = Object.fromEntries(
  Object.entries(TYPOGRAPHY_SCALE).map(([k, v]) => [k, toStyle(v)])
) as Record<keyof typeof TYPOGRAPHY_SCALE, StyleRule>;

export const typography = recipe({
  base: { margin: 0, color: vars.color.foreground },
  variants: {
    variant: variantStyles,
    tone: {
      default: { color: vars.color.foreground },
      muted: { color: vars.color.mutedForeground },
      primary: { color: vars.color.primary },
      onAccent: { color: vars.color.accentForeground },
    },
    align: {
      left: { textAlign: 'left' },
      center: { textAlign: 'center' },
      right: { textAlign: 'right' },
    },
  },
  defaultVariants: { variant: 'body', tone: 'default' },
});
