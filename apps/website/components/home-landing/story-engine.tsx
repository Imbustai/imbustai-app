'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@imbustai/i18n';
import { Button, Typography } from '@imbustai/ds';
import { signupUrl } from '@/lib/site';
import styles from './home-landing.module.css';

/** One road per reply, from the first letter to the author's twist. */
const ROUTES = [
  'M80 120 C160 120 180 36 260 36 C340 36 360 120 440 120',
  'M80 120 H440',
  'M80 120 C160 120 180 204 260 204 C340 204 360 120 440 120',
] as const;

/** The same three roads, narrower, from the twist to the ending. */
const ROUTES_AFTER = [
  'M440 120 C500 120 510 72 570 72 C630 72 640 120 700 120',
  'M440 120 H700',
  'M440 120 C500 120 510 168 570 168 C630 168 640 120 700 120',
] as const;

const ROUTE_LABEL_Y = [22, 106, 228] as const;

export function StoryEngine() {
  const { t, tArray } = useTranslation();
  const [choice, setChoice] = useState<number | null>(null);

  const choiceLabels = tArray('landing.engine.choiceLabels');
  const replies = tArray('landing.engine.replies');
  const routeLabels = tArray('landing.engine.routeLabels');
  const pointTitles = tArray('landing.engine.pointTitles');
  const pointBodies = tArray('landing.engine.pointBodies');

  return (
    <section id="engine" className={styles.engine} aria-labelledby="engine-title">
      <div className={styles.wrap}>
        <p className={styles.kicker}>{t('landing.engine.kicker')}</p>
        <h2 id="engine-title" className={styles.sectionTitle}>
          {t('landing.engine.title')}
        </h2>
        <div className={styles.lead}>
          <Typography variant="body">{t('landing.engine.body')}</Typography>
        </div>

        <div className={styles.demo}>
          <span className={styles.demoTag}>{t('landing.engine.demoLabel')}</span>

          <div className={styles.demoLetters}>
            <article className={styles.sheet}>
              <h3 className={styles.sheetFrom}>{t('landing.engine.letterFrom')}</h3>
              <p className={styles.sheetText}>{t('landing.engine.letterText')}</p>
            </article>

            <div className={styles.choices}>
              <h3 id="engine-choice" className={styles.choicePrompt}>
                {t('landing.engine.choicePrompt')}
              </h3>
              <div
                role="group"
                aria-labelledby="engine-choice"
                className={styles.choiceList}
              >
                {choiceLabels.map((label, index) => (
                  <button
                    key={index}
                    type="button"
                    className={styles.choice}
                    aria-pressed={choice === index}
                    onClick={() => setChoice(index)}
                  >
                    <span className={styles.choiceNumber} aria-hidden>
                      {index + 1}
                    </span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <article
              className={`${styles.sheet} ${styles.sheetReply}`}
              aria-live="polite"
            >
              <h3 className={styles.sheetFrom}>{t('landing.engine.replyFrom')}</h3>
              {choice === null ? (
                <p className={styles.sheetEmpty}>{t('landing.engine.replyEmpty')}</p>
              ) : (
                <p key={choice} className={`${styles.sheetText} ${styles.sheetReveal}`}>
                  {replies[choice]}
                </p>
              )}
            </article>
          </div>

          <figure className={styles.timeline}>
            <svg
              viewBox="0 0 780 250"
              role="img"
              aria-label={t('landing.engine.timelineAria')}
              className={styles.timelineSvg}
            >
              {ROUTES.map((d, index) => (
                <path key={`a${index}`} d={d} className={styles.route} />
              ))}
              {ROUTES_AFTER.map((d, index) => (
                <path key={`b${index}`} d={d} className={styles.route} />
              ))}
              {choice !== null ? (
                <g key={choice}>
                  <path
                    d={ROUTES[choice]}
                    pathLength={1}
                    className={styles.routeActive}
                  />
                  <path
                    d={ROUTES_AFTER[choice]}
                    pathLength={1}
                    className={`${styles.routeActive} ${styles.routeActiveLate}`}
                  />
                </g>
              ) : null}

              {routeLabels.map((label, index) => (
                <text
                  key={index}
                  x={260}
                  y={ROUTE_LABEL_Y[index]}
                  textAnchor="middle"
                  className={
                    choice === index ? styles.routeLabelActive : styles.routeLabel
                  }
                >
                  {label}
                </text>
              ))}

              <rect x={62} y={102} width={36} height={36} className={styles.node} />
              <rect x={418} y={98} width={44} height={44} className={styles.nodeAuthor} />
              <rect x={678} y={98} width={44} height={44} className={styles.nodeAuthor} />
              <text x={80} y={166} textAnchor="middle" className={styles.nodeLabel}>
                {t('landing.engine.nodeStart')}
              </text>
              <text x={440} y={172} textAnchor="middle" className={styles.nodeLabel}>
                {t('landing.engine.nodeTwist')}
              </text>
              <text x={700} y={172} textAnchor="middle" className={styles.nodeLabel}>
                {t('landing.engine.nodeEnd')}
              </text>
            </svg>
            <figcaption className={styles.timelineCaption}>
              {t('landing.engine.timelineCaption')}
            </figcaption>
          </figure>

          <p className={styles.demoNote}>{t('landing.engine.demoNote')}</p>
        </div>

        <ol className={styles.points}>
          {pointTitles.map((title, index) => (
            <li key={index} className={styles.point}>
              <span className={styles.pointNumber} aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className={styles.pointTitle}>{title}</h3>
              <Typography variant="body" tone="muted">
                {pointBodies[index]}
              </Typography>
            </li>
          ))}
        </ol>

        <div className={styles.closing}>
          <p className={styles.closingTitle}>{t('landing.engine.ctaTitle')}</p>
          <Button size="lg" asChild>
            <Link href={signupUrl}>{t('landing.engine.cta')}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
