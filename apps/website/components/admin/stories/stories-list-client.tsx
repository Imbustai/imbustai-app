'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@imbustai/i18n';
import { storyTitle } from '@/lib/story-i18n';
import type { StoryRow } from '@/lib/types/db';
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Inline,
  Input,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Typography,
} from '@imbustai/ds';
import s from '../admin-styles.module.css';

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
      <Box marginBottom="6">
        <Link href="/admin" className={s.mutedLink}>
          ← {t('storiesAdmin.backToDashboard')}
        </Link>
      </Box>

      <Typography variant="h2" as="h1">{t('storiesAdmin.title')}</Typography>
      <Typography variant="body" tone="muted">{t('storiesAdmin.subtitle')}</Typography>

      <Box marginTop="6">
        <Card>
          <CardHeader>
            <CardTitle>{t('storiesAdmin.newStory')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap="3">
              <Inline gap="3" align="flex-end">
                <Stack gap="1">
                  <Typography variant="caption" tone="muted" as="label">
                    {t('storiesAdmin.fields.slug')}
                  </Typography>
                  <Box width="56">
                    <Input
                      value={newSlug}
                      onChange={(e) => setNewSlug(e.target.value)}
                      placeholder="my_new_story"
                    />
                  </Box>
                </Stack>
                <Stack gap="1">
                  <Typography variant="caption" tone="muted" as="label">
                    {t('storiesAdmin.fields.title')}
                  </Typography>
                  <Box width="72">
                    <Input
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder={t('storiesAdmin.newStoryTitlePlaceholder')}
                    />
                  </Box>
                </Stack>
                <Button onClick={createStory} disabled={busy || !newSlug.trim()}>
                  {t('storiesAdmin.create')}
                </Button>
              </Inline>
              <Typography variant="caption" tone="muted">{t('storiesAdmin.slugHint')}</Typography>
              {error ? <p className={s.errorText}>{error}</p> : null}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Box marginTop="6">
        <Card>
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
                      <TableCell>
                        <Link href={`/admin/stories/${story.id}`} className={s.mutedLink}>
                          {storyTitle(story, locale)}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" tone="muted" as="span">{story.slug}</Typography>
                      </TableCell>
                      <TableCell>
                        <Badge variant={lifecycleBadgeVariant(story.lifecycle)}>
                          {t(`storiesAdmin.lifecycle.${story.lifecycle}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>{story.is_published ? '✓' : '—'}</TableCell>
                      <TableCell>
                        {counts.total}
                        {counts.inProgress > 0 ? (
                          <span className={s.mutedTextXs}>
                            {' '}({counts.inProgress} {t('storiesAdmin.inProgress')})
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Inline gap="2">
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
                        </Inline>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stories.length === 0 ? (
                  <TableRow>
                    <TableCell>
                      <Typography variant="caption" tone="muted" as="span">
                        {t('common.none')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}
