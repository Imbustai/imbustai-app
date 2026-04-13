'use client';

import { useTranslation } from '@imbustai/i18n';

export function ClientSectionTitle({
  titleKey,
  asSpan,
}: {
  titleKey: string;
  asSpan?: boolean;
}) {
  const { t } = useTranslation();
  if (asSpan) return <span>{t(titleKey)}</span>;
  return <>{t(titleKey)}</>;
}
