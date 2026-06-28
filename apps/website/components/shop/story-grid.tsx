'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import type { StoryRow } from '@/lib/types/db';
import { formatMoney, storyDescription, storyTitle } from '@/lib/story-i18n';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Typography,
  Grid,
  Box,
  Inline,
} from '@imbustai/ds';

export function StoryGrid({ stories }: { stories: StoryRow[] }) {
  const { t, locale } = useTranslation();

  if (!stories.length) {
    return (
      <Typography variant="body" tone="muted" align="center">
        {t('shop.empty')}
      </Typography>
    );
  }

  return (
    <Grid as="ul" columns={3} gap="6">
      {stories.map((story) => (
        <Box as="li" key={story.id} display="flex" height="full">
          <Card>
            <CardHeader>
              <CardTitle>{storyTitle(story, locale)}</CardTitle>
              <CardDescription>
                {storyDescription(story, locale)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="caption">
                {t('common.price')}:{' '}
                {formatMoney(story.price_cents, story.currency)}
              </Typography>
            </CardContent>
            <CardFooter>
              <Inline gap="2">
                <Button asChild variant="secondary">
                  <Link href={`/shop/${story.slug}`}>{t('shop.details')}</Link>
                </Button>
                <Button asChild>
                  <Link href={`/shop/${story.slug}/checkout`}>
                    {t('shop.buy')}
                  </Link>
                </Button>
              </Inline>
            </CardFooter>
          </Card>
        </Box>
      ))}
    </Grid>
  );
}
