'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import type { StoryRow } from '@/lib/types/db';
import { storyDescription, storyTitle } from '@/lib/story-i18n';
import { Button } from '@/components/ui/button';

export function StoryDetailClient({
  story,
  priceLabel,
}: {
  story: StoryRow;
  priceLabel: string;
}) {
  const { t, locale } = useTranslation();

  return (
    <article>
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {storyTitle(story, locale)}
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
        {storyDescription(story, locale)}
      </p>
      <p className="mt-8 text-sm font-medium">
        {t('common.price')}: {priceLabel}
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href={`/shop/${story.slug}/checkout`}>{t('shop.buy')}</Link>
        </Button>
      </div>
    </article>
  );
}
