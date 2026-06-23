const fontFamily = {
  heading: "var(--font-futura-condensed), 'Futura', ui-sans-serif, system-ui, sans-serif",
  body: "var(--font-archivo), ui-sans-serif, system-ui, sans-serif",
};

const fontSize = {
  display: 'clamp(3.5rem, 16vw, 5rem)',
  h1: 'clamp(2.75rem, 8vw, 4rem)',
  h2: 'clamp(2rem, 5vw, 3rem)',
  h3: 'clamp(1.5rem, 3vw, 2rem)',
  h4: 'clamp(1.25rem, 2.5vw, 1.5rem)',
  body: '1rem',
  caption: '0.8125rem',
  overline: '0.75rem',
};

const lineHeight = {
  tight: '1.1',
  snug: '1.25',
  normal: '1.5',
  relaxed: '1.6',
};

const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

const letterSpacing = {
  tight: '-0.02em',
  normal: '0em',
  wide: '0.04em',
  widest: '0.1em',
};

const space = {
  '0': '0px',
  '1': '0.25rem',
  '2': '0.5rem',
  '3': '0.75rem',
  '4': '1rem',
  '5': '1.25rem',
  '6': '1.5rem',
  '8': '2rem',
  '10': '2.5rem',
  '12': '3rem',
  '16': '4rem',
  '20': '5rem',
  '24': '6rem',
};

const shadow = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
};

export const sharedValues = {
  typography: { fontFamily, fontSize, lineHeight, fontWeight, letterSpacing },
  space,
  shadow,
};
