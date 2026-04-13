'use client';

import { useTranslation } from '@imbustai/i18n';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

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

export function AdminBreadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const items = useMemo(() => buildCrumbs(pathname, t), [pathname, t]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex flex-wrap items-center gap-1 text-sm', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.href}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
            ) : null}
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
