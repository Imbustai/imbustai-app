// PROTOTYPE — throwaway. Round 1: heading-font specimen for the homepage redesign.
// Question: which open-licence condensed face replaces Futura Condensed (not licensed for web)?
// Removed before the PR. Candidates are pulled with next/font/google only for this page.
import {
  Oswald,
  League_Gothic,
  Barlow_Condensed,
  Archivo,
} from 'next/font/google';
import styles from './prototype.module.css';

const oswald = Oswald({ subsets: ['latin'], weight: ['500', '700'] });
const league = League_Gothic({ subsets: ['latin'] });
const barlow = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '800'] });
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'] });

const CANDIDATES = [
  {
    key: '0',
    name: 'Futura Condensed Medium (oggi — non licenziato)',
    note: 'Riferimento: quello che il sito usa adesso.',
    style: { fontFamily: 'var(--font-futura-condensed)', fontWeight: 500 },
    scale: 1,
  },
  {
    key: 'A',
    name: 'Oswald Bold',
    note: 'SIL OFL 1.1 · gotico condensato classico, minuscole, pesi 200–700.',
    style: { ...oswald.style, fontWeight: 700 },
    scale: 0.9,
  },
  {
    key: 'B',
    name: 'League Gothic',
    note: 'SIL OFL 1.1 · altissimo e stretto, da manifesto; un solo peso.',
    style: { ...league.style, fontWeight: 400 },
    scale: 1.12,
  },
  {
    key: 'C',
    name: 'Barlow Condensed ExtraBold',
    note: 'SIL OFL 1.1 · segnaletica stradale, squadrato; pesi 100–900.',
    style: { ...barlow.style, fontWeight: 800 },
    scale: 1,
  },
  {
    key: 'D',
    name: 'Archivo ExtraCondensed Bold',
    note: 'SIL OFL 1.1 · stessa famiglia del testo di corpo (asse larghezza): un solo font per tutto.',
    style: { ...archivo.style, fontWeight: 800, fontStretch: '62%' },
    scale: 0.95,
  },
] as const;

export default function PrototypeHomepage() {
  return (
    <main className={styles.page}>
      <p className={styles.banner}>
        PROTOTIPO · Round 1 — font dei titoli. Il testo di corpo resta Archivo.
      </p>
      {CANDIDATES.map((c) => (
        <section key={c.key} className={styles.specimen}>
          <header className={styles.meta}>
            <span className={styles.key}>{c.key}</span>
            <div>
              <strong>{c.name}</strong>
              <br />
              <span>{c.note}</span>
            </div>
          </header>
          <div className={styles.cols}>
            <div style={{ ...c.style, fontSize: `${c.scale}em` }}>
              <p className={styles.overline}>Posta lenta · Storie epistolari</p>
              <h2 className={styles.display}>
                Qualcuno ha
                <br />
                iniziato a<br />
                <span className={styles.red}>scriverti.</span>
              </h2>
            </div>
            <div>
              <div style={{ ...c.style, fontSize: `${c.scale}em` }}>
                <h3 className={styles.h2}>Quali storie vivrai?</h3>
                <h4 className={styles.h3}>01 — Ricevi una lettera reale</h4>
              </div>
              <p className={styles.body}>
                Non è un libro. Non è un gioco. È una storia che arriva a casa
                tua, si sviluppa con te, lettera dopo lettera.
              </p>
              <div className={styles.row} style={{ ...c.style, fontSize: `${c.scale}em` }}>
                <span className={styles.cta}>Partecipa al primo test</span>
                <span className={styles.label}>Raccomandata</span>
                <span className={styles.labelBlue}>Espresso</span>
              </div>
              <div className={styles.dark} style={{ ...c.style, fontSize: `${c.scale}em` }}>
                <span className={styles.h2}>Someone has started writing to you.</span>
                <span className={styles.nums}>0123456789 · àèéìòù</span>
              </div>
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
