'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '@imbustai/i18n';
import { createClient } from '@/lib/supabase/client';
import type { GameStatus, InteractionRow } from '@/lib/types/db';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Textarea,
  Typography,
  Stack,
  Inline,
  Box,
} from '@imbustai/ds';
import styles from './play-client.module.css';

export interface PlayContact {
  slug: string;
  name: string;
  role: string;
}

interface GameStateResponse {
  game_status: GameStatus;
  story_date: string | null;
  max_letters_per_turn: number;
  contacts: PlayContact[];
  locked_count: number;
  open_turn: { id: string; turn_number: number; awaiting_reply: boolean } | null;
  pending_reveal: { count: number; next_visible_from: string } | null;
}

const POLL_MS = 15_000;

function formatStoryDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatCountdown(targetIso: string, now: number): string {
  const ms = new Date(targetIso).getTime() - now;
  if (ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}:${String(s).padStart(2, '0')}`;
}

export function PlayClient({
  gameId,
  gameStatus,
  storyTitleEn,
  storyTitleIt,
  dateLocale,
  maxLettersPerTurn,
  initialStoryDate,
  contacts: initialContacts,
  lockedCount: initialLockedCount,
  initialLetters,
}: {
  gameId: string;
  gameStatus: GameStatus;
  storyTitleEn: string;
  storyTitleIt: string;
  dateLocale: string;
  maxLettersPerTurn: number;
  initialStoryDate: string | null;
  contacts: PlayContact[];
  lockedCount: number;
  initialLetters: InteractionRow[];
}) {
  const { t, locale } = useTranslation();
  const storyTitle = locale === 'it' ? storyTitleIt : storyTitleEn;

  const [letters, setLetters] = useState<InteractionRow[]>(initialLetters);
  const [contacts, setContacts] = useState<PlayContact[]>(initialContacts);
  const [lockedCount, setLockedCount] = useState(initialLockedCount);
  const [storyDate, setStoryDate] = useState(initialStoryDate);
  const [status, setStatus] = useState<GameStatus>(gameStatus);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [pendingReveal, setPendingReveal] = useState<GameStateResponse['pending_reveal']>(null);
  const [maxLetters, setMaxLetters] = useState(maxLettersPerTurn);
  const [now, setNow] = useState(() => Date.now());

  const draftsKey = `imbustai-drafts-${gameId}`;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftsKey);
      if (stored) setDrafts(JSON.parse(stored));
    } catch {
      // ignore corrupt drafts
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftsKey]);

  const persistDrafts = useCallback(
    (next: Record<string, string>) => {
      setDrafts(next);
      try {
        localStorage.setItem(draftsKey, JSON.stringify(next));
      } catch {
        // storage full/blocked — drafts stay in memory
      }
    },
    [draftsKey],
  );

  const refreshLetters = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('interactions')
      .select('*')
      .eq('game_id', gameId)
      .order('letter_number', { ascending: true });
    if (data) setLetters(data as InteractionRow[]);
  }, [gameId]);

  const refreshState = useCallback(async () => {
    const res = await fetch(`/api/game/${gameId}/state`);
    if (!res.ok) return;
    const state = (await res.json()) as GameStateResponse;
    setContacts(state.contacts);
    setLockedCount(state.locked_count);
    setStoryDate(state.story_date);
    setStatus(state.game_status);
    setAwaitingReply(Boolean(state.open_turn));
    setPendingReveal(state.pending_reveal);
    setMaxLetters(state.max_letters_per_turn);
  }, [gameId]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    refreshState();
    pollRef.current = setInterval(() => {
      refreshState();
      refreshLetters();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [refreshState, refreshLetters]);

  useEffect(() => {
    if (!pendingReveal) return;
    const tick = setInterval(() => {
      setNow(Date.now());
      if (new Date(pendingReveal.next_visible_from).getTime() <= Date.now()) {
        refreshLetters();
        refreshState();
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [pendingReveal, refreshLetters, refreshState]);

  const draftEntries = useMemo(
    () =>
      contacts
        .map((c) => ({ contact: c, content: drafts[c.slug]?.trim() ?? '' }))
        .filter((d) => d.content !== ''),
    [contacts, drafts],
  );

  async function sendAll() {
    setSending(true);
    setError(null);
    const res = await fetch(`/api/game/${gameId}/turns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        letters: draftEntries.map((d) => ({
          recipient_slug: d.contact.slug,
          content: d.content,
        })),
      }),
    });
    const body = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      const key = `play.errors.${body.error}`;
      const text = t(key);
      setError(text === key ? `${t('common.error')} (${body.error ?? res.status})` : text);
      return;
    }
    persistDrafts({});
    setReviewing(false);
    setActiveSlug(null);
    setAwaitingReply(true);
    await refreshLetters();
    await refreshState();
  }

  const nameOf = (slug: string | null) =>
    contacts.find((c) => c.slug === slug)?.name ?? slug ?? storyTitle;

  const composerOpen = status === 'in_progress' && !awaitingReply;

  return (
    <Stack gap="0">
      {/* Header */}
      <Inline gap="3" justify="space-between">
        <Stack gap="1">
          <Typography variant="h2">{storyTitle}</Typography>
          {storyDate ? (
            <Typography variant="caption" tone="muted">
              📅 {formatStoryDate(storyDate, dateLocale)}
            </Typography>
          ) : null}
        </Stack>
        {status === 'completed' ? (
          <Badge>{t('games.completed')}</Badge>
        ) : awaitingReply ? (
          <Badge variant="secondary">✉️ {t('play.awaitingReply')}</Badge>
        ) : null}
      </Inline>

      {/* Transit banner */}
      {pendingReveal ? (
        <Box marginTop="4">
          <div className={styles.transitBanner}>
            📮{' '}
            {t(pendingReveal.count === 1 ? 'play.inTransitOne' : 'play.inTransitMany').replace(
              '{count}',
              String(pendingReveal.count),
            )}{' '}
            <span className={styles.monoMedium}>
              {formatCountdown(pendingReveal.next_visible_from, now)}
            </span>
          </div>
        </Box>
      ) : awaitingReply ? (
        <Box marginTop="4">
          <div className={styles.awaitingBanner}>
            ⏳ {t('play.awaitingReplyHint')}
          </div>
        </Box>
      ) : null}

      <Box marginTop="8">
        <div className={styles.layout}>
          {/* Contact list */}
          <Box as="aside">
            <Typography variant="caption" tone="muted" as="h2">
              {t('play.contacts')}
            </Typography>
            <Box marginTop="3">
              <Stack gap="2">
                {contacts.map((c) => (
                  <Box as="li" key={c.slug}>
                    <button
                      type="button"
                      disabled={!composerOpen}
                      onClick={() => {
                        setActiveSlug(c.slug);
                        setReviewing(false);
                      }}
                      className={
                        activeSlug === c.slug
                          ? styles.contactButtonActive
                          : styles.contactButton
                      }
                    >
                      <Typography variant="body" as="span">
                        {c.name}
                      </Typography>
                      <Typography variant="caption" tone="muted" as="span">
                        {c.role}
                      </Typography>
                      {drafts[c.slug]?.trim() ? (
                        <Typography variant="caption" tone="primary" as="span">
                          ✏️ {t('play.draftSaved')}
                        </Typography>
                      ) : null}
                    </button>
                  </Box>
                ))}
                {Array.from({ length: lockedCount }).map((_, i) => (
                  <Box as="li" key={`locked-${i}`}>
                    <div className={styles.lockedContact}>
                      🔒 ???
                    </div>
                  </Box>
                ))}
              </Stack>
            </Box>
            {composerOpen && draftEntries.length > 0 ? (
              <Box marginTop="4">
                <Button fullWidth onClick={() => setReviewing(true)}>
                  📨 {t('play.reviewAndSend')} ({draftEntries.length})
                </Button>
              </Box>
            ) : null}
          </Box>

          {/* Main column */}
          <Box as="main">
            {/* Composer */}
            {composerOpen && activeSlug && !reviewing ? (
              <Box marginBottom="8">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      ✍️ {t('play.writeTo')} {nameOf(activeSlug)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={drafts[activeSlug] ?? ''}
                      placeholder={t('play.composerPlaceholder')}
                      onChange={(e) =>
                        persistDrafts({ ...drafts, [activeSlug]: e.target.value })
                      }
                    />
                    <Box marginTop="2">
                      <Typography variant="caption" tone="muted">
                        {t('play.draftHint')}
                      </Typography>
                    </Box>
                    <Box marginTop="3">
                      <Inline gap="2">
                        <Button size="sm" variant="outline" onClick={() => setActiveSlug(null)}>
                          {t('common.back')}
                        </Button>
                        {draftEntries.length > 0 ? (
                          <Button size="sm" onClick={() => setReviewing(true)}>
                            📨 {t('play.reviewAndSend')} ({draftEntries.length}/{maxLetters})
                          </Button>
                        ) : null}
                      </Inline>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ) : null}

            {/* Review & send all */}
            {composerOpen && reviewing ? (
              <Box marginBottom="8">
                <Card>
                  <CardHeader>
                    <CardTitle>📨 {t('play.reviewTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Stack gap="3">
                      <Typography variant="caption" tone="muted">
                        {t('play.reviewHint')}
                      </Typography>
                      {draftEntries.map(({ contact, content }) => (
                        <div key={contact.slug} className={styles.reviewDraft}>
                          <Typography variant="caption" tone="muted">
                            → {contact.name}
                          </Typography>
                          <Box marginTop="1">
                            <div className={styles.reviewDraftContent}>{content}</div>
                          </Box>
                        </div>
                      ))}
                      {draftEntries.length > maxLetters ? (
                        <Typography variant="caption" tone="muted">
                          {t('play.errors.too_many_letters')} (max {maxLetters})
                        </Typography>
                      ) : null}
                      <Inline gap="2">
                        <Button variant="outline" size="sm" onClick={() => setReviewing(false)}>
                          {t('play.keepEditing')}
                        </Button>
                        <Button
                          size="sm"
                          disabled={sending || draftEntries.length === 0 || draftEntries.length > maxLetters}
                          onClick={sendAll}
                        >
                          {sending ? t('play.sending') : `📮 ${t('play.sendAll')}`}
                        </Button>
                      </Inline>
                      {error ? (
                        <Typography variant="caption" tone="muted">
                          {error}
                        </Typography>
                      ) : null}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            ) : null}

            {/* Inbox / thread */}
            <Typography variant="caption" tone="muted" as="h2">
              {t('play.inbox')}
            </Typography>
            <Box marginTop="3">
              <Stack gap="4">
                {letters.map((letter) => {
                  const mine = letter.role === 'user';
                  return (
                    <div
                      key={letter.id}
                      className={mine ? styles.letterMine : styles.letterNpc}
                    >
                      <Inline gap="2" justify="space-between">
                        <Typography variant="caption" tone="muted">
                          {mine
                            ? `${t('play.you')} → ${nameOf(letter.character_slug)}`
                            : nameOf(letter.character_slug)}
                        </Typography>
                        {letter.story_date ? (
                          <Typography variant="caption" tone="muted">
                            {formatStoryDate(letter.story_date, dateLocale)}
                          </Typography>
                        ) : null}
                      </Inline>
                      <Box marginTop="2">
                        {mine ? (
                          <div className={styles.letterContent}>{letter.content}</div>
                        ) : (
                          <div className={styles.prose}>
                            <ReactMarkdown>{letter.content}</ReactMarkdown>
                          </div>
                        )}
                      </Box>
                    </div>
                  );
                })}
                {letters.length === 0 ? (
                  <Typography variant="caption" tone="muted">
                    {t('common.none')}
                  </Typography>
                ) : null}
              </Stack>
            </Box>
          </Box>
        </div>
      </Box>
    </Stack>
  );
}
