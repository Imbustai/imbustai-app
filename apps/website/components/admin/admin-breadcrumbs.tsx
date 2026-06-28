'use client';

import { useTranslation } from '@imbustai/i18n';
import { Inline } from '@imbustai/ds';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import styles from './admin-breadcrumbs.module.css';

function buildCrumbs(
  pathname: string,
  t: (key: string) => string
): { href: string; label: string }[] {
  const root = { href: '/admin', label: t('admin.dashboardNav') };
  if (pathname === '/admin') return [root];

  if (pathname === '/admin/games') {
    return [root, { href: '/admin/games', label: t('admin.allGamesNav') }];
  }

  if (pathname === '/admin/orders') {
    return [root, { href: '/admin/orders', label: t('admin.ordersNav') }];
  }

  if (pathname === '/admin/settings') {
    return [root, { href: '/admin/settings', label: t('admin.breadcrumbSettings') }];
  }

  if (pathname === '/admin/order/create') {
    return [
      root,
      { href: '/admin/orders', label: t('admin.ordersNav') },
      { href: '/admin/order/create', label: t('admin.createFreeOrder') },
    ];
  }

  const orderDetail = pathname.match(/^\/admin\/order\/([^/]+)$/);
  if (orderDetail) {
    return [
      root,
      { href: '/admin/orders', label: t('admin.ordersNav') },
      { href: pathname, label: t('admin.breadcrumbOrderDetail') },
    ];
  }

  if (pathname.startsWith('/admin/game/')) {
    return [
      root,
      { href: '/admin/games', label: t('admin.allGamesNav') },
      { href: pathname, label: t('games.gameDetail') },
    ];
  }

  return [root];
}

export function AdminBreadcrumbs() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);

  return (
    <Inline as="nav" gap="1" wrap={true} aria-label="Breadcrumb">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <Inline key={`${item.href}-${i}`} gap="1">
            {i > 0 ? (
              <ChevronRight className={styles.chevron} aria-hidden />
            ) : null}
            {isLast ? (
              <span className={styles.breadcrumbCurrent}>{item.label}</span>
            ) : (
              <Link href={item.href} className={styles.breadcrumbLink}>
                {item.label}
              </Link>
            )}
          </Inline>
        );
      })}
    </Inline>
  );
}
