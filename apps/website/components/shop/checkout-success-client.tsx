'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Typography, Stack, Box } from '@imbustai/ds';

export function CheckoutSuccessClient({
  status,
}: {
  status: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  useEffect(() => {
    if (status === 'paid') return undefined;
    const id = window.setInterval(() => {
      router.refresh();
    }, 2500);
    return () => window.clearInterval(id);
  }, [status, router]);

  if (!status) {
    return (
      <Stack align="center">
        <Typography variant="body" tone="muted">{t('common.loading')}</Typography>
      </Stack>
    );
  }

  if (status !== 'paid') {
    return (
      <Stack align="center" gap="2">
        <Typography variant="h3">{t('common.loading')}</Typography>
        <Typography variant="caption" tone="muted">
          {t('shop.orderPending')}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="4">
      <Typography variant="h2">{t('shop.successTitle')}</Typography>
      <Typography variant="body" tone="muted">{t('shop.successBody')}</Typography>
      <Box marginTop="4">
        <Button asChild>
          <Link href="/shop">{t('shop.continueShopping')}</Link>
        </Button>
      </Box>
    </Stack>
  );
}
