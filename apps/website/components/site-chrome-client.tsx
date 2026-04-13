'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';

export function SiteChromeClient({
  email,
  isAdmin,
  children,
}: {
  email?: string | null;
  isAdmin: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hideMarketingHeader = pathname.startsWith('/admin');

  return (
    <>
      {!hideMarketingHeader ? (
        <SiteHeader email={email} isAdmin={isAdmin} />
      ) : null}
      {children}
    </>
  );
}
