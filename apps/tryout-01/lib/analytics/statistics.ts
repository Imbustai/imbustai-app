import type { DescriptiveStats, CorrelationEntry } from './types';

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xd = xs[i] - mx;
    const yd = ys[i] - my;
    num += xd * yd;
    dx += xd * xd;
    dy += yd * yd;
  }
  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function correlationMatrix(
  data: Record<string, number[]>,
  keys: string[]
): CorrelationEntry[] {
  const entries: CorrelationEntry[] = [];
  for (const rowKey of keys) {
    for (const colKey of keys) {
      entries.push({
        rowKey,
        colKey,
        value: pearsonCorrelation(data[rowKey], data[colKey]),
      });
    }
  }
  return entries;
}

export function descriptiveStats(label: string, values: number[]): DescriptiveStats {
  return {
    label,
    mean: mean(values),
    median: median(values),
    stddev: stddev(values),
    min: values.length > 0 ? Math.min(...values) : 0,
    max: values.length > 0 ? Math.max(...values) : 0,
    values,
  };
}

export function normalize01(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0.5);
  return values.map((v) => (v - min) / range);
}

export function normalizeMatrix(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  const cols = matrix[0].length;
  const mins = new Array(cols).fill(Infinity);
  const maxs = new Array(cols).fill(-Infinity);
  for (const row of matrix) {
    for (let c = 0; c < cols; c++) {
      if (row[c] < mins[c]) mins[c] = row[c];
      if (row[c] > maxs[c]) maxs[c] = row[c];
    }
  }
  return matrix.map((row) =>
    row.map((v, c) => {
      const range = maxs[c] - mins[c];
      return range === 0 ? 0.5 : (v - mins[c]) / range;
    })
  );
}
