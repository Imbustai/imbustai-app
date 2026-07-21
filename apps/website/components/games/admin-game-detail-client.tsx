'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import type { GameRow, InteractionRow, StoryRow } from '@/lib/types/db';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Stack,
  Inline,
  Grid,
  Box,
  Typography,
} from '@imbustai/ds';
import styles from './games.module.css';

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
}

export function AdminGameDetailClient({
  gameId,
  game,
  interactions,
  story,
  userEmail,
}: {
  gameId: string;
  game: GameRow;
  interactions: InteractionRow[];
  story?: StoryRow;
  userEmail: string;
}) {
  const { t, locale } = useTranslation();
  const list = interactions;
  const userCount = list.filter((i) => i.role === 'user').length;
  const aiCount = list.filter((i) => i.role === 'ai').length;

  return (
    <Stack gap="4">
      <Inline gap="4">
        <Button variant="link" size="sm" asChild>
          <Link href="/admin/games">← {t('games.adminBackToList')}</Link>
        </Button>
        <Button variant="link" size="sm" asChild>
          <Link href="/admin">{t('games.adminBackToDashboard')}</Link>
        </Button>
      </Inline>

      <Typography variant="h2">{t('games.gameDetail')}</Typography>
      {story ? (
        <Typography variant="body" tone="muted">
          {storyTitle(story, locale)}
        </Typography>
      ) : null}
      <Typography variant="caption" tone="muted" as="p">
        <span className={styles.monoSmall}>{gameId}</span>
      </Typography>

      <Grid columns={4} gap="4">
        <Card>
          <CardHeader>
            <CardDescription>{t('admin.user')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography variant="body">{userEmail}</Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('common.status')}</CardDescription>
          </CardHeader>
          <CardContent>
            {game.status === 'completed' ? (
              <Badge>{t('games.completed')}</Badge>
            ) : (
              <Badge variant="secondary">{t('games.inProgress')}</Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('admin.interactionCount')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography variant="caption">
              {locale === 'it'
                ? `${list.length} in totale (${aiCount} AI, ${userCount} utente)`
                : `${list.length} total (${aiCount} AI, ${userCount} user)`}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>{t('games.datesCard')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Typography variant="caption">
              {t('games.started')}: {formatDate(game.created_at)}
            </Typography>
            <Typography variant="caption">
              {t('games.completed')}: {formatDate(game.completed_at)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Box as="section" marginTop="6">
        <Typography variant="h3">{t('games.letters')}</Typography>
        <Stack gap="4" as="ol">
          {[...list].reverse().map((i) => (
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
