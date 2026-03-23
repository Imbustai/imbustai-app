'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/context';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { mean, stddev } from '@/lib/analytics/statistics';
import { computeIndices } from '@/lib/questionnaire';
import type { EnrichedParticipant } from '@/lib/analytics/types';

interface ComparativeDimensionsProps {
  participants: EnrichedParticipant[];
}

interface DimensionPair {
  titleKey: string;
  leftKey: string;
  leftLabel: string;
  rightKey: string;
  rightLabel: string;
  leftExtract: (q: Record<string, number>) => number;
  rightExtract: (q: Record<string, number>) => number;
  leftColor: string;
  rightColor: string;
}

export function ComparativeDimensions({ participants }: ComparativeDimensionsProps) {
  const { t } = useTranslation();
  const c = (key: string) => t(`admin.dashboard.comparativeDimensions.${key}`);

  const withData = participants.filter((p) => p.questionnaire);

  const pairs: DimensionPair[] = [
    {
      titleKey: 'responsibility',
      leftKey: 'individual',
      leftLabel: c('individual'),
      rightKey: 'social',
      rightLabel: c('social'),
      leftExtract: (q) => q.q3,
      rightExtract: (q) => q.q4,
      leftColor: 'hsl(221, 83%, 53%)',
      rightColor: 'hsl(25, 95%, 53%)',
    },
    {
      titleKey: 'agency',
      leftKey: 'agency',
      leftLabel: c('perceivedAgency'),
      rightKey: 'constraint',
      rightLabel: c('perceivedConstraint'),
      leftExtract: (q) => q.q5,
      rightExtract: (q) => q.q6,
      leftColor: 'hsl(160, 60%, 45%)',
      rightColor: 'hsl(340, 65%, 50%)',
    },
    {
      titleKey: 'emotional',
      leftKey: 'involvement',
      leftLabel: c('involvement'),
      rightKey: 'distance',
      rightLabel: c('distance'),
      leftExtract: (q) => q.q7,
      rightExtract: (q) => q.q8,
      leftColor: 'hsl(270, 60%, 55%)',
      rightColor: 'hsl(45, 80%, 50%)',
    },
    {
      titleKey: 'boundary',
      leftKey: 'rigidity',
      leftLabel: c('rigidity'),
      rightKey: 'mediation',
      rightLabel: c('mediation'),
      leftExtract: (q) => q.q9,
      rightExtract: (q) => q.q10,
      leftColor: 'hsl(0, 65%, 50%)',
      rightColor: 'hsl(190, 65%, 45%)',
    },
  ];

  const chartData = useMemo(() => {
    const questionnaires = withData.map((p) => p.questionnaire!);
    return pairs.map((pair) => {
      const leftVals = questionnaires.map(pair.leftExtract);
      const rightVals = questionnaires.map(pair.rightExtract);
      return {
        pair,
        data: [
          {
            dimension: c(pair.titleKey),
            [pair.leftLabel]: Number(mean(leftVals).toFixed(2)),
            [pair.rightLabel]: Number(mean(rightVals).toFixed(2)),
          },
        ],
      };
    });
  }, [withData]);

  if (withData.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{c('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{c('subtitle')}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {chartData.map(({ pair, data }) => (
          <Card key={pair.titleKey}>
            <CardContent className="py-4">
              <h3 className="mb-3 text-sm font-semibold">{c(pair.titleKey)}</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="dimension" tick={{ fontSize: 11 }} width={56} />
                  <Tooltip contentStyle={{ fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey={pair.leftLabel} fill={pair.leftColor} barSize={16} radius={[0, 4, 4, 0]} />
                  <Bar dataKey={pair.rightLabel} fill={pair.rightColor} barSize={16} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
