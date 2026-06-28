'use client';

import { useTranslation } from '@imbustai/i18n';
import { Typography } from '@imbustai/ds';

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
      <Typography variant="h2" as="h1">{t(titleKey)}</Typography>
      <Typography variant="body" tone="muted">{t(subtitleKey)}</Typography>
    </header>
  );
}
