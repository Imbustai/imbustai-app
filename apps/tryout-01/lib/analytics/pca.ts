import { mean } from './statistics';

/**
 * Project an N-dimensional dataset down to 2D using PCA via power iteration.
 * Returns [x, y][] for each input row.
 */
export function projectTo2D(matrix: number[][]): [number, number][] {
  if (matrix.length === 0) return [];
  const n = matrix.length;
  const dims = matrix[0].length;

  const means = Array.from({ length: dims }, (_, d) =>
    mean(matrix.map((row) => row[d]))
  );
  const centered = matrix.map((row) => row.map((v, d) => v - means[d]));

  const cov = covarianceMatrix(centered, dims);

  const pc1 = powerIteration(cov, dims, 200);
  const deflated = deflateMatrix(cov, pc1, dims);
  const pc2 = powerIteration(deflated, dims, 200);

  return centered.map((row) => [dot(row, pc1), dot(row, pc2)]);
}

function covarianceMatrix(centered: number[][], dims: number): number[][] {
  const n = centered.length;
  const cov: number[][] = Array.from({ length: dims }, () =>
    new Array(dims).fill(0)
  );
  for (let i = 0; i < dims; i++) {
    for (let j = i; j < dims; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      const val = sum / (n - 1 || 1);
      cov[i][j] = val;
      cov[j][i] = val;
    }
  }
  return cov;
}

function powerIteration(mat: number[][], dims: number, maxIter: number): number[] {
  let vec = Array.from({ length: dims }, (_, i) => (i === 0 ? 1 : 0.1 / (i + 1)));
  let norm = vecNorm(vec);
  vec = vec.map((v) => v / norm);

  for (let iter = 0; iter < maxIter; iter++) {
    const next = matVecMul(mat, vec);
    norm = vecNorm(next);
    if (norm === 0) break;
    const newVec = next.map((v) => v / norm);
    let delta = 0;
    for (let i = 0; i < dims; i++) delta += (newVec[i] - vec[i]) ** 2;
    vec = newVec;
    if (delta < 1e-10) break;
  }

  return vec;
}

function deflateMatrix(mat: number[][], vec: number[], dims: number): number[][] {
  const eigenvalue = dot(matVecMul(mat, vec), vec);
  const result: number[][] = Array.from({ length: dims }, () =>
    new Array(dims).fill(0)
  );
  for (let i = 0; i < dims; i++) {
    for (let j = 0; j < dims; j++) {
      result[i][j] = mat[i][j] - eigenvalue * vec[i] * vec[j];
    }
  }
  return result;
}

function matVecMul(mat: number[][], vec: number[]): number[] {
  return mat.map((row) => dot(row, vec));
}

function dot(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function vecNorm(v: number[]): number {
  return Math.sqrt(v.reduce((s, x) => s + x * x, 0));
}
