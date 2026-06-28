'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import { formatUsd } from '@/lib/format-cost';
import type { GameRow, StoryRow } from '@/lib/types/db';
import {
  Badge,
  Button,
  Stack,
  Inline,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@imbustai/ds';
import styles from './games.module.css';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function GamesList({
  rows,
  adminView = false,
}: {
  adminView?: boolean;
  rows: {
    game: GameRow;
    story: StoryRow | undefined;
    interactionCount: number;
    userEmail?: string;
    totalCostUsd?: number;
    models?: string[];
  }[];
}) {
  const { t, locale } = useTranslation();

  const title = adminView ? t('games.adminListTitle') : t('games.title');
  const subtitle = adminView ? t('games.adminListSubtitle') : t('games.subtitle');
  const empty = adminView ? t('games.adminListEmpty') : t('games.empty');

  if (!rows.length) {
    return (
      <Stack gap="2">
        <Typography variant="h2">{title}</Typography>
        <Typography variant="body" tone="muted">{subtitle}</Typography>
        <Typography variant="caption" tone="muted">{empty}</Typography>
        {!adminView ? (
          <Button variant="link" asChild>
            <Link href="/shop">{t('nav.shop')}</Link>
          </Button>
        ) : null}
      </Stack>
    );
  }

  return (
    <Stack gap="4">
      <Stack gap="2">
        <Typography variant="h2">{title}</Typography>
        <Typography variant="body" tone="muted">{subtitle}</Typography>
      </Stack>
      <Table>
        <TableHeader>
          <TableRow>
            {adminView ? (
              <TableHead>{t('admin.user')}</TableHead>
            ) : null}
            <TableHead>{t('games.orderId')}</TableHead>
            <TableHead>{t('games.storyColumn')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead>{t('games.interactions')}</TableHead>
            {adminView ? <TableHead>{t('admin.cost.column')}</TableHead> : null}
            <TableHead>{t('games.started')}</TableHead>
            <TableHead>{t('games.completed')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ game, story, interactionCount, userEmail, totalCostUsd, models }) => (
            <TableRow key={game.id}>
              {adminView ? (
                <TableCell>
                  <span className={styles.truncateCell}>
                    <Typography variant="caption">{userEmail ?? '—'}</Typography>
                  </span>
                </TableCell>
              ) : null}
              <TableCell>
                <span className={styles.monoSmall}>
                  {game.order_id.slice(0, 8)}…
                </span>
              </TableCell>
              <TableCell>
                {story ? storyTitle(story, locale) : '—'}
              </TableCell>
              <TableCell>
                {game.status === 'completed' ? (
                  <Badge>{t('games.completed')}</Badge>
                ) : (
                  <Badge variant="secondary">{t('games.inProgress')}</Badge>
                )}
              </TableCell>
              <TableCell>{interactionCount}</TableCell>
              {adminView ? (
                <TableCell>
                  <span className={`${styles.noWrap} ${styles.tabularNums}`} title={models?.length ? models.join(', ') : undefined}>
                    {formatUsd(totalCostUsd ?? 0)}
                    {models?.length ? (
                      <Typography variant="caption" tone="muted" as="span">
                        {' '}{models.length === 1 ? models[0] : `${models.length} models`}
                      </Typography>
                    ) : null}
                  </span>
                </TableCell>
              ) : null}
              <TableCell>{formatDate(game.created_at)}</TableCell>
              <TableCell>{formatDate(game.completed_at)}</TableCell>
              <TableCell>
                <Button variant="link" asChild>
                  <Link href={adminView ? `/admin/game/${game.id}` : `/game/${game.id}`}>
                    {t('common.view')}
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
