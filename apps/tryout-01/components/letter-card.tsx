'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useTranslation } from '@imbustai/i18n';
import { Mail, Pen } from 'lucide-react';

interface LetterCardProps {
  role: 'ai' | 'user';
  content: string;
  letterNumber: number;
  timestamp: string;
}

export function LetterCard({ role, content, letterNumber, timestamp }: LetterCardProps) {
  const { t } = useTranslation();
  const isAI = role === 'ai';

  const date = new Date(timestamp);
  const formattedDate = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Card
      className={`transition-all ${
        isAI
          ? 'border-l-4 border-l-primary/40 bg-card'
          : 'border-r-4 border-r-muted-foreground/30 bg-muted/30'
      }`}
    >
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isAI ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          }`}
        >
          {isAI ? <Mail className="h-4 w-4" /> : <Pen className="h-4 w-4" />}
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">
            {isAI
              ? `${t('game.letterFrom')} ${t('game.friendName')}`
              : t('game.you')}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('game.letterNumber')} {letterNumber} &middot; {formattedDate}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="whitespace-pre-wrap text-sm leading-relaxed select-none"
          onCopy={(e) => e.preventDefault()}
        >
          {content}
        </div>
      </CardContent>
    </Card>
  );
}
