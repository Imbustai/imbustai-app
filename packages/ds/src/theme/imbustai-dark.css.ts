import { createGlobalTheme } from '@vanilla-extract/css';
import { vars } from './contract.css';
import { sharedValues } from './shared-values';

createGlobalTheme('html[data-palette="imbustai"].dark', vars, {
  color: {
    brand: '#4A8FD4',
    signal: '#F06555',
    highlight: '#F6C500',
    surface: '#FAF7F0',
    contrast: '#FAF7F0',
    background: '#111111',
    foreground: '#FAF7F0',
    card: '#1A1A1A',
    cardForeground: '#FAF7F0',
    muted: '#222222',
    mutedForeground: '#999999',
    border: 'color-mix(in srgb, #FAF7F0 14%, transparent)',
    input: 'color-mix(in srgb, #FAF7F0 18%, transparent)',
    ring: '#4A8FD4',
    primary: '#4A8FD4',
    primaryForeground: '#111111',
    secondary: '#F06555',
    secondaryForeground: '#FFFFFF',
    accent: '#F6C500',
    accentForeground: '#111111',
    destructive: '#F06555',
    destructiveForeground: '#FFFFFF',
    popover: '#1A1A1A',
    popoverForeground: '#FAF7F0',
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
