'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import type { StoryRow } from '@/lib/types/db';
import { formatMoney, storyDescription, storyTitle } from '@/lib/story-i18n';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function StoryGrid({ stories }: { stories: StoryRow[] }) {
  const { t, locale } = useTranslation();

  if (!stories.length) {
    return (
      <p className="text-center text-muted-foreground">{t('shop.empty')}</p>
    );
  }

  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((story) => (
        <li key={story.id}>
          <Card className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                {storyTitle(story, locale)}
              </CardTitle>
              <CardDescription className="line-clamp-3">
                {storyDescription(story, locale)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm font-medium">
                {t('common.price')}:{' '}
                {formatMoney(story.price_cents, story.currency)}
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button asChild variant="secondary" className="flex-1">
                <Link href={`/shop/${story.slug}`}>{t('shop.details')}</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href={`/shop/${story.slug}/checkout`}>
                  {t('shop.buy')}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </li>
      ))}
    </ul>
  );
}
