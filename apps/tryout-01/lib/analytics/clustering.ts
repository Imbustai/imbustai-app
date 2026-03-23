import type { ClusterResult } from './types';
import { normalizeMatrix } from './statistics';

function euclidean(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

function initKMeansPP(data: number[][], k: number, rng: () => number): number[][] {
  const centroids: number[][] = [];
  const firstIdx = Math.floor(rng() * data.length);
  centroids.push([...data[firstIdx]]);

  for (let c = 1; c < k; c++) {
    const distances = data.map((point) => {
      let minDist = Infinity;
      for (const centroid of centroids) {
        const d = euclidean(point, centroid);
        if (d < minDist) minDist = d;
      }
      return minDist * minDist;
    });
    const totalDist = distances.reduce((s, d) => s + d, 0);
    let threshold = rng() * totalDist;
    let chosen = 0;
    for (let i = 0; i < distances.length; i++) {
      threshold -= distances[i];
      if (threshold <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push([...data[chosen]]);
  }

  return centroids;
}

/** Seeded pseudo-random number generator (mulberry32) for deterministic results */
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function kMeans(
  rawData: number[][],
  k: number,
  maxIter = 50,
  seed = 42
): ClusterResult {
  if (rawData.length === 0 || k <= 0) {
    return { assignments: [], centroids: [], k };
  }

  const effectiveK = Math.min(k, rawData.length);
  const data = normalizeMatrix(rawData);
  const dims = data[0].length;
  const rng = seededRng(seed);

  let centroids = initKMeansPP(data, effectiveK, rng);
  let assignments = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    const newAssignments = data.map((point) => {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = euclidean(point, centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      return best;
    });

    let converged = true;
    for (let i = 0; i < newAssignments.length; i++) {
      if (newAssignments[i] !== assignments[i]) {
        converged = true;
        converged = false;
        break;
      }
    }
    assignments = newAssignments;
    if (converged) break;

    const newCentroids: number[][] = Array.from({ length: effectiveK }, () =>
      new Array(dims).fill(0)
    );
    const counts = new Array(effectiveK).fill(0);
    for (let i = 0; i < data.length; i++) {
      const c = assignments[i];
      counts[c]++;
      for (let d = 0; d < dims; d++) {
        newCentroids[c][d] += data[i][d];
      }
    }
    for (let c = 0; c < effectiveK; c++) {
      if (counts[c] > 0) {
        for (let d = 0; d < dims; d++) {
          newCentroids[c][d] /= counts[c];
        }
      } else {
        newCentroids[c] = [...centroids[c]];
      }
    }
    centroids = newCentroids;
  }

  return { assignments, centroids, k: effectiveK };
}

export function silhouetteScore(rawData: number[][], assignments: number[]): number {
  if (rawData.length < 2) return 0;
  const data = normalizeMatrix(rawData);
  const clusters = new Set(assignments);
  if (clusters.size < 2) return 0;

  let totalScore = 0;
  for (let i = 0; i < data.length; i++) {
    const myCluster = assignments[i];
    let intraCount = 0;
    let intraSum = 0;
    const interSums = new Map<number, number>();
    const interCounts = new Map<number, number>();

    for (let j = 0; j < data.length; j++) {
      if (i === j) continue;
      const d = euclidean(data[i], data[j]);
      if (assignments[j] === myCluster) {
        intraSum += d;
        intraCount++;
      } else {
        const c = assignments[j];
        interSums.set(c, (interSums.get(c) ?? 0) + d);
        interCounts.set(c, (interCounts.get(c) ?? 0) + 1);
      }
    }

    const a = intraCount > 0 ? intraSum / intraCount : 0;
    let b = Infinity;
    for (const [c, sum] of interSums) {
      const avg = sum / (interCounts.get(c) ?? 1);
      if (avg < b) b = avg;
    }
    if (b === Infinity) b = 0;

    const s = Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
    totalScore += s;
  }

  return totalScore / data.length;
}
