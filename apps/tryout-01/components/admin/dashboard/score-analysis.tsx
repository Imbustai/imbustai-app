'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { descriptiveStats } from '@/lib/analytics/statistics';
import { computeIndices, QUESTION_KEYS, INDEX_LABELS } from '@/lib/questionnaire';
import type { QuestionnaireData, QuestionKey, SessionIndices } from '@/lib/questionnaire';
import type { DescriptiveStats } from '@/lib/analytics/types';
import type { EnrichedParticipant } from '@/lib/analytics/types';

interface ScoreAnalysisProps {
  participants: EnrichedParticipant[];
}

function buildHistogramData(values: number[], bins = 5): { bin: string; count: number }[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binWidth = range / bins;
  const histogram = Array.from({ length: bins }, (_, i) => ({
    bin: `${(min + i * binWidth).toFixed(1)}`,
    count: 0,
  }));
  for (const v of values) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[idx].count++;
  }
  return histogram;
}

function StatsRow({ stat, t }: { stat: DescriptiveStats; t: (k: string) => string }) {
  const s = (key: string) => t(`admin.dashboard.scoreAnalysis.${key}`);
  const histData = useMemo(() => buildHistogramData(stat.values), [stat.values]);

  return (
    <div className="flex items-center gap-4 rounded-md border px-3 py-2">
      <div className="w-40 shrink-0">
        <p className="text-xs font-medium">{stat.label}</p>
      </div>
      <div className="grid flex-1 grid-cols-5 gap-2 text-center text-xs">
        <div>
          <p className="text-muted-foreground">{s('mean')}</p>
          <p className="font-semibold">{stat.mean.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{s('median')}</p>
          <p className="font-semibold">{stat.median.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{s('stdDev')}</p>
          <p className="font-semibold">{stat.stddev.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{s('min')}</p>
          <p className="font-semibold">{stat.min.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{s('max')}</p>
          <p className="font-semibold">{stat.max.toFixed(1)}</p>
        </div>
      </div>
      <div className="w-28 shrink-0">
        <ResponsiveContainer width="100%" height={36}>
          <BarChart data={histData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Bar dataKey="count" fill="hsl(221, 83%, 53%)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ScoreAnalysis({ participants }: ScoreAnalysisProps) {
  const { t } = useTranslation();
  const s = (key: string) => t(`admin.dashboard.scoreAnalysis.${key}`);

  const withData = participants.filter((p) => p.questionnaire);

  const { rawStats, indexStats } = useMemo(() => {
    const questionnaires = withData.map((p) => p.questionnaire!);

    const rawStats: DescriptiveStats[] = QUESTION_KEYS.map((key) => {
      const values = questionnaires.map((q) => q[key]);
      return descriptiveStats(key.toUpperCase(), values);
    });

    const allIndices = questionnaires.map((q) => computeIndices(q));
    const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];
    const indexStats: DescriptiveStats[] = indexKeys.map((key) => {
      const values = allIndices.map((idx) => idx[key]);
      return descriptiveStats(INDEX_LABELS[key], values);
    });

    return { rawStats, indexStats };
  }, [withData]);

  if (withData.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{s('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{s('subtitle')}</p>

      <Card className="mb-4">
        <CardContent className="py-4">
          <h3 className="mb-3 text-sm font-semibold">{s('rawScores')}</h3>
          <div className="space-y-1">
            {rawStats.map((stat) => (
              <StatsRow key={stat.label} stat={stat} t={t} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h3 className="mb-3 text-sm font-semibold">{s('derivedIndices')}</h3>
          <div className="space-y-1">
            {indexStats.map((stat) => (
              <StatsRow key={stat.label} stat={stat} t={t} />
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
