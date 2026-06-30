import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const textarea = recipe({
  base: {
    display: 'block',
    width: '100%',
    minWidth: 0,
    minHeight: '10rem',
    resize: 'vertical',
    borderRadius: vars.radius.none,
    border: `1px solid ${vars.color.input}`,
    backgroundColor: 'transparent',
    paddingLeft: vars.space[3],
    paddingRight: vars.space[3],
    paddingTop: vars.space[2],
    paddingBottom: vars.space[2],
    fontFamily: t.fontFamily.body,
    fontSize: t.fontSize.body,
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
    size: {
      sm: { minHeight: '5rem' },
      md: { minHeight: '10rem' },
      lg: { minHeight: '16rem' },
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
