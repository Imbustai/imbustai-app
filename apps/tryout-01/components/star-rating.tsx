'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  max?: number;
}

export function StarRating({ value, onChange, max = 5 }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const displayValue = hovered ?? value ?? -1;

  return (
    <div
      className="inline-flex gap-0.5"
      onMouseLeave={() => setHovered(null)}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;

        return (
          <button
            key={i}
            type="button"
            className={cn(
              'rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === null && hovered === null && 'opacity-30',
            )}
            onClick={() => onChange(starValue === value ? 0 : starValue)}
            onMouseEnter={() => setHovered(starValue)}
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                filled
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-none text-muted-foreground/50',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
