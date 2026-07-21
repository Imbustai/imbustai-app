import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { CheckoutSuccessClient } from '@/components/shop/checkout-success-client';
import { Button, Typography, Box, Stack } from '@imbustai/ds';

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
      <Box maxWidth="md" marginX="auto" paddingX="4" paddingY="16">
        <Stack align="center" gap="4">
          <Typography variant="body" tone="muted">Missing session.</Typography>
          <Button asChild variant="link">
            <Link href="/shop">Shop</Link>
          </Button>
        </Stack>
      </Box>
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
    <Box maxWidth="md" marginX="auto" paddingX="4" paddingY="16">
      <CheckoutSuccessClient
        status={(order?.status as string | undefined) ?? null}
      />
    </Box>
  );
}
