'use client';

import type { StaticImageData } from 'next/image';
import type { CSSProperties } from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@imbustai/i18n';
import { Typography, Button } from '@imbustai/ds';
import { cn } from '@/lib/utils';
import { signupUrl } from '@/lib/site';
import Link from 'next/link';
import letterImage1 from '../../assets/the_tales.jpg';
import letterImage2 from '../../assets/the_love_letter.webp';
import letterImage3 from '../../assets/the_writer_letter.jpg';
import letterImage4 from '../../assets/the_night_watch.webp';
import styles from './how-it-works-section.module.scss';

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

const STEP_COUNT = STEP_BG_FOCUS.length;

const BG_IMG_FADE_MS = 380;

function documentTop(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top + window.scrollY;
}

export function HowItWorksSection() {
  const { t, tArray } = useTranslation();
  const stepLabels = tArray('landing.steps.items');
  const stepBodies = tArray('landing.different.items');
  const stepCount = Math.min(STEP_COUNT, stepLabels.length, stepBodies.length);
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const syncActiveFromScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el || reducedMotion || stepCount < 1) return;
    const top = documentTop(el);
    const trackHeight = el.offsetHeight;
    const denom = Math.max(1, trackHeight - window.innerHeight);
    const progress = Math.min(
      1,
      Math.max(0, (window.scrollY - top) / denom),
    );
    const next = Math.min(
      stepCount - 1,
      Math.floor(progress * stepCount),
    );
    setActive((a) => (a !== next ? next : a));
  }, [reducedMotion, stepCount]);

  useLayoutEffect(() => {
    syncActiveFromScroll();
  }, [syncActiveFromScroll]);

  useEffect(() => {
    if (reducedMotion) return;
    const onScroll = () => syncActiveFromScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    const el = trackRef.current;
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(onScroll);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      ro?.disconnect();
    };
  }, [reducedMotion, syncActiveFromScroll]);

  const scrollToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(stepCount - 1, Math.max(0, index));
      const el = trackRef.current;
      if (!el || stepCount < 1 || reducedMotion) {
        setActive(clamped);
        return;
      }
      const top = documentTop(el);
      const trackHeight = el.offsetHeight;
      const denom = Math.max(1, trackHeight - window.innerHeight);
      const y = top + (clamped / stepCount) * denom;
      window.scrollTo({ top: y, behavior: 'smooth' });
      setActive(clamped);
    },
    [reducedMotion, stepCount],
  );

  const safeActive = Math.min(active, Math.max(0, stepCount - 1));
  const focus = STEP_BG_FOCUS[safeActive] ?? STEP_BG_FOCUS[0];

  return (
    <div
      ref={trackRef}
      className={styles.scrollTrack}
      style={
        { '--how-it-works-steps': String(stepCount) } as CSSProperties
      }
    >
      <div className={styles.stickySlot}>
        <div className="relative z-10 mx-auto w-full max-w-6xl bg-background">
          <Typography variant="display" as="h1">
            {t('landing.hero.headline')}
          </Typography>
          <div className="mt-6 max-w-xl">
            <Typography variant="body" tone="muted">
              {t('landing.hero.subLine1')}
              <br />
              {t('landing.hero.subLine2')}
            </Typography>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href={signupUrl}>{t('landing.hero.ctaPrimary')}</Link>
            </Button>
          </div>
        </div>
        <div className={styles.root}>
          <div
            className={cn(
              'how-it-works-stage relative flex flex-col overflow-hidden border border-border shadow-sm',
              'md:block md:aspect-video',
            )}
          >
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
                {STEP_BG_FOCUS.slice(0, stepCount).map((step, index) => {
                  const isActive = index === safeActive;
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

            <div
              className={cn(
                styles.howItWorksGrid +
                  ' relative z-10 flex w-full min-w-0 flex-1 flex-col gap-4 border-t border-border bg-card p-4 sm:gap-5 sm:p-5',
                'md:border-t-0 md:bg-transparent md:p-8',
                'md:absolute md:inset-0 md:grid md:grid-cols-[300px_minmax(0,1fr)] md:gap-8',
              )}
            >
              <nav
                className="min-w-0 shrink-0 md:flex md:w-[300px] md:flex-col"
                aria-label="How it works steps"
              >
                <div
                  className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin] md:hidden"
                  role="presentation"
                >
                  <ol className="flex min-w-min flex-row gap-2">
                    {stepLabels.slice(0, stepCount).map((label, index) => {
                      const isActive = index === safeActive;
                      return (
                        <li key={index} className="shrink-0 snap-start">
                          <button
                            type="button"
                            onClick={() => scrollToStep(index)}
                            className={cn(
                              'flex max-w-[11.5rem] flex-col items-center gap-1.5 border px-3 py-2.5 text-center transition-colors',
                              'snap-start sm:max-w-[13rem]',
                              isActive
                                ? 'border-primary/60 bg-muted/90 text-foreground shadow-sm'
                                : 'border-border bg-muted/50 text-foreground active:bg-muted/70',
                            )}
                            aria-current={isActive ? 'step' : undefined}
                          >
                            <span
                              className={cn(
                                'flex size-8 items-center justify-center rounded-full font-heading text-sm tabular-nums',
                                isActive
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-foreground/10 text-foreground',
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

                <ol className="hidden min-h-0 flex-col gap-2 md:flex">
                  {stepLabels.slice(0, stepCount).map((label, index) => {
                    const isActive = index === safeActive;
                    return (
                      <li key={index} className="min-w-0">
                        <button
                          type="button"
                          onClick={() => scrollToStep(index)}
                          className={cn(
                            'flex min-h-12 w-full items-start gap-3 border px-4 py-3 text-left text-base transition-colors',
                            isActive
                              ? 'border-primary/60 bg-card/95 text-foreground shadow-sm'
                              : 'border-border/80 bg-card/75 text-foreground hover:bg-card/90',
                          )}
                          aria-current={isActive ? 'step' : undefined}
                        >
                          <span
                            className={cn(
                              'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm tabular-nums',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-foreground/10 text-foreground',
                            )}
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                          <span className="min-w-0 flex-1 leading-snug">
                            {label}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </nav>

              <div
                className={cn(
                  'flex min-w-0 flex-1 flex-col justify-center border border-border bg-card/95 p-4 sm:p-5',
                  'md:bg-card/90 md:p-6',
                )}
              >
                <p className={styles.bodyCopy}>
                  {stepBodies[safeActive] ?? ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
