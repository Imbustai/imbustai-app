'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@imbustai/i18n';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { QUESTION_KEYS, INDEX_LABELS, computeIndices, computeBalances } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import type { EnrichedParticipant } from '@/lib/analytics/types';
import { Download, ArrowUpDown } from 'lucide-react';

interface DataTableExportProps {
  participants: EnrichedParticipant[];
}

type SortKey = 'email' | 'status' | 'date' | 'duration' | 'profile' | 'cluster' | string;

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function DataTableExport({ participants }: DataTableExportProps) {
  const { t } = useTranslation();
  const dt = (key: string) => t(`admin.dashboard.dataTable.${key}`);

  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);

  const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];

  const sorted = useMemo(() => {
    const copy = [...participants];
    copy.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'email':
          cmp = a.userEmail.localeCompare(b.userEmail);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'date':
          cmp = (a.completedAt ?? a.createdAt).localeCompare(b.completedAt ?? b.createdAt);
          break;
        case 'duration':
          cmp = (a.durationMinutes ?? 0) - (b.durationMinutes ?? 0);
          break;
        case 'profile':
          cmp = a.profileLabel.localeCompare(b.profileLabel);
          break;
        case 'cluster':
          cmp = (a.clusterId ?? -1) - (b.clusterId ?? -1);
          break;
        default:
          if (sortKey.startsWith('q') && a.questionnaire && b.questionnaire) {
            cmp = (a.questionnaire[sortKey as keyof typeof a.questionnaire] ?? 0) -
                  (b.questionnaire[sortKey as keyof typeof b.questionnaire] ?? 0);
          }
      }
      return sortAsc ? cmp : -cmp;
    });
    return copy;
  }, [participants, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function exportParticipantsCsv() {
    const headers = [
      'gameId', 'email', 'status', 'createdAt', 'completedAt', 'durationMin',
      'profile', 'cluster',
      ...QUESTION_KEYS,
      ...indexKeys,
      'responsibilityBalance', 'agencyBalance', 'emotionalPositioning', 'boundaryOrientation',
    ];
    const rows = participants.map((p) => {
      const q = p.questionnaire;
      const idx = p.indices;
      const bal = p.balances;
      return [
        p.gameId, p.userEmail, p.status, p.createdAt, p.completedAt ?? '',
        p.durationMinutes ?? '',
        p.profileLabel, p.clusterId ?? '',
        ...QUESTION_KEYS.map((k) => q?.[k] ?? ''),
        ...indexKeys.map((k) => idx?.[k]?.toFixed(2) ?? ''),
        bal?.responsibilityBalance.value ?? '',
        bal?.agencyBalance.value ?? '',
        bal?.emotionalPositioning.value ?? '',
        bal?.boundaryOrientation.value ?? '',
      ].join(',');
    });
    downloadCsv('participants-export.csv', [headers.join(','), ...rows].join('\n'));
  }

  function exportAggregatedCsv() {
    const withData = participants.filter((p) => p.questionnaire);
    const headers = ['metric', 'mean', 'median', 'stddev', 'min', 'max'];
    const allQ = withData.map((p) => p.questionnaire!);
    const allIdx = allQ.map((q) => computeIndices(q));

    const rows: string[] = [];
    for (const key of QUESTION_KEYS) {
      const vals = allQ.map((q) => q[key]);
      const m = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sorted = [...vals].sort((a, b) => a - b);
      const med = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1 || 1));
      rows.push([key, m.toFixed(2), med.toFixed(2), sd.toFixed(2), Math.min(...vals), Math.max(...vals)].join(','));
    }
    for (const key of indexKeys) {
      const vals = allIdx.map((idx) => idx[key]);
      const m = vals.reduce((s, v) => s + v, 0) / vals.length;
      const sorted = [...vals].sort((a, b) => a - b);
      const med = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const sd = Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / (vals.length - 1 || 1));
      rows.push([key, m.toFixed(2), med.toFixed(2), sd.toFixed(2), Math.min(...vals).toFixed(2), Math.max(...vals).toFixed(2)].join(','));
    }
    downloadCsv('aggregated-stats.csv', [headers.join(','), ...rows].join('\n'));
  }

  const SortHeader = ({ label, sortId }: { label: string; sortId: SortKey }) => (
    <TableHead
      className="cursor-pointer select-none whitespace-nowrap text-xs"
      onClick={() => toggleSort(sortId)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="size-3 text-muted-foreground" />
      </span>
    </TableHead>
  );

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{dt('title')}</h2>
          <p className="text-sm text-muted-foreground">{dt('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportParticipantsCsv}>
            <Download className="size-3.5" />
            {dt('exportCsv')}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={exportAggregatedCsv}>
            <Download className="size-3.5" />
            {dt('exportAggregated')}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader label={dt('email')} sortId="email" />
                <SortHeader label={dt('status')} sortId="status" />
                <SortHeader label={dt('date')} sortId="date" />
                <SortHeader label={dt('duration')} sortId="duration" />
                <SortHeader label={dt('profile')} sortId="profile" />
                <SortHeader label={dt('cluster')} sortId="cluster" />
                {QUESTION_KEYS.map((k) => (
                  <SortHeader key={k} label={k.toUpperCase()} sortId={k} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.slice(0, 50).map((p) => (
                <TableRow key={p.gameId}>
                  <TableCell className="text-xs">{p.userEmail}</TableCell>
                  <TableCell>
                    <Badge variant={p.status === 'completed' ? 'default' : 'secondary'} className="text-[10px]">
                      {p.status === 'completed' ? dt('status') : 'In Progress'}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {(p.completedAt ?? p.createdAt).slice(0, 10)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.durationMinutes ? `${p.durationMinutes}m` : '—'}
                  </TableCell>
                  <TableCell className="text-xs">
                    {t(`admin.dashboard.profileDistribution.profiles.${p.profileLabel}`)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.clusterId !== null ? p.clusterId + 1 : '—'}
                  </TableCell>
                  {QUESTION_KEYS.map((k) => (
                    <TableCell key={k} className="text-center text-xs">
                      {p.questionnaire?.[k] ?? '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
