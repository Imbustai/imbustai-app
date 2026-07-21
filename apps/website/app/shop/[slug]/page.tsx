import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StoryDetailClient } from '@/components/shop/story-detail-client';
import { formatMoney } from '@/lib/story-i18n';
import type { StoryRow } from '@/lib/types/db';
import { Button, Box, Stack } from '@imbustai/ds';

export const dynamic = 'force-dynamic';

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (!story) notFound();

  const s = story as StoryRow;

  return (
    <Box maxWidth="2xl" marginX="auto" paddingX="4" paddingY="12">
      <Stack gap="6">
        <Button variant="ghost" asChild>
          <Link href="/shop">← Shop</Link>
        </Button>
        <StoryDetailClient story={s} priceLabel={formatMoney(s.price_cents, s.currency)} />
      </Stack>
    </Box>
  );
}
