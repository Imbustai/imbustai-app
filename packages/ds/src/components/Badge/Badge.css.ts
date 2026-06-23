import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const badge = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: vars.radius.none,
    paddingLeft: vars.space[2],
    paddingRight: vars.space[2],
    paddingTop: vars.space[1],
    paddingBottom: vars.space[1],
    fontFamily: t.fontFamily.body,
    fontSize: t.fontSize.overline,
    fontWeight: t.fontWeight.semibold,
    lineHeight: t.lineHeight.tight,
    letterSpacing: t.letterSpacing.widest,
    textTransform: 'uppercase',
    border: '1px solid transparent',
  },
  variants: {
    variant: {
      default: {
        backgroundColor: vars.color.primary,
        color: vars.color.primaryForeground,
      },
      primary: {
        backgroundColor: vars.color.primary,
        color: vars.color.primaryForeground,
      },
      secondary: {
        backgroundColor: vars.color.secondary,
        color: vars.color.secondaryForeground,
      },
      accent: {
        backgroundColor: vars.color.accent,
        color: vars.color.accentForeground,
      },
      outline: {
        backgroundColor: 'transparent',
        color: vars.color.foreground,
        borderColor: vars.color.border,
      },
      destructive: {
        backgroundColor: vars.color.destructive,
        color: vars.color.destructiveForeground,
      },
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});
