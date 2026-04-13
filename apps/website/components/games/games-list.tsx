'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import type { GameRow, StoryRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
  }[];
}) {
  const { t, locale } = useTranslation();

  const title = adminView ? t('games.adminListTitle') : t('games.title');
  const subtitle = adminView ? t('games.adminListSubtitle') : t('games.subtitle');
  const empty = adminView ? t('games.adminListEmpty') : t('games.empty');

  if (!rows.length) {
    return (
      <div>
        <h1 className="font-heading text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-muted-foreground">{subtitle}</p>
        <p className="mt-8 text-sm text-muted-foreground">{empty}</p>
        {!adminView ? (
          <Link
            href="/shop"
            className="mt-4 inline-block text-primary underline"
          >
            {t('nav.shop')}
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-heading text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted-foreground">{subtitle}</p>
      <Table className="mt-8">
        <TableHeader>
          <TableRow>
            {adminView ? (
              <TableHead>{t('admin.user')}</TableHead>
            ) : null}
            <TableHead>{t('games.orderId')}</TableHead>
            <TableHead>{t('games.storyColumn')}</TableHead>
            <TableHead>{t('common.status')}</TableHead>
            <TableHead>{t('games.interactions')}</TableHead>
            <TableHead>{t('games.started')}</TableHead>
            <TableHead>{t('games.completed')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ game, story, interactionCount, userEmail }) => (
            <TableRow key={game.id}>
              {adminView ? (
                <TableCell className="max-w-[10rem] truncate text-sm">
                  {userEmail ?? '—'}
                </TableCell>
              ) : null}
              <TableCell className="font-mono text-xs">
                {game.order_id.slice(0, 8)}…
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
              <TableCell>{formatDate(game.created_at)}</TableCell>
              <TableCell>{formatDate(game.completed_at)}</TableCell>
              <TableCell>
                <Link
                  href={`/game/${game.id}`}
                  className="text-primary underline"
                >
                  {t('common.view')}
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
