'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function OrdersFilter({ current }: { current?: string }) {
  const { t } = useTranslation();

  const items = [
    { value: '', label: t('admin.allStatuses') },
    { value: 'pending_payment', label: t('orders.statusPending') },
    { value: 'paid', label: t('orders.statusPaid') },
    { value: 'cancelled', label: t('orders.statusCancelled') },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {items.map(({ value, label }) => {
        const href =
          value === '' ? '/admin/orders' : `/admin/orders?status=${value}`;
        const active = (current ?? '') === value;
        return (
          <Link
            key={value || 'all'}
            href={href}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              active
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/30'
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
