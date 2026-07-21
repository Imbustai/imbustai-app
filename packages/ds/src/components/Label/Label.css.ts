import { vars } from '../../theme/tokens';
import { dsStyle } from '../../utils/dsStyle';

export const label = dsStyle({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space[2],
  userSelect: 'none',
});
