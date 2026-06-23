import { createElement, forwardRef } from 'react';
import { input } from './Input.css';

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type InputProps = AriaProps & {
  invalid?: boolean;
  id?: string;
  ref?: React.Ref<HTMLInputElement>;
  type?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onInput?: React.FormEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, ...rest },
  ref
) {
  return createElement('input', {
    'data-slot': 'input',
    className: input({ invalid: invalid || undefined }),
    'aria-invalid': invalid || undefined,
    ref,
    ...rest,
  });
});
