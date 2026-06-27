import { createElement } from 'react';
import { sprinkles } from '../../layout/sprinkles.css';
import type { Sprinkles } from '../../layout/sprinkles.css';

type AllowedTag =
  | 'div' | 'section' | 'article' | 'aside' | 'main' | 'nav'
  | 'header' | 'footer' | 'ul' | 'ol' | 'li' | 'span' | 'form';

type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };
type DataProps = { [K in `data-${string}`]?: string | boolean | number | undefined };

export type BoxProps = Sprinkles & AriaProps & DataProps & {
  as?: AllowedTag;
  children?: React.ReactNode;
  id?: string;
  role?: string;
  tabIndex?: number;
  ref?: React.Ref<HTMLElement>;
};

export function Box({ as = 'div', children, id, role, tabIndex, ref, ...rest }: BoxProps) {
  const sprinklesKeys = new Set<string>();
  const sprinklesProps: Record<string, unknown> = {};
  const htmlProps: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rest)) {
    if (isSprinklesProp(key)) {
      sprinklesProps[key] = value;
    } else {
      htmlProps[key] = value;
    }
  }

  return createElement(as, {
    className: sprinkles(sprinklesProps as Sprinkles),
    id,
    role,
    tabIndex,
    ref,
    ...htmlProps,
  }, children);
}

const SPRINKLES_PROPS = new Set([
  'display', 'flexDirection', 'flexWrap', 'alignItems', 'alignSelf',
  'justifyContent', 'gap', 'rowGap', 'columnGap',
  'padding', 'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'paddingX', 'paddingY',
  'margin', 'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'marginX', 'marginY',
  'position', 'width', 'maxWidth', 'height', 'borderRadius',
  'overflow', 'flexGrow', 'flexShrink',
]);

function isSprinklesProp(key: string): boolean {
  return SPRINKLES_PROPS.has(key);
}
