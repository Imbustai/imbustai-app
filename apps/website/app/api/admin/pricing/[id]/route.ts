import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/require-admin';
import { createAdminClient } from '@/lib/supabase/admin';

const NUMERIC_FIELDS = [
  'input_usd_per_mtok',
  'output_usd_per_mtok',
  'cache_read_usd_per_mtok',
  'cache_write_usd_per_mtok',
] as const;

// PATCH /api/admin/pricing/[id] — update prices/notes/provider/model (admin-only).
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.provider === 'string' && body.provider.trim()) patch.provider = body.provider.trim();
  if (typeof body.model === 'string' && body.model.trim()) patch.model = body.model.trim();
  if (typeof body.notes === 'string') patch.notes = body.notes;
  for (const f of NUMERIC_FIELDS) {
    if (body[f] !== undefined) {
      const n = Number(body[f]);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: `invalid_${f}` }, { status: 400 });
      }
      patch[f] = n;
    }
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('ai_model_pricing')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    const status = error.code === '23505' ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
  return NextResponse.json({ row: data });
}

// DELETE /api/admin/pricing/[id] — remove a model price row (admin-only).
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from('ai_model_pricing').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
