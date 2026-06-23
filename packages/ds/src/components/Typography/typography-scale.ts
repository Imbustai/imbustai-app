export const TYPOGRAPHY_SCALE = {
  display:  { font: 'heading', size: 'display',  lineHeight: 'tight',   weight: 'bold',     transform: 'uppercase', tracking: 'widest' },
  h1:       { font: 'heading', size: 'h1',       lineHeight: 'tight',   weight: 'bold',     transform: 'uppercase', tracking: 'wide' },
  h2:       { font: 'heading', size: 'h2',       lineHeight: 'snug',    weight: 'bold',     transform: 'uppercase', tracking: 'wide' },
  h3:       { font: 'heading', size: 'h3',       lineHeight: 'snug',    weight: 'semibold', transform: 'uppercase', tracking: 'normal' },
  h4:       { font: 'heading', size: 'h4',       lineHeight: 'snug',    weight: 'semibold', transform: null,        tracking: null },
  body:     { font: 'body',    size: 'body',     lineHeight: 'normal',  weight: 'regular',  transform: null,        tracking: null },
  caption:  { font: 'body',    size: 'caption',  lineHeight: 'normal',  weight: 'regular',  transform: null,        tracking: null },
  overline: { font: 'body',    size: 'overline', lineHeight: 'normal',  weight: 'medium',   transform: 'uppercase', tracking: 'widest' },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY_SCALE;
