'use client';

import { useTranslation } from '@imbustai/i18n';

export function AdminPageTitle({
  titleKey,
  subtitleKey,
}: {
  titleKey: string;
  subtitleKey: string;
}) {
  const { t } = useTranslation();
  return (
    <header>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        {t(titleKey)}
      </h1>
      <p className="mt-2 text-muted-foreground">{t(subtitleKey)}</p>
    </header>
  );
}
