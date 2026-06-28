'use client';

import { useTranslation } from '@imbustai/i18n';
import { Badge, Typography, Stack } from '@imbustai/ds';
import type { OrderSource, OrderStatus } from '@/lib/types/db';

export function OrderStatusBadge({
  status,
  source,
}: {
  status: OrderStatus;
  source: OrderSource;
}) {
  const { t } = useTranslation();
  const label =
    status === 'paid'
      ? t('orders.statusPaid')
      : status === 'pending_payment'
        ? t('orders.statusPending')
        : t('orders.statusCancelled');
  const sub =
    source === 'stripe' ? t('orders.sourceStripe') : t('orders.sourceAdmin');
  return (
    <Stack gap="1">
      <Badge variant={status === 'paid' ? 'default' : 'secondary'}>
        {label}
      </Badge>
      <Typography variant="caption" tone="muted">{sub}</Typography>
    </Stack>
  );
}
