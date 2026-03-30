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
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import type { EnrichedParticipant, ProfileLabel } from '@/lib/analytics/types';

interface ProfileDistributionProps {
  participants: EnrichedParticipant[];
}

const PROFILE_COLORS: Record<ProfileLabel, string> = {
  'rigid-normative': 'hsl(0, 65%, 50%)',
  'contextual-mediating': 'hsl(190, 65%, 45%)',
  'ambivalent': 'hsl(45, 80%, 50%)',
  'empathic-interventionist': 'hsl(270, 60%, 55%)',
  'detached': 'hsl(200, 10%, 55%)',
  'unclassified': 'hsl(0, 0%, 70%)',
};

const ALL_PROFILES: ProfileLabel[] = [
  'rigid-normative',
  'contextual-mediating',
  'ambivalent',
  'empathic-interventionist',
  'detached',
  'unclassified',
];

export function ProfileDistribution({ participants }: ProfileDistributionProps) {
  const { t } = useTranslation();
  const p = (key: string) => t(`admin.dashboard.profileDistribution.${key}`);

  const withData = participants.filter((pp) => pp.questionnaire);

  const distribution = useMemo(() => {
    const counts = new Map<ProfileLabel, number>();
    for (const label of ALL_PROFILES) counts.set(label, 0);
    for (const pp of withData) {
      counts.set(pp.profileLabel, (counts.get(pp.profileLabel) ?? 0) + 1);
    }
    return ALL_PROFILES.map((label) => ({
      label,
      name: t(`admin.dashboard.profileDistribution.profiles.${label}`),
      count: counts.get(label) ?? 0,
      pct: withData.length > 0 ? (((counts.get(label) ?? 0) / withData.length) * 100).toFixed(1) : '0',
    })).filter((d) => d.count > 0);
  }, [withData, t]);

  if (withData.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{p('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{p('subtitle')}</p>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribution} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distribution.map((entry) => (
                    <Cell key={entry.label} fill={PROFILE_COLORS[entry.label as ProfileLabel]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <div className="space-y-3">
              {distribution.map((d) => (
                <div key={d.label} className="flex items-start gap-3 rounded-md border px-3 py-2">
                  <div
                    className="mt-1 size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: PROFILE_COLORS[d.label as ProfileLabel] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{d.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {d.count} ({d.pct}%)
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`admin.dashboard.profileDistribution.descriptions.${d.label}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
