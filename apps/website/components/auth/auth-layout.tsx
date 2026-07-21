import Link from 'next/link';
import type { ReactNode } from 'react';
import { Typography, Box, Stack } from '@imbustai/ds';

export function AuthLayout({
  children,
  title,
  subtitle,
  backLabel,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backLabel: string;
}) {
  return (
    <Box maxWidth="sm" marginX="auto" paddingX="4" paddingY="16" display="flex" flexDirection="column" justifyContent="center" height="auto">
      <Box marginBottom="8">
        <Link href="/">
          <Typography variant="caption" tone="muted">{backLabel}</Typography>
        </Link>
      </Box>
      <Typography variant="h2">{title}</Typography>
      {subtitle ? (
        <Box marginTop="2">
          <Typography variant="caption" tone="muted">{subtitle}</Typography>
        </Box>
      ) : null}
      <Box marginTop="8">{children}</Box>
    </Box>
  );
}
