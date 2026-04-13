'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import type { GameRow, InteractionRow, StoryRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <Link
          href="/admin/games"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          ← {t('games.adminBackToList')}
        </Link>
        <Link
          href="/admin"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('games.adminBackToDashboard')}
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-semibold">
        {t('games.gameDetail')}
      </h1>
      {story ? (
        <p className="mt-2 text-muted-foreground">
          {storyTitle(story, locale)}
        </p>
      ) : null}
      <p className="mt-1 font-mono text-xs text-muted-foreground">{gameId}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('admin.user')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-semibold">{userEmail}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('common.status')}
            </CardTitle>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('admin.interactionCount')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {locale === 'it'
              ? `${list.length} in totale (${aiCount} AI, ${userCount} utente)`
              : `${list.length} total (${aiCount} AI, ${userCount} user)`}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t('games.datesCard')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs leading-relaxed">
            <p>
              {t('games.started')}: {formatDate(game.created_at)}
            </p>
            <p>
              {t('games.completed')}: {formatDate(game.completed_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          {t('games.letters')}
        </h2>
        <ol className="space-y-4">
          {list.map((i) => (
            <li
              key={i.id}
              className="rounded-lg border border-border bg-card p-4 text-sm"
            >
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={i.role === 'ai' ? 'default' : 'outline'}>
                  {i.role}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  #{i.letter_number} · {formatDate(i.created_at)}
                </span>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {i.content}
              </pre>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
