import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { typescript: true });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !stripe) {
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    console.error('Stripe webhook signature error', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const admin = createAdminClient();
    const { error: evErr } = await admin
      .from('stripe_events')
      .insert({ id: event.id });

    if (evErr) {
      const isDup =
        evErr.code === '23505' ||
        evErr.message?.toLowerCase().includes('duplicate');
      if (isDup) {
        return NextResponse.json({ received: true });
      }
      console.error(evErr);
      return NextResponse.json({ error: 'Persist failed' }, { status: 500 });
    }

    const paidAt = new Date().toISOString();
    const { error: ordErr } = await admin
      .from('orders')
      .update({
        status: 'paid',
        paid_at: paidAt,
        stripe_payment_intent_id:
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      })
      .eq('id', orderId)
      .eq('status', 'pending_payment');

    if (ordErr) {
      console.error(ordErr);
    }
  }

  return NextResponse.json({ received: true });
}
