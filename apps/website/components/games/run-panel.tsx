'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Inline,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Typography,
} from '@imbustai/ds';
import { formatTokens, formatUsd } from '@/lib/format-cost';
import type { AiCallRow, RunRow } from '@/lib/types/db';
import adminStyles from '../admin/admin-styles.module.css';
import styles from './games.module.css';

const OUTCOME_KEY = {
  ending: 'outcomeEnding',
  turn_limit: 'outcomeTurnLimit',
  cap: 'outcomeCap',
  error: 'outcomeError',
} as const;
const STATUS_KEY = { running: 'statusRunning', completed: 'statusCompleted', failed: 'statusFailed' } as const;

/**
 * A Run on its Game's admin page: where it stands against its cap, the button
 * that plays it Turn by Turn, and — once it stops — its report: the Ending,
 * a score per complaint and what every model call cost.
 */
export function RunPanel({
  run,
  calls,
  spentUsd,
  autoPlay,
}: {
  run: RunRow;
  calls: AiCallRow[];
  spentUsd: number;
  autoPlay: boolean;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const [playing, setPlaying] = useState(false);
  const [turn, setTurn] = useState(run.report?.turns_played ?? 0);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  const play = useCallback(async () => {
    setPlaying(true);
    setError(null);
    for (;;) {
      const res = await fetch(`/api/admin/runs/${run.game_id}/step`, { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as {
        status?: string;
        turns_played?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(body.error ?? t('common.error'));
        break;
      }
      setTurn(body.turns_played ?? 0);
      // Each Turn's Letters and costs appear as they are sent.
      router.refresh();
      if (body.status !== 'running') break;
    }
    setPlaying(false);
  }, [router, run.game_id, t]);

  useEffect(() => {
    if (autoPlay && run.status === 'running' && !started.current) {
      started.current = true;
      void play();
    }
  }, [autoPlay, play, run.status]);

  const report = run.report;
  return (
    <Card>
      <CardHeader>
        <Inline gap="2" align="center">
          <CardTitle>{t('admin.run.title')}</CardTitle>
          <Badge variant={run.status === 'failed' ? 'destructive' : run.status === 'completed' ? 'default' : 'secondary'}>
            {t(`admin.run.${STATUS_KEY[run.status]}`)}
          </Badge>
          <Badge variant="outline">{run.persona}</Badge>
          <Box marginLeft="auto">
            <span className={styles.tabularNums}>
              <Typography variant="body" as="span">
                {t('admin.run.spent')}: {formatUsd(spentUsd)} / {formatUsd(Number(run.cap_usd))} ·{' '}
                {t('admin.run.estimate')}: {formatUsd(Number(run.estimate_usd))}
              </Typography>
            </span>
          </Box>
        </Inline>
      </CardHeader>
      <CardContent>
        <Stack gap="4">
          {run.status === 'running' ? (
            <div>
              <Button type="button" disabled={playing} onClick={play}>
                {playing ? `${t('admin.run.playing')} ${turn + 1} / ${run.max_turns}` : t('admin.run.play')}
              </Button>
            </div>
          ) : null}
          {error ? <p className={adminStyles.errorText} role="alert">{error}</p> : null}

          {report && run.outcome ? (
            <Stack gap="2">
              <Typography variant="body">
                {t(`admin.run.${OUTCOME_KEY[run.outcome]}`)} · {t('admin.run.turnsPlayed')}: {report.turns_played}
                {report.ending ? ` · ${t('admin.run.ending')}: ${report.ending.key}` : ''}
              </Typography>
              {report.error ? <p className={adminStyles.errorText}>{report.error}</p> : null}
              {report.draft_errors > 0 ? (
                <Typography variant="caption" tone="muted">
                  {t('admin.run.draftErrors')}: {report.draft_errors}
                </Typography>
              ) : null}
              <Typography variant="caption" tone="muted">{t('admin.run.scores')}</Typography>
              {report.scores ? (
                <Stack gap="1" as="ul">
                  {report.scores.map((score) => (
                    <Box as="li" key={score.complaint}>
                      <Inline gap="2" align="flex-start">
                        <Badge variant={score.score >= 4 ? 'default' : score.score >= 3 ? 'secondary' : 'destructive'}>
                          {score.score}/5
                        </Badge>
                        <Typography variant="body" as="span">
                          {t(`admin.run.complaint.${score.complaint}`)}: {score.evidence}
                        </Typography>
                      </Inline>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="caption" tone="muted">
                  {t('admin.run.noScores')}{report.scores_error ? `: ${report.scores_error}` : ''}
                </Typography>
              )}
            </Stack>
          ) : null}

          {calls.length > 0 ? (
            <Stack gap="2">
              <Typography variant="caption" tone="muted">{t('admin.run.calls')}</Typography>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin.cost.turn')}</TableHead>
                    <TableHead>Hook</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>{t('admin.cost.model')}</TableHead>
                    <TableHead>Tokens</TableHead>
                    <TableHead>USD</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{call.turn_number}</TableCell>
                      <TableCell>{call.hook}</TableCell>
                      <TableCell>{call.role}</TableCell>
                      <TableCell>
                        {call.purpose}
                        {call.character_slug ? ` (${call.character_slug})` : ''}
                        {call.outcome !== 'ok' ? ` · ${call.outcome}` : ''}
                      </TableCell>
                      <TableCell>{call.model}</TableCell>
                      <TableCell>
                        ↓{formatTokens(call.input_tokens + call.cache_read_input_tokens + call.cache_creation_input_tokens)} ↑
                        {formatTokens(call.output_tokens)}
                      </TableCell>
                      <TableCell>
                        <span className={styles.tabularNums}>{formatUsd(Number(call.cost_usd))}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
