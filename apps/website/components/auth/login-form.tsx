'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { safeNextPath } from '@/lib/safe-next-path';
import { Button, Input, Label, Typography, Stack, Box } from '@imbustai/ds';
import { AuthLayout } from './auth-layout';

export function LoginForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get('next'), '/shop');
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    errorParam === 'auth' ? t('auth.errorGeneric') : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <AuthLayout
      backLabel={t('nav.home')}
      title={t('auth.loginTitle')}
      subtitle={t('auth.loginSubtitle')}
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Stack>
          {error ? (
            <Typography variant="caption" tone="muted" as="p">{error}</Typography>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.loginCta')}
          </Button>
        </Stack>
      </form>
      <Box marginTop="6">
        <Typography variant="caption" tone="muted" align="center" as="p">
          <Link href="/forgot-password">
            {t('auth.forgotLink')}
          </Link>
        </Typography>
      </Box>
      <Box marginTop="4">
        <Typography variant="caption" tone="muted" align="center" as="p">
          {t('auth.noAccount')}{' '}
          <Link href={`/register?next=${encodeURIComponent(next)}`}>
            {t('auth.registerCta')}
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
