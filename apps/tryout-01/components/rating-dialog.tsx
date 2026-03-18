'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';
import { Star } from 'lucide-react';

interface RatingDialogProps {
  open: boolean;
  onSubmit: (rating: number) => Promise<void>;
}

export function RatingDialog({ open, onSubmit }: RatingDialogProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0 || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(rating);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        {submitted ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('rating.thankYou')}</DialogTitle>
              <DialogDescription>
                {t('rating.thankYouDescription')}
              </DialogDescription>
            </DialogHeader>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('rating.title')}</DialogTitle>
              <DialogDescription>{t('rating.description')}</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="cursor-pointer rounded-md p-1 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} ${t('rating.stars')}`}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                </button>
              ))}
            </div>
            <DialogFooter>
              <Button
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="w-full"
              >
                {submitting ? t('game.sending') : t('rating.submit')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
