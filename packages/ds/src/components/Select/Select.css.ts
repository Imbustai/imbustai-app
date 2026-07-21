import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const select = recipe({
  base: {
    display: 'flex',
    height: vars.space[10],
    width: '100%',
    minWidth: 0,
    borderRadius: vars.radius.none,
    border: `1px solid ${vars.color.input}`,
    backgroundColor: 'transparent',
    paddingLeft: vars.space[3],
    paddingRight: vars.space[8],
    paddingTop: vars.space[1],
    paddingBottom: vars.space[1],
    fontFamily: t.fontFamily.body,
    fontSize: t.fontSize.body,
    fontWeight: t.fontWeight.regular,
    lineHeight: t.lineHeight.normal,
    letterSpacing: t.letterSpacing.normal,
    color: vars.color.foreground,
    outline: 'none',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: `right ${vars.space[3]} center`,
    transitionProperty: 'box-shadow, border-color',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    selectors: {
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
