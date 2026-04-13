'use client';

import { useTranslation } from '@imbustai/i18n';
import Link from 'next/link';
import { storyTitle } from '@/lib/story-i18n';
import type { GameRow, InteractionRow, StoryRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';

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
    <div>
      <Link
        href="/games"
        className="mb-6 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← {t('games.title')}
      </Link>
      <h1 className="font-heading text-2xl font-semibold">
        {t('games.gameDetail')}
      </h1>
      {story ? (
        <p className="mt-2 text-muted-foreground">
          {storyTitle(story, locale)}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {game.status === 'completed' ? (
          <Badge>{t('games.completed')}</Badge>
        ) : (
          <Badge variant="secondary">{t('games.inProgress')}</Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {t('games.orderId')}: {game.order_id.slice(0, 8)}…
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t('games.started')}: {formatDate(game.created_at)} ·{' '}
        {t('games.completed')}: {formatDate(game.completed_at)}
      </p>

      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          {t('games.letters')}
        </h2>
        <ol className="space-y-4">
          {interactions.map((i) => (
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
