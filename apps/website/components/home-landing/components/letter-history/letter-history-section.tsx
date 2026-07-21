'use client';

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from '@imbustai/i18n';
import { Typography } from '@imbustai/ds';
import { cn } from '@/lib/utils';
import styles from './letter-history-section.module.scss';
import { TimelineSvg } from './timeline/timeline-svg';

function documentTop(el: HTMLElement) {
  const rect = el.getBoundingClientRect();
  return rect.top + window.scrollY;
}

const STEP_COUNT = 3;

export function LetterHistorySection() {
  const { t, tArray } = useTranslation();
  const stepBodies = tArray('landing.letterHistory.steps');
  const stepCount = Math.min(STEP_COUNT, stepBodies.length);

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
    if (!el || stepCount < 1) return;
    const top = documentTop(el);
    const trackHeight = el.offsetHeight;
    const denom = Math.max(1, trackHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, (window.scrollY - top) / denom));
    const next = Math.min(stepCount - 1, Math.floor(progress * stepCount));
    setActive((a) => (a !== next ? next : a));
  }, [stepCount]);

  useLayoutEffect(() => {
    syncActiveFromScroll();
  }, [syncActiveFromScroll]);

  useEffect(() => {
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
  }, [syncActiveFromScroll]);

  const scrollToStep = useCallback(
    (index: number) => {
      const clamped = Math.min(stepCount - 1, Math.max(0, index));
      const el = trackRef.current;
      if (!el || stepCount < 1) {
        setActive(clamped);
        return;
      }
      const top = documentTop(el);
      const trackHeight = el.offsetHeight;
      const denom = Math.max(1, trackHeight - window.innerHeight);
      const y = top + (clamped / stepCount) * denom;
      if (reducedMotion) {
        window.scrollTo({ top: y });
      } else {
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
      setActive(clamped);
    },
    [reducedMotion, stepCount],
  );

  const safeActive = Math.min(active, Math.max(0, stepCount - 1));
  const activeBody = stepBodies[safeActive] as unknown as string;

  const step1Body =
    safeActive === 1 ? (
      <>
        {t('landing.letterHistory.step1Before')}{' '}
        <em className="text-foreground">{t('landing.letterHistory.step1Emphasis')}</em>{' '}
        {t('landing.letterHistory.step1After')}
      </>
    ) : null;

  return (
    <div
      ref={trackRef}
      className={styles.scrollTrack}
      style={
        { '--letter-history-steps': String(stepCount) } as CSSProperties
      }
    >
      <div className={cn(styles.stickySlot, 'bg-background px-4 sm:px-6 md:px-10 lg:px-16')}>
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <Typography variant="h2">
            {t('landing.letterHistory.title')}
          </Typography>
          <div className="mt-3 max-w-3xl">
            <Typography variant="body" tone="muted">
              {t('landing.letterHistory.subtitle')}
            </Typography>
          </div>
        </div>

        <div className={styles.root}>
          <div
            className={cn(
              'letter-history-stage mt-10 grid gap-6 overflow-hidden border border-border bg-card/60 p-4 shadow-sm',
              'sm:p-5',
              'md:grid-cols-[360px_minmax(0,1fr)] md:items-end md:gap-8 md:p-8',
            )}
          >
            <div className="min-w-0">
              <nav
                className="flex items-center gap-2"
                aria-label={t('landing.letterHistory.stepsNavLabel')}
              >
                {Array.from({ length: stepCount }, (_, i) => {
                  const isActive = i === safeActive;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => scrollToStep(i)}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-full font-heading text-xs tabular-nums transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-foreground/10 text-foreground hover:bg-foreground/15',
                      )}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </nav>

              <p className={cn('mt-5 text-pretty', styles.bodyCopy)}>
                {step1Body ?? activeBody}
              </p>
            </div>

            <div className="min-w-0">
              <TimelineSvg
                step={safeActive}
                reducedMotion={reducedMotion}
                ariaLabel={t('landing.letterHistory.timelineAria')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
