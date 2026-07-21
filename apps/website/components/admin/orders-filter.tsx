'use client';

import { useTranslation } from '@imbustai/i18n';
import { Inline, Pill } from '@imbustai/ds';
import Link from 'next/link';

export function OrdersFilter({ current }: { current?: string }) {
  const { t } = useTranslation();

  const items = [
    { value: '', label: t('admin.allStatuses') },
    { value: 'pending_payment', label: t('orders.statusPending') },
    { value: 'paid', label: t('orders.statusPaid') },
    { value: 'cancelled', label: t('orders.statusCancelled') },
  ];

  return (
    <Inline gap="2">
      {items.map(({ value, label }) => {
        const href =
          value === '' ? '/admin/orders' : `/admin/orders?status=${value}`;
        const active = (current ?? '') === value;
        return (
          <Pill key={value || 'all'} variant={active ? 'active' : 'inactive'}>
            <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
              {label}
            </Link>
          </Pill>
        );
      })}
    </Inline>
  );
}
