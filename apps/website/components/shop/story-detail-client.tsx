'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import type { StoryRow } from '@/lib/types/db';
import { storyDescription, storyTitle } from '@/lib/story-i18n';
import { Button, Typography, Stack, Box } from '@imbustai/ds';

export function StoryDetailClient({
  story,
  priceLabel,
}: {
  story: StoryRow;
  priceLabel: string;
}) {
  const { t, locale } = useTranslation();

  return (
    <Stack as="article" gap="4">
      <Typography variant="h1">{storyTitle(story, locale)}</Typography>
      <Typography variant="body" tone="muted">
        {storyDescription(story, locale)}
      </Typography>
      <Box marginTop="4">
        <Typography variant="caption">
          {t('common.price')}: {priceLabel}
        </Typography>
      </Box>
      <Box marginTop="4">
        <Button asChild size="lg">
          <Link href={`/shop/${story.slug}/checkout`}>{t('shop.buy')}</Link>
        </Button>
      </Box>
    </Stack>
  );
}
