import { createElement, forwardRef } from 'react';
import { badge } from './Badge.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type Variants = NonNullable<RecipeVariants<typeof badge>>;

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type BadgeProps = Variants &
  AriaProps & {
    children?: React.ReactNode;
    id?: string;
    ref?: React.Ref<HTMLSpanElement>;
  };

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { variant, children, ...rest },
  ref
) {
  return createElement(
    'span',
    { 'data-slot': 'badge', className: badge({ variant }), ref, ...rest },
    children
  );
});
