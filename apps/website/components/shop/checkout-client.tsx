'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AddressRow, StoryRow } from '@/lib/types/db';
import { formatMoney, storyTitle } from '@/lib/story-i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function CheckoutClient({
  story,
  addresses: initialAddresses,
  cancelled,
}: {
  story: StoryRow;
  addresses: AddressRow[];
  cancelled: boolean;
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [addresses, setAddresses] = useState(initialAddresses);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialAddresses.find((a) => a.is_default)?.id ??
      initialAddresses[0]?.id ??
      null
  );
  const [showForm, setShowForm] = useState(initialAddresses.length === 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [label, setLabel] = useState('');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('IT');

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError(t('common.error'));
      return;
    }
    const { data, error: insErr } = await supabase
      .from('addresses')
      .insert({
        user_id: user.id,
        label: label || null,
        line1,
        line2: line2 || null,
        city,
        postal_code: postalCode,
        country,
        is_default: addresses.length === 0,
      })
      .select()
      .single();

    if (insErr) {
      setError(insErr.message);
      return;
    }
    if (data) {
      setAddresses((prev) => [...prev, data as AddressRow]);
      setSelectedId(data.id);
      setShowForm(false);
      setLabel('');
      setLine1('');
      setLine2('');
      setCity('');
      setPostalCode('');
      router.refresh();
    }
  }

  async function startStripe() {
    if (!selectedId) {
      setError(t('shop.selectAddress'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storySlug: story.slug,
          addressId: selectedId,
        }),
      });
      const body = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !body.url) {
        setError(body.error ?? t('common.error'));
        setLoading(false);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError(t('common.error'));
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold">
        {t('shop.checkoutTitle')}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {storyTitle(story, locale)} —{' '}
        {formatMoney(story.price_cents, story.currency)}
      </p>

      {cancelled ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          {t('shop.cancelled')}
        </p>
      ) : null}

      <section className="mt-8">
        <h2 className="text-sm font-medium">{t('shop.selectAddress')}</h2>
        <ul className="mt-3 space-y-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <label className="flex cursor-pointer gap-3 rounded-md border p-3 has-[:checked]:border-primary">
                <input
                  type="radio"
                  name="address"
                  checked={selectedId === a.id}
                  onChange={() => setSelectedId(a.id)}
                  className="mt-1"
                />
                <span className="text-sm">
                  {a.label ? `${a.label} — ` : ''}
                  {a.line1}, {a.postal_code} {a.city}, {a.country}
                </span>
              </label>
            </li>
          ))}
        </ul>

        {!showForm ? (
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => setShowForm(true)}
          >
            {t('shop.addAddress')}
          </Button>
        ) : (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">{t('shop.addAddress')}</CardTitle>
              <CardDescription>{t('shop.createAddress')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveAddress} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="al">{t('shop.addressLabel')}</Label>
                  <Input
                    id="al"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="a1">{t('shop.line1')}</Label>
                  <Input
                    id="a1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="a2">{t('shop.line2')}</Label>
                  <Input
                    id="a2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="city">{t('shop.city')}</Label>
                    <Input
                      id="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zip">{t('shop.postalCode')}</Label>
                    <Input
                      id="zip"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="ct">{t('shop.country')}</Label>
                  <Input
                    id="ct"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">{t('shop.createAddress')}</Button>
                  {addresses.length > 0 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowForm(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </section>

      {error ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-10">
        <Button
          type="button"
          size="lg"
          disabled={loading || !selectedId}
          onClick={startStripe}
        >
          {loading ? t('common.loading') : t('shop.payWithStripe')}
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {t('shop.orderPending')}{' '}
        <Link href="/shop" className="underline">
          Shop
        </Link>
      </p>
    </div>
  );
}
