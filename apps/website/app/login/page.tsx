import { Suspense } from 'react';
import { Box, Typography } from '@imbustai/ds';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" height="screen">
          <Typography variant="caption" tone="muted">…</Typography>
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
