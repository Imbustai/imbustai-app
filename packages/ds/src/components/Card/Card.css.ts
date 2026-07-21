import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';
import { dsStyle } from '../../utils/dsStyle';

export const card = recipe({
  base: {
    display: 'flex',
    flexDirection: 'column',
    gap: vars.space[6],
    paddingTop: vars.space[6],
    paddingBottom: vars.space[6],
    borderRadius: vars.radius.none,
    backgroundColor: vars.color.card,
    color: vars.color.cardForeground,
  },
  variants: {
    tone: {
      default: {},
      muted: {
        backgroundColor: vars.color.muted,
        color: vars.color.mutedForeground,
      },
      accent: {
        backgroundColor: vars.color.accent,
        color: vars.color.accentForeground,
        border: `1px solid ${vars.color.accent}`,
      },
    },
    bordered: {
      true: {
        border: `1px solid ${vars.color.border}`,
      },
      false: {},
    },
  },
  defaultVariants: {
    tone: 'default',
    bordered: true,
  },
});

export const cardHeader = dsStyle({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space[2],
  paddingLeft: vars.space[6],
  paddingRight: vars.space[6],
});

export const cardContent = dsStyle({
  paddingLeft: vars.space[6],
  paddingRight: vars.space[6],
});

export const cardFooter = dsStyle({
  display: 'flex',
  alignItems: 'center',
  paddingLeft: vars.space[6],
  paddingRight: vars.space[6],
});
