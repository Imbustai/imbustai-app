'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslation } from '@imbustai/i18n';
import { Button, Typography } from '@imbustai/ds';
import { christmasUrl, signupUrl } from '@/lib/site';
import {
  CatalogueArt,
  EnvelopeArt,
  FlatLayArt,
  LetterArt,
  PostboxArt,
  ReplyArt,
} from './postal-art';
import { StoryEngine } from './story-engine';
import { VISUAL_BRIEFS } from './visual-briefs';
import styles from './home-landing.module.css';

const STEP_ART = [
  { art: <CatalogueArt />, brief: VISUAL_BRIEFS.stepChoose },
  { art: <LetterArt />, brief: VISUAL_BRIEFS.stepReceive },
  { art: <ReplyArt />, brief: VISUAL_BRIEFS.stepReply },
  { art: <PostboxArt />, brief: VISUAL_BRIEFS.stepNext },
];

export function HomeLanding() {
  const { t, tArray } = useTranslation();
  const factTerms = tArray('landing.facts.terms');
  const factValues = tArray('landing.facts.values');
  const stepTitles = tArray('landing.steps.titles');
  const stepBodies = tArray('landing.steps.bodies');
  const itemTitles = tArray('landing.receive.itemTitles');
  const itemBodies = tArray('landing.receive.itemBodies');

  return (
    <main className={styles.page}>
      {/* 1 — What Imbustai is, at a glance */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <p className={styles.kicker}>{t('landing.hero.kicker')}</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              {t('landing.hero.headlineLead')}{' '}
              <span className={styles.heroAccent}>
                {t('landing.hero.headlineAccent')}
              </span>
            </h1>
            <p className={styles.heroDefinition}>{t('landing.hero.definition')}</p>
            <div className={styles.actions}>
              <Button size="lg" asChild>
                <Link href={signupUrl}>{t('landing.hero.ctaPrimary')}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#how-it-works">{t('landing.hero.ctaSecondary')}</a>
              </Button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <VisualSlot brief={VISUAL_BRIEFS.hero}>
              <EnvelopeArt
                to={t('landing.hero.envelopeTo')}
                from={t('landing.hero.envelopeFrom')}
              />
            </VisualSlot>
          </div>
        </div>

        <div className={styles.wrap}>
          <dl className={styles.facts} aria-label={t('landing.facts.label')}>
            {factTerms.map((term, index) => (
              <div key={index} className={styles.fact}>
                <dt className={styles.factTerm}>{term}</dt>
                <dd className={styles.factValue}>{factValues[index]}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className={styles.airmail} aria-hidden />

      <section
        id="how-it-works"
        className={styles.steps}
        aria-labelledby="steps-title"
      >
        <div className={styles.wrap}>
          <h2 id="steps-title" className={styles.sectionTitle}>
            {t('landing.steps.title')}
          </h2>
          <ol className={styles.stepList} aria-label={t('landing.steps.navLabel')}>
            {stepTitles.map((title, index) => (
              <li key={index} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden>
                  {index + 1}
                </span>
                <VisualSlot brief={STEP_ART[index]?.brief ?? ''} compact>
                  {STEP_ART[index]?.art}
                </VisualSlot>
                <h3 className={styles.stepTitle}>{title}</h3>
                <Typography variant="body" tone="muted">
                  {stepBodies[index]}
                </Typography>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 2 — What you receive */}
      <section className={styles.receive} aria-labelledby="receive-title">
        <div className={`${styles.wrap} ${styles.receiveGrid}`}>
          <div>
            <p className={styles.kickerOnField}>{t('landing.receive.kicker')}</p>
            <h2 id="receive-title" className={styles.receiveTitle}>
              {t('landing.receive.title')}
            </h2>
            <p className={styles.receiveBody}>{t('landing.receive.body')}</p>
          </div>
          <VisualSlot brief={VISUAL_BRIEFS.receive} onField>
            <FlatLayArt />
          </VisualSlot>
        </div>

        <div className={styles.wrap}>
          <ul className={styles.items}>
            {itemTitles.map((title, index) => (
              <li key={index} className={styles.item}>
                <h3 className={styles.itemTitle}>{title}</h3>
                <p className={styles.itemBody}>{itemBodies[index]}</p>
              </li>
            ))}
          </ul>

          <div className={styles.receiveFoot}>
            <figure className={styles.postcard}>
              <blockquote className={styles.postcardQuote}>
                {t('landing.receive.quote')}
              </blockquote>
              <figcaption className={styles.postcardSource}>
                {t('landing.receive.quoteSource')}
              </figcaption>
            </figure>
            <div className={styles.receiveActions}>
              <div className={styles.actions}>
                <Button size="lg" variant="accent" asChild>
                  <Link href={signupUrl}>{t('landing.receive.ctaPrimary')}</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href={christmasUrl}>{t('landing.receive.ctaGift')}</Link>
                </Button>
              </div>
              <p className={styles.giftNote}>{t('landing.receive.giftNote')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 — How the story answers */}
      <StoryEngine />

      <div className={styles.airmail} aria-hidden />
      <footer className={styles.footer}>
        <p className={styles.footerName}>Imbustai</p>
        <p className={styles.footerTagline}>{t('landing.footer.tagline')}</p>
      </footer>
    </main>
  );
}

/**
 * A slot for a visual that is still to be produced: the drawing mimics it and
 * the caption carries the brief. Swap the children for the real image or film
 * and drop the brief when it exists.
 */
function VisualSlot({
  brief,
  children,
  compact,
  onField,
}: {
  brief: string;
  children: ReactNode;
  compact?: boolean;
  onField?: boolean;
}) {
  return (
    <figure
      className={styles.visual}
      data-compact={compact || undefined}
      data-on-field={onField || undefined}
    >
      <div className={styles.visualArt}>{children}</div>
      <div className={styles.visualBrief}>
        <details>
          <summary className={styles.visualTag}>Visual da produrre</summary>
          <p className={styles.visualText}>{brief}</p>
        </details>
      </div>
    </figure>
  );
}
