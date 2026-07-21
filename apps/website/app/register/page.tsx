import { Suspense } from 'react';
import { Box, Typography } from '@imbustai/ds';
import { RegisterForm } from '@/components/auth/register-form';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" height="screen">
          <Typography variant="caption" tone="muted">…</Typography>
        </Box>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
