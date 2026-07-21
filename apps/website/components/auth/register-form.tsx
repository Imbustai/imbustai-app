'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/safe-next-path';
import { getSiteUrl } from '@/lib/site-url';
import { Button, Input, Label, Typography, Stack, Box } from '@imbustai/ds';
import { AuthLayout } from './auth-layout';

export function RegisterForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'), '/shop');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const siteUrl = getSiteUrl();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    setMessage(t('auth.checkEmail'));
    router.refresh();
  }

  return (
    <AuthLayout
      backLabel={t('nav.home')}
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
    >
      <form onSubmit={onSubmit}>
        <Stack gap="4">
          <Stack gap="2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Stack>
          <Stack gap="2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Stack>
          {error ? (
            <Typography variant="caption" tone="muted" as="p">{error}</Typography>
          ) : null}
          {message ? (
            <Typography variant="caption" tone="muted" as="p">{message}</Typography>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.registerSubmit')}
          </Button>
        </Stack>
      </form>
      <Box marginTop="6">
        <Typography variant="caption" tone="muted" align="center" as="p">
          {t('auth.hasAccount')}{' '}
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            {t('auth.loginCta')}
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
