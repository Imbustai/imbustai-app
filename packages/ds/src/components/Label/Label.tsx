import { createElement, forwardRef } from 'react';
import { label } from './Label.css';
import { typography } from '../Typography/Typography.css';

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type LabelProps = AriaProps & {
  children: React.ReactNode;
  htmlFor?: string;
  id?: string;
  ref?: React.Ref<HTMLLabelElement>;
};

export const Label = forwardRef<HTMLLabelElement, LabelProps>(function Label(
  { children, htmlFor, id, ...ariaRest },
  ref
) {
  return createElement(
    'label',
    {
      'data-slot': 'label',
      className: `${label} ${typography({ variant: 'bodySm' })}`,
      htmlFor,
      id,
      ref,
      ...ariaRest,
    },
    children
  );
});
