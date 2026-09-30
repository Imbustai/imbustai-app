'use client';

import { useTranslation } from '@imbustai/i18n';
import type { AiModelPricingRow } from '@/lib/types/db';
import {
  Badge,
  Box,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Inline,
  Stack,
  Typography,
} from '@imbustai/ds';
import { PricingTable } from '@/components/admin/pricing-table';

export function AiCostSettings({
  profile,
  keys,
  rows,
}: {
  profile: { role: string; model: string; effort?: string }[];
  keys: { provider: string; configured: boolean }[];
  rows: AiModelPricingRow[];
}) {
  const { t } = useTranslation();

  return (
    <Stack gap="6">
      <div>
        <Typography variant="h2" as="h1">{t('admin.cost.settingsTitle')}</Typography>
        <Typography variant="body" tone="muted">{t('admin.cost.settingsSubtitle')}</Typography>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.cost.defaultProfile')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap="3">
            <Typography variant="caption" tone="muted">{t('admin.cost.defaultProfileHint')}</Typography>
            {profile.map((p) => (
              <Inline key={p.role} gap="2">
                <Typography variant="caption" tone="muted" as="span">
                  {p.role}
                </Typography>
                <Badge>{p.model}</Badge>
                {p.effort ? (
                  <Typography variant="caption" tone="muted" as="span">
                    {t('admin.cost.effort')}: <strong>{p.effort}</strong>
                  </Typography>
                ) : null}
              </Inline>
            ))}
            <Inline gap="6">
              {keys.map((k) => (
                <Typography key={k.provider} variant="caption" tone="muted" as="span">
                  {t('admin.cost.keyConfigured')} ({k.provider}):{' '}
                  <strong>{k.configured ? t('admin.cost.yes') : t('admin.cost.no')}</strong>
                </Typography>
              ))}
            </Inline>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.cost.pricingTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack gap="3">
            <Typography variant="caption" tone="muted">{t('admin.cost.pricingHint')}</Typography>
            <PricingTable rows={rows} />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
