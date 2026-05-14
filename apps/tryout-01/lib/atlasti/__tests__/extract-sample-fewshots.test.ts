import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SampleFewshot } from '../types';
import { BASELINE_CODES, flattenCodes } from '../codebook';

const FEWSHOTS_PATH = resolve(__dirname, '..', 'sample-fewshots.json');

describe('sample-fewshots.json', () => {
  const raw = readFileSync(FEWSHOTS_PATH, 'utf-8');
  const fewshots = JSON.parse(raw) as SampleFewshot[];

  it('has a stable, non-trivial number of pairs', () => {
    expect(fewshots.length).toBeGreaterThanOrEqual(100);
  });

  it('every quoteText is non-empty', () => {
    for (const f of fewshots) {
      expect(f.quoteText.length).toBeGreaterThan(0);
    }
  });

  it('every code name resolves against the baseline codebook', () => {
    const baselineNames = new Set(flattenCodes(BASELINE_CODES).map((c) => c.name));
    const referenced = new Set(fewshots.flatMap((f) => f.codeNames));
    const unknown = [...referenced].filter((n) => !baselineNames.has(n));
    expect(unknown).toEqual([]);
  });

  it('only covers human-coded docs 12 f and 13 f', () => {
    const docs = new Set(fewshots.map((f) => f.doc));
    expect([...docs].sort()).toEqual(['12 f', '13 f']);
  });
});
