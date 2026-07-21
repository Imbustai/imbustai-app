// Client-safe formatting for admin AI-cost displays. Costs are usually small
// (fractions of a cent to a few dollars), so show enough precision to be useful.

export function formatUsd(n: number): string {
  const v = Number(n) || 0;
  if (v === 0) return '$0';
  if (v < 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(2)}`;
}

export function formatTokens(n: number): string {
  return (Number(n) || 0).toLocaleString();
}
