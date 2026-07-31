import { globalStyle, style } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens';

const t = vars.typography;

export const letterContent = style({
  color: vars.color.foreground,
  fontFamily: t.fontFamily.body,
  fontSize: t.fontSize.body,
  lineHeight: t.lineHeight.relaxed,
  overflowWrap: 'anywhere',
});

globalStyle(`${letterContent} > :first-child`, { marginTop: 0 });
globalStyle(`${letterContent} > :last-child`, { marginBottom: 0 });
globalStyle(`${letterContent} p`, { marginTop: 0, marginBottom: vars.space[4] });
globalStyle(`${letterContent} h1, ${letterContent} h2, ${letterContent} h3, ${letterContent} h4, ${letterContent} h5, ${letterContent} h6`, { fontFamily: t.fontFamily.heading, fontWeight: t.fontWeight.bold, lineHeight: t.lineHeight.tight, marginTop: vars.space[8], marginBottom: vars.space[3] });
globalStyle(`${letterContent} h1`, { fontSize: t.fontSize.h1 });
globalStyle(`${letterContent} h2`, { fontSize: t.fontSize.h2 });
globalStyle(`${letterContent} h3`, { fontSize: t.fontSize.h3 });
globalStyle(`${letterContent} h4`, { fontSize: t.fontSize.h4 });
globalStyle(`${letterContent} h5, ${letterContent} h6`, { fontSize: t.fontSize.body });
globalStyle(`${letterContent} ul, ${letterContent} ol`, { marginTop: 0, marginBottom: vars.space[4], paddingLeft: vars.space[8] });
globalStyle(`${letterContent} li + li`, { marginTop: vars.space[1] });
globalStyle(`${letterContent} blockquote`, { margin: `${vars.space[4]} 0`, paddingLeft: vars.space[4], borderLeft: `3px solid ${vars.color.border}`, color: vars.color.mutedForeground });
globalStyle(`${letterContent} hr`, { margin: `${vars.space[6]} 0`, border: 0, borderTop: `1px solid ${vars.color.border}` });
globalStyle(`${letterContent} a`, { color: vars.color.primary, textDecoration: 'underline', textUnderlineOffset: '3px' });
globalStyle(`${letterContent} table`, { width: '100%', borderCollapse: 'collapse', margin: `${vars.space[4]} 0`, display: 'block', overflowX: 'auto' });
globalStyle(`${letterContent} th, ${letterContent} td`, { border: `1px solid ${vars.color.border}`, padding: vars.space[2], textAlign: 'left', verticalAlign: 'top' });
globalStyle(`${letterContent} th`, { background: vars.color.muted, fontWeight: t.fontWeight.semibold });
