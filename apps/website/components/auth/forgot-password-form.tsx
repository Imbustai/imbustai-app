'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSiteUrl } from '@/lib/site-url';
import { Button, Input, Label, Typography, Stack, Box } from '@imbustai/ds';
import { AuthLayout } from './auth-layout';

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const supabase = createClient();
    const siteUrl = getSiteUrl();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent('/reset-password')}`,
      }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage(t('auth.resetEmailSent'));
  }

  return (
    <AuthLayout
      backLabel={t('nav.home')}
      title={t('auth.forgotTitle')}
      subtitle={t('auth.forgotSubtitle')}
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
          {error ? (
            <Typography variant="caption" tone="muted" as="p">{error}</Typography>
          ) : null}
          {message ? (
            <Typography variant="caption" tone="muted" as="p">{message}</Typography>
          ) : null}
          <Button type="submit" disabled={loading}>
            {loading ? t('common.loading') : t('auth.forgotSubmit')}
          </Button>
        </Stack>
      </form>
      <Box marginTop="6">
        <Typography variant="caption" tone="muted" align="center" as="p">
          <Link href="/login">
            {t('auth.backToLogin')}
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
