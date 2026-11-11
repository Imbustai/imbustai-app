'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@imbustai/i18n';
import { createClient } from '@/lib/supabase/client';
import {
  buildMailbox,
  threadOf,
  type MailCorrespondent,
  type MailLetter,
  type MailSender,
} from '@/lib/mailbox';
import type { GameStatus, InteractionRow } from '@/lib/types/db';
import { Badge, Button, Textarea, Typography, Stack, Inline, Box } from '@imbustai/ds';
import { EnclosurePaper, LetterPaper, PlayerSheet, RulesProse } from './papers';
import styles from './play-client.module.css';

// The Tester's mailbox (Imbustai/imbustai-app#43). Letters reach paying
// Players on paper; this screen is how a Tester reads and answers them.

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
  turn_numbers: Record<string, number>;
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

type Translate = (key: string) => string;

function turnLabel(turn: number, t: Translate): string {
  return turn === 0 ? t('play.openingTurn') : t('play.turn').replace('{n}', String(turn));
}

/** One Letter in a thread: who and when, then the sheet, with its Enclosures behind tabs. */
function LetterBlock({
  letter,
  sender,
  dateLocale,
  highlighted,
  t,
}: {
  letter: MailLetter;
  sender: MailSender;
  dateLocale: string;
  highlighted: boolean;
  t: Translate;
}) {
  const [tab, setTab] = useState('letter');
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [highlighted]);

  const enclosure = letter.enclosures.find((e) => e.key === tab);
  const isClipping = !letter.mine && sender.kind === 'newspaper';

  return (
    <article ref={ref} className={highlighted ? styles.letterHighlighted : styles.letter}>
      <Inline gap="2" justify="space-between">
        <Typography variant="caption" tone="muted">
          {letter.mine ? `${t('play.you')} → ${sender.name}` : sender.name}
          {letter.kind === 'epilogue' ? ` · ${t('play.epilogue')}` : ''}
        </Typography>
        <Typography variant="caption" tone="muted">
          {turnLabel(letter.turn, t)}
          {letter.storyDate ? ` · ${formatStoryDate(letter.storyDate, dateLocale)}` : ''}
        </Typography>
      </Inline>
      {letter.enclosures.length > 0 ? (
        <Box marginTop="3">
          <Inline gap="2">
            <Button
              size="sm"
              variant={enclosure ? 'ghost' : 'outline'}
              aria-pressed={!enclosure}
              onClick={() => setTab('letter')}
            >
              {isClipping ? t('play.clipping') : t('play.letter')}
            </Button>
            {letter.enclosures.map((e) => (
              <Button
                key={e.key}
                size="sm"
                variant={e.key === tab ? 'outline' : 'ghost'}
                aria-pressed={e.key === tab}
                onClick={() => setTab(e.key)}
              >
                📎 {e.title}
              </Button>
            ))}
          </Inline>
        </Box>
      ) : null}
      <div className={styles.sheet}>
        {enclosure ? (
          <EnclosurePaper enclosure={enclosure} storyDate={letter.storyDate} locale={dateLocale} />
        ) : letter.mine ? (
          <PlayerSheet body={letter.body} />
        ) : (
          <LetterPaper letter={letter} sender={sender} locale={dateLocale} />
        )}
      </div>
    </article>
  );
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
  initialLetters,
  initialTurnNumbers,
  allCharacters,
  rulesCard,
}: {
  gameId: string;
  gameStatus: GameStatus;
  storyTitleEn: string;
  storyTitleIt: string;
  dateLocale: string;
  maxLettersPerTurn: number;
  initialStoryDate: string | null;
  contacts: PlayContact[];
  initialLetters: InteractionRow[];
  initialTurnNumbers: Record<string, number>;
  /** Everyone who may sign a Letter. */
  allCharacters: MailCorrespondent[];
  /** Markdown, outside the fiction; null when the Story has none. */
  rulesCard: string | null;
}) {
  const { t, locale } = useTranslation();
  const storyTitle = locale === 'it' ? storyTitleIt : storyTitleEn;

  const [letters, setLetters] = useState<InteractionRow[]>(initialLetters);
  const [contacts, setContacts] = useState<PlayContact[]>(initialContacts);
  const [turnNumbers, setTurnNumbers] = useState(initialTurnNumbers);
  const [storyDate, setStoryDate] = useState(initialStoryDate);
  const [status, setStatus] = useState<GameStatus>(gameStatus);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [pendingReveal, setPendingReveal] = useState<GameStateResponse['pending_reveal']>(null);
  const [maxLetters, setMaxLetters] = useState(maxLettersPerTurn);
  const [now, setNow] = useState(() => Date.now());

  const draftsKey = `imbustai-drafts-${gameId}`;
  const rulesKey = `imbustai-rules-read-${gameId}`;
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [view, setView] = useState<'senders' | 'timeline'>('senders');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [showEarlier, setShowEarlier] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(draftsKey);
      if (stored) setDrafts(JSON.parse(stored));
      // The rules card comes before the first Letter, once per device.
      if (rulesCard && !localStorage.getItem(rulesKey)) setRulesOpen(true);
    } catch {
      // ignore corrupt or blocked storage
    }
  }, [draftsKey, rulesKey, rulesCard]);

  function closeRules() {
    setRulesOpen(false);
    try {
      localStorage.setItem(rulesKey, '1');
    } catch {
      // storage blocked — the card shows again next visit
    }
  }

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
    setTurnNumbers(state.turn_numbers ?? {});
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

  const mailbox = useMemo(
    () =>
      buildMailbox({
        letters,
        turnNumbers,
        contacts: contacts.map((c) => c.slug),
        correspondents: allCharacters,
      }),
    [letters, turnNumbers, contacts, allCharacters],
  );

  const sender = mailbox.senders.find((s) => s.slug === selectedSlug) ?? mailbox.senders[0] ?? null;
  const thread = sender ? threadOf(sender) : null;

  const draftEntries = useMemo(
    () =>
      contacts
        .map((c) => ({ contact: c, content: drafts[c.slug]?.trim() ?? '' }))
        .filter((d) => d.content !== ''),
    [contacts, drafts],
  );

  function openSender(slug: string, letterId: string | null) {
    const target = mailbox.senders.find((s) => s.slug === slug);
    setSelectedSlug(slug);
    setHighlightId(letterId);
    setReviewing(false);
    // A Letter picked from the timeline may sit among the folded ones.
    setShowEarlier(
      Boolean(letterId && target && threadOf(target).earlier.some((l) => l.id === letterId)),
    );
  }

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
    setAwaitingReply(true);
    await refreshLetters();
    await refreshState();
  }

  const nameOf = (slug: string) => allCharacters.find((c) => c.slug === slug)?.name ?? slug;
  const composerOpen = status === 'in_progress' && !awaitingReply;

  if (rulesOpen && rulesCard) {
    return (
      <div className={styles.rulesScreen}>
        <div className={styles.rulesSheet}>
          <RulesProse body={rulesCard} />
          <Box marginTop="6">
            <Button onClick={closeRules}>{t('play.openMail')}</Button>
          </Box>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHead}>
          <Stack gap="1">
            <Typography variant="h4" as="h1">
              {storyTitle}
            </Typography>
            {storyDate ? (
              <Typography variant="caption" tone="muted">
                📅 {formatStoryDate(storyDate, dateLocale)}
              </Typography>
            ) : null}
            {status === 'completed' ? (
              <Inline gap="2">
                <Badge>{t('games.completed')}</Badge>
              </Inline>
            ) : awaitingReply ? (
              <Inline gap="2">
                <Badge variant="secondary">✉️ {t('play.awaitingReply')}</Badge>
              </Inline>
            ) : null}
          </Stack>
          <Box marginTop="3">
            <Inline gap="2">
              <Button
                size="sm"
                variant={view === 'senders' ? 'outline' : 'ghost'}
                aria-pressed={view === 'senders'}
                onClick={() => setView('senders')}
              >
                {t('play.bySender')}
              </Button>
              <Button
                size="sm"
                variant={view === 'timeline' ? 'outline' : 'ghost'}
                aria-pressed={view === 'timeline'}
                onClick={() => setView('timeline')}
              >
                {t('play.timeline')}
              </Button>
            </Inline>
          </Box>
        </div>

        <div className={styles.sidebarList}>
          {view === 'senders'
            ? mailbox.senders.map((s) => (
                <button
                  key={s.slug}
                  type="button"
                  className={s.slug === sender?.slug && !reviewing ? styles.rowActive : styles.row}
                  onClick={() => openSender(s.slug, null)}
                >
                  <span className={styles.rowTitle}>{s.name}</span>
                  {s.role ? <span className={styles.rowSub}>{s.role}</span> : null}
                  <span className={styles.rowMeta}>
                    {s.lastReceived
                      ? `${turnLabel(s.lastReceived.turn, t)} · ${formatStoryDate(s.lastReceived.storyDate, dateLocale)}`
                      : s.letters.length > 0
                        ? t('play.noReplyYet')
                        : t('play.noLettersYet')}
                    {drafts[s.slug]?.trim() ? ` · ✏️ ${t('play.draftSaved')}` : ''}
                  </span>
                </button>
              ))
            : mailbox.timeline.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={l.id === highlightId && !reviewing ? styles.rowActive : styles.row}
                  onClick={() => openSender(l.slug, l.id)}
                >
                  <span className={styles.rowTitle}>
                    {l.mine ? `${t('play.you')} → ${nameOf(l.slug)}` : nameOf(l.slug)}
                  </span>
                  <span className={styles.rowMeta}>
                    {turnLabel(l.turn, t)}
                    {l.storyDate ? ` · ${formatStoryDate(l.storyDate, dateLocale)}` : ''}
                    {l.kind === 'epilogue' ? ` · ${t('play.epilogue')}` : ''}
                    {l.enclosures.length > 0 ? ` · 📎 ${l.enclosures.length}` : ''}
                  </span>
                </button>
              ))}
          {mailbox.senders.length === 0 ? (
            <Typography variant="caption" tone="muted">
              {t('common.none')}
            </Typography>
          ) : null}
        </div>

        <div className={styles.sidebarFoot}>
          <Stack gap="2">
            {composerOpen && draftEntries.length > 0 ? (
              <Button fullWidth onClick={() => setReviewing(true)}>
                📨 {t('play.reviewAndSend')} ({draftEntries.length})
              </Button>
            ) : null}
            {rulesCard ? (
              <Button fullWidth size="sm" variant="ghost" onClick={() => setRulesOpen(true)}>
                {t('play.rules')}
              </Button>
            ) : null}
          </Stack>
        </div>
      </aside>

      <main className={styles.pane}>
        {pendingReveal ? (
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
        ) : awaitingReply ? (
          <div className={styles.awaitingBanner}>⏳ {t('play.awaitingReplyHint')}</div>
        ) : null}

        {composerOpen && reviewing ? (
          <section className={styles.thread}>
            <Stack gap="3">
              <Typography variant="h3">📨 {t('play.reviewTitle')}</Typography>
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
          </section>
        ) : sender && thread ? (
          <section className={styles.thread} key={sender.slug}>
            <Stack gap="1">
              <Typography variant="h3">{sender.name}</Typography>
              {sender.role ? (
                <Typography variant="caption" tone="muted">
                  {sender.role}
                </Typography>
              ) : null}
            </Stack>

            {thread.earlier.length > 0 ? (
              <Box marginTop="4">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-expanded={showEarlier}
                  onClick={() => setShowEarlier(!showEarlier)}
                >
                  {showEarlier
                    ? `▾ ${t('play.hideEarlier')}`
                    : `▸ ${t(thread.earlier.length === 1 ? 'play.earlierOne' : 'play.earlierMany').replace(
                        '{count}',
                        String(thread.earlier.length),
                      )}`}
                </Button>
              </Box>
            ) : null}

            {showEarlier
              ? thread.earlier.map((l) => (
                  <LetterBlock
                    key={l.id}
                    letter={l}
                    sender={sender}
                    dateLocale={dateLocale}
                    highlighted={l.id === highlightId}
                    t={t}
                  />
                ))
              : null}

            {thread.current ? (
              <LetterBlock
                letter={thread.current}
                sender={sender}
                dateLocale={dateLocale}
                highlighted={thread.current.id === highlightId}
                t={t}
              />
            ) : (
              <Box marginTop="6">
                <Typography variant="caption" tone="muted">
                  {sender.letters.length > 0 ? t('play.noReplyYet') : t('play.noLettersYet')}
                </Typography>
              </Box>
            )}

            {thread.since.map((l) => (
              <LetterBlock
                key={l.id}
                letter={l}
                sender={sender}
                dateLocale={dateLocale}
                highlighted={l.id === highlightId}
                t={t}
              />
            ))}

            {composerOpen && sender.canWrite ? (
              <div className={styles.composer}>
                <Typography variant="caption" tone="muted" as="h2">
                  ✍️ {t('play.writeTo')} {sender.name}
                </Typography>
                <Box marginTop="2">
                  <Textarea
                    value={drafts[sender.slug] ?? ''}
                    placeholder={t('play.composerPlaceholder')}
                    onChange={(e) => persistDrafts({ ...drafts, [sender.slug]: e.target.value })}
                  />
                </Box>
                <Box marginTop="3">
                  <Inline gap="3">
                    {draftEntries.length > 0 ? (
                      <Button size="sm" onClick={() => setReviewing(true)}>
                        📨 {t('play.reviewAndSend')}
                      </Button>
                    ) : null}
                    <Typography variant="caption" tone="muted">
                      {t('play.draftHint')}
                    </Typography>
                  </Inline>
                </Box>
              </div>
            ) : null}
          </section>
        ) : (
          <section className={styles.thread}>
            <Typography variant="caption" tone="muted">
              {t('common.none')}
            </Typography>
          </section>
        )}
      </main>
    </div>
  );
}
