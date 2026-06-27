import { styleVariants } from '@vanilla-extract/css';

export const gridColumns = styleVariants({
  1: { gridTemplateColumns: 'repeat(1, minmax(0, 1fr))' },
  2: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  3: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  4: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
  5: { gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' },
  6: { gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' },
});
