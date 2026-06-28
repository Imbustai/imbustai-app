'use client';

import { useTranslation } from '@imbustai/i18n';
import { Typography, Box } from '@imbustai/ds';

export function ShopPageHeader() {
  const { t } = useTranslation();
  return (
    <Box as="header" display="flex" flexDirection="column" gap="2" marginBottom="10">
      <Typography variant="h1">{t('shop.title')}</Typography>
      <Typography variant="body" tone="muted">{t('shop.subtitle')}</Typography>
    </Box>
  );
}
