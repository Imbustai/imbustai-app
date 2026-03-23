'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MessageSquare, Mail, Pen } from 'lucide-react';

interface Interaction {
  id: string;
  role: 'ai' | 'user';
  content: string;
  letter_number: number;
  created_at: string;
  visible_from?: string | null;
}

export function InteractionsDrawer({
  interactions,
}: {
  interactions: Interaction[];
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <MessageSquare className="size-4" />
          View Interactions ({interactions.length})
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Interactions</SheetTitle>
        </SheetHeader>
        <div className="space-y-3 p-6 pt-2">
          {interactions.map((interaction) => {
            const isAI = interaction.role === 'ai';
            const displayTimestamp = interaction.visible_from ?? interaction.created_at;
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
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
