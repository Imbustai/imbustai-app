'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/lib/i18n/context';
import { correlationMatrix, pearsonCorrelation } from '@/lib/analytics/statistics';
import { QUESTION_KEYS, computeIndices, INDEX_LABELS } from '@/lib/questionnaire';
import type { SessionIndices } from '@/lib/questionnaire';
import type { EnrichedParticipant } from '@/lib/analytics/types';

interface CorrelationMatrixProps {
  participants: EnrichedParticipant[];
}

const HIGHLIGHTED_PAIRS = [
  ['q3', 'q4'],
  ['q5', 'q6'],
  ['q7', 'q8'],
  ['q9', 'q10'],
  ['judgementReflection', 'moralBoundaryMediation'],
  ['emotionalInvolvement', 'argumentativeEngagement'],
];

function correlationColor(r: number): string {
  const abs = Math.abs(r);
  if (r > 0) {
    const alpha = Math.round(abs * 80);
    return `hsla(221, 83%, 53%, ${alpha}%)`;
  }
  const alpha = Math.round(abs * 80);
  return `hsla(25, 95%, 53%, ${alpha}%)`;
}

function correlationStrength(r: number, t: (k: string) => string): string {
  const abs = Math.abs(r);
  const dir = r >= 0
    ? t('admin.dashboard.correlationMatrix.positive')
    : t('admin.dashboard.correlationMatrix.negative');
  if (abs >= 0.7) return `${t('admin.dashboard.correlationMatrix.strong')} ${dir}`;
  if (abs >= 0.4) return `${t('admin.dashboard.correlationMatrix.moderate')} ${dir}`;
  return `${t('admin.dashboard.correlationMatrix.weak')} ${dir}`;
}

export function CorrelationMatrix({ participants }: CorrelationMatrixProps) {
  const { t } = useTranslation();
  const cm = (key: string) => t(`admin.dashboard.correlationMatrix.${key}`);

  const withData = participants.filter((p) => p.questionnaire);

  const keys = [...(QUESTION_KEYS as readonly string[])];

  const { matrix, highlightedResults } = useMemo(() => {
    if (withData.length < 3) return { matrix: [], highlightedResults: [] };

    const questionnaires = withData.map((p) => p.questionnaire!);
    const allIndices = questionnaires.map((q) => computeIndices(q));

    const dataMap: Record<string, number[]> = {};
    for (const key of QUESTION_KEYS) {
      dataMap[key] = questionnaires.map((q) => q[key]);
    }
    const indexKeys = Object.keys(INDEX_LABELS) as (keyof SessionIndices)[];
    for (const key of indexKeys) {
      dataMap[key] = allIndices.map((idx) => idx[key]);
    }

    const matrix = correlationMatrix(dataMap, keys);

    const highlightedResults = HIGHLIGHTED_PAIRS.map(([a, b]) => {
      const va = dataMap[a];
      const vb = dataMap[b];
      if (!va || !vb) return null;
      const r = pearsonCorrelation(va, vb);
      return { pair: `${a} / ${b}`, r };
    }).filter(Boolean) as { pair: string; r: number }[];

    return { matrix, highlightedResults };
  }, [withData]);

  if (withData.length < 3) return null;

  return (
    <section>
      <h2 className="mb-1 text-lg font-semibold tracking-tight">{cm('title')}</h2>
      <p className="mb-4 text-sm text-muted-foreground">{cm('subtitle')}</p>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent className="overflow-x-auto py-4">
            <div className="inline-block">
              <div className="flex">
                <div className="w-12" />
                {keys.map((k) => (
                  <div
                    key={k}
                    className="flex w-10 items-end justify-center pb-1"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                  >
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {k.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
              {keys.map((rowKey) => (
                <div key={rowKey} className="flex">
                  <div className="flex w-12 items-center">
                    <span className="text-[9px] font-medium text-muted-foreground">
                      {rowKey.toUpperCase()}
                    </span>
                  </div>
                  {keys.map((colKey) => {
                    const entry = matrix.find(
                      (e) => e.rowKey === rowKey && e.colKey === colKey
                    );
                    const val = entry?.value ?? 0;
                    return (
                      <div
                        key={colKey}
                        className="flex size-10 items-center justify-center border border-background/50 text-[9px] font-medium"
                        style={{ backgroundColor: correlationColor(val) }}
                        title={`${rowKey} × ${colKey}: ${val.toFixed(3)}`}
                      >
                        {rowKey !== colKey ? val.toFixed(1) : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4">
            <h3 className="mb-3 text-sm font-semibold">{cm('highlightedPairs')}</h3>
            <div className="space-y-2">
              {highlightedResults.map((h) => (
                <div key={h.pair} className="rounded-md border px-3 py-2">
                  <p className="text-xs font-medium">{h.pair}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${Math.abs(h.r) * 100}%`,
                        backgroundColor: correlationColor(h.r),
                        minWidth: 8,
                      }}
                    />
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      r={h.r.toFixed(3)} ({correlationStrength(h.r, t)})
                    </span>
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
