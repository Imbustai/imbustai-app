import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens';

const fadeIn = keyframes({
  from: { opacity: 0, transform: 'scale(0.96)' },
  to: { opacity: 1, transform: 'scale(1)' },
});

const fadeOut = keyframes({
  from: { opacity: 1, transform: 'scale(1)' },
  to: { opacity: 0, transform: 'scale(0.96)' },
});

export const tooltipContent = style({
  zIndex: 50,
  overflow: 'hidden',
  borderRadius: vars.radius.sm,
  backgroundColor: vars.color.foreground,
  color: vars.color.background,
  fontFamily: vars.typography.fontFamily.body,
  fontSize: vars.typography.fontSize.caption,
  lineHeight: vars.typography.lineHeight.snug,
  paddingLeft: vars.space[3],
  paddingRight: vars.space[3],
  paddingTop: vars.space[1],
  paddingBottom: vars.space[1],
  boxShadow: vars.shadow.sm,
  selectors: {
    '&[data-state="delayed-open"]': {
      animationName: fadeIn,
      animationDuration: '150ms',
      animationTimingFunction: 'ease-out',
    },
    '&[data-state="closed"]': {
      animationName: fadeOut,
      animationDuration: '100ms',
      animationTimingFunction: 'ease-in',
    },
  },
});
