'use client';

import { useTranslation } from '@imbustai/i18n';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { AddressRow } from '@/lib/types/db';

type UserOption = { id: string; email: string };
type StoryOption = {
  id: string;
  slug: string;
  title_en: string;
  title_it: string;
};

export function FreeOrderForm({
  users,
  stories,
}: {
  users: UserOption[];
  stories: StoryOption[];
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [userId, setUserId] = useState('');
  const [storyId, setStoryId] = useState('');
  const [addressId, setAddressId] = useState('');
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setAddresses([]);
      setAddressId('');
      return;
    }
    let cancelled = false;
    setLoadingAddr(true);
    fetch(`/api/admin/users/${userId}/addresses`)
      .then((r) => r.json())
      .then((body: { addresses?: AddressRow[] }) => {
        if (!cancelled) {
          setAddresses(body.addresses ?? []);
          setAddressId('');
        }
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAddr(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId || !storyId || !addressId) {
      setError(t('common.error'));
      return;
    }
    setSubmitting(true);
    const res = await fetch('/api/admin/orders/free', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, storyId, addressId }),
    });
    const body = (await res.json()) as { id?: string; error?: string };
    setSubmitting(false);
    if (!res.ok || !body.id) {
      setError(body.error ?? t('common.error'));
      return;
    }
    router.push(`/admin/order/${body.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="user">{t('admin.selectUser')}</Label>
        <select
          id="user"
          required
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        >
          <option value="">—</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="story">{t('admin.selectStory')}</Label>
        <select
          id="story"
          required
          className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm"
          value={storyId}
          onChange={(e) => setStoryId(e.target.value)}
        >
          <option value="">—</option>
          {stories.map((s) => (
            <option key={s.id} value={s.id}>
              {locale === 'it' ? s.title_it : s.title_en}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="addr">{t('admin.selectAddress')}</Label>
        {loadingAddr ? (
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        ) : (
          <select
            id="addr"
            required
            disabled={!userId || addresses.length === 0}
            className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm disabled:opacity-50"
            value={addressId}
            onChange={(e) => setAddressId(e.target.value)}
          >
            <option value="">—</option>
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label ? `${a.label} — ` : ''}
                {a.line1}, {a.postal_code} {a.city}
              </option>
            ))}
          </select>
        )}
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? t('common.loading') : t('admin.submitFreeOrder')}
      </Button>
    </form>
  );
}
