import { createGlobalTheme } from '@vanilla-extract/css';
import { vars } from './contract.css';
import { sharedValues } from './shared-values';

createGlobalTheme('html[data-palette="imbustai"]:not(.dark)', vars, {
  color: {
    brand: '#0057B8',
    signal: '#E53B2C',
    highlight: '#F6C500',
    surface: '#FAF7F0',
    contrast: '#111111',
    background: '#FAF7F0',
    foreground: '#111111',
    card: '#FFFFFF',
    cardForeground: '#111111',
    muted: '#F0EDE4',
    mutedForeground: '#555555',
    border: 'color-mix(in srgb, #111111 15%, transparent)',
    input: 'color-mix(in srgb, #111111 20%, transparent)',
    ring: '#0057B8',
    primary: '#0057B8',
    primaryForeground: '#FFFFFF',
    secondary: '#E53B2C',
    secondaryForeground: '#FFFFFF',
    accent: '#F6C500',
    accentForeground: '#111111',
    destructive: '#E53B2C',
    destructiveForeground: '#FFFFFF',
    popover: '#FFFFFF',
    popoverForeground: '#111111',
  },
  ...sharedValues,
  radius: {
    none: '0px',
    sm: '0px',
    md: '0px',
    lg: '0px',
    full: '9999px',
  },
});
