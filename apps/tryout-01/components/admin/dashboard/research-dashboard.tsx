'use client';

import { useMemo, useState, useCallback } from 'react';
import { useTranslation } from '@/lib/i18n/context';
import { computeIndices, computeBalances } from '@/lib/questionnaire';
import { assignProfileLabel, assignUsageLabels } from '@/lib/analytics/profiles';
import { kMeans } from '@/lib/analytics/clustering';
import { INDEX_LABELS } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import type { ParticipantRecord, EnrichedParticipant, ProfileLabel } from '@/lib/analytics/types';
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
  const [clusterAssignments, setClusterAssignments] = useState<number[]>([]);

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

  const withClusterIds = useMemo((): EnrichedParticipant[] => {
    if (clusterAssignments.length === 0) return enriched;
    const withData = enriched.filter((p) => p.questionnaire);
    let clusterIdx = 0;
    return enriched.map((p) => {
      if (!p.questionnaire) return p;
      return { ...p, clusterId: clusterAssignments[clusterIdx++] ?? null };
    });
  }, [enriched, clusterAssignments]);

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

  const handleClusterChange = useCallback((assignments: number[]) => {
    setClusterAssignments(assignments);
  }, []);

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
          <ClusterAnalysis participants={filtered} onClusterChange={handleClusterChange} />
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
