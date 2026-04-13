import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSessionUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import type { AddressRow, ShippingSnapshot, StoryRow } from '@/lib/types/db';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured' },
      { status: 500 }
    );
  }

  const user = await getSessionUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { storySlug?: string; addressId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { storySlug, addressId } = body;
  if (!storySlug || !addressId) {
    return NextResponse.json(
      { error: 'Missing storySlug or addressId' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', storySlug)
    .eq('is_published', true)
    .single();

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const { data: address } = await supabase
    .from('addresses')
    .select('*')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single();

  if (!address) {
    return NextResponse.json({ error: 'Address not found' }, { status: 404 });
  }

  const s = story as StoryRow;
  const a = address as AddressRow;
  const snapshot: ShippingSnapshot = {
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    postal_code: a.postal_code,
    country: a.country,
  };

  const admin = createAdminClient();
  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      story_id: s.id,
      status: 'pending_payment',
      source: 'stripe',
      shipping_snapshot: snapshot,
      amount_cents: s.price_cents,
      currency: s.currency,
    })
    .select('id')
    .single();

  if (orderErr || !order) {
    console.error(orderErr);
    return NextResponse.json(
      { error: 'Could not create order' },
      { status: 500 }
    );
  }

  const siteUrl = getSiteUrl();
  const productName = s.title_en;

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: s.currency,
            unit_amount: s.price_cents,
            product_data: {
              name: productName,
              description: s.slug,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop/${s.slug}/checkout?cancelled=1`,
      metadata: {
        order_id: order.id,
        user_id: user.id,
        story_id: s.id,
      },
    });
  } catch (e) {
    console.error(e);
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json(
      { error: 'Stripe session failed' },
      { status: 502 }
    );
  }

  if (!session.url) {
    await admin.from('orders').delete().eq('id', order.id);
    return NextResponse.json(
      { error: 'No checkout URL' },
      { status: 502 }
    );
  }

  const { error: updErr } = await admin
    .from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id);

  if (updErr) {
    console.error(updErr);
  }

  return NextResponse.json({ url: session.url });
}
