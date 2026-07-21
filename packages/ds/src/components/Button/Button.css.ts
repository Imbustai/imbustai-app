import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const button = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: vars.space[2],
    whiteSpace: 'nowrap',
    borderRadius: vars.radius.none,
    fontFamily: t.fontFamily.body,
    fontSize: t.fontSize.body,
    fontWeight: t.fontWeight.medium,
    lineHeight: t.lineHeight.tight,
    letterSpacing: t.letterSpacing.normal,
    border: 'none',
    cursor: 'pointer',
    textDecoration: 'none',
    transitionProperty: 'background-color, box-shadow, opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'ease',
    outline: 'none',
    selectors: {
      '&:disabled': {
        pointerEvents: 'none',
        opacity: 0.5,
      },
      '&:focus-visible': {
        boxShadow: `0 0 0 3px ${vars.color.ring}`,
      },
      '&[aria-invalid="true"]': {
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
    variant: {
      primary: {
        backgroundColor: vars.color.primary,
        color: vars.color.primaryForeground,
        selectors: {
          '&:hover:not(:disabled)': {
            opacity: 0.9,
          },
        },
      },
      secondary: {
        backgroundColor: vars.color.secondary,
        color: vars.color.secondaryForeground,
        selectors: {
          '&:hover:not(:disabled)': {
            opacity: 0.8,
          },
        },
      },
      accent: {
        backgroundColor: vars.color.accent,
        color: vars.color.accentForeground,
        selectors: {
          '&:hover:not(:disabled)': {
            opacity: 0.9,
          },
        },
      },
      outline: {
        backgroundColor: 'transparent',
        color: vars.color.foreground,
        border: `1px solid ${vars.color.input}`,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: vars.color.accent,
            color: vars.color.accentForeground,
          },
        },
      },
      ghost: {
        backgroundColor: 'transparent',
        color: vars.color.foreground,
        selectors: {
          '&:hover:not(:disabled)': {
            backgroundColor: vars.color.accent,
            color: vars.color.accentForeground,
          },
        },
      },
      link: {
        backgroundColor: 'transparent',
        color: vars.color.primary,
        textUnderlineOffset: '4px',
        selectors: {
          '&:hover:not(:disabled)': {
            textDecoration: 'underline',
          },
        },
      },
      destructive: {
        backgroundColor: vars.color.destructive,
        color: vars.color.destructiveForeground,
        selectors: {
          '&:hover:not(:disabled)': {
            opacity: 0.9,
          },
        },
      },
    },
    size: {
      sm: {
        height: vars.space[8],
        paddingLeft: vars.space[3],
        paddingRight: vars.space[3],
        fontSize: t.fontSize.caption,
      },
      md: {
        height: vars.space[10],
        paddingLeft: vars.space[4],
        paddingRight: vars.space[4],
      },
      lg: {
        height: vars.space[12],
        paddingLeft: vars.space[8],
        paddingRight: vars.space[8],
        fontSize: t.fontSize.body,
      },
      icon: {
        height: vars.space[10],
        width: vars.space[10],
        padding: vars.space[0],
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});
