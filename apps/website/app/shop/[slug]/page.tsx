import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StoryDetailClient } from '@/components/shop/story-detail-client';
import { formatMoney } from '@/lib/story-i18n';
import type { StoryRow } from '@/lib/types/db';
import { Button } from '@/components/ui/button';

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
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href="/shop">← Shop</Link>
      </Button>
      <StoryDetailClient story={s} priceLabel={formatMoney(s.price_cents, s.currency)} />
    </div>
  );
}
