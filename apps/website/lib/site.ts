/** Signup link for CTAs. Override with NEXT_PUBLIC_SIGNUP_URL. */
export const signupUrl =
  process.env.NEXT_PUBLIC_SIGNUP_URL?.trim() || '/register';

/**
 * Christmas gift landing page. It does not exist yet, so the CTA goes to the
 * shop until it does. Override with NEXT_PUBLIC_CHRISTMAS_URL.
 */
export const christmasUrl =
  process.env.NEXT_PUBLIC_CHRISTMAS_URL?.trim() || '/shop';
