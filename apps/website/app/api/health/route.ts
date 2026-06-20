import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lightweight, unauthenticated, side-effect-free healthcheck for Coolify.
export async function GET() {
  return NextResponse.json({ ok: true });
}
