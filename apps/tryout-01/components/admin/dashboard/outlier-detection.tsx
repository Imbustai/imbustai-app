'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import { Badge } from '@/components/ui/badge';
import { mean, stddev } from '@/lib/analytics/statistics';
import { computeIndices, INDEX_LABELS } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import type { EnrichedParticipant } from '@/lib/analytics/types';
import { AlertTriangle } from 'lucide-react';

interface OutlierDetectionProps {
  participants: EnrichedParticipant[];
}

interface OutlierCase {
  participant: EnrichedParticipant;
  extremes: { index: string; value: number; direction: 'high' | 'low'; zScore: number }[];
}

export function OutlierDetection({ participants }: OutlierDetectionProps) {
  const { t } = useTranslation();
  const o = (key: string) => t(`admin.dashboard.outlierDetection.${key}`);

  const withData = participants.filter((p) => p.questionnaire);
  const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];

  const outliers = useMemo((): OutlierCase[] => {
    if (withData.length < 5) return [];

    const allIndices = withData.map((p) => computeIndices(p.questionnaire!));
    const stats = indexKeys.map((key) => {
      const vals = allIndices.map((idx) => idx[key]);
      return { key, mean: mean(vals), stddev: stddev(vals) };
    });

    const cases: OutlierCase[] = [];
    for (let i = 0; i < withData.length; i++) {
      const idx = allIndices[i];
      const extremes: OutlierCase['extremes'] = [];

      for (const stat of stats) {
        if (stat.stddev === 0) continue;
        const z = (idx[stat.key] - stat.mean) / stat.stddev;
        if (Math.abs(z) > 2) {
          extremes.push({
            index: INDEX_LABELS[stat.key],
            value: idx[stat.key],
            direction: z > 0 ? 'high' : 'low',
            zScore: z,
          });
        }
      }

      if (extremes.length > 0) {
        cases.push({ participant: withData[i], extremes });
      }
    }

    return cases.sort((a, b) => b.extremes.length - a.extremes.length).slice(0, 10);
  }, [withData]);

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{o('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{o('subtitle')}</p>

      {outliers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-sm text-muted-foreground">{o('noOutliers')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {outliers.map((c) => (
            <Card key={c.participant.gameId}>
              <CardContent className="py-4">
                <div className="mb-2 flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span className="text-xs font-semibold">{c.participant.userEmail}</span>
                </div>
                <p className="mb-2 text-[10px] text-muted-foreground">
                  {c.participant.gameId.slice(0, 12)}
                </p>
                <div className="space-y-1">
                  {c.extremes.map((e) => (
                    <div key={e.index} className="flex items-center gap-2">
                      <Badge
                        variant={e.direction === 'high' ? 'default' : 'secondary'}
                        className="text-[10px]"
                      >
                        {e.direction === 'high' ? o('extremeHigh') : o('extremeLow')}
                      </Badge>
                      <span className="text-xs">
                        {e.index}: {e.value.toFixed(1)}{' '}
                        <span className="text-muted-foreground">
                          (z={e.zScore.toFixed(1)})
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
