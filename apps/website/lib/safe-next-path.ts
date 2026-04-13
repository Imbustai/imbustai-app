/** Safe internal redirect path (same-origin path only). */
export function safeNextPath(
  next: string | null | undefined,
  fallback = '/shop'
) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback;
  return next;
}
