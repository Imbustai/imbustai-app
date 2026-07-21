import { createGlobalTheme } from '@vanilla-extract/css';
import { vars } from './contract.css';
import { sharedValues } from './shared-values';

createGlobalTheme('html[data-palette="default"]:not(.dark)', vars, {
  color: {
    brand: 'oklch(0.45 0.15 250)',
    signal: 'oklch(0.55 0.22 27)',
    highlight: 'oklch(0.8 0.15 85)',
    surface: 'oklch(0.985 0 0)',
    contrast: 'oklch(0.145 0 0)',
    background: 'oklch(1 0 0)',
    foreground: 'oklch(0.145 0 0)',
    card: 'oklch(1 0 0)',
    cardForeground: 'oklch(0.145 0 0)',
    muted: 'oklch(0.97 0 0)',
    mutedForeground: 'oklch(0.556 0 0)',
    border: 'oklch(0.922 0 0)',
    input: 'oklch(0.922 0 0)',
    ring: 'oklch(0.708 0 0)',
    primary: 'oklch(0.205 0 0)',
    primaryForeground: 'oklch(0.985 0 0)',
    secondary: 'oklch(0.97 0 0)',
    secondaryForeground: 'oklch(0.205 0 0)',
    accent: 'oklch(0.97 0 0)',
    accentForeground: 'oklch(0.205 0 0)',
    destructive: 'oklch(0.577 0.245 27.325)',
    destructiveForeground: 'oklch(0.985 0 0)',
    popover: 'oklch(1 0 0)',
    popoverForeground: 'oklch(0.145 0 0)',
  },
  ...sharedValues,
  radius: {
    none: '0px',
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.625rem',
    full: '9999px',
  },
});
