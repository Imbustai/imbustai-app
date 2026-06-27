'use client';

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { tooltipContent } from './Tooltip.css';

export type TooltipProviderProps = {
  delayDuration?: number;
  skipDelayDuration?: number;
  children: React.ReactNode;
};

export function TooltipProvider({ delayDuration = 200, skipDelayDuration = 300, children }: TooltipProviderProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      {children}
    </RadixTooltip.Provider>
  );
}

export type TooltipProps = {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function Tooltip({ children, open, defaultOpen, onOpenChange }: TooltipProps) {
  return (
    <RadixTooltip.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {children}
    </RadixTooltip.Root>
  );
}

export type TooltipTriggerProps = {
  asChild?: boolean;
  children: React.ReactNode;
};

export function TooltipTrigger({ asChild = true, children }: TooltipTriggerProps) {
  return <RadixTooltip.Trigger asChild={asChild}>{children}</RadixTooltip.Trigger>;
}

export type TooltipContentProps = {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
  children: React.ReactNode;
};

export function TooltipContent({ side = 'top', sideOffset = 4, children }: TooltipContentProps) {
  return (
    <RadixTooltip.Portal>
      <RadixTooltip.Content
        side={side}
        sideOffset={sideOffset}
        className={tooltipContent}
      >
        {children}
      </RadixTooltip.Content>
    </RadixTooltip.Portal>
  );
}
