'use client';

import { useState, useCallback } from 'react';
import { MessageSquare, ClipboardList, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Star, Mail, Pen } from 'lucide-react';
import {
  generateTextExport,
  type QuestionnaireData,
  type ExportInteraction,
} from '@/lib/questionnaire';

interface Interaction {
  id: string;
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
  visible_from?: string | null;
}

const QUESTION_LABELS: Record<string, string> = {
  q1: 'I tried to understand the situation before making a judgment',
  q2: 'I found it difficult to take a clear position',
  q3: 'I perceived that actions depended mainly on individual choices',
  q4: 'I perceived that actions were influenced by context and social expectations',
  q5: 'I perceived the interlocutor as free to choose what to do',
  q6: 'I perceived the interlocutor as somehow constrained by the situation',
  q7: "I felt involved in the interlocutor's situation",
  q8: 'I maintained a certain emotional distance',
  q9: 'I perceived a clear boundary between what I consider acceptable and unacceptable',
  q10: 'I tried to mediate between my point of view and that of the interlocutor',
  q11: 'I tried to argue and explain my point of view in my responses',
};

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < value
              ? 'fill-amber-400 text-amber-400'
              : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

interface GameRowActionsProps {
  gameId: string;
  questionnaire: Record<string, number> | null;
  feedback: string | null;
}

export function GameRowActions({
  gameId,
  questionnaire,
  feedback,
}: GameRowActionsProps) {
  const [interactionsOpen, setInteractionsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingInteractions, setLoadingInteractions] = useState(false);

  const hasFeedback = !!(questionnaire || feedback);

  const handleViewInteractions = useCallback(async () => {
    setInteractionsOpen(true);
    setLoadingInteractions(true);
    try {
      const res = await fetch(`/api/admin/games/${gameId}/interactions`);
      if (res.ok) {
        setInteractions(await res.json());
      }
    } finally {
      setLoadingInteractions(false);
    }
  }, [gameId]);

  const handleExport = useCallback(async () => {
    if (!questionnaire) return;

    let exportInteractions = interactions;
    if (exportInteractions.length === 0) {
      try {
        const res = await fetch(`/api/admin/games/${gameId}/interactions`);
        if (res.ok) {
          exportInteractions = await res.json();
        }
      } catch {
        return;
      }
    }

    const text = generateTextExport(
      questionnaire as QuestionnaireData,
      feedback,
      exportInteractions as ExportInteraction[]
    );
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session-${gameId.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [questionnaire, feedback, interactions, gameId]);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={handleViewInteractions}
            >
              <MessageSquare className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>View interactions</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasFeedback}
              onClick={() => setFeedbackOpen(true)}
            >
              <ClipboardList className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasFeedback ? 'View feedback' : 'No feedback yet'}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              disabled={!hasFeedback}
              onClick={handleExport}
            >
              <Download className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {hasFeedback ? 'Export summary' : 'No data to export'}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Interactions Drawer */}
      <Sheet open={interactionsOpen} onOpenChange={setInteractionsOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Interactions</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 p-6 pt-2">
            {loadingInteractions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : interactions.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No interactions found.
              </p>
            ) : (
              interactions.map((interaction) => {
                const isAI = interaction.role === 'ai';
                const displayTimestamp =
                  interaction.visible_from ?? interaction.created_at;
                const date = new Date(displayTimestamp).toLocaleDateString(
                  'en-GB',
                  {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                );
                const isDelayed = isAI && interaction.visible_from;
                return (
                  <Card
                    key={interaction.id}
                    className={
                      isAI
                        ? 'border-l-4 border-l-primary/40'
                        : 'border-r-4 border-r-muted-foreground/30 bg-muted/30'
                    }
                  >
                    <CardHeader className="flex flex-row items-center gap-3 pb-2">
                      <div
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                          isAI
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isAI ? (
                          <Mail className="size-3.5" />
                        ) : (
                          <Pen className="size-3.5" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col">
                        <span className="text-sm font-medium">
                          {isAI ? 'AI (Apaya)' : 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Letter {interaction.letter_number} &middot; {date}
                          {isDelayed && ' (delayed)'}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {interaction.content}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Feedback Drawer */}
      <Sheet open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Feedback & Questionnaire</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 p-6 pt-2">
            {questionnaire && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Questionnaire Answers</h3>
                {Object.entries(questionnaire).map(([key, value]) => (
                  <Card key={key}>
                    <CardContent className="flex items-start justify-between gap-4 py-3">
                      <p className="flex-1 text-sm leading-snug">
                        {QUESTION_LABELS[key] ?? key}
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <Stars value={value} />
                        <span className="w-5 text-right text-xs font-medium text-muted-foreground">
                          {value}/5
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {feedback && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Free-text Feedback</h3>
                <Card>
                  <CardContent className="py-3">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {feedback}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!hasFeedback && (
              <p className="text-sm text-muted-foreground">
                This user has not submitted any feedback yet.
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
