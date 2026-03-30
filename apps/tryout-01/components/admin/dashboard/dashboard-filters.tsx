'use client';

import { useTranslation } from '@imbustai/i18n';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProfileLabel } from '@/lib/analytics/types';
import { X } from 'lucide-react';

export interface DashboardFilterState {
  dateFrom: string;
  dateTo: string;
  status: 'all' | 'completed' | 'in_progress';
  profileLabel: ProfileLabel | 'all';
  clusterId: number | 'all';
  search: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
  profileLabels: ProfileLabel[];
  clusterIds: number[];
  totalCount: number;
  filteredCount: number;
}

export function DashboardFilters({
  filters,
  onChange,
  profileLabels,
  clusterIds,
  totalCount,
  filteredCount,
}: DashboardFiltersProps) {
  const { t } = useTranslation();
  const f = (key: string) => t(`admin.dashboard.filters.${key}`);

  const update = (patch: Partial<DashboardFilterState>) =>
    onChange({ ...filters, ...patch });

  const hasActiveFilters =
    filters.dateFrom ||
    filters.dateTo ||
    filters.status !== 'all' ||
    filters.profileLabel !== 'all' ||
    filters.clusterId !== 'all' ||
    filters.search;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{f('title')}</h3>
        <span className="text-xs text-muted-foreground">
          {f('showing')} {filteredCount} {f('of')} {totalCount} {f('participants')}
        </span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('from')}</label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('to')}</label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
            className="h-8 w-36 text-xs"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('status')}</label>
          <select
            value={filters.status}
            onChange={(e) => update({ status: e.target.value as DashboardFilterState['status'] })}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="all">{f('all')}</option>
            <option value="completed">{f('completed')}</option>
            <option value="in_progress">{f('inProgress')}</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('profile')}</label>
          <select
            value={filters.profileLabel}
            onChange={(e) => update({ profileLabel: e.target.value as ProfileLabel | 'all' })}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="all">{f('all')}</option>
            {profileLabels.map((l) => (
              <option key={l} value={l}>
                {t(`admin.dashboard.profileDistribution.profiles.${l}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('cluster')}</label>
          <select
            value={filters.clusterId === 'all' ? 'all' : String(filters.clusterId)}
            onChange={(e) =>
              update({ clusterId: e.target.value === 'all' ? 'all' : Number(e.target.value) })
            }
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="all">{f('all')}</option>
            {clusterIds.map((id) => (
              <option key={id} value={String(id)}>
                Cluster {id + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{f('search')}</label>
          <Input
            type="text"
            placeholder={f('search')}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="h-8 w-48 text-xs"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() =>
              onChange({
                dateFrom: '',
                dateTo: '',
                status: 'all',
                profileLabel: 'all',
                clusterId: 'all',
                search: '',
              })
            }
          >
            <X className="size-3" />
            {f('reset')}
          </Button>
        )}
      </div>
    </div>
  );
}
