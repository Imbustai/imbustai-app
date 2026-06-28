'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import type { GameRow, InteractionRow, StoryRow } from '@/lib/types/db';
import { Badge, Button, Stack, Inline, Box, Typography } from '@imbustai/ds';
import styles from './games.module.css';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function GameDetail({
  game,
  interactions,
  story,
}: {
  game: GameRow;
  interactions: InteractionRow[];
  story?: StoryRow;
}) {
  const { t, locale } = useTranslation();

  return (
    <Stack gap="4">
      <Button variant="link" size="sm" asChild>
        <Link href="/games">← {t('games.title')}</Link>
      </Button>
      <Typography variant="h2">{t('games.gameDetail')}</Typography>
      {story ? (
        <Typography variant="body" tone="muted">
          {storyTitle(story, locale)}
        </Typography>
      ) : null}
      <Inline gap="2">
        {game.status === 'completed' ? (
          <Badge>{t('games.completed')}</Badge>
        ) : (
          <Badge variant="secondary">{t('games.inProgress')}</Badge>
        )}
        <Typography variant="caption" tone="muted" as="span">
          {t('games.orderId')}: {game.order_id.slice(0, 8)}…
        </Typography>
      </Inline>
      <Typography variant="caption" tone="muted">
        {t('games.started')}: {formatDate(game.created_at)} ·{' '}
        {t('games.completed')}: {formatDate(game.completed_at)}
      </Typography>

      <Box as="section" marginTop="6">
        <Typography variant="h3">{t('games.letters')}</Typography>
        <Stack gap="4" as="ol">
          {interactions.map((i) => (
            <li key={i.id} className={styles.interactionCard}>
              <Inline gap="2">
                <Badge variant={i.role === 'ai' ? 'default' : 'outline'}>
                  {i.role}
                </Badge>
                <Typography variant="caption" tone="muted" as="span">
                  #{i.letter_number} · {formatDate(i.created_at)}
                </Typography>
              </Inline>
              <Box marginTop="2">
                <pre className={styles.letterContent}>{i.content}</pre>
              </Box>
            </li>
          ))}
        </Stack>
      </Box>
    </Stack>
  );
}
