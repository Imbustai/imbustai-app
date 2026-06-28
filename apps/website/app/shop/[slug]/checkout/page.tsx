import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { AddressRow, StoryRow } from '@/lib/types/db';
import { CheckoutClient } from '@/components/shop/checkout-client';
import { Button, Box, Stack } from '@imbustai/ds';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const user = await getSessionUser();
  if (!user) {
    const { slug } = await params;
    redirect(`/login?next=${encodeURIComponent(`/shop/${slug}/checkout`)}`);
  }

  const { slug } = await params;
  const { cancelled } = await searchParams;
  const supabase = await createClient();

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!story) notFound();

  const { data: addresses } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  return (
    <Box maxWidth="lg" marginX="auto" paddingX="4" paddingY="12">
      <Stack gap="6">
        <Button variant="ghost" asChild>
          <Link href={`/shop/${slug}`}>←</Link>
        </Button>
        <CheckoutClient
          story={story as StoryRow}
          addresses={(addresses ?? []) as AddressRow[]}
          cancelled={cancelled === '1'}
        />
      </Stack>
    </Box>
  );
}
