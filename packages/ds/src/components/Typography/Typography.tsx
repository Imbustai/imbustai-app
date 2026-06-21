import { createElement } from 'react';
import { typography } from './Typography.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type Variants = NonNullable<RecipeVariants<typeof typography>>;

type AllowedTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'label' | 'div';

const defaultTag: Record<NonNullable<Variants['variant']>, AllowedTag> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  lead: 'p',
  bodyLg: 'p',
  body: 'p',
  bodySm: 'p',
  caption: 'span',
  overline: 'span',
};

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type TypographyProps = Variants & AriaProps & {
  as?: AllowedTag;
  children: React.ReactNode;
  id?: string;
};

export function Typography({
  variant = 'body',
  tone,
  align,
  as,
  children,
  id,
  ...ariaRest
}: TypographyProps) {
  const Tag = as ?? defaultTag[variant!] ?? 'p';
  return createElement(
    Tag,
    { className: typography({ variant, tone, align }), id, ...ariaRest },
    children,
  );
}
