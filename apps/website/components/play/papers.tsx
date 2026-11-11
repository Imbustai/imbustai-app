import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { LetterContent } from '@imbustai/ds';
import type { Enclosure } from '@imbustai/story-runtime';
import type { MailLetter, MailSender } from '@/lib/mailbox';
import { keepLineBreaks, splitClipping } from './paper';
import styles from './papers.module.css';

// The fixed pieces as paper (Imbustai/imbustai-app#43): a typed document, a
// newspaper clipping, a handwritten Letter. Which one a piece becomes follows
// from who sent it and what kind it is — never from the Story.

function longDate(iso: string | null, locale: string): string {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Inline **bold** and *italic*, nothing else. */
function inline(line: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    out.push(m[1] ? <strong key={m.index}>{m[1]}</strong> : <em key={m.index}>{m[2]}</em>);
    last = m.index + m[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

/** A typed sheet: every line kept as typed, long lines wrapped, `---` a rule. */
export function TypedSheet({ body }: { body: string }) {
  return (
    <div className={styles.paper}>
      <div className={styles.typed}>
        {body.split('\n').map((line, i) =>
          line.trim() === '---' ? (
            <hr key={i} className={styles.typedRule} />
          ) : (
            <div key={i}>{line ? inline(line) : ' '}</div>
          ),
        )}
      </div>
    </div>
  );
}

export function Clipping({
  masthead,
  storyDate,
  body,
  locale,
}: {
  masthead: string;
  storyDate: string | null;
  body: string;
  locale: string;
}) {
  const { headline, deck, paragraphs } = splitClipping(body);
  return (
    <figure className={styles.clipping}>
      <div className={styles.masthead}>
        <span>{masthead}</span>
        <span>{longDate(storyDate, locale)}</span>
      </div>
      {headline ? <h3 className={styles.headline}>{headline}</h3> : null}
      {deck.map((d) => (
        <p key={d} className={styles.deck}>
          {d}
        </p>
      ))}
      {paragraphs.map((p, i) => (
        <p key={i} className={styles.newsText}>
          {inline(p)}
        </p>
      ))}
    </figure>
  );
}

const HANDS = [styles.hand0, styles.hand1, styles.hand2];

/** A person's Letter, in that person's hand. */
export function HandwrittenSheet({ body, hand }: { body: string; hand: number }) {
  return (
    <div className={`${styles.letterSheet} ${HANDS[hand % HANDS.length]}`}>
      <ReactMarkdown>{keepLineBreaks(body)}</ReactMarkdown>
    </div>
  );
}

/** What the Player wrote: Letter Markdown from the rich-text composer. */
export function PlayerSheet({ body }: { body: string }) {
  return <LetterContent markdown={keepLineBreaks(body)} className={styles.playerSheet} />;
}

/** A received Letter, set as the paper its sender would use. */
export function LetterPaper({
  letter,
  sender,
  locale,
}: {
  letter: MailLetter;
  sender: MailSender;
  locale: string;
}) {
  if (sender.kind === 'newspaper') {
    return <Clipping masthead={sender.name} storyDate={letter.storyDate} body={letter.body} locale={locale} />;
  }
  if (sender.kind === 'office' || sender.hand === null) return <TypedSheet body={letter.body} />;
  return <HandwrittenSheet body={letter.body} hand={sender.hand} />;
}

export function EnclosurePaper({
  enclosure,
  storyDate,
  locale,
}: {
  enclosure: Enclosure;
  storyDate: string | null;
  locale: string;
}) {
  if (enclosure.kind === 'clipping') {
    return <Clipping masthead={enclosure.title} storyDate={storyDate} body={enclosure.body} locale={locale} />;
  }
  return <TypedSheet body={enclosure.body} />;
}

/** The rules card: the app's own voice, never paper. */
export function RulesProse({ body }: { body: string }) {
  return (
    <div className={styles.rules}>
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}
