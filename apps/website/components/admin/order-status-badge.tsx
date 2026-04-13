'use client';

import { useTranslation } from '@imbustai/i18n';
import { Badge } from '@/components/ui/badge';
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
    <span className="flex flex-col gap-0.5">
      <Badge variant={status === 'paid' ? 'default' : 'secondary'}>
        {label}
      </Badge>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </span>
  );
}
