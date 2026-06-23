import { createElement, forwardRef } from 'react';
import { card, cardHeader, cardContent, cardFooter } from './Card.css';
import { Typography } from '../Typography/Typography';
import type { RecipeVariants } from '@vanilla-extract/recipes';

type CardVariants = NonNullable<RecipeVariants<typeof card>>;

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

type BaseProps = AriaProps & {
  children?: React.ReactNode;
  id?: string;
};

export type CardProps = CardVariants & BaseProps & {
  ref?: React.Ref<HTMLDivElement>;
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { tone, bordered, children, ...rest },
  ref
) {
  return createElement(
    'div',
    { 'data-slot': 'card', className: card({ tone, bordered }), ref, ...rest },
    children
  );
});

export const CardHeader = forwardRef<HTMLDivElement, BaseProps & { ref?: React.Ref<HTMLDivElement> }>(
  function CardHeader({ children, ...rest }, ref) {
    return createElement(
      'div',
      { 'data-slot': 'card-header', className: cardHeader, ref, ...rest },
      children
    );
  }
);

export const CardContent = forwardRef<HTMLDivElement, BaseProps & { ref?: React.Ref<HTMLDivElement> }>(
  function CardContent({ children, ...rest }, ref) {
    return createElement(
      'div',
      { 'data-slot': 'card-content', className: cardContent, ref, ...rest },
      children
    );
  }
);

export const CardFooter = forwardRef<HTMLDivElement, BaseProps & { ref?: React.Ref<HTMLDivElement> }>(
  function CardFooter({ children, ...rest }, ref) {
    return createElement(
      'div',
      { 'data-slot': 'card-footer', className: cardFooter, ref, ...rest },
      children
    );
  }
);

export type CardTitleProps = BaseProps & {
  ref?: React.Ref<HTMLHeadingElement>;
};

export function CardTitle({ children, id, ...ariaRest }: CardTitleProps) {
  return createElement(Typography, { variant: 'h3', id, ...ariaRest, children });
}

export type CardDescriptionProps = BaseProps & {
  ref?: React.Ref<HTMLParagraphElement>;
};

export function CardDescription({ children, id, ...ariaRest }: CardDescriptionProps) {
  return createElement(Typography, { variant: 'bodySm', tone: 'muted', id, ...ariaRest, children });
}
