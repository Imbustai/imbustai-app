'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from '@imbustai/i18n';
import { createClient } from '@/lib/supabase/client';
import type { GameStatus, InteractionRow } from '@/lib/types/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Player play UI (Phase 4). UX ported from the prototype: contact list,
// per-recipient drafts the player can keep editing (epistolary rhythm — R7),
// review, Send All as ONE turn, then "awaiting reply" until the (admin-
// approved) batch arrives. Letters render markdown; in-fiction dates are
// metadata shown in the header line, never inside the body. New letters
// appear via polling — RLS hides anything before its visible_from, so the
// client only ever receives what the player may see.

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
const textareaCls =
  'w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/50 min-h-40';

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

  // Per-recipient drafts, persisted so the player can take their time (R7).
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

  // Initial state fetch + steady polling (reveals arrive without a refresh).
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

  // 1s tick for the transit countdown; refetch letters the moment one lands.
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
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{storyTitle}</h1>
          {storyDate ? (
            <p className="mt-1 text-muted-foreground">
              📅 {formatStoryDate(storyDate, dateLocale)}
            </p>
          ) : null}
        </div>
        {status === 'completed' ? (
          <Badge>{t('games.completed')}</Badge>
        ) : awaitingReply ? (
          <Badge variant="secondary">✉️ {t('play.awaitingReply')}</Badge>
        ) : null}
      </div>

      {/* Transit banner */}
      {pendingReveal ? (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 p-4 text-sm">
          📮{' '}
          {t(pendingReveal.count === 1 ? 'play.inTransitOne' : 'play.inTransitMany').replace(
            '{count}',
            String(pendingReveal.count),
          )}{' '}
          <span className="font-mono font-medium">
            {formatCountdown(pendingReveal.next_visible_from, now)}
          </span>
        </div>
      ) : awaitingReply ? (
        <div className="mt-4 rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          ⏳ {t('play.awaitingReplyHint')}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        {/* Contact list */}
        <aside>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            {t('play.contacts')}
          </h2>
          <ul className="space-y-2">
            {contacts.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  disabled={!composerOpen}
                  onClick={() => {
                    setActiveSlug(c.slug);
                    setReviewing(false);
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    activeSlug === c.slug
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  } ${!composerOpen ? 'cursor-default opacity-70' : ''}`}
                >
                  <span className="block font-medium">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.role}</span>
                  {drafts[c.slug]?.trim() ? (
                    <span className="mt-1 inline-block text-xs text-primary">
                      ✏️ {t('play.draftSaved')}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
            {Array.from({ length: lockedCount }).map((_, i) => (
              <li
                key={`locked-${i}`}
                className="rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
              >
                🔒 ???
              </li>
            ))}
          </ul>
          {composerOpen && draftEntries.length > 0 ? (
            <Button className="mt-4 w-full" onClick={() => setReviewing(true)}>
              📨 {t('play.reviewAndSend')} ({draftEntries.length})
            </Button>
          ) : null}
        </aside>

        {/* Main column */}
        <main>
          {/* Composer */}
          {composerOpen && activeSlug && !reviewing ? (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>
                  ✍️ {t('play.writeTo')} {nameOf(activeSlug)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className={textareaCls}
                  value={drafts[activeSlug] ?? ''}
                  placeholder={t('play.composerPlaceholder')}
                  onChange={(e) =>
                    persistDrafts({ ...drafts, [activeSlug]: e.target.value })
                  }
                />
                <p className="mt-2 text-xs text-muted-foreground">{t('play.draftHint')}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setActiveSlug(null)}>
                    {t('common.back')}
                  </Button>
                  {draftEntries.length > 0 ? (
                    <Button size="sm" onClick={() => setReviewing(true)}>
                      📨 {t('play.reviewAndSend')} ({draftEntries.length}/{maxLetters})
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Review & send all */}
          {composerOpen && reviewing ? (
            <Card className="mb-8 border-primary/50">
              <CardHeader>
                <CardTitle>📨 {t('play.reviewTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('play.reviewHint')}</p>
                {draftEntries.map(({ contact, content }) => (
                  <div key={contact.slug} className="rounded-md border border-border p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      → {contact.name}
                    </p>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm">{content}</p>
                  </div>
                ))}
                {draftEntries.length > maxLetters ? (
                  <p className="text-sm text-destructive">
                    {t('play.errors.too_many_letters')} (max {maxLetters})
                  </p>
                ) : null}
                <div className="flex gap-2">
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
                </div>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Inbox / thread */}
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t('play.inbox')}</h2>
          <div className="space-y-4">
            {letters.map((letter) => {
              const mine = letter.role === 'user';
              return (
                <div
                  key={letter.id}
                  className={`rounded-lg border p-4 ${
                    mine
                      ? 'ml-6 border-border bg-muted/30 md:ml-16'
                      : 'mr-6 border-primary/30 bg-card md:mr-16'
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {mine
                        ? `${t('play.you')} → ${nameOf(letter.character_slug)}`
                        : nameOf(letter.character_slug)}
                    </span>
                    {letter.story_date ? (
                      <span>{formatStoryDate(letter.story_date, dateLocale)}</span>
                    ) : null}
                  </div>
                  {mine ? (
                    <p className="whitespace-pre-wrap text-sm">{letter.content}</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-2">
                      <ReactMarkdown>{letter.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              );
            })}
            {letters.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('common.none')}</p>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}
