import { createElement, forwardRef } from 'react';
import { pill } from './Pill.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type Variants = NonNullable<RecipeVariants<typeof pill>>;

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type PillProps = Variants &
  AriaProps & {
    children?: React.ReactNode;
    id?: string;
    ref?: React.Ref<HTMLSpanElement>;
  };

export const Pill = forwardRef<HTMLSpanElement, PillProps>(function Pill(
  { variant, children, ...rest },
  ref
) {
  return createElement(
    'span',
    { 'data-slot': 'pill', className: pill({ variant }), ref, ...rest },
    children
  );
});
