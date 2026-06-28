'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AddressRow, StoryRow } from '@/lib/types/db';
import { formatMoney, storyTitle } from '@/lib/story-i18n';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Typography,
  Stack,
  Inline,
  Box,
  Grid,
} from '@imbustai/ds';

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
    <Stack gap="4">
      <Typography variant="h2">{t('shop.checkoutTitle')}</Typography>
      <Typography variant="caption" tone="muted">
        {storyTitle(story, locale)} —{' '}
        {formatMoney(story.price_cents, story.currency)}
      </Typography>

      {cancelled ? (
        <Card tone="accent" bordered>
          <CardContent>
            <Typography variant="caption">{t('shop.cancelled')}</Typography>
          </CardContent>
        </Card>
      ) : null}

      <Box as="section" display="flex" flexDirection="column" gap="3" marginTop="4">
        <Typography variant="caption">{t('shop.selectAddress')}</Typography>
        <Stack as="ul" gap="2">
          {addresses.map((a) => (
            <Box as="li" key={a.id}>
              <label>
                <Inline gap="3">
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === a.id}
                    onChange={() => setSelectedId(a.id)}
                  />
                  <Typography variant="caption">
                    {a.label ? `${a.label} — ` : ''}
                    {a.line1}, {a.postal_code} {a.city}, {a.country}
                  </Typography>
                </Inline>
              </label>
            </Box>
          ))}
        </Stack>

        {!showForm ? (
          <Box marginTop="2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowForm(true)}
            >
              {t('shop.addAddress')}
            </Button>
          </Box>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t('shop.addAddress')}</CardTitle>
              <CardDescription>{t('shop.createAddress')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveAddress}>
              <Stack gap="3">
                <Stack gap="1">
                  <Label htmlFor="al">{t('shop.addressLabel')}</Label>
                  <Input
                    id="al"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </Stack>
                <Stack gap="1">
                  <Label htmlFor="a1">{t('shop.line1')}</Label>
                  <Input
                    id="a1"
                    required
                    value={line1}
                    onChange={(e) => setLine1(e.target.value)}
                  />
                </Stack>
                <Stack gap="1">
                  <Label htmlFor="a2">{t('shop.line2')}</Label>
                  <Input
                    id="a2"
                    value={line2}
                    onChange={(e) => setLine2(e.target.value)}
                  />
                </Stack>
                <Grid columns={2} gap="3">
                  <Stack gap="1">
                    <Label htmlFor="city">{t('shop.city')}</Label>
                    <Input
                      id="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </Stack>
                  <Stack gap="1">
                    <Label htmlFor="zip">{t('shop.postalCode')}</Label>
                    <Input
                      id="zip"
                      required
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </Stack>
                </Grid>
                <Stack gap="1">
                  <Label htmlFor="ct">{t('shop.country')}</Label>
                  <Input
                    id="ct"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </Stack>
                <Inline gap="2">
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
                </Inline>
              </Stack>
              </form>
            </CardContent>
          </Card>
        )}
      </Box>

      {error ? (
        <Box role="alert">
          <Typography variant="caption" tone="primary">
            {error}
          </Typography>
        </Box>
      ) : null}

      <Box marginTop="6">
        <Button
          type="button"
          size="lg"
          disabled={loading || !selectedId}
          onClick={startStripe}
        >
          {loading ? t('common.loading') : t('shop.payWithStripe')}
        </Button>
      </Box>

      <Typography variant="caption" tone="muted">
        {t('shop.orderPending')}{' '}
        <Button asChild variant="link">
          <Link href="/shop">Shop</Link>
        </Button>
      </Typography>
    </Stack>
  );
}
