'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from 'recharts';
import { INDEX_LABELS } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import type { EnrichedParticipant, ClusterResult } from '@/lib/analytics/types';

interface ClusterAnalysisProps {
  participants: EnrichedParticipant[];
  k: number;
  onKChange: (k: number) => void;
  clusterResult: ClusterResult | null;
  projection: [number, number][];
  silhouetteScore: number;
}

const CLUSTER_COLORS = [
  'hsl(221, 83%, 53%)',
  'hsl(25, 95%, 53%)',
  'hsl(160, 60%, 45%)',
  'hsl(270, 60%, 55%)',
  'hsl(45, 80%, 50%)',
  'hsl(340, 65%, 50%)',
];

export function ClusterAnalysis({
  participants,
  k,
  onKChange,
  clusterResult,
  projection,
  silhouetteScore: silScore,
}: ClusterAnalysisProps) {
  const { t } = useTranslation();
  const cl = (key: string) => t(`admin.dashboard.clusterAnalysis.${key}`);

  const withData = useMemo(
    () => participants.filter((p) => p.questionnaire),
    [participants]
  );
  const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];

  const { scatterData, clusterGroups, clusterSummaries } = useMemo(() => {
    if (!clusterResult || withData.length < 2) {
      return {
        scatterData: [],
        clusterGroups: new Map<number, { x: number; y: number; cluster: number; email: string }[]>(),
        clusterSummaries: [],
      };
    }

    const scatterData = withData.map((p, i) => ({
      x: projection[i]?.[0] ?? 0,
      y: projection[i]?.[1] ?? 0,
      cluster: clusterResult.assignments[i] ?? 0,
      email: p.userEmail,
      gameId: p.gameId,
    }));

    const clusterGroups = new Map<number, typeof scatterData>();
    for (const point of scatterData) {
      if (!clusterGroups.has(point.cluster)) clusterGroups.set(point.cluster, []);
      clusterGroups.get(point.cluster)!.push(point);
    }

    const clusterSummaries = Array.from({ length: clusterResult.k }, (_, i) => {
      const members = scatterData.filter((p) => p.cluster === i);
      return { id: i, count: members.length, centroid: clusterResult.centroids[i] };
    });

    return { scatterData, clusterGroups, clusterSummaries };
  }, [clusterResult, withData, projection]);

  if (withData.length < 2) return null;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{cl('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{cl('subtitle')}</p>

      <div className="mb-4 flex items-center gap-4">
        <label className="text-sm font-medium">{cl('clusters')}</label>
        <input
          type="range"
          min={2}
          max={Math.min(6, withData.length)}
          value={k}
          onChange={(e) => onKChange(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-sm font-semibold">{k}</span>
        <span className="text-xs text-muted-foreground">
          {cl('silhouette')}: {silScore.toFixed(3)}
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 text-sm font-semibold">{cl('pcaProjection')}</h3>
            <ResponsiveContainer width="100%" height={360}>
              <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" dataKey="x" tick={{ fontSize: 10 }} name="PC1" />
                <YAxis type="number" dataKey="y" tick={{ fontSize: 10 }} name="PC2" />
                <ZAxis range={[40, 40]} />
                <Tooltip
                  contentStyle={{ fontSize: 12 }}
                  labelFormatter={() => ''}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
                        <p className="font-medium">{d.email}</p>
                        <p className="text-muted-foreground">Cluster {d.cluster + 1}</p>
                      </div>
                    );
                  }}
                />
                {[...clusterGroups.entries()].map(([clusterId, data]) => (
                  <Scatter
                    key={clusterId}
                    name={`Cluster ${clusterId + 1}`}
                    data={data}
                    fill={CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length]}
                    opacity={0.8}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 text-sm font-semibold">{cl('clusterSummary')}</h3>
            <div className="space-y-3">
              {clusterSummaries.map((cs) => (
                <div key={cs.id} className="rounded-md border p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: CLUSTER_COLORS[cs.id % CLUSTER_COLORS.length] }}
                    />
                    <span className="text-sm font-semibold">Cluster {cs.id + 1}</span>
                    <span className="text-xs text-muted-foreground">
                      ({cs.count} {cl('members')})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {indexKeys.map((key, i) => (
                      <span key={key} className="text-[10px] text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim().slice(0, 8)}:{' '}
                        <span className="font-medium text-foreground">
                          {(cs.centroid?.[i] ?? 0).toFixed(2)}
                        </span>
                      </span>
                    ))}
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
