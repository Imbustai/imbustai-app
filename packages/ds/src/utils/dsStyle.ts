import { style as veStyle } from '@vanilla-extract/css';
import type { StyleRule } from '@vanilla-extract/css';

type BlockedProperty =
  | 'fontFamily'
  | 'fontSize'
  | 'fontWeight'
  | 'lineHeight'
  | 'letterSpacing'
  | 'textTransform'
  | 'fontStyle'
  | 'textDecoration'
  | 'color';

type SafeStyleRule = Omit<StyleRule, BlockedProperty>;

export function dsStyle(rule: SafeStyleRule) {
  return veStyle(rule as StyleRule);
}
