'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { mean } from '@/lib/analytics/statistics';
import type { ParticipantRecord } from '@/lib/analytics/types';
import { Users, CheckCircle, Percent, Clock } from 'lucide-react';

interface GlobalOverviewProps {
  participants: ParticipantRecord[];
}

export function GlobalOverview({ participants }: GlobalOverviewProps) {
  const { t } = useTranslation();
  const g = (key: string) => t(`admin.dashboard.globalOverview.${key}`);

  const stats = useMemo(() => {
    const total = participants.length;
    const completed = participants.filter((p) => p.status === 'completed').length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;
    const durations = participants
      .map((p) => p.durationMinutes)
      .filter((d): d is number => d !== null);
    const avgDuration = durations.length > 0 ? mean(durations) : null;

    const dateMap = new Map<string, number>();
    for (const p of participants) {
      if (p.completedAt) {
        const day = p.completedAt.slice(0, 10);
        dateMap.set(day, (dateMap.get(day) ?? 0) + 1);
      }
    }
    const timeline = [...dateMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return { total, completed, completionRate, avgDuration, timeline };
  }, [participants]);

  const kpis = [
    { label: g('totalParticipants'), value: stats.total, icon: Users },
    { label: g('completedSessions'), value: stats.completed, icon: CheckCircle },
    {
      label: g('completionRate'),
      value: `${stats.completionRate.toFixed(1)}%`,
      icon: Percent,
    },
    {
      label: g('avgDuration'),
      value: stats.avgDuration !== null ? `${stats.avgDuration.toFixed(0)} ${g('minutes')}` : g('na'),
      icon: Clock,
    },
  ];

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{g('title')}</h2>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <kpi.icon className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <p className="text-xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.timeline.length > 1 && (
        <Card>
          <CardContent className="py-5">
            <h3 className="mb-3 text-sm font-semibold">{g('completionsOverTime')}</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.timeline} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v: string) => v.slice(5)}
                  className="fill-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} className="fill-muted-foreground" />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={(v) =>
                    new Date(String(v)).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                  }
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
