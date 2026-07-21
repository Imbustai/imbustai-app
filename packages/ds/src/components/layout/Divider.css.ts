import { style } from '@vanilla-extract/css';
import { vars } from '../../theme/tokens';

export const divider = style({
  border: 'none',
  borderTop: `1px solid ${vars.color.border}`,
  margin: 0,
  width: '100%',
});
