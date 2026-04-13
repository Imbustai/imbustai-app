import type { Locale } from '@imbustai/i18n';
import type { StoryRow } from '@/lib/types/db';

export function storyTitle(story: StoryRow, locale: Locale) {
  return locale === 'it' ? story.title_it : story.title_en;
}

export function storyDescription(story: StoryRow, locale: Locale) {
  return locale === 'it' ? story.description_it : story.description_en;
}

export function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
