import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal native checkbox styled to match the rest of the UI. Avoids pulling in
 * a new radix-ui dependency for a single use site.
 *
 * Supports an indeterminate state via the `indeterminate` prop.
 */
type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  indeterminate?: boolean;
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ className, indeterminate, disabled, ...props }, ref) {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    React.useImperativeHandle(ref, () => innerRef.current as HTMLInputElement);

    React.useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = !!indeterminate;
      }
    }, [indeterminate]);

    return (
      <input
        ref={innerRef}
        type="checkbox"
        disabled={disabled}
        className={cn(
          'peer h-4 w-4 shrink-0 cursor-pointer rounded border border-input bg-background',
          'text-primary focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
