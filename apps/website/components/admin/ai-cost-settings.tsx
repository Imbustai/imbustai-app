'use client';

import { useTranslation } from '@imbustai/i18n';
import type { AiModelPricingRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">{t('admin.cost.settingsTitle')}</h1>
        <p className="mt-2 text-muted-foreground">{t('admin.cost.settingsSubtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {t('admin.cost.activeModel')}
            <Badge>{active.model || '—'}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>
            {t('admin.cost.activeProvider')}: <strong>{active.provider}</strong>
          </span>
          <span>
            {t('admin.cost.keyConfigured')}:{' '}
            <strong>{active.keyConfigured ? t('admin.cost.yes') : t('admin.cost.no')}</strong>
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('admin.cost.pricingTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">{t('admin.cost.pricingHint')}</p>
          <PricingTable rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}
