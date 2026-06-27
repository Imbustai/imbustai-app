'use client';

import { useTranslation } from '@imbustai/i18n';
import type { AiDraftRow, StoryCharacterRow, UsageRecord } from '@/lib/types/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatTokens, formatUsd } from '@/lib/format-cost';

// Admin-only AI cost breakdown for a game: total real spend, then per draft
// version (orchestrator + per-letter calls). Never rendered to players.
export function GameCostBreakdown({
  drafts,
  turnNumbers,
  characters,
}: {
  drafts: AiDraftRow[];
  turnNumbers: Record<string, number>;
  characters: StoryCharacterRow[];
}) {
  const { t } = useTranslation();
  const nameOf = (slug?: string) =>
    (slug && characters.find((c) => c.slug === slug)?.name) || slug || '—';

  const total = drafts.reduce((acc, d) => acc + Number(d.cost_usd ?? 0), 0);
  const sorted = [...drafts].sort((a, b) => {
    const ta = turnNumbers[a.turn_id] ?? 0;
    const tb = turnNumbers[b.turn_id] ?? 0;
    return ta - tb || a.version - b.version;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          {t('admin.cost.breakdownTitle')}
          <Badge variant="secondary" className="tabular-nums">
            {t('admin.cost.totalSpend')}: {formatUsd(total)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{t('admin.cost.realSpendNote')}</p>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('admin.cost.noSpend')}</p>
        ) : (
          sorted.map((d) => {
            const usage = (d.usage ?? []) as UsageRecord[];
            return (
              <div key={d.id} className="rounded-md border border-border p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">
                    {t('admin.cost.turn')} {turnNumbers[d.turn_id] ?? '?'} · v{d.version}
                  </span>
                  <Badge variant="outline">{d.source}</Badge>
                  <span className="text-xs text-muted-foreground">{d.model || '—'}</span>
                  <span className="ml-auto tabular-nums font-medium">
                    {t('admin.cost.draftTotal')}: {formatUsd(Number(d.cost_usd ?? 0))}
                  </span>
                </div>
                {usage.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {usage.map((u, i) => (
                      <li key={i} className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground">
                          {u.call_type === 'orchestrator'
                            ? t('admin.cost.orchestrator')
                            : `${t('admin.cost.letterTo')} ${nameOf(u.character_slug)}`}
                        </span>
                        <span>
                          ↓{formatTokens(u.input_tokens)} ↑{formatTokens(u.output_tokens)}
                        </span>
                        <span className="ml-auto tabular-nums">{formatUsd(u.cost_usd)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
