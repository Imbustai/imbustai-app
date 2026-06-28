import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

export const pill = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    // borderRadius: vars.radius.full,
    border: '1px solid transparent',
    paddingLeft: vars.space[3],
    paddingRight: vars.space[3],
    paddingTop: vars.space[1],
    paddingBottom: vars.space[1],
    fontFamily: vars.typography.fontFamily.body,
    fontSize: vars.typography.fontSize.caption,
    fontWeight: vars.typography.fontWeight.medium,
    lineHeight: vars.typography.lineHeight.tight,
    textDecoration: 'none',
    transition: 'color 150ms, background-color 150ms, border-color 150ms',
  },
  variants: {
    variant: {
      active: {
        borderColor: vars.color.primary,
        backgroundColor: vars.color.primary,
        color: vars.color.primaryForeground,
      },
      inactive: {
        borderColor: vars.color.border,
        color: vars.color.mutedForeground,
        selectors: {
          '&:hover': {
            borderColor: vars.color.foreground,
          },
        },
      },
    },
  },
  defaultVariants: {
    variant: 'inactive',
  },
});
