'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button, Input, Label, Typography, Stack, Box } from '@imbustai/ds';
import { AuthLayout } from './auth-layout';

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push('/shop');
    router.refresh();
  }

  if (!ready) {
    return (
      <AuthLayout
        backLabel={t('nav.home')}
        title={t('auth.resetTitle')}
        subtitle={t('auth.resetSubtitle')}
      >
        <Typography variant="caption" tone="muted" as="p">{t('auth.resetNeedLink')}</Typography>
        <Box marginTop="4">
          <Typography variant="caption" as="p">
            <Link href="/forgot-password">
              {t('auth.forgotLink')}
            </Link>
          </Typography>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      backLabel={t('nav.home')}
      title={t('auth.resetTitle')}
      subtitle={t('auth.resetSubtitle')}
    >
      <form onSubmit={onSubmit}>
        <Stack gap="4">
          <Stack gap="2">
            <Label htmlFor="password">{t('auth.newPassword')}</Label>
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
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.resetSubmit')}
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
}
