import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const root = style({
  border: `1px solid ${vars.color.input}`,
  background: 'transparent',
  color: vars.color.foreground,
  selectors: {
    '&:focus-within': { borderColor: vars.color.ring, boxShadow: `0 0 0 3px ${vars.color.ring}` },
    '&[data-invalid="true"]': { borderColor: vars.color.destructive, boxShadow: `0 0 0 3px ${vars.color.destructive}` },
  },
});

export const toolbar = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space[1],
  alignItems: 'center',
  padding: vars.space[2],
  borderBottom: `1px solid ${vars.color.border}`,
  background: vars.color.muted,
});

export const toolbarButton = style({
  minWidth: vars.space[8],
  height: vars.space[8],
  padding: `0 ${vars.space[2]}`,
  border: 0,
  background: 'transparent',
  color: vars.color.foreground,
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.caption,
  cursor: 'pointer',
  selectors: {
    '&:hover:not(:disabled), &[data-active="true"]': { background: vars.color.accent, color: vars.color.accentForeground },
    '&:focus-visible': { outline: `2px solid ${vars.color.ring}`, outlineOffset: '1px' },
    '&:disabled': { cursor: 'not-allowed', opacity: 0.5 },
  },
});

export const headingSelect = style({
  height: vars.space[8],
  border: `1px solid ${vars.color.input}`,
  borderRadius: vars.radius.none,
  background: vars.color.background,
  color: vars.color.foreground,
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.caption,
});

export const editor = style({
  minHeight: '10rem',
  padding: `${vars.space[3]} ${vars.space[3]}`,
  outline: 'none',
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.body,
  lineHeight: t.lineHeight.relaxed,
});

globalStyle(`${editor} .ProseMirror`, { minHeight: '8rem', outline: 'none' });
globalStyle(`${editor} .ProseMirror p.is-editor-empty:first-child::before`, { color: vars.color.mutedForeground, content: 'attr(data-placeholder)', float: 'left', height: 0, pointerEvents: 'none' });
globalStyle(`${editor} .ProseMirror > :first-child`, { marginTop: 0 });
globalStyle(`${editor} .ProseMirror > :last-child`, { marginBottom: 0 });
globalStyle(`${editor} .ProseMirror p`, { marginTop: 0, marginBottom: vars.space[4] });
globalStyle(`${editor} .ProseMirror h1, ${editor} .ProseMirror h2, ${editor} .ProseMirror h3, ${editor} .ProseMirror h4, ${editor} .ProseMirror h5, ${editor} .ProseMirror h6`, { fontFamily: t.fontFamily.heading, lineHeight: t.lineHeight.tight, marginTop: vars.space[6], marginBottom: vars.space[3] });
globalStyle(`${editor} .ProseMirror h1`, { fontSize: t.fontSize.h1 });
globalStyle(`${editor} .ProseMirror h2`, { fontSize: t.fontSize.h2 });
globalStyle(`${editor} .ProseMirror h3`, { fontSize: t.fontSize.h3 });
globalStyle(`${editor} .ProseMirror h4`, { fontSize: t.fontSize.h4 });
globalStyle(`${editor} .ProseMirror h5, ${editor} .ProseMirror h6`, { fontSize: t.fontSize.body });
globalStyle(`${editor} .ProseMirror blockquote`, { borderLeft: `3px solid ${vars.color.border}`, color: vars.color.mutedForeground, margin: `${vars.space[4]} 0`, paddingLeft: vars.space[4] });
globalStyle(`${editor} .ProseMirror table`, { borderCollapse: 'collapse', margin: `${vars.space[4]} 0`, width: '100%' });
globalStyle(`${editor} .ProseMirror th, ${editor} .ProseMirror td`, { border: `1px solid ${vars.color.border}`, padding: vars.space[2], verticalAlign: 'top' });
globalStyle(`${editor} .ProseMirror th`, { background: vars.color.muted });
