'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import { storyTitle } from '@/lib/story-i18n';
import type { StoryRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export function lifecycleBadgeVariant(lifecycle: StoryRow['lifecycle']) {
  return lifecycle === 'released'
    ? 'default'
    : lifecycle === 'testing'
      ? 'secondary'
      : 'outline';
}

export function StoriesListClient({
  stories,
  gamesByStory,
}: {
  stories: StoryRow[];
  gamesByStory: Record<string, { total: number; inProgress: number }>;
}) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [newSlug, setNewSlug] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createStory() {
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: newSlug.trim(), title: newTitle.trim() }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      const key = `storiesAdmin.errors.${body.error}`;
      const text = t(key);
      setError(text === key ? t('common.error') : text);
      return;
    }
    router.push(`/admin/stories/${body.storyId}`);
  }

  async function duplicateStory(storyId: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/stories/${storyId}/duplicate`, { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) router.push(`/admin/stories/${body.storyId}`);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm">
        <Link href="/admin" className="text-muted-foreground transition-colors hover:text-foreground">
          ← {t('storiesAdmin.backToDashboard')}
        </Link>
      </div>

      <h1 className="font-heading text-2xl font-semibold">{t('storiesAdmin.title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('storiesAdmin.subtitle')}</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('storiesAdmin.newStory')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">
                {t('storiesAdmin.fields.slug')}
              </label>
              <Input
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="my_new_story"
                className="w-56"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-muted-foreground">
                {t('storiesAdmin.fields.title')}
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={t('storiesAdmin.newStoryTitlePlaceholder')}
                className="w-72"
              />
            </div>
            <Button onClick={createStory} disabled={busy || !newSlug.trim()}>
              {t('storiesAdmin.create')}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('storiesAdmin.slugHint')}</p>
          {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t('storiesAdmin.allStories')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('storiesAdmin.fields.title')}</TableHead>
                <TableHead>{t('storiesAdmin.fields.slug')}</TableHead>
                <TableHead>{t('storiesAdmin.fields.lifecycle')}</TableHead>
                <TableHead>{t('storiesAdmin.fields.published')}</TableHead>
                <TableHead>{t('storiesAdmin.games')}</TableHead>
                <TableHead>{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stories.map((story) => {
                const counts = gamesByStory[story.id] ?? { total: 0, inProgress: 0 };
                return (
                  <TableRow key={story.id}>
                    <TableCell className="font-medium">
                      <Link href={`/admin/stories/${story.id}`} className="hover:underline">
                        {storyTitle(story, locale)}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{story.slug}</TableCell>
                    <TableCell>
                      <Badge variant={lifecycleBadgeVariant(story.lifecycle)}>
                        {t(`storiesAdmin.lifecycle.${story.lifecycle}`)}
                      </Badge>
                    </TableCell>
                    <TableCell>{story.is_published ? '✓' : '—'}</TableCell>
                    <TableCell>
                      {counts.total}
                      {counts.inProgress > 0 ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({counts.inProgress} {t('storiesAdmin.inProgress')})
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/stories/${story.id}`}>{t('storiesAdmin.edit')}</Link>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busy}
                          onClick={() => duplicateStory(story.id)}
                        >
                          {t('storiesAdmin.duplicate')}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {stories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    {t('common.none')}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
