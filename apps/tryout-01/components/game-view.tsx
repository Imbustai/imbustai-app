'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { LetterCard } from '@/components/letter-card';
import { LetterCompose } from '@/components/letter-compose';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Clock, Loader2, LogOut, Mail, Shield } from 'lucide-react';
import { StarRating } from '@/components/star-rating';
import { QUESTION_KEYS } from '@/lib/questionnaire';

interface Interaction {
  id: string;
  game_id: string;
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
  visible_from: string | null;
}

interface GameState {
  id: string;
  status: 'in_progress' | 'completed';
  feedback: string | null;
  questionnaire: Record<string, number> | null;
}

interface DelayedSettings {
  enabled: boolean;
  maxResponseTime: number;
}

function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}min`;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '0min';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}min`;
  if (minutes > 0) return `${minutes}min ${String(seconds).padStart(2, '0')}s`;
  return `${seconds}s`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function GameView() {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameState | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [delayedSettings, setDelayedSettings] = useState<DelayedSettings>({ enabled: false, maxResponseTime: 120 });
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, number | null>>(
    () => Object.fromEntries(QUESTION_KEYS.map((k) => [k, null]))
  );
  const [now, setNow] = useState(() => Date.now());
  const bottomRef = useRef<HTMLDivElement>(null);

  const shuffledQuestions = useMemo(() => shuffleArray([...QUESTION_KEYS]), []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  useEffect(() => {
    loadGame();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [interactions, scrollToBottom]);

  useEffect(() => {
    const pendingInteraction = interactions.find(
      (i) => i.role === 'ai' && i.visible_from && new Date(i.visible_from).getTime() > now
    );
    if (!pendingInteraction?.visible_from) return;

    const tick = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(tick);
  }, [interactions, now]);

  async function loadGame() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setIsAdmin(user.app_metadata?.role === 'admin');

      const { data: settings } = await supabase
        .from('app_settings')
        .select('delayed_responses_enabled, max_response_time')
        .single();

      if (settings) {
        setDelayedSettings({
          enabled: settings.delayed_responses_enabled,
          maxResponseTime: settings.max_response_time,
        });
      }

      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (gameData) {
        setGame({
          id: gameData.id,
          status: gameData.status,
          feedback: gameData.feedback,
          questionnaire: gameData.questionnaire,
        });

        const { data: interactionsData } = await supabase
          .from('interactions')
          .select('*')
          .eq('game_id', gameData.id)
          .order('letter_number', { ascending: true })
          .order('created_at', { ascending: true });

        if (interactionsData) {
          setInteractions(interactionsData);
        }
      }
    } catch {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      const response = await fetch('/api/game/start', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setGame({ id: data.gameId, status: 'in_progress', feedback: null, questionnaire: null });
      setInteractions([
        {
          id: crypto.randomUUID(),
          game_id: data.gameId,
          role: 'ai',
          content: data.letter,
          letter_number: data.letterNumber,
          created_at: new Date().toISOString(),
          visible_from: null,
        },
      ]);
    } catch {
      setError(t('common.error'));
    } finally {
      setStarting(false);
    }
  }

  async function handleReply(content: string) {
    if (!game) return;
    setWaitingForAI(true);
    setError(null);

    const userLetterNumber = interactions.filter((i) => i.role === 'user').length + 1;

    const userInteraction: Interaction = {
      id: crypto.randomUUID(),
      game_id: game.id,
      role: 'user',
      content,
      letter_number: userLetterNumber,
      created_at: new Date().toISOString(),
      visible_from: null,
    };

    setInteractions((prev) => [...prev, userInteraction]);

    try {
      const response = await fetch('/api/game/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      const aiInteraction: Interaction = {
        id: crypto.randomUUID(),
        game_id: game.id,
        role: 'ai',
        content: data.letter,
        letter_number: data.letterNumber,
        created_at: new Date().toISOString(),
        visible_from: data.visibleFrom ?? null,
      };

      setInteractions((prev) => [...prev, aiInteraction]);

      if (data.isComplete) {
        setGame((prev) => (prev ? { ...prev, status: 'completed' } : prev));
      }
    } catch {
      setInteractions((prev) => prev.filter((i) => i.id !== userInteraction.id));
      setError(t('common.error'));
    } finally {
      setWaitingForAI(false);
    }
  }

  const allQuestionsAnswered = QUESTION_KEYS.every((k) => questionnaireAnswers[k] !== null);

  async function handleFeedback() {
    if (!game || !allQuestionsAnswered) return;
    setSubmittingFeedback(true);
    setError(null);
    try {
      const response = await fetch('/api/game/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          feedback: feedbackText.trim() || null,
          questionnaire: questionnaireAnswers,
        }),
      });
      if (!response.ok) throw new Error();
      setGame((prev) => (prev ? { ...prev, feedback: 'submitted', questionnaire: questionnaireAnswers as Record<string, number> } : prev));
    } catch {
      setError(t('common.error'));
    } finally {
      setSubmittingFeedback(false);
    }
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const userReplyCount = interactions.filter((i) => i.role === 'user').length;
  const hasPendingLetter = interactions.some(
    (i) => i.role === 'ai' && i.visible_from && new Date(i.visible_from).getTime() > now
  );
  const canReply =
    game?.status === 'in_progress' &&
    userReplyCount < 4 &&
    !waitingForAI &&
    !hasPendingLetter;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/80 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{t('app.title')}</h1>
        </div>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <a href="/admin">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </a>
          )}
          <LanguageSwitcher />
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            {t('common.logout')}
          </Button>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
          <Button
            variant="link"
            size="sm"
            onClick={() => setError(null)}
            className="ml-2 h-auto p-0 text-destructive"
          >
            {t('common.retry')}
          </Button>
        </div>
      )}

      {!game ? (
        <div className="flex flex-1 justify-center pt-12 pb-12">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">{t('game.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm leading-relaxed text-muted-foreground">
              <section>
                <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.studyTitle')}</h3>
                <p>{t('game.intro.studyDesc1')}</p>
                <p className="mt-2">{t('game.intro.studyDesc2')}</p>
                <p className="mt-2">{t('game.intro.studyDesc3')}</p>
              </section>

              <section>
                <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.dataTitle')}</h3>
                <p>{t('game.intro.dataDesc')}</p>
              </section>

              <section>
                <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.anonymityTitle')}</h3>
                <p>{t('game.intro.anonymityDesc')}</p>
              </section>

              <section>
                <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.voluntaryTitle')}</h3>
                <p>{t('game.intro.voluntaryDesc')}</p>
              </section>

              <section className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.consentTitle')}</h3>
                <p>{t('game.intro.consentDesc')}</p>
              </section>

              {delayedSettings.enabled && (
                <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <h3 className="mb-2 text-base font-semibold text-foreground">{t('game.intro.timingTitle')}</h3>
                  <p>
                    {t('game.intro.timingDesc').replace('{time}', formatDuration(delayedSettings.maxResponseTime))}
                  </p>
                </section>
              )}

              <Button
                onClick={handleStart}
                disabled={starting}
                size="lg"
                className="w-full gap-2"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('common.loading')}
                  </>
                ) : (
                  t('game.start')
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4 pb-4">
          {interactions.map((interaction) => {
            const isPending =
              interaction.role === 'ai' &&
              interaction.visible_from &&
              new Date(interaction.visible_from).getTime() > now;

            if (isPending) return null;

            return (
              <LetterCard
                key={interaction.id}
                role={interaction.role}
                content={interaction.content}
                letterNumber={interaction.letter_number}
                timestamp={interaction.visible_from ?? interaction.created_at}
              />
            );
          })}

          {waitingForAI && (
            <Card className="border-dashed">
              <CardContent className="flex items-center gap-3 py-6">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <div>
                  <p className="text-sm font-medium">{t('game.waitingForReply')}</p>
                  <p className="text-xs text-muted-foreground">{t('game.waitingDescription')}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPendingLetter && !waitingForAI && (() => {
            const pending = interactions.find(
              (i) => i.role === 'ai' && i.visible_from && new Date(i.visible_from).getTime() > now
            );
            const remainingMs = pending?.visible_from
              ? new Date(pending.visible_from).getTime() - now
              : 0;

            return (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex items-center gap-4 py-8">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t('game.letterSent')}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('game.letterSentCountdown').replace('{time}', formatCountdown(remainingMs))}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {canReply && (
            <LetterCompose
              onSend={handleReply}
            />
          )}

          {game.status === 'completed' && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-6">
                <p className="text-center font-medium">{t('game.gameComplete')}</p>
                <p className="mt-1 text-center text-sm text-muted-foreground">{t('game.gameCompleteDescription')}</p>
                {game.questionnaire ? (
                  <div className="mt-4 text-center">
                    <p className="font-medium">{t('game.feedbackThankYou')}</p>
                    <p className="text-sm text-muted-foreground">{t('game.feedbackThankYouDescription')}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-6">
                    <div className="space-y-4">
                      <p className="text-sm font-medium">{t('game.questionnaire.title')}</p>
                      {shuffledQuestions.map((qKey) => (
                        <div key={qKey} className="flex flex-col gap-1.5 rounded-lg border bg-background/60 p-3">
                          <p className="text-sm leading-snug">{t(`game.questionnaire.${qKey}`)}</p>
                          <StarRating
                            value={questionnaireAnswers[qKey]}
                            onChange={(val) =>
                              setQuestionnaireAnswers((prev) => ({ ...prev, [qKey]: val }))
                            }
                          />
                        </div>
                      ))}
                      {!allQuestionsAnswered && (
                        <p className="text-xs text-muted-foreground">{t('game.questionnaire.unanswered')}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">{t('game.feedbackTitle')}</p>
                      <Textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        onPaste={(e) => e.preventDefault()}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        placeholder={t('game.feedbackPlaceholder')}
                        className="min-h-[120px] resize-y"
                      />
                    </div>

                    <Button
                      onClick={handleFeedback}
                      disabled={!allQuestionsAnswered || submittingFeedback}
                      className="w-full gap-2"
                      size="lg"
                    >
                      {submittingFeedback ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {t('game.sending')}
                        </>
                      ) : (
                        t('game.feedbackSubmit')
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
