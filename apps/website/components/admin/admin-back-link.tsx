'use client';

import { useTranslation } from '@imbustai/i18n';
import { Box } from '@imbustai/ds';
import Link from 'next/link';
import s from './admin-styles.module.css';

export function AdminBackLink({
  href,
  labelKey,
}: {
  href: string;
  labelKey: string;
}) {
  const { t } = useTranslation();
  return (
    <Box marginBottom="4" display="inline-block">
      <Link href={href} className={s.mutedLink}>
        {t(labelKey)}
      </Link>
    </Box>
  );
}
