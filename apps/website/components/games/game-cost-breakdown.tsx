'use client';

import { useTranslation } from '@imbustai/i18n';
import type { AiDraftRow, StoryCharacterRow, UsageRecord } from '@/lib/types/db';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Stack,
  Inline,
  Box,
  Typography,
} from '@imbustai/ds';
import { formatTokens, formatUsd } from '@/lib/format-cost';
import styles from './games.module.css';

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
        <Inline gap="2" align="center">
          <CardTitle>{t('admin.cost.breakdownTitle')}</CardTitle>
          <Badge variant="secondary">
            <span className={styles.tabularNums}>
              {t('admin.cost.totalSpend')}: {formatUsd(total)}
            </span>
          </Badge>
        </Inline>
      </CardHeader>
      <CardContent>
        <Stack gap="3">
          <Typography variant="caption" tone="muted">{t('admin.cost.realSpendNote')}</Typography>
          {sorted.length === 0 ? (
            <Typography variant="caption" tone="muted">{t('admin.cost.noSpend')}</Typography>
          ) : (
            sorted.map((d) => {
              const usage = (d.usage ?? []) as UsageRecord[];
              return (
                <div key={d.id} className={styles.letterPanel}>
                  <Inline gap="2" align="center">
                    <Typography variant="body">
                      {t('admin.cost.turn')} {turnNumbers[d.turn_id] ?? '?'} · v{d.version}
                    </Typography>
                    <Badge variant="outline">{d.source}</Badge>
                    <Typography variant="caption" tone="muted" as="span">{d.model || '—'}</Typography>
                    <Box marginLeft="auto">
                      <span className={styles.tabularNums}>
                        <Typography variant="body" as="span">
                          {t('admin.cost.draftTotal')}: {formatUsd(Number(d.cost_usd ?? 0))}
                        </Typography>
                      </span>
                    </Box>
                  </Inline>
                  {usage.length > 0 ? (
                    <Stack gap="1" as="ul">
                      {usage.map((u, i) => (
                        <Box key={i} as="li">
                        <Inline gap="2" align="center">
                          <Typography variant="caption" as="span">
                            {u.call_type === 'orchestrator'
                              ? t('admin.cost.orchestrator')
                              : `${t('admin.cost.letterTo')} ${nameOf(u.character_slug)}`}
                          </Typography>
                          <Typography variant="caption" tone="muted" as="span">
                            ↓{formatTokens(u.input_tokens)} ↑{formatTokens(u.output_tokens)}
                          </Typography>
                          <Box marginLeft="auto">
                            <span className={styles.tabularNums}>
                              <Typography variant="caption" as="span">{formatUsd(u.cost_usd)}</Typography>
                            </span>
                          </Box>
                        </Inline>
                        </Box>
                      ))}
                    </Stack>
                  ) : null}
                </div>
              );
            })
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
