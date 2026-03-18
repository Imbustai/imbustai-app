'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTranslation } from '@/lib/i18n/context';
import { LetterCard } from '@/components/letter-card';
import { LetterCompose } from '@/components/letter-compose';
import { RatingDialog } from '@/components/rating-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  rating: number | null;
}

export function GameView() {
  const { t } = useTranslation();
  const [game, setGame] = useState<GameState | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [waitingForAI, setWaitingForAI] = useState(false);
  const [showRating, setShowRating] = useState(false);
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
          rating: gameData.rating,
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

        if (gameData.status === 'completed' && gameData.rating) {
          setShowRating(false);
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

      setGame({ id: data.gameId, status: 'in_progress', rating: null });
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

  async function handleRate(rating: number) {
    if (!game) return;
    await fetch('/api/game/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId: game.id, rating }),
    });
    setGame((prev) => (prev ? { ...prev, rating } : prev));
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
        <div className="flex flex-1 items-center justify-center pt-24">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <CardTitle>{t('game.title')}</CardTitle>
              <CardDescription>{t('game.startDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
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
            <Card className="border-primary/20 bg-primary/5 text-center">
              <CardContent className="py-6">
                <p className="font-medium">{t('game.gameComplete')}</p>
                <p className="text-sm text-muted-foreground">{t('game.gameCompleteDescription')}</p>
                {game.rating ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t('rating.title')}: {'★'.repeat(game.rating)}{'☆'.repeat(5 - game.rating)}
                  </p>
                ) : (
                  <Button
                    onClick={() => setShowRating(true)}
                    className="mt-4 gap-2"
                    size="lg"
                  >
                    {t('game.endStoryStartReview')}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          <div ref={bottomRef} />
        </div>
      )}

      <RatingDialog open={showRating} onSubmit={handleRate} />
    </div>
  );
}
