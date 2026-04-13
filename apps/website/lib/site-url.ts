/** Canonical site origin for auth redirects and Stripe callbacks. No trailing slash. */
export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  return 'http://localhost:3000';
}
