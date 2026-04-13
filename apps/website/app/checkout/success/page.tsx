import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CheckoutSuccessClient } from '@/components/shop/checkout-success-client';

export const dynamic = 'force-dynamic';

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const { session_id } = await searchParams;
  if (!session_id) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-muted-foreground">Missing session.</p>
        <Link href="/shop" className="mt-4 inline-block text-primary underline">
          Shop
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from('orders')
    .select('id,status,stripe_checkout_session_id')
    .eq('stripe_checkout_session_id', session_id)
    .eq('user_id', user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <CheckoutSuccessClient
        status={(order?.status as string | undefined) ?? null}
      />
    </div>
  );
}
