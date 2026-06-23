import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { button } from './Button.css';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type Variants = NonNullable<RecipeVariants<typeof button>>;

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type ButtonProps = Variants &
  AriaProps & {
    asChild?: boolean;
    children?: React.ReactNode;
    id?: string;
    ref?: React.Ref<HTMLButtonElement>;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    name?: string;
    value?: string;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseUp?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>;
    onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>;
    onFocus?: React.FocusEventHandler<HTMLButtonElement>;
    onBlur?: React.FocusEventHandler<HTMLButtonElement>;
    onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
    onKeyUp?: React.KeyboardEventHandler<HTMLButtonElement>;
  };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, fullWidth, asChild, children, ...rest },
  ref
) {
  const className = button({ variant, size, fullWidth });

  if (asChild) {
    return (
      <Slot className={className} ref={ref} {...(rest as any)}>
        {children}
      </Slot>
    );
  }

  return (
    <button data-slot="button" className={className} ref={ref} {...rest}>
      {children}
    </button>
  );
});
