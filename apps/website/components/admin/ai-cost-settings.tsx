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
  active,
  rows,
}: {
  active: { provider: string; model: string; keyConfigured: boolean };
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
          <CardTitle>
            <Inline gap="2">
              {t('admin.cost.activeModel')}
              <Badge>{active.model || '—'}</Badge>
            </Inline>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Inline gap="6">
            <Typography variant="caption" tone="muted" as="span">
              {t('admin.cost.activeProvider')}: <strong>{active.provider}</strong>
            </Typography>
            <Typography variant="caption" tone="muted" as="span">
              {t('admin.cost.keyConfigured')}:{' '}
              <strong>{active.keyConfigured ? t('admin.cost.yes') : t('admin.cost.no')}</strong>
            </Typography>
          </Inline>
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
