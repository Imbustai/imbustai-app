import { createElement, forwardRef } from 'react';
import { select } from './Select.css';

type AriaProps = { [K in `aria-${string}`]?: string | boolean | undefined };

export type SelectProps = AriaProps & {
  invalid?: boolean;
  id?: string;
  ref?: React.Ref<HTMLSelectElement>;
  name?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  children?: React.ReactNode;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  onFocus?: React.FocusEventHandler<HTMLSelectElement>;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, children, ...rest },
  ref
) {
  return createElement('select', {
    'data-slot': 'select',
    className: select({ invalid: invalid || undefined }),
    'aria-invalid': invalid || undefined,
    ref,
    ...rest,
  }, children);
});
