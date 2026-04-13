'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
      <div className="text-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  if (status !== 'paid') {
    return (
      <div className="text-center">
        <h1 className="font-heading text-xl font-semibold">
          {t('common.loading')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('shop.orderPending')}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1 className="font-heading text-2xl font-semibold">
        {t('shop.successTitle')}
      </h1>
      <p className="mt-4 text-muted-foreground">{t('shop.successBody')}</p>
      <Button asChild className="mt-8">
        <Link href="/shop">{t('shop.continueShopping')}</Link>
      </Button>
    </div>
  );
}
