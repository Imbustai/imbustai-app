'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';

export function AdminBackLink({
  href,
  labelKey,
}: {
  href: string;
  labelKey: string;
}) {
  const { t } = useTranslation();
  return (
    <Link
      href={href}
      className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
    >
      {t(labelKey)}
    </Link>
  );
}
