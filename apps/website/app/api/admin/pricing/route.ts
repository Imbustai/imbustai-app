import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const NUMERIC_FIELDS = [
  'input_usd_per_mtok',
  'output_usd_per_mtok',
  'cache_read_usd_per_mtok',
  'cache_write_usd_per_mtok',
] as const;

// POST /api/admin/pricing — create a model price row (admin-only).
export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const provider = typeof body?.provider === 'string' ? body.provider.trim() : '';
  const model = typeof body?.model === 'string' ? body.model.trim() : '';
  if (!provider || !model) {
    return NextResponse.json({ error: 'provider_and_model_required' }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    provider,
    model,
    notes: typeof body.notes === 'string' ? body.notes : '',
  };
  for (const f of NUMERIC_FIELDS) {
    const n = Number(body?.[f]);
    row[f] = Number.isFinite(n) && n >= 0 ? n : 0;
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('ai_model_pricing').insert(row).select('*').single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500; // unique violation on model
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ row: data });
}
