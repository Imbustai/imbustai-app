'use client';

import { useMemo, useState } from 'react';
import { useTranslation } from '@imbustai/i18n';
import { computeIndices, computeBalances, INDEX_LABELS } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import { assignProfileLabel, assignUsageLabels } from '@/lib/analytics/profiles';
import { kMeans, silhouetteScore } from '@/lib/analytics/clustering';
import { projectTo2D } from '@/lib/analytics/pca';
import type { ParticipantRecord, EnrichedParticipant, ProfileLabel, ClusterResult } from '@/lib/analytics/types';
import { DashboardFilters, type DashboardFilterState } from './dashboard-filters';
import { GlobalOverview } from './global-overview';
import { ScoreAnalysis } from './score-analysis';
import { ComparativeDimensions } from './comparative-dimensions';
import { ClusterAnalysis } from './cluster-analysis';
import { ProfileDistribution } from './profile-distribution';
import { UsageSegmentation } from './usage-segmentation';
import { CorrelationMatrix } from './correlation-matrix';
import { OutlierDetection } from './outlier-detection';
import { DataTableExport } from './data-table-export';

interface ResearchDashboardProps {
  participants: ParticipantRecord[];
}

const INITIAL_FILTERS: DashboardFilterState = {
  dateFrom: '',
  dateTo: '',
  status: 'all',
  profileLabel: 'all',
  clusterId: 'all',
  search: '',
};

export function ResearchDashboard({ participants }: ResearchDashboardProps) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<DashboardFilterState>(INITIAL_FILTERS);
  const [k, setK] = useState(3);

  const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];

  const enriched = useMemo((): EnrichedParticipant[] => {
    const usageLabels = assignUsageLabels(participants);
    return participants.map((p, i) => {
      if (!p.questionnaire) {
        return {
          ...p,
          indices: null,
          balances: null,
          profileLabel: 'unclassified' as ProfileLabel,
          usageLabel: usageLabels[i],
          clusterId: null,
        };
      }
      const indices = computeIndices(p.questionnaire);
      const balances = computeBalances(p.questionnaire);
      const profileLabel = assignProfileLabel(indices, balances, p.questionnaire);
      return {
        ...p,
        indices,
        balances,
        profileLabel,
        usageLabel: usageLabels[i],
        clusterId: null,
      };
    });
  }, [participants]);

  const clusterData = useMemo(() => {
    const withData = enriched.filter((p) => p.questionnaire);
    if (withData.length < 2) {
      return { result: null, projection: [] as [number, number][], silScore: 0, withDataIds: [] as string[] };
    }
    const matrix = withData.map((p) => {
      const idx = computeIndices(p.questionnaire!);
      return indexKeys.map((key) => idx[key]);
    });
    const result = kMeans(matrix, k);
    const projection = projectTo2D(matrix);
    const silScore = silhouetteScore(matrix, result.assignments);
    const withDataIds = withData.map((p) => p.gameId);
    return { result, projection, silScore, withDataIds };
  }, [enriched, k, indexKeys]);

  const withClusterIds = useMemo((): EnrichedParticipant[] => {
    if (!clusterData.result) return enriched;
    const assignmentMap = new Map<string, number>();
    clusterData.withDataIds.forEach((id, i) => {
      assignmentMap.set(id, clusterData.result!.assignments[i]);
    });
    return enriched.map((p) => {
      const clusterId = assignmentMap.get(p.gameId) ?? null;
      return clusterId !== null ? { ...p, clusterId } : p;
    });
  }, [enriched, clusterData]);

  const allProfileLabels = useMemo(() => {
    const labels = new Set<ProfileLabel>();
    for (const p of withClusterIds) labels.add(p.profileLabel);
    return [...labels].sort();
  }, [withClusterIds]);

  const allClusterIds = useMemo(() => {
    const ids = new Set<number>();
    for (const p of withClusterIds) {
      if (p.clusterId !== null) ids.add(p.clusterId);
    }
    return [...ids].sort();
  }, [withClusterIds]);

  const filtered = useMemo(() => {
    return withClusterIds.filter((p) => {
      if (filters.status !== 'all' && p.status !== filters.status) return false;
      if (filters.profileLabel !== 'all' && p.profileLabel !== filters.profileLabel) return false;
      if (filters.clusterId !== 'all' && p.clusterId !== filters.clusterId) return false;
      if (filters.dateFrom) {
        const pDate = (p.completedAt ?? p.createdAt).slice(0, 10);
        if (pDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const pDate = (p.completedAt ?? p.createdAt).slice(0, 10);
        if (pDate > filters.dateTo) return false;
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (
          !p.userEmail.toLowerCase().includes(q) &&
          !p.gameId.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [withClusterIds, filters]);

  const completedWithData = filtered.filter((p) => p.questionnaire);

  if (participants.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">{t('admin.dashboard.noData')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('admin.dashboard.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('admin.dashboard.subtitle')}</p>
      </div>

      <DashboardFilters
        filters={filters}
        onChange={setFilters}
        profileLabels={allProfileLabels}
        clusterIds={allClusterIds}
        totalCount={withClusterIds.length}
        filteredCount={filtered.length}
      />

      <GlobalOverview participants={filtered} />

      {completedWithData.length > 0 && (
        <>
          <ScoreAnalysis participants={filtered} />
          <ComparativeDimensions participants={filtered} />
          <ClusterAnalysis
            participants={filtered}
            k={k}
            onKChange={setK}
            clusterResult={clusterData.result}
            projection={clusterData.projection}
            silhouetteScore={clusterData.silScore}
          />
          <ProfileDistribution participants={filtered} />
          <UsageSegmentation participants={filtered} />
          <CorrelationMatrix participants={filtered} />
          <OutlierDetection participants={filtered} />
        </>
      )}

      <DataTableExport participants={filtered} />
    </div>
  );
}
