import { createElement, forwardRef } from 'react';
import { textarea } from './Textarea.css';

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type TextareaProps = AriaProps & {
  invalid?: boolean;
  size?: 'sm' | 'md' | 'lg';
  id?: string;
  ref?: React.Ref<HTMLTextAreaElement>;
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  rows?: number;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onInput?: React.FormEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyUp?: React.KeyboardEventHandler<HTMLTextAreaElement>;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, size, ...rest }, ref) {
    return createElement('textarea', {
      'data-slot': 'textarea',
      className: textarea({ invalid: invalid || undefined, size }),
      'aria-invalid': invalid || undefined,
      ref,
      ...rest,
    });
  },
);
