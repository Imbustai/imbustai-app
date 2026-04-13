'use client';

import { useState } from 'react';
import { useTranslation } from '@imbustai/i18n';
import { cn } from '@/lib/utils';
import letterImage1 from '../../assets/the_tales.jpg';
import letterImage2 from '../../assets/the_love_letter.webp';
import letterImage3 from '../../assets/the_writer_letter.jpg';
import letterImage4 from '../../assets/the_night_watch.webp';
import styles from './how-it-works-section.module.scss';
import { StaticImageData } from 'next/image';

/** Focal zoom per step: CSS % for transform-origin; scale > 1 zooms in toward that point. */
const STEP_BG_FOCUS: ReadonlyArray<{
  originX: number;
  originY: number;
  scale: number;
  img: StaticImageData;
}> = [
  { originX: 50, originY: 70, scale: 1, img: letterImage1 },
  { originX: 38, originY: 65, scale: 3, img: letterImage2 },
  { originX: 50, originY: 100, scale: 1, img: letterImage3 },
  { originX: 48, originY: 68, scale: 1.48, img: letterImage4 },
];

const BG_IMG_FADE_MS = 380;

export function HowItWorksSection() {
  const { tArray } = useTranslation();
  const stepLabels = tArray('landing.steps.items');
  const stepBodies = tArray('landing.different.items');
  const [active, setActive] = useState(0);
  const focus = STEP_BG_FOCUS[active] ?? STEP_BG_FOCUS[0];

  return (
    <div className={styles.root}>
      <div
        className={cn(
          'how-it-works-stage relative flex flex-col overflow-hidden border border-landing-card-border-subtle shadow-md',
          /* md: block + aspect-video so height isn’t collapsed when children are position:absolute */
          'md:block md:aspect-video',
        )}
      >
        {/* Background: top band on mobile, full bleed on md+ */}
        <div
          className={cn(
            'relative h-44 w-full shrink-0 overflow-hidden sm:h-52',
            'md:absolute md:inset-0 md:h-full md:w-full',
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 will-change-transform"
            style={{
              transform: `scale(${focus.scale})`,
              transformOrigin: `${focus.originX}% ${focus.originY}%`,
              transition:
                'transform 700ms cubic-bezier(0.33, 1, 0.68, 1), transform-origin 700ms cubic-bezier(0.33, 1, 0.68, 1)',
            }}
          >
            {STEP_BG_FOCUS.map((step, index) => {
              const isActive = index === active;
              return (
                <img
                  key={index}
                  src={step.img.src}
                  alt=""
                  width={step.img.width}
                  height={step.img.height}
                  decoding="async"
                  loading="eager"
                  fetchPriority={isActive ? 'high' : 'low'}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                  style={{
                    opacity: isActive ? 1 : 0,
                    zIndex: isActive ? 2 : 1,
                    transition: `opacity ${BG_IMG_FADE_MS}ms ease-out`,
                  }}
                  aria-hidden
                />
              );
            })}
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-black/30 dark:bg-black/40 md:bg-black/35 md:dark:bg-black/45"
            aria-hidden
          />
        </div>

        {/* Content: stacked card below image on mobile; overlay grid on md+ */}
        <div
          className={cn(
            styles.howItWorksGrid + ' relative z-10 flex w-full min-w-0 flex-1 flex-col gap-4 border-t border-landing-card-border-subtle bg-landing-card p-4 sm:gap-5 sm:p-5',
            'md:border-t-0 md:bg-transparent md:p-8',
            'md:absolute md:inset-0 md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-8 text-mania',
          )}
        >
          <nav
            className="min-w-0 shrink-0 md:flex md:w-[300px] md:flex-col"
            aria-label="How it works steps"
          >
            {/* Mobile: horizontal step picker */}
            <div
              className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] md:hidden"
              role="presentation"
            >
              <ol className="flex min-w-min flex-row gap-2">
                {stepLabels.map((label, index) => {
                  const isActive = index === active;
                  return (
                    <li key={index} className="shrink-0 snap-start">
                      <button
                        type="button"
                        onClick={() => setActive(index)}
                        className={cn(
                          'flex max-w-[11.5rem] flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center transition-colors',
                          'snap-start sm:max-w-[13rem]',
                          isActive
                            ? 'border-primary/60 bg-landing-surface-warm/90 text-landing-surface-warm-fg shadow-sm'
                            : 'border-landing-card-border-subtle bg-landing-surface-warm/50 text-landing-surface-warm-fg active:bg-landing-surface-warm/70',
                        )}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        <span
                          className={cn(
                            'flex size-8 items-center justify-center rounded-full font-heading text-sm tabular-nums',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-landing-surface-warm-fg/10 text-landing-surface-warm-fg',
                          )}
                          aria-hidden
                        >
                          {index + 1}
                        </span>
                        <span className="line-clamp-3 text-left text-xs font-medium leading-snug sm:text-sm">
                          {label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Desktop: vertical list */}
            <ol className="hidden min-h-0 flex-col gap-2 md:flex">
              {stepLabels.map((label, index) => {
                const isActive = index === active;
                return (
                  <li key={index} className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setActive(index)}
                      className={cn(
                        'flex min-h-12 w-full items-start gap-3 rounded-lg border px-4 py-3 text-left text-base transition-colors',
                        isActive
                          ? 'border-primary/60 bg-landing-card/95 text-landing-surface-warm-fg shadow-sm'
                          : 'border-landing-card-border-subtle/80 bg-landing-card/75 text-landing-surface-warm-fg hover:bg-landing-card/90',
                      )}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm tabular-nums',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-landing-surface-warm-fg/10 text-landing-surface-warm-fg',
                        )}
                        aria-hidden
                      >
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 leading-snug">{label}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col justify-center rounded-xl border border-landing-card-border-subtle bg-landing-card/95 p-4 sm:p-5',
              'md:bg-landing-card/90 md:p-6',
            )}
          >
            <p className={styles.bodyCopy}>{stepBodies[active] ?? ''}</p>
            {/* Reserved for richer step content later */}
          </div>
        </div>
      </div>
    </div>
  );
}
