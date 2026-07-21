'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { Mail, MapPin } from 'lucide-react';
import { useTranslation } from '@imbustai/i18n';
import { Typography, Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@imbustai/ds';
import { signupUrl } from '@/lib/site';
import { HowItWorksSection } from './components/how-it-works/how-it-works-section';
import { LetterHistorySection } from './components/letter-history/letter-history-section';

export function HomeLanding() {
  const { t, tArray } = useTranslation();
  const steps = tArray('landing.steps.items');
  const differentiators = tArray('landing.different.items');

  return (
    <main className="relative">
      <section className="relative flex flex-col justify-end gap-8 bg-background px-4 pb-20 sm:px-6 md:px-10 lg:px-16">
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

      <section className="bg-muted px-4 py-20 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-5xl">
          <Typography variant="h2">
            {t('landing.visual.title')}
          </Typography>
          <div className="mt-4 max-w-2xl">
            <Typography variant="body" tone="muted">
              {t('landing.visual.body')}
            </Typography>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <VisualMock
              icon={<Mail className="size-10" />}
              label={t('landing.visual.mockLetterLabel')}
              caption={t('landing.visual.mockLetterCaption')}
            />
            <VisualMock
              icon={
                <div className="flex size-14 items-center justify-center rounded-sm border-2 border-dashed border-foreground/30 bg-card">
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

      <section className="bg-secondary px-4 py-16 sm:px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>
                {t('landing.social.title')}
              </CardTitle>
              <CardDescription>
                {t('landing.social.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Typography variant="h4">
                {t('landing.social.quote')}
              </Typography>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="join"
        className="scroll-mt-8 bg-background px-4 py-20 sm:px-6 md:px-10 lg:px-16"
      >
        <div className="mx-auto max-w-2xl text-center">
          <Typography variant="h2">
            {t('landing.cta.title')}
          </Typography>
          <div className="mt-4">
            <Typography variant="body" tone="muted">
              {t('landing.cta.subtitle')}
            </Typography>
          </div>
          <div className="mt-10">
            <Button size="lg" asChild>
              <Link href={signupUrl}>{t('landing.cta.button')}</Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="bg-background px-4 py-10 text-center">
        <Typography variant="overline">
          {t('landing.hero.kicker')}
        </Typography>
        <div className="mt-1">
          <Typography variant="caption" tone="muted">
            {t('landing.footer.tagline')}
          </Typography>
        </div>
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
    <div className="flex flex-col overflow-hidden border border-border bg-card shadow-sm">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-muted">
        <div className="text-muted-foreground">{icon}</div>
      </div>
      <div className="p-4">
        <Typography variant="h4">{label}</Typography>
        <div className="mt-1">
          <Typography variant="caption" tone="muted">{caption}</Typography>
        </div>
      </div>
    </div>
  );
}
