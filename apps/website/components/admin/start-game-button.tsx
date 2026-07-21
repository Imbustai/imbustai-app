'use client';

import { useTranslation } from '@imbustai/i18n';
import { Button, Stack } from '@imbustai/ds';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import s from './admin-styles.module.css';

export function StartGameButton({
  orderId,
  existingGameId,
}: {
  orderId: string;
  existingGameId: string | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingGameId) {
    return (
      <Button asChild variant="secondary">
        <Link href={`/admin/game/${existingGameId}`}>
          {t('admin.openGame')}
        </Link>
      </Button>
    );
  }

  async function onClick() {
    setError(null);
    setLoading(true);
    const res = await fetch(`/api/admin/orders/${orderId}/start-game`, {
      method: 'POST',
    });
    const body = (await res.json()) as { gameId?: string; error?: string };
    setLoading(false);
    if (!res.ok || !body.gameId) {
      setError(body.error ?? t('common.error'));
      return;
    }
    router.push(`/admin/game/${body.gameId}`);
    router.refresh();
  }

  return (
    <Stack gap="2">
      <Button type="button" disabled={loading} onClick={onClick}>
        {loading ? t('common.loading') : t('admin.startGame')}
      </Button>
      {error ? (
        <p className={s.errorText} role="alert">
          {error}
        </p>
      ) : null}
    </Stack>
  );
}
