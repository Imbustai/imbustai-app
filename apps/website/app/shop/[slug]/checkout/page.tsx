import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { AddressRow, StoryRow } from '@/lib/types/db';
import { CheckoutClient } from '@/components/shop/checkout-client';
import { Button } from '@/components/ui/button';

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
    <div className="mx-auto max-w-lg px-4 py-12">
      <Button variant="ghost" asChild className="mb-6 -ml-2">
        <Link href={`/shop/${slug}`}>←</Link>
      </Button>
      <CheckoutClient
        story={story as StoryRow}
        addresses={(addresses ?? []) as AddressRow[]}
        cancelled={cancelled === '1'}
      />
    </div>
  );
}
