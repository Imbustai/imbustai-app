import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const input = recipe({
  base: {
    display: 'flex',
    height: vars.space[10],
    width: '100%',
    minWidth: 0,
    borderRadius: vars.radius.none,
    border: `1px solid ${vars.color.input}`,
    backgroundColor: 'transparent',
    paddingLeft: vars.space[3],
    paddingRight: vars.space[3],
    paddingTop: vars.space[1],
    paddingBottom: vars.space[1],
    fontFamily: t.fontFamily.body,
    fontSize: t.fontSize.bodySm,
    fontWeight: t.fontWeight.regular,
    lineHeight: t.lineHeight.normal,
    letterSpacing: t.letterSpacing.normal,
    color: vars.color.foreground,
    outline: 'none',
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    selectors: {
      '&::placeholder': {
        color: vars.color.mutedForeground,
      },
      '&:focus-visible': {
        borderColor: vars.color.ring,
        boxShadow: `0 0 0 3px ${vars.color.ring}`,
      },
      '&:disabled': {
        pointerEvents: 'none',
        cursor: 'not-allowed',
        opacity: 0.5,
      },
      '&[aria-invalid="true"]': {
        borderColor: vars.color.destructive,
        boxShadow: `0 0 0 3px ${vars.color.destructive}`,
      },
    },
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        transitionDuration: '0ms',
      },
    },
  },
  variants: {
    invalid: {
      true: {
        borderColor: vars.color.destructive,
      },
    },
  },
});
