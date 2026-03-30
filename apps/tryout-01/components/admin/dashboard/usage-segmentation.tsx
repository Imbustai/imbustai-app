'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import type { EnrichedParticipant, UsageLabel } from '@/lib/analytics/types';

interface UsageSegmentationProps {
  participants: EnrichedParticipant[];
}

const USAGE_COLORS: Record<UsageLabel, string> = {
  'fast-completer': 'hsl(45, 80%, 50%)',
  'slow-reflective': 'hsl(270, 60%, 55%)',
  'high-engagement': 'hsl(160, 60%, 45%)',
  'low-engagement': 'hsl(0, 65%, 50%)',
  'typical': 'hsl(200, 10%, 55%)',
};

const ALL_USAGE_LABELS: UsageLabel[] = [
  'fast-completer',
  'slow-reflective',
  'high-engagement',
  'low-engagement',
  'typical',
];

export function UsageSegmentation({ participants }: UsageSegmentationProps) {
  const { t } = useTranslation();
  const u = (key: string) => t(`admin.dashboard.usageSegmentation.${key}`);

  const withData = participants.filter(
    (p) => p.durationMinutes !== null && p.avgLetterLength !== null
  );

  const { distribution, scatterData } = useMemo(() => {
    const counts = new Map<UsageLabel, number>();
    for (const l of ALL_USAGE_LABELS) counts.set(l, 0);
    for (const p of withData) {
      counts.set(p.usageLabel, (counts.get(p.usageLabel) ?? 0) + 1);
    }

    const distribution = ALL_USAGE_LABELS
      .map((label) => ({
        label,
        name: t(`admin.dashboard.usageSegmentation.labels.${label}`),
        count: counts.get(label) ?? 0,
      }))
      .filter((d) => d.count > 0);

    const scatterData = withData.map((p) => ({
      duration: p.durationMinutes ?? 0,
      letterLength: p.avgLetterLength ?? 0,
      usage: p.usageLabel,
      email: p.userEmail,
    }));

    return { distribution, scatterData };
  }, [withData, t]);

  if (withData.length === 0) return null;

  const usageGroups = new Map<UsageLabel, typeof scatterData>();
  for (const point of scatterData) {
    if (!usageGroups.has(point.usage)) usageGroups.set(point.usage, []);
    usageGroups.get(point.usage)!.push(point);
  }

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{u('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{u('subtitle')}</p>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 text-sm font-semibold">
              {u('duration')} vs {u('letterLength')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  type="number"
                  dataKey="duration"
                  name={u('duration')}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="letterLength"
                  name={u('letterLength')}
                  tick={{ fontSize: 10 }}
                />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{d.email}</p>
                        <p className="text-muted-foreground">
                          {t(`admin.dashboard.usageSegmentation.labels.${d.usage}`)}
                        </p>
                        <p className="text-muted-foreground">
                          {d.duration}min / {d.letterLength} chars
                        </p>
                      </div>
                    );
                  }}
                />
                {[...usageGroups.entries()].map(([label, data]) => (
                  <Scatter
                    key={label}
                    name={t(`admin.dashboard.usageSegmentation.labels.${label}`)}
                    data={data}
                    fill={USAGE_COLORS[label]}
                    opacity={0.8}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribution} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.label} fill={USAGE_COLORS[entry.label as UsageLabel]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
