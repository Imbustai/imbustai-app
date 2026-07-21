import { createElement, forwardRef } from 'react';
import { sidebar, sidebarHeader, sidebarFooter, sidebarItem } from './Sidebar.css';

type AriaProps = {
  [K in `aria-${string}`]?: string | boolean | undefined;
};

export type SidebarProps = AriaProps & {
  collapsed?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLElement>;
};

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(function Sidebar(
  { collapsed = false, children, ...rest },
  ref
) {
  return createElement(
    'aside',
    { 'data-slot': 'sidebar', className: sidebar({ collapsed }), ref, ...rest },
    children
  );
});

export type SidebarHeaderProps = AriaProps & {
  collapsed?: boolean;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
};

export const SidebarHeader = forwardRef<HTMLDivElement, SidebarHeaderProps>(
  function SidebarHeader({ collapsed = false, children, ...rest }, ref) {
    return createElement(
      'div',
      { 'data-slot': 'sidebar-header', className: sidebarHeader({ collapsed }), ref, ...rest },
      children
    );
  }
);

export type SidebarFooterProps = AriaProps & {
  children?: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
};

export const SidebarFooter = forwardRef<HTMLDivElement, SidebarFooterProps>(
  function SidebarFooter({ children, ...rest }, ref) {
    return createElement(
      'div',
      { 'data-slot': 'sidebar-footer', className: sidebarFooter({}), ref, ...rest },
      children
    );
  }
);

export type SidebarItemProps = AriaProps & {
  active?: boolean;
  collapsed?: boolean;
  children?: React.ReactNode;
  asChild?: boolean;
  ref?: React.Ref<HTMLElement>;
};

export const SidebarItem = forwardRef<HTMLElement, SidebarItemProps>(
  function SidebarItem({ active = false, collapsed = false, asChild, children, ...rest }, ref) {
    if (asChild) {
      const child = children as React.ReactElement<Record<string, unknown>>;
      if (child && typeof child === 'object' && 'props' in child) {
        return createElement(child.type as string, {
          ...child.props,
          className: sidebarItem({ active, collapsed }),
          ref,
          ...rest,
        });
      }
    }
    return createElement(
      'button',
      { 'data-slot': 'sidebar-item', className: sidebarItem({ active, collapsed }), ref, ...rest },
      children
    );
  }
);
