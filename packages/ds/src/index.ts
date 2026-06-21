import { vars } from './theme/tokens';

import './theme/imbustai-light.css';
import './theme/imbustai-dark.css';
import './theme/default-light.css';
import './theme/default-dark.css';

export const dsVars = {
  color: vars.color,
  space: vars.space,
  radius: vars.radius,
  shadow: vars.shadow,
} as const;

export { dsStyle } from './utils/dsStyle';
export { DsSmoke } from './_smoke/DsSmoke';
export { Typography } from './components/Typography/Typography';
export type { TypographyProps } from './components/Typography/Typography';
export { TYPOGRAPHY_SCALE } from './components/Typography/typography-scale';
export type { TypographyVariant } from './components/Typography/typography-scale';
