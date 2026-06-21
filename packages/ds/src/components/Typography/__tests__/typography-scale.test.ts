import { describe, it, expect } from 'vitest';
import { TYPOGRAPHY_SCALE } from '../typography-scale';

const VALID_FONTS = ['heading', 'body'] as const;
const VALID_WEIGHTS = ['regular', 'medium', 'semibold', 'bold'] as const;
const VALID_LINE_HEIGHTS = ['tight', 'snug', 'normal', 'relaxed'] as const;
const VALID_TRACKINGS = ['tight', 'normal', 'wide', 'widest'] as const;

const HEADING_VARIANTS = ['display', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const BODY_VARIANTS = ['lead', 'bodyLg', 'body', 'bodySm', 'caption', 'overline'] as const;

describe('TYPOGRAPHY_SCALE', () => {
  it.each(Object.entries(TYPOGRAPHY_SCALE))('%s has valid font', (_, entry) => {
    expect(VALID_FONTS).toContain(entry.font);
  });

  it.each(Object.entries(TYPOGRAPHY_SCALE))('%s has valid weight', (_, entry) => {
    expect(VALID_WEIGHTS).toContain(entry.weight);
  });

  it.each(Object.entries(TYPOGRAPHY_SCALE))('%s has valid lineHeight', (_, entry) => {
    expect(VALID_LINE_HEIGHTS).toContain(entry.lineHeight);
  });

  it.each(Object.entries(TYPOGRAPHY_SCALE))('%s has valid tracking (or null)', (_, entry) => {
    if (entry.tracking !== null) {
      expect(VALID_TRACKINGS).toContain(entry.tracking);
    }
  });

  it.each(HEADING_VARIANTS)('%s uses heading font', (variant) => {
    expect(TYPOGRAPHY_SCALE[variant].font).toBe('heading');
  });

  it.each(BODY_VARIANTS)('%s uses body font', (variant) => {
    expect(TYPOGRAPHY_SCALE[variant].font).toBe('body');
  });

  it('covers all 13 variants', () => {
    expect(Object.keys(TYPOGRAPHY_SCALE)).toHaveLength(13);
  });
});
