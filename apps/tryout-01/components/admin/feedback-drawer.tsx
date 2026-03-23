'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Star } from 'lucide-react';

const QUESTION_LABELS: Record<string, string> = {
  q1: 'I tried to understand the situation before making a judgment',
  q2: 'I found it difficult to take a clear position',
  q3: 'I perceived that actions depended mainly on individual choices',
  q4: 'I perceived that actions were influenced by context and social expectations',
  q5: 'I perceived the interlocutor as free to choose what to do',
  q6: 'I perceived the interlocutor as somehow constrained by the situation',
  q7: 'I felt involved in the interlocutor\'s situation',
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

export function FeedbackDrawer({
  questionnaire,
  feedback,
}: {
  questionnaire: Record<string, number> | null;
  feedback: string | null;
}) {
  const hasData = questionnaire || feedback;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2" disabled={!hasData}>
          <ClipboardList className="size-4" />
          {hasData ? 'View Feedback' : 'No Feedback Yet'}
        </Button>
      </SheetTrigger>
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

          {!hasData && (
            <p className="text-sm text-muted-foreground">
              This user has not submitted any feedback yet.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
