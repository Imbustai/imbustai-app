'use client';

import { useTranslation } from '@imbustai/i18n';

export function ShopPageHeader() {
  const { t } = useTranslation();
  return (
    <header className="mb-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
        {t('shop.title')}
      </h1>
      <p className="mt-2 text-muted-foreground">{t('shop.subtitle')}</p>
    </header>
  );
}
