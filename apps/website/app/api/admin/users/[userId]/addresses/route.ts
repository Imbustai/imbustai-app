import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  const { userId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: data ?? [] });
}
