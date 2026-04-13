import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/require-admin';
import type { AddressRow, ShippingSnapshot, StoryRow } from '@/lib/types/db';

export async function POST(request: Request) {
  const gate = await requireAdmin();
  if (!gate.ok) return gate.response;

  let body: { userId?: string; storyId?: string; addressId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { userId, storyId, addressId } = body;
  if (!userId || !storyId || !addressId) {
    return NextResponse.json(
      { error: 'Missing userId, storyId, or addressId' },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: address, error: aErr } = await admin
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single();

  if (aErr || !address) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  const { data: story, error: sErr } = await admin
    .from('stories')
    .select('*')
    .eq('id', storyId)
    .single();

  if (sErr || !story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const a = address as AddressRow;
  const st = story as StoryRow;
  const snapshot: ShippingSnapshot = {
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    postal_code: a.postal_code,
    country: a.country,
  };

  const paidAt = new Date().toISOString();
  const { data: order, error: oErr } = await admin
    .from('orders')
    .insert({
      user_id: userId,
      story_id: st.id,
      status: 'paid',
      source: 'admin',
      shipping_snapshot: snapshot,
      amount_cents: 0,
      currency: st.currency,
      paid_at: paidAt,
    })
    .select('id')
    .single();

  if (oErr || !order) {
    console.error(oErr);
    return NextResponse.json({ error: 'Could not create order' }, { status: 500 });
  }

  return NextResponse.json({ id: order.id });
}
