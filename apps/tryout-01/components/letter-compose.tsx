'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/lib/i18n/context';
import { Pen, Send } from 'lucide-react';

interface LetterComposeProps {
  onSend: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function LetterCompose({ onSend, disabled }: LetterComposeProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const now = new Date();
  const formattedDate = now.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  async function handleSend() {
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      await onSend(content.trim());
      setContent('');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="border-dashed">
      <CardHeader className="flex flex-row items-center gap-3 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Pen className="h-4 w-4" />
        </div>
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium">{t('game.yourReply')}</span>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={(e) => e.preventDefault()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          placeholder={t('game.replyPlaceholder')}
          disabled={disabled || sending}
          className="min-h-[480px] resize-y"
        />
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          onClick={handleSend}
          disabled={!content.trim() || disabled || sending}
          className="gap-2"
        >
          {sending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('game.sending')}
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {t('game.send')}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
