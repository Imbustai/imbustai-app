import { createClient } from '@/lib/supabase/server';
import type { StoryRow } from '@/lib/types/db';
import { StoryGrid } from '@/components/shop/story-grid';
import { ShopPageHeader } from '@/components/shop/shop-page-header';
import { Container, Stack } from '@imbustai/ds';

export const dynamic = 'force-dynamic';

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  return (
    <Container>
      <Stack paddingY="12">
        <ShopPageHeader />
        <StoryGrid stories={(stories ?? []) as StoryRow[]} />
      </Stack>
    </Container>
  );
}
