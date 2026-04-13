import { createClient } from '@/lib/supabase/server';
import type { StoryRow } from '@/lib/types/db';
import { StoryGrid } from '@/components/shop/story-grid';
import { ShopPageHeader } from '@/components/shop/shop-page-header';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <ShopPageHeader />
      <StoryGrid stories={(stories ?? []) as StoryRow[]} />
    </div>
  );
}
