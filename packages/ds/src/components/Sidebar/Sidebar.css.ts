import { recipe } from '@vanilla-extract/recipes';
import { vars } from '../../theme/tokens';

export const sidebar = recipe({
  base: {
    display: 'flex',
    flexDirection: 'column',
    position: 'sticky',
    top: 0,
    alignSelf: 'flex-start',
    height: '100dvh',
    overflowY: 'auto',
    borderRight: `1px solid ${vars.color.border}`,
    backgroundColor: vars.color.card,
    transition: 'width 200ms ease-out',
    flexShrink: 0,
  },
  variants: {
    collapsed: {
      false: { width: '14rem' },
      true: { width: '4.5rem' },
    },
  },
  defaultVariants: {
    collapsed: false,
  },
});

export const sidebarHeader = recipe({
  base: {
    display: 'flex',
    height: '3.5rem',
    alignItems: 'center',
    paddingLeft: vars.space[3],
    paddingRight: vars.space[3],
    borderBottom: `1px solid ${vars.color.border}`,
  },
  variants: {
    collapsed: {
      false: { gap: vars.space[2] },
      true: { justifyContent: 'center' },
    },
  },
  defaultVariants: {
    collapsed: false,
  },
});

export const sidebarFooter = recipe({
  base: {
    padding: vars.space[2],
    borderTop: `1px solid ${vars.color.border}`,
  },
  variants: {},
});

export const sidebarItem = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    gap: vars.space[3],
    padding: `0.625rem ${vars.space[3]}`,
    fontSize: vars.typography.fontSize.caption,
    fontWeight: vars.typography.fontWeight.medium,
    textDecoration: 'none',
    transition: 'color 150ms, background-color 150ms',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    width: '100%',
  },
  variants: {
    active: {
      false: {
        color: vars.color.mutedForeground,
        selectors: {
          '&:hover': {
            backgroundColor: vars.color.muted,
            color: vars.color.foreground,
          },
        },
      },
      true: {
        backgroundColor: vars.color.primary,
        color: vars.color.primaryForeground,
        boxShadow: vars.shadow.sm,
      },
    },
    collapsed: {
      false: {},
      true: {
        justifyContent: 'center',
        padding: `0.625rem ${vars.space[2]}`,
      },
    },
  },
  defaultVariants: {
    active: false,
    collapsed: false,
  },
});
