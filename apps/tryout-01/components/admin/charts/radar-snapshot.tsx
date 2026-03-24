'use client';

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SessionIndices } from '@/lib/questionnaire';
import { INDEX_LABELS } from '@/lib/questionnaire';

interface RadarSnapshotProps {
  indices: SessionIndices;
}

interface RadarDataPoint {
  dimension: string;
  fullLabel: string;
  value: number;
}

const SHORT_LABELS: Record<keyof SessionIndices, string> = {
  judgementReflection: 'Judgement',
  individualResponsibility: 'Individual',
  socialResponsibility: 'Social',
  perceivedAgency: 'Agency',
  perceivedConstraint: 'Constraint',
  emotionalInvolvement: 'Involvement',
  emotionalDistance: 'Distance',
  moralBoundaryRigidity: 'Rigidity',
  moralBoundaryMediation: 'Mediation',
  argumentativeEngagement: 'Argumentation',
};

interface RadarPayloadEntry {
  payload: RadarDataPoint;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: RadarPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{d.fullLabel}</p>
      <p className="text-muted-foreground">{d.value.toFixed(1)} / 5</p>
    </div>
  );
}

export function RadarSnapshot({ indices }: RadarSnapshotProps) {
  const data: RadarDataPoint[] = (
    Object.keys(indices) as (keyof SessionIndices)[]
  ).map((key) => ({
    dimension: SHORT_LABELS[key],
    fullLabel: INDEX_LABELS[key],
    value: indices[key],
  }));

  return (
    <ResponsiveContainer width="100%" height={340}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
        <PolarGrid strokeOpacity={0.3} />
        <PolarAngleAxis
          dataKey="dimension"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tick={{ fontSize: 10 }}
          tickCount={6}
          className="fill-muted-foreground"
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          dataKey="value"
          stroke="hsl(221, 83%, 53%)"
          fill="hsl(221, 83%, 53%)"
          fillOpacity={0.2}
          strokeWidth={2}
          isAnimationActive={false}
          dot={{ r: 3, fill: 'hsl(221, 83%, 53%)', strokeWidth: 0 }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
