'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { LetterCard } from '@/components/letter-card';
import { LetterCompose } from '@/components/letter-compose';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Loader2, LogOut, Mail } from 'lucide-react';

interface Interaction {
  id: string;
  game_id: string;
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
}

interface GameState {
  id: string;
  status: 'in_progress' | 'completed';
  feedback: string | null;
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
  const bottomRef = useRef<HTMLDivElement>(null);

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

  async function loadGame() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

      setGame({ id: data.gameId, status: 'in_progress', feedback: null });
      setInteractions([
        {
          id: crypto.randomUUID(),
          game_id: data.gameId,
          role: 'ai',
          content: data.letter,
          letter_number: data.letterNumber,
          created_at: new Date().toISOString(),
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

  async function handleFeedback() {
    if (!game || feedbackText.trim().length === 0) return;
    setSubmittingFeedback(true);
    setError(null);
    try {
      const response = await fetch('/api/game/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, feedback: feedbackText }),
      });
      if (!response.ok) throw new Error();
      setGame((prev) => (prev ? { ...prev, feedback: feedbackText.trim() } : prev));
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
  const canReply = game?.status === 'in_progress' && userReplyCount < 4 && !waitingForAI;

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 pb-8">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-background/80 py-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">{t('app.title')}</h1>
        </div>
        <div className="flex items-center gap-1">
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
          {interactions.map((interaction) => (
            <LetterCard
              key={interaction.id}
              role={interaction.role}
              content={interaction.content}
              letterNumber={interaction.letter_number}
              timestamp={interaction.created_at}
            />
          ))}

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
                {game.feedback ? (
                  <div className="mt-4 text-center">
                    <p className="font-medium">{t('game.feedbackThankYou')}</p>
                    <p className="text-sm text-muted-foreground">{t('game.feedbackThankYouDescription')}</p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{t('game.feedbackTitle')}</p>
                    <Textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder={t('game.feedbackPlaceholder')}
                      className="min-h-[120px] resize-y"
                    />
                    <Button
                      onClick={handleFeedback}
                      disabled={feedbackText.trim().length === 0 || submittingFeedback}
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
