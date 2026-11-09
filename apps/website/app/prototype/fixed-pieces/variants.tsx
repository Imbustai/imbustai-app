'use client';

// PROTOTYPE — throwaway (#43). Four renderings of the same Game: the rules
// card, the opening envelope with the transfer order, two clippings, Adelaide's
// calendar and the PM's letter with the dispositivo. Fonts are browser stacks
// (serif, typewriter); a real build would need DS font tokens (Regola #7).

import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Badge, Button, Card, CardContent, Inline, Stack, Typography, Box } from '@imbustai/ds';
import styles from './fixed-pieces.module.css';

export interface ProtoEnclosure {
  key: string;
  kind: 'document' | 'clipping';
  title: string;
  body: string;
}

export interface ProtoLetter {
  id: string;
  mine: boolean;
  kind: 'letter' | 'dispatch' | 'epilogue';
  from: string;
  fromName: string;
  fromKind: string;
  storyDate: string;
  body: string;
  enclosures: ProtoEnclosure[];
  opening?: boolean;
}

export interface ProtoData {
  leadName: string;
  rulesCard: string;
  transferOrder: { title: string; body: string };
  contacts: { slug: string; name: string; role: string }[];
  letters: ProtoLetter[];
}

// ─── Shared bits ────────────────────────────────────────────────────────────

function date(iso: string, weekday = false) {
  if (!iso) return '';
  return new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', {
    weekday: weekday ? 'long' : undefined,
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

/** A typed document: every line kept, spacing kept, `---` a rule. */
function Typed({ body, className }: { body: string; className?: string }) {
  return (
    <div className={className ?? styles.typed}>
      {body.split('\n').map((line, i) =>
        line.trim() === '---' ? <hr key={i} className={styles.typedRule} /> : <div key={i}>{line ? inline(line) : ' '}</div>,
      )}
    </div>
  );
}

/** A clipping: the leading **bold** lines are headline and deck. */
function splitClipping(body: string) {
  const lines = body.split('\n');
  const heads: string[] = [];
  while (lines.length && /^\*\*.+\*\*$/.test(lines[0].trim())) heads.push(lines.shift()!.trim().slice(2, -2));
  return { headline: heads[0] ?? '', deck: heads.slice(1), text: lines.join('\n').trim() };
}

function Clipping({ letter, compact }: { letter: ProtoLetter; compact?: boolean }) {
  const { headline, deck, text } = splitClipping(letter.body);
  return (
    <figure className={compact ? styles.clippingCompact : styles.clipping}>
      <div className={styles.masthead}>
        <span>{letter.fromName}</span>
        <span>{date(letter.storyDate, true)}</span>
      </div>
      <h3 className={styles.headline}>{headline}</h3>
      {deck.map((d) => (
        <p key={d} className={styles.deck}>
          {d}
        </p>
      ))}
      <p className={styles.newsText}>{text}</p>
    </figure>
  );
}

function RulesProse({ body }: { body: string }) {
  return (
    <div className={styles.rules}>
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}

function LetterProse({ body }: { body: string }) {
  return (
    <div className={styles.letterProse}>
      <ReactMarkdown>{body}</ReactMarkdown>
    </div>
  );
}

function PaperDoc({ title, body, label }: { title?: string; body: string; label?: string }) {
  return (
    <div className={styles.paper}>
      {label ? <div className={styles.paperLabel}>{label}</div> : null}
      {title ? <div className={styles.srOnly}>{title}</div> : null}
      <Typed body={body} />
    </div>
  );
}

function PageHeader({ right }: { right?: ReactNode }) {
  return (
    <Inline gap="3" justify="space-between">
      <Stack gap="1">
        <Typography variant="h2">Il quarto nome</Typography>
        <Typography variant="caption" tone="muted">
          📅 12 settembre 1987
        </Typography>
      </Stack>
      {right}
    </Inline>
  );
}

function Contacts({ data }: { data: ProtoData }) {
  return (
    <Box as="aside">
      <Typography variant="caption" tone="muted" as="h2">
        Contatti
      </Typography>
      <Box marginTop="3">
        <Stack gap="2">
          {data.contacts.map((c) => (
            <div key={c.slug} className={styles.contact}>
              <Typography variant="body" as="span">
                {c.name}
              </Typography>
              <Typography variant="caption" tone="muted" as="span">
                {c.role}
              </Typography>
            </div>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

function Notes({ children }: { children: ReactNode }) {
  return <div className={styles.protoNote}>{children}</div>;
}

// ─── Today: the platform as it renders now ──────────────────────────────────

function Today({ data }: { data: ProtoData }) {
  return (
    <Stack gap="6">
      <Notes>
        Com&apos;è oggi in <code>play-client.tsx</code>: la carta delle regole e il decreto non arrivano al Giocatore
        (startGame manda solo la Lettera di Voss); il markdown unisce le righe a capo singolo, quindi il dispositivo e
        il calendario diventano un paragrafo unico.
      </Notes>
      <PageHeader />
      <div className={styles.layout}>
        <Contacts data={data} />
        <Stack gap="4">
          {[...data.letters].reverse().map((l) => (
            <div key={l.id} className={l.mine ? styles.todayMine : styles.todayNpc}>
              <Inline gap="2" justify="space-between">
                <Typography variant="caption" tone="muted">
                  {l.mine ? `Tu → ${l.fromName}` : l.fromName}
                  {l.kind === 'epilogue' ? ' · Epilogo' : ''}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {date(l.storyDate)}
                </Typography>
              </Inline>
              <Box marginTop="2">
                <LetterProse body={l.body} />
              </Box>
              {l.enclosures.map((e) => (
                <div key={e.key} className={styles.todayEnclosure}>
                  <Typography variant="caption" tone="muted">
                    📎 Allegato: {e.title}
                  </Typography>
                  <LetterProse body={e.body} />
                </div>
              ))}
            </div>
          ))}
        </Stack>
      </div>
    </Stack>
  );
}

// ─── A: Carta in linea ──────────────────────────────────────────────────────
// One timeline; every piece looks like the paper it is, in place.

function VariantA({ data }: { data: ProtoData }) {
  const [rulesOpen, setRulesOpen] = useState(true);
  return (
    <Stack gap="6">
      <Notes>
        <b>A — Carta in linea.</b> Una sola colonna di posta. La carta delle regole sta in cima, fuori dalla finzione
        (stile dell&apos;app, non carta), richiudibile. Ogni consegna è un oggetto: la busta iniziale contiene il decreto
        dattiloscritto e la Lettera; i ritagli sono ritagli di giornale nel flusso; gli allegati stanno sotto la
        Lettera come fogli spillati.
      </Notes>
      <PageHeader
        right={
          rulesOpen ? null : (
            <Button size="sm" variant="outline" onClick={() => setRulesOpen(true)}>
              Le regole
            </Button>
          )
        }
      />
      {rulesOpen ? (
        <Card>
          <CardContent>
            <RulesProse body={data.rulesCard} />
            <Box marginTop="4">
              <Button size="sm" onClick={() => setRulesOpen(false)}>
                Ho capito, apri la busta
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : null}
      <div className={styles.layout}>
        <Contacts data={data} />
        <Stack gap="8">
          {[...data.letters].reverse().map((l) => {
            if (l.kind === 'dispatch') {
              return (
                <div key={l.id} className={styles.aClipRow}>
                  <Clipping letter={l} />
                </div>
              );
            }
            if (l.mine) {
              return (
                <div key={l.id} className={styles.todayMine}>
                  <Typography variant="caption" tone="muted">
                    Tu → {l.fromName} · {date(l.storyDate)}
                  </Typography>
                  <div className={styles.letterContent}>{l.body}</div>
                </div>
              );
            }
            return (
              <section key={l.id} className={styles.aDelivery}>
                <div className={styles.envelopeLine}>
                  ✉ {l.opening ? 'La busta iniziale' : l.kind === 'epilogue' ? 'Epilogo' : 'Lettera'} · da{' '}
                  {l.fromName} · {date(l.storyDate)}
                </div>
                {l.opening ? <PaperDoc body={data.transferOrder.body} label={data.transferOrder.title} /> : null}
                <div className={styles.letterSheet}>
                                    <LetterProse body={l.body} />
                </div>
                {l.enclosures.map((e) => (
                  <PaperDoc key={e.key} body={e.body} label={`Allegato · ${e.title}`} />
                ))}
              </section>
            );
          })}
        </Stack>
      </div>
    </Stack>
  );
}

// ─── B: La busta e il lettore ───────────────────────────────────────────────
// A first-visit ritual, then an inbox of envelopes and a reader with tabs.

function VariantB({ data }: { data: ProtoData }) {
  const [step, setStep] = useState<'rules' | 'envelope' | 'inbox'>('rules');
  const [openId, setOpenId] = useState<string>('opening');
  const [tab, setTab] = useState<string>('letter');
  const npc = [...data.letters].reverse();
  const open = data.letters.find((l) => l.id === openId)!;
  const tabs: { key: string; label: string }[] = [
    { key: 'letter', label: open.kind === 'dispatch' ? 'Ritaglio' : 'Lettera' },
    ...(open.opening ? [{ key: 'transfer', label: data.transferOrder.title }] : []),
    ...open.enclosures.map((e) => ({ key: e.key, label: `📎 ${e.title}` })),
  ];
  const current = tabs.find((t) => t.key === tab) ? tab : 'letter';

  if (step === 'rules') {
    return (
      <div className={styles.overlay}>
        <Notes>
          <b>B — La busta e il lettore.</b> Alla prima apertura: prima la carta delle regole a tutto schermo, poi la
          busta, poi la posta. Dopo, la posta è un elenco di buste e un lettore a schede (Lettera · Allegato).
        </Notes>
        <div className={styles.rulesSheet}>
          <RulesProse body={data.rulesCard} />
          <Box marginTop="6">
            <Button onClick={() => setStep('envelope')}>Apri la busta</Button>
          </Box>
        </div>
      </div>
    );
  }

  if (step === 'envelope') {
    return (
      <div className={styles.overlay}>
        <div className={styles.envelopeOpen}>
          <Typography variant="caption" tone="muted">
            Lipari, sabato 12 settembre 1987. Nella busta ci sono due fogli.
          </Typography>
          <div className={styles.sheetStack}>
            <button type="button" className={styles.sheetPick} onClick={() => { setOpenId('opening'); setTab('transfer'); setStep('inbox'); }}>
              <span className={styles.sheetPickTitle}>{data.transferOrder.title}</span>
              <span className={styles.sheetPickSub}>Ministero dell&apos;Interno · 25 maggio 1987</span>
            </button>
            <button type="button" className={styles.sheetPick} onClick={() => { setOpenId('opening'); setTab('letter'); setStep('inbox'); }}>
              <span className={styles.sheetPickTitle}>Una lettera da Roma</span>
              <span className={styles.sheetPickSub}>Florian Voss · 5 settembre 1987</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Stack gap="6">
      <PageHeader
        right={
          <Button size="sm" variant="outline" onClick={() => setStep('rules')}>
            Rivedi le regole
          </Button>
        }
      />
      <div className={styles.bLayout}>
        <Stack gap="2">
          <Typography variant="caption" tone="muted" as="h2">
            Posta
          </Typography>
          {npc.map((l) => (
            <button
              key={l.id}
              type="button"
              className={l.id === openId ? styles.bRowActive : styles.bRow}
              onClick={() => {
                setOpenId(l.id);
                setTab('letter');
              }}
            >
              <span className={styles.bRowFrom}>
                {l.mine ? `Tu → ${l.fromName}` : l.fromName}
              </span>
              <span className={styles.bRowMeta}>
                {date(l.storyDate)}
                {l.kind === 'dispatch' ? ' · ritaglio' : ''}
                {l.kind === 'epilogue' ? ' · epilogo' : ''}
                {l.opening ? ' · con il decreto' : ''}
                {l.enclosures.length ? ` · 📎 ${l.enclosures.length}` : ''}
              </span>
            </button>
          ))}
        </Stack>
        <div>
          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={t.key === current ? styles.tabActive : styles.tab}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className={styles.reader}>
            {current === 'transfer' ? (
              <PaperDoc body={data.transferOrder.body} />
            ) : current !== 'letter' ? (
              <PaperDoc body={open.enclosures.find((e) => e.key === current)!.body} />
            ) : open.kind === 'dispatch' ? (
              <Clipping letter={open} />
            ) : open.mine ? (
              <div className={styles.letterContent}>{open.body}</div>
            ) : (
              <div className={styles.letterSheet}>
                                <LetterProse body={open.body} />
              </div>
            )}
          </div>
        </div>
      </div>
    </Stack>
  );
}

// ─── C: Il fascicolo ────────────────────────────────────────────────────────
// Letters on the left; every paper that isn't a Letter is filed on the right.

interface Filed {
  id: string;
  kind: 'decreto' | 'ritaglio' | 'allegato';
  title: string;
  sub: string;
  render: () => ReactNode;
}

function VariantC({ data }: { data: ProtoData }) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [openFiled, setOpenFiled] = useState<string | null>('decreto');

  const filed: Filed[] = [
    {
      id: 'decreto',
      kind: 'decreto',
      title: data.transferOrder.title,
      sub: 'nella busta iniziale',
      render: () => <PaperDoc body={data.transferOrder.body} />,
    },
  ];
  for (const l of data.letters) {
    if (l.kind === 'dispatch') {
      filed.push({
        id: l.id,
        kind: 'ritaglio',
        title: splitClipping(l.body).headline,
        sub: `${l.fromName} · ${date(l.storyDate)}`,
        render: () => <Clipping letter={l} compact />,
      });
    }
    for (const e of l.enclosures) {
      filed.push({
        id: `${l.id}:${e.key}`,
        kind: 'allegato',
        title: e.title,
        sub: `allegato alla Lettera di ${l.fromName} · ${date(l.storyDate)}`,
        render: () => <PaperDoc body={e.body} />,
      });
    }
  }

  return (
    <Stack gap="6">
      <Notes>
        <b>C — Il fascicolo.</b> Le Lettere a sinistra; tutto ciò che non è una Lettera (decreto, ritagli, allegati)
        finisce nel fascicolo a destra, in ordine di arrivo, e si apre lì. Le regole sono un pannello che si apre dal
        pulsante, e alla prima visita una striscia in cima.
      </Notes>
      <PageHeader
        right={
          <Button size="sm" variant="outline" onClick={() => setRulesOpen((o) => !o)}>
            {rulesOpen ? 'Chiudi le regole' : 'Come si gioca'}
          </Button>
        }
      />
      {!rulesOpen ? (
        <div className={styles.cStrip}>
          Prima volta? Leggi <button type="button" className={styles.linkButton} onClick={() => setRulesOpen(true)}>come si gioca</button>: 8 turni, fino a 3 lettere per turno, gli uffici rispondono in 2–3 turni.
        </div>
      ) : (
        <aside className={styles.cRulesPanel}>
          <RulesProse body={data.rulesCard} />
        </aside>
      )}
      <div className={styles.cLayout}>
        <Stack gap="4">
          <Typography variant="caption" tone="muted" as="h2">
            Corrispondenza
          </Typography>
          {[...data.letters]
            .filter((l) => l.kind !== 'dispatch')
            .reverse()
            .map((l) => (
              <div key={l.id} className={l.mine ? styles.todayMine : styles.todayNpc}>
                <Inline gap="2" justify="space-between">
                  <Typography variant="caption" tone="muted">
                    {l.mine ? `Tu → ${l.fromName}` : l.fromName}
                    {l.kind === 'epilogue' ? ' · Epilogo' : ''}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {date(l.storyDate)}
                  </Typography>
                </Inline>
                <Box marginTop="2">
                  {l.mine ? <div className={styles.letterContent}>{l.body}</div> : <LetterProse body={l.body} />}
                </Box>
                {(l.opening ? [{ id: 'decreto', title: data.transferOrder.title }] : [])
                  .concat(l.enclosures.map((e) => ({ id: `${l.id}:${e.key}`, title: e.title })))
                  .map((f) => (
                    <button key={f.id} type="button" className={styles.cRef} onClick={() => setOpenFiled(f.id)}>
                      📎 {f.title} → nel fascicolo
                    </button>
                  ))}
              </div>
            ))}
        </Stack>
        <aside className={styles.cFile}>
          <div className={styles.cFileTab}>FASCICOLO — comm. {data.leadName}</div>
          <Stack gap="3">
            {[...filed].reverse().map((f) => (
              <div key={f.id}>
                <button
                  type="button"
                  className={openFiled === f.id ? styles.cCardActive : styles.cCard}
                  onClick={() => setOpenFiled(openFiled === f.id ? null : f.id)}
                >
                  <Badge variant="secondary">{f.kind}</Badge>
                  <span className={styles.cCardTitle}>{f.title}</span>
                  <span className={styles.cCardSub}>{f.sub}</span>
                </button>
                {openFiled === f.id ? <Box marginTop="2">{f.render()}</Box> : null}
              </div>
            ))}
          </Stack>
        </aside>
      </div>
    </Stack>
  );
}

export function FixedPiecesPrototype({ variant, data }: { variant: string; data: ProtoData }) {
  if (variant === 'A') return <VariantA data={data} />;
  if (variant === 'B') return <VariantB data={data} />;
  if (variant === 'C') return <VariantC data={data} />;
  return <Today data={data} />;
}

