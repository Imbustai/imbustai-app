'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Mail, Sparkles, MapPin } from 'lucide-react';
import { useTranslation } from '@imbustai/i18n';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { signupUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import { HowItWorksSection } from './components/how-it-works/how-it-works-section';
import { LetterHistorySection } from './components/letter-history/letter-history-section';
import { SectionHeadingGridBG } from './components/section-heading-grid-bg';

function SectionHeading({
  children,
  className,
  as: Comp = 'h2',
}: {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Comp className={cn('font-heading text-balance', className)}>
      {children}
    </Comp>
  );
}

export function HomeLanding() {
  const { t, tArray } = useTranslation();
  const steps = tArray('landing.steps.items');
  const differentiators = tArray('landing.different.items');

  return (
    <main className="relative">
      <section className="relative flex flex-col justify-end gap-8 bg-landing-hero px-4 pb-20 sm:px-6 md:px-10 lg:px-16 ">
        <SectionHeadingGridBG />
        <div
          className="pointer-events-none absolute inset-0 z-[1] opacity-[0.07]"
          aria-hidden
        />
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <HowItWorksSection />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-8 relative">
        <LetterHistorySection />
      </section>

      <section className="bg-landing-band-olive px-4 py-20 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading className="text-3xl text-landing-band-olive-fg sm:text-4xl">
            {t('landing.different.title')}
          </SectionHeading>
          <p className="mt-4 text-xl font-medium leading-snug text-landing-band-olive-fg sm:text-2xl">
            {t('landing.different.leadLine1')}
            <br />
            {t('landing.different.leadLine2')}
          </p>
          <ul className="mt-10 space-y-4">
            {differentiators.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-landing-band-olive-fg/25 pb-4 text-lg text-landing-band-olive-fg last:border-0"
              >
                <Sparkles
                  className="size-5 shrink-0 text-landing-band-olive-accent"
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-landing-surface-warm px-4 py-20 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <SectionHeading className="text-3xl text-landing-surface-warm-fg sm:text-4xl">
            {t('landing.visual.title')}
          </SectionHeading>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-landing-surface-warm-fg-muted">
            {t('landing.visual.body')}
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <VisualMock
              icon={<Mail className="size-10" />}
              label={t('landing.visual.mockLetterLabel')}
              caption={t('landing.visual.mockLetterCaption')}
            />
            <VisualMock
              icon={
                <div className="flex size-14 items-center justify-center rounded-sm border-2 border-dashed border-landing-surface-warm-fg/30 bg-white">
                  <Mail className="size-8 opacity-60" />
                </div>
              }
              label={t('landing.visual.mockEnvelopeLabel')}
              caption={t('landing.visual.mockEnvelopeCaption')}
            />
            <VisualMock
              icon={<MapPin className="size-10" />}
              label={t('landing.visual.mockHomeLabel')}
              caption={t('landing.visual.mockHomeCaption')}
            />
          </div>
        </div>
      </section>

      <section className="bg-landing-band-coral px-4 py-16 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <Card className="border-0 bg-landing-social-card text-landing-social-card-fg shadow-lg">
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                {t('landing.social.title')}
              </CardTitle>
              <CardDescription className="text-landing-social-card-muted">
                {t('landing.social.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <blockquote className="font-heading text-xl leading-relaxed sm:text-2xl">
                {t('landing.social.quote')}
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="join"
        className="scroll-mt-8 bg-landing-hero px-4 py-20 sm:px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading className="text-3xl text-landing-hero-fg sm:text-4xl">
            {t('landing.cta.title')}
          </SectionHeading>
          <p className="mt-4 text-landing-hero-fg-muted">
            {t('landing.cta.subtitle')}
          </p>
          <Button size="lg" className="mt-10" asChild>
            <Link href={signupUrl}>{t('landing.cta.button')}</Link>
          </Button>
        </div>
      </section>

      <section className="border-t border-landing-compare-border-t bg-landing-surface-warm px-4 py-16 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl">
          <SectionHeading className="text-2xl text-landing-surface-warm-fg sm:text-3xl">
            {t('landing.compare.title')}
          </SectionHeading>
          <p className="mt-2 text-sm uppercase tracking-wider text-landing-compare-tagline">
            {t('landing.compare.tagline')}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-landing-compare-weak-border bg-landing-card p-6 opacity-80">
              <p className="text-sm font-medium text-intense-cherry">
                {t('landing.compare.weakLabel')}
              </p>
              <p className="mt-3 font-heading text-lg text-landing-surface-warm-fg line-through decoration-intense-cherry/50">
                {t('landing.compare.weakLine')}
              </p>
            </div>
            <div className="rounded-xl border-2 border-landing-compare-strong-border bg-landing-card p-6 shadow-sm">
              <p className="text-sm font-medium text-landing-social-card-muted">
                {t('landing.compare.strongLabel')}
              </p>
              <p className="mt-3 font-heading text-lg text-landing-surface-warm-fg sm:text-xl">
                {t('landing.compare.strongLine')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-landing-footer px-4 py-10 text-center text-sm text-landing-footer-fg-muted">
        <p className="font-heading text-landing-footer-kicker">
          {t('landing.hero.kicker')}
        </p>
        <p className="mt-1">{t('landing.footer.tagline')}</p>
      </footer>
    </main>
  );
}

function VisualMock({
  icon,
  label,
  caption,
}: {
  icon: ReactNode;
  label: string;
  caption: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-landing-mock-tile-border bg-landing-card shadow-md">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-landing-mock-stage">
        <div className="text-landing-mock-icon">{icon}</div>
        <div
          className="absolute bottom-3 left-3 right-3 h-12 rounded border border-landing-surface-warm-fg/10 bg-white/80 backdrop-blur-sm"
          aria-hidden
        />
      </div>
      <div className="p-4 text-landing-surface-warm-fg">
        <p className="font-heading text-lg">{label}</p>
        <p className="mt-1 text-sm text-landing-mock-caption">{caption}</p>
      </div>
    </div>
  );
}
