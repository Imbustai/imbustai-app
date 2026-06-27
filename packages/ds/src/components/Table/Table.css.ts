import { style, globalStyle } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const tableWrapper = style({
  position: 'relative',
  width: '100%',
  overflow: 'auto',
});

export const table = style({
  width: '100%',
  captionSide: 'bottom',
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.body,
  borderCollapse: 'collapse',
});

export const tableHeader = style({});

export const tableBody = style({});

globalStyle(`${tableBody} tr:last-child`, {
  borderBottom: 'none',
});

export const tableRow = style({
  borderBottom: `1px solid ${vars.color.border}`,
  transitionProperty: 'background-color',
  transitionDuration: '150ms',
  selectors: {
    '&:hover': { backgroundColor: vars.color.muted },
    '&[data-state="selected"]': { backgroundColor: vars.color.muted },
  },
});

export const tableHead = style({
  height: vars.space[10],
  paddingLeft: vars.space[2],
  paddingRight: vars.space[2],
  textAlign: 'left',
  verticalAlign: 'middle',
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.caption,
  fontWeight: t.fontWeight.medium,
  color: vars.color.mutedForeground,
  whiteSpace: 'nowrap',
});

export const tableCell = style({
  paddingLeft: vars.space[2],
  paddingRight: vars.space[2],
  paddingTop: vars.space[2],
  paddingBottom: vars.space[2],
  verticalAlign: 'middle',
});
