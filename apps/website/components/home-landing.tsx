'use client';

import type { CSSProperties, ReactNode } from 'react';
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

function SectionHeading({
  children,
  className,
  style,
  as: Comp = 'h2',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'h1' | 'h2' | 'h3';
}) {
  return (
    <Comp
      className={cn('font-heading text-balance tracking-tight', className)}
      style={style}
    >
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
      <section
        className="relative flex min-h-[85vh] flex-col justify-end gap-8 px-4 pb-16 pt-24 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#283618' }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fefae0' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative mx-auto w-full max-w-3xl">
          <p
            className="mb-4 font-heading text-sm font-bold uppercase tracking-[0.2em]"
            style={{ color: '#e37884' }}
          >
            {t('landing.hero.kicker')}
          </p>
          <SectionHeading
            as="h1"
            className="text-4xl leading-[1.05] sm:text-5xl md:text-6xl"
            style={{ color: '#fefae0' }}
          >
            {t('landing.hero.headline')}
          </SectionHeading>
          <p
            className="mt-6 max-w-xl text-lg leading-relaxed sm:text-xl"
            style={{ color: 'color-mix(in srgb, #fefae0 92%, transparent)' }}
          >
            {t('landing.hero.subLine1')}
            <br />
            {t('landing.hero.subLine2')}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href={signupUrl}>{t('landing.hero.ctaPrimary')}</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-cornsilk/50 bg-transparent text-cornsilk hover:bg-cornsilk/10 hover:text-cornsilk"
              asChild
            >
              <a href="#how-it-works">{t('landing.hero.ctaSecondary')}</a>
            </Button>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="scroll-mt-8 px-4 py-20 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#fefae0' }}
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            className="text-3xl sm:text-4xl"
            style={{ color: '#283618' }}
          >
            {t('landing.steps.title')}
          </SectionHeading>
          <p
            className="mt-3 text-lg"
            style={{ color: 'color-mix(in srgb, #283618 78%, transparent)' }}
          >
            {t('landing.steps.subtitle')}
          </p>
          <ul className="mt-12 grid gap-6 sm:grid-cols-2">
            {steps.map((line, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border p-5 shadow-sm"
                style={{
                  borderColor: 'color-mix(in srgb, #283618 15%, transparent)',
                  backgroundColor: '#ffffff',
                  color: '#283618',
                }}
              >
                <span
                  className="mt-1 flex size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: '#bd263a' }}
                  aria-hidden
                />
                <span className="text-lg leading-snug">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#606c38' }}
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            className="text-3xl sm:text-4xl"
            style={{ color: '#fefae0' }}
          >
            {t('landing.different.title')}
          </SectionHeading>
          <p
            className="mt-4 text-xl font-medium leading-snug sm:text-2xl"
            style={{ color: '#fefae0' }}
          >
            {t('landing.different.leadLine1')}
            <br />
            {t('landing.different.leadLine2')}
          </p>
          <ul className="mt-10 space-y-4">
            {differentiators.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-cornsilk/25 pb-4 text-lg last:border-0"
                style={{ color: '#fefae0' }}
              >
                <Sparkles
                  className="size-5 shrink-0"
                  style={{ color: '#e37884' }}
                  aria-hidden
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="px-4 py-20 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#fefae0' }}
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            className="text-3xl sm:text-4xl"
            style={{ color: '#283618' }}
          >
            {t('landing.visual.title')}
          </SectionHeading>
          <p
            className="mt-4 max-w-2xl text-lg leading-relaxed"
            style={{ color: 'color-mix(in srgb, #283618 85%, transparent)' }}
          >
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
                <div className="flex size-14 items-center justify-center rounded-sm border-2 border-dashed border-black-forest/30 bg-white">
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

      <section
        className="px-4 py-16 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#e37884' }}
      >
        <div className="mx-auto max-w-2xl">
          <Card
            className="border-0 shadow-lg"
            style={{
              backgroundColor: '#fefae0',
              color: '#283618',
            }}
          >
            <CardHeader>
              <CardTitle className="font-heading text-xl">
                {t('landing.social.title')}
              </CardTitle>
              <CardDescription style={{ color: '#606c38' }}>
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
        className="scroll-mt-8 px-4 py-20 sm:px-6 md:px-10 lg:px-16"
        style={{ backgroundColor: '#283618' }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            className="text-3xl sm:text-4xl"
            style={{ color: '#fefae0' }}
          >
            {t('landing.cta.title')}
          </SectionHeading>
          <p
            className="mt-4"
            style={{ color: 'color-mix(in srgb, #fefae0 90%, transparent)' }}
          >
            {t('landing.cta.subtitle')}
          </p>
          <Button size="lg" className="mt-10" asChild>
            <Link href={signupUrl}>{t('landing.cta.button')}</Link>
          </Button>
        </div>
      </section>

      <section
        className="border-t px-4 py-16 sm:px-6 md:px-10 lg:px-16"
        style={{
          backgroundColor: '#fefae0',
          borderColor: 'color-mix(in srgb, #283618 12%, transparent)',
        }}
      >
        <div className="mx-auto max-w-3xl">
          <SectionHeading
            className="text-2xl sm:text-3xl"
            style={{ color: '#283618' }}
          >
            {t('landing.compare.title')}
          </SectionHeading>
          <p
            className="mt-2 text-sm uppercase tracking-wider"
            style={{ color: 'color-mix(in srgb, #283618 60%, transparent)' }}
          >
            {t('landing.compare.tagline')}
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div
              className="rounded-xl border p-6 opacity-80"
              style={{
                borderColor: 'color-mix(in srgb, #bd263a 35%, transparent)',
                backgroundColor: '#ffffff',
              }}
            >
              <p className="text-sm font-medium text-intense-cherry">
                {t('landing.compare.weakLabel')}
              </p>
              <p
                className="mt-3 font-heading text-lg line-through decoration-intense-cherry/50"
                style={{ color: '#283618' }}
              >
                {t('landing.compare.weakLine')}
              </p>
            </div>
            <div
              className="rounded-xl border-2 p-6 shadow-sm"
              style={{
                borderColor: '#606c38',
                backgroundColor: '#ffffff',
              }}
            >
              <p className="text-sm font-medium" style={{ color: '#606c38' }}>
                {t('landing.compare.strongLabel')}
              </p>
              <p
                className="mt-3 font-heading text-lg sm:text-xl"
                style={{ color: '#283618' }}
              >
                {t('landing.compare.strongLine')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="px-4 py-10 text-center text-sm"
        style={{
          backgroundColor: '#283618',
          color: 'color-mix(in srgb, #fefae0 65%, transparent)',
        }}
      >
        <p className="font-heading" style={{ color: '#fefae0' }}>
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
    <div
      className="flex flex-col overflow-hidden rounded-xl border shadow-md"
      style={{
        borderColor: 'color-mix(in srgb, #283618 14%, transparent)',
        backgroundColor: '#ffffff',
      }}
    >
      <div
        className="relative flex aspect-[4/3] items-center justify-center"
        style={{ backgroundColor: 'color-mix(in srgb, #fefae0 70%, #ffffff)' }}
      >
        <div style={{ color: '#606c38' }}>{icon}</div>
        <div
          className="absolute bottom-3 left-3 right-3 h-12 rounded border border-black-forest/10 bg-white/80 backdrop-blur-sm"
          aria-hidden
        />
      </div>
      <div className="p-4" style={{ color: '#283618' }}>
        <p className="font-heading text-lg">{label}</p>
        <p
          className="mt-1 text-sm"
          style={{ color: 'color-mix(in srgb, #283618 72%, transparent)' }}
        >
          {caption}
        </p>
      </div>
    </div>
  );
}
