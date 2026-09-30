import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createAiAccess, type UsageRecord } from '../ai/access';
import { DEFAULT_MODEL_PROFILE, mergeModelProfile } from '../ai/profile';
import { MockProvider, type StructuredRequest } from '../ai/provider';
import { checkLetter } from '../writing/checker';
import { composeLetter } from '../writing/compose';
import { editLetter } from '../writing/editor';
import { ledgerFor, ledgerFromReader, ledgerSchema, recordTexture, renderLedger, type Ledger } from '../writing/ledger';
import { readPlayerLetter, renderReaderNotes } from '../writing/reader';
import { findPlotKeyCollisions, reservedTermSchema, type ReservedTerm } from '../writing/plotKeys';

// Plot keys of the Voss story that a Character's Texture must not reuse by
// accident (the via Carini case in "One real Voss Turn, end to end",
// Imbustai/imbustai-app#25): Aldo lives in via Giacomo Carini.
const RESERVED: ReservedTerm[] = [
  { term: 'Carini', knownBy: [], note: "via Giacomo Carini, la strada di Aldo" },
  { term: 'Aldo', knownBy: ['voss'] },
  { term: 'La donna è mobile', knownBy: ['adelaide'] },
];

describe('findPlotKeyCollisions', () => {
  it('catches Texture that reuses a Plot-key street the Character cannot know', () => {
    const letter =
      'Di giorno sto bene: lo sportello, i portafogli, una signora di via Carini che da tre settimane viene a denunciare lo stesso cane.';
    const hits = findPlotKeyCollisions(letter, { character: 'voss', reserved: RESERVED });
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ term: 'Carini', note: 'via Giacomo Carini, la strada di Aldo' });
    expect(hits[0].quote).toContain('una signora di via Carini');
  });

  it('lets a Character use a term it knows, or one the Lead already wrote to it', () => {
    expect(findPlotKeyCollisions('Giovedì ho giocato con Aldo.', { character: 'voss', reserved: RESERVED })).toEqual([]);
    expect(
      findPlotKeyCollisions('Chi abita in via Carini, dici?', {
        character: 'voss',
        reserved: RESERVED,
        knownText: ['Florian, chi abita al 12 di via Carini?'],
      }),
    ).toEqual([]);
  });

  it('matches whole words regardless of case, accents and spacing, never inside another word', () => {
    const knows = { character: 'mobile', reserved: RESERVED };
    expect(findPlotKeyCollisions('gli Aldobrandini di Frascati', knows)).toEqual([]);
    expect(findPlotKeyCollisions("il bar d'Aldo", knows)).toHaveLength(1);
    expect(findPlotKeyCollisions('fischiava «la  donna e mobile» per le scale', knows)).toHaveLength(1);
  });

  it('is part of the Story document, validated with it', () => {
    expect(reservedTermSchema.parse({ term: 'Carini' })).toEqual({ term: 'Carini', knownBy: [] });
    expect(reservedTermSchema.safeParse({ term: '' }).success).toBe(false);
  });
});

// What the reader returned on the prototype Turn (out/1-reader.json), trimmed.
const READ = {
  questions: ["Com'era Luca quando l'avete preso?", 'E tu come stai?'],
  claimsAboutSelf: ['Ha una sorella a Cremona che gli scrive ogni settimana e gli chiede se mangia.'],
  actions: ["Ha scritto alla cancelleria della Corte d'Assise per avere gli atti del processo Moretti."],
  hypotheses: [
    {
      hypothesis: 'Un ex compagno di cella di Luca potrebbe vendicarlo.',
      reason: 'In due anni e mezzo di cella si parla.',
    },
    { hypothesis: 'Le morti dei testimoni non sono casuali.', reason: '' },
  ],
  requests: ['Se gli viene voglia di andare dalla maestra, scrivergli prima.'],
  answersToCharacterQuestions: ['Dalla finestra vede un pezzo di mare e il muro della chiesa.'],
  tone: 'Affettuoso ma asciutto.',
};

// Two of the Voss Engine's own reader fields (§11 of "The eight Turns and
// the Endings", Imbustai/imbustai-app#26).
const VOSS_SIGNALS = z.object({
  condivide: z.boolean().describe('Lombardo shares something personal of his own'),
  accusa: z.boolean().describe('Lombardo accuses Voss of hiding something'),
});

function aiWith(provider: MockProvider, usage: UsageRecord[] = []) {
  const profile = mergeModelProfile(DEFAULT_MODEL_PROFILE, {
    characters: { voss: { analyst: { model: 'claude-opus-5-5', effort: 'high' } } },
  });
  return createAiAccess({ profile, providerFor: () => provider, turn: 1, onUsage: (u) => usage.push(u) });
}

describe('readPlayerLetter', () => {
  it("extracts what the Character must answer, plus the Engine's own signals, on the Character's analyst", async () => {
    const provider = new MockProvider(() => ({ ...READ, signals: { condivide: true, accusa: false } }));
    const usage: UsageRecord[] = [];
    const notes = await readPlayerLetter(aiWith(provider, usage), {
      character: { slug: 'voss', name: 'Florian Voss' },
      lead: 'Giacomo Lombardo',
      previousLetter: 'Caro Giacomo, dalla finestra vedi il mare?',
      playerLetter: 'Florian, com’era Luca quando l’avete preso?',
      signals: VOSS_SIGNALS,
    });

    expect(notes.signals).toEqual({ condivide: true, accusa: false });
    expect(notes.hypotheses[1]).toEqual({ hypothesis: 'Le morti dei testimoni non sono casuali.', reason: '' });
    expect(usage).toMatchObject([{ role: 'analyst', purpose: 'reader', character: 'voss', model: 'claude-opus-5-5' }]);
    const sent = provider.requests[0] as StructuredRequest;
    expect(sent.user).toContain('dalla finestra vedi il mare?');
    expect(sent.user).toContain('com’era Luca');
    expect(JSON.stringify(sent.format.schema)).toContain('condivide');
  });

  it('works without Engine signals, and renders its notes for the writer and the checker', async () => {
    const notes = await readPlayerLetter(aiWith(new MockProvider(() => READ)), {
      character: { slug: 'mobile', name: 'Squadra Mobile' },
      lead: 'Giacomo Lombardo',
      playerLetter: 'Chiedo la tutela della signora Benvenuti.',
    });
    expect(notes).not.toHaveProperty('signals');

    const text = renderReaderNotes(notes);
    expect(text).toContain("1. Com'era Luca quando l'avete preso?");
    expect(text).toContain('Un ex compagno di cella di Luca potrebbe vendicarlo. (reason given: In due anni e mezzo di cella si parla.)');
    expect(text).toContain('Le morti dei testimoni non sono casuali. (no reason given)');
  });
});

const issue = (severity: 'must' | 'should', quote: string, rule = 'lead') => ({
  rule,
  severity,
  quote,
  problem: 'p',
  fix: 'f',
});

describe('checkLetter', () => {
  const input = {
    character: { slug: 'voss', name: 'Florian Voss', kind: 'person' as const },
    lead: 'Giacomo Lombardo',
    caseFile: 'CASE FILE: Aldo Ferrante, via Giacomo Carini 12.',
    storyRules: '9. pacing — Aldo appears only as a chess partner.',
    characterSheet: 'Voss sheet',
    turnState: 'Turn 1: layers 0 and 1.',
    playerLetter: 'Florian, come stai?',
    readerNotes: READ,
    letter: 'Caro Giacomo, una signora di via Carini viene per il cane. Hai ragione tu.',
    plotKeys: { reserved: RESERVED },
  };

  it('puts Plot-key collisions first as must, and only must points go to the rewrite', async () => {
    const provider = new MockProvider(() => ({
      issues: [issue('must', 'Hai ragione tu.', 'voice'), issue('should', 'sempre la stessa storia')],
      questionsAnswered: [{ question: 'E tu come stai?', answered: 'no', how: '' }],
    }));
    const usage: UsageRecord[] = [];
    const check = await checkLetter(aiWith(provider, usage), input);

    expect(check.issues.map((i) => [i.rule, i.severity])).toEqual([
      ['plot_key_collision', 'must'],
      ['voice', 'must'],
      ['lead', 'should'],
    ]);
    expect(check.issues[0].quote).toBe('Caro Giacomo, una signora di via Carini viene per il cane.');
    expect(check.mustFix).toHaveLength(2);
    expect(check.questionsAnswered).toEqual([{ question: 'E tu come stai?', answered: 'no', how: '' }]);
    expect(usage).toMatchObject([{ role: 'analyst', purpose: 'checker', character: 'voss', model: 'claude-opus-5-5' }]);
  });

  it('checks against the whole truth, cached, with the Story rules and the doors rule', async () => {
    const provider = new MockProvider(() => ({ issues: [], questionsAnswered: [] }));
    const check = await checkLetter(aiWith(provider), { ...input, letter: 'Caro Giacomo, sto bene.' });
    expect(check).toMatchObject({ issues: [], mustFix: [] });

    const sent = provider.requests[0];
    expect(sent.cachedPrefix).toContain('CASE FILE: Aldo Ferrante');
    expect(sent.cachedPrefix).toContain('Aldo appears only as a chess partner');
    expect(sent.cachedPrefix).toMatch(/name the office and the document, never the field/);
    expect(sent.user).toContain('Voss sheet');
    expect(sent.user).toContain("Com'era Luca quando l'avete preso?");
    expect(sent.user).toContain('Caro Giacomo, sto bene.');
  });

  it('drops a model point that repeats a collision already found', async () => {
    const provider = new MockProvider(() => ({
      issues: [issue('must', 'una signora di via Carini', 'collision'), issue('must', 'Hai ragione tu.', 'voice')],
      questionsAnswered: [],
    }));
    const check = await checkLetter(aiWith(provider), input);
    expect(check.issues.map((i) => i.rule)).toEqual(['plot_key_collision', 'voice']);
  });

  it('keeps the model to its 8 most important points', async () => {
    const many = Array.from({ length: 11 }, (_, n) => issue(n < 2 ? 'must' : 'should', `q${n}`));
    const check = await checkLetter(aiWith(new MockProvider(() => ({ issues: many, questionsAnswered: [] }))), {
      ...input,
      plotKeys: undefined,
    });
    expect(check.issues.map((i) => i.quote)).toEqual(['q0', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7']);
  });
});

describe('editLetter', () => {
  const voss = { slug: 'voss', name: 'Florian Voss', kind: 'person' as const };
  const letter = 'Mario me l’ha consegnata lui, e me l’ha data con una faccia solenne.';

  it("rereads an Italian Letter on the writer at low effort, with the method, the voice and the examples cached", async () => {
    const provider = new MockProvider(() => ({}), () => 'Me l’ha consegnata Mario, con una faccia solenne.\n');
    const usage: UsageRecord[] = [];
    const edited = await editLetter(aiWith(provider, usage), {
      character: voss,
      language: 'it',
      voice: 'Periodi lunghi, qualche costruzione tedesca.',
      examples: 'Caro Giacomo, (lettera approvata)',
      letter,
    });

    expect(edited).toBe('Me l’ha consegnata Mario, con una faccia solenne.');
    expect(usage).toMatchObject([{ role: 'writer', purpose: 'editor', character: 'voss', effort: 'low' }]);
    const sent = provider.textRequests[0];
    expect(sent.cachedPrefix).toContain('dal punto di vista di chi la riceve');
    expect(sent.cachedPrefix).toContain('Periodi lunghi, qualche costruzione tedesca.');
    expect(sent.cachedPrefix).toContain('Caro Giacomo, (lettera approvata)');
    expect(sent.user).toContain(letter);
  });

  it('edits an office on the clerk, keeping its bureaucratic formulas', async () => {
    const provider = new MockProvider(() => ({}), (r) => r.user.split('\n\n').at(-1)!);
    const usage: UsageRecord[] = [];
    await editLetter(aiWith(provider, usage), {
      character: { slug: 'mobile', name: 'Squadra Mobile', kind: 'office' },
      language: 'it',
      letter: 'Si comunica quanto segue.',
    });
    expect(usage).toMatchObject([{ role: 'clerk', purpose: 'editor', effort: 'low' }]);
    expect(provider.textRequests[0].cachedPrefix).toContain('le formule d’ufficio sono la sua voce');
  });

  it('leaves a Letter in a language it has no method for untouched, with no call', async () => {
    const provider = new MockProvider(() => ({}));
    expect(await editLetter(aiWith(provider), { character: voss, language: 'en', letter: 'Dear Giacomo,' })).toBe('Dear Giacomo,');
    expect(provider.textRequests).toHaveLength(0);
  });
});

describe('composeLetter', () => {
  const base = {
    character: { slug: 'voss', name: 'Florian Voss', kind: 'person' as const },
    lead: 'Giacomo Lombardo',
    language: 'it',
    writer: { cachedPrefix: 'VOSS VIEW', system: 'Scrivi le Lettere di Voss.', user: 'Scrivi la risposta di Voss.' },
    check: { caseFile: 'CASE FILE', characterSheet: 'Voss sheet', readerNotes: READ, plotKeys: { reserved: RESERVED } },
    edit: { voice: 'La voce di Voss.' },
  };

  /** Draft, rewrite and edit by what each call asks; the checker's report is scripted. */
  function scripted(report: object, texts: { draft: string; rewrite?: string }) {
    return new MockProvider(
      () => report,
      (r) => {
        if (r.system.startsWith('Rileggi')) return `EDITED ${r.user.split('\n\n').slice(1).join('\n\n')}`;
        return r.history?.length ? texts.rewrite! : texts.draft;
      },
    );
  }

  it('rewrites once for the must points, in the writer conversation, then edits the rewrite', async () => {
    const provider = scripted(
      { issues: [issue('should', 'Hai ragione.', 'voice')], questionsAnswered: [] },
      { draft: 'Caro Giacomo, una signora di via Carini. Hai ragione.', rewrite: 'Caro Giacomo, una signora di via Merulana. Hai ragione.' },
    );
    const usage: UsageRecord[] = [];
    const letter = await composeLetter(aiWith(provider, usage), base);

    expect(letter.draft).toBe('Caro Giacomo, una signora di via Carini. Hai ragione.');
    expect(letter.rewrite).toBe('Caro Giacomo, una signora di via Merulana. Hai ragione.');
    expect(letter.body).toBe('EDITED Caro Giacomo, una signora di via Merulana. Hai ragione.');
    expect(usage.map((u) => `${u.role}:${u.purpose}`)).toEqual([
      'writer:reply',
      'analyst:checker',
      'writer:rewrite',
      'writer:editor',
    ]);

    const rewrite = provider.textRequests[1];
    expect(rewrite.cachedPrefix).toBe('VOSS VIEW');
    expect(rewrite.history).toHaveLength(2);
    // Only the must point goes to the rewrite, not the should.
    expect(rewrite.user).toContain('Carini');
    expect(rewrite.user).not.toContain('Hai ragione.');
  });

  it('does not rewrite without a must point', async () => {
    const provider = scripted({ issues: [issue('should', 'x')], questionsAnswered: [] }, { draft: 'Caro Giacomo, sto bene.' });
    const letter = await composeLetter(aiWith(provider), base);
    expect(letter).toMatchObject({ draft: 'Caro Giacomo, sto bene.', body: 'EDITED Caro Giacomo, sto bene.' });
    expect(letter.rewrite).toBeUndefined();
    expect(provider.textRequests.filter((r) => r.history)).toHaveLength(0);
  });

  it('never rewrites twice: a collision the rewrite kept goes to the admin', async () => {
    const provider = scripted(
      { issues: [], questionsAnswered: [] },
      { draft: 'Una signora di via Carini.', rewrite: 'Una vecchia signora di via Carini.' },
    );
    const letter = await composeLetter(aiWith(provider), base);
    expect(provider.textRequests.filter((r) => r.history)).toHaveLength(1);
    expect(letter.adminNotes.join('\n')).toMatch(/voss: .*Carini.* still in the Letter after the rewrite/);
  });
});

describe('the Ledger', () => {
  const told: Ledger = [
    { turn: 1, teller: 'lombardo', audience: 'voss', fact: 'Ha una sorella a Cremona.' },
    { turn: 1, teller: 'voss', audience: 'lombardo', fact: 'Compra un Maigret ogni lunedì in piazza Rosolino Pilo.' },
    { turn: 2, teller: 'adelaide', audience: 'lombardo', fact: 'Tiene i gerani sul ballatoio.' },
    { turn: 2, teller: 'lombardo', audience: 'adelaide', fact: 'Soffre il mal di mare.' },
  ];

  it("records what the Lead says about himself, from the reader's notes, as told to that Character", () => {
    expect(ledgerFromReader(READ, { turn: 1, lead: 'lombardo', character: 'voss' })).toEqual([
      { turn: 1, teller: 'lombardo', audience: 'voss', fact: 'Ha una sorella a Cremona che gli scrive ogni settimana e gli chiede se mangia.' },
    ]);
  });

  it('shows each Character only what it told or was told', () => {
    expect(ledgerFor(told, 'voss').map((e) => e.fact)).toEqual([
      'Ha una sorella a Cremona.',
      'Compra un Maigret ogni lunedì in piazza Rosolino Pilo.',
    ]);
    const text = renderLedger(ledgerFor(told, 'adelaide'), { lombardo: 'Giacomo Lombardo', adelaide: 'Adelaide' });
    expect(text).toContain('Adelaide (Turn 2): Tiene i gerani sul ballatoio.');
    expect(text).toContain('Giacomo Lombardo (Turn 2): Soffre il mal di mare.');
    expect(text).not.toContain('Cremona');
  });

  it("reads the Character's new Texture from the Letter as sent, on its analyst, given what is already recorded", async () => {
    const provider = new MockProvider(() => ({ facts: ['Ha una sorella a Caldaro, Martha, con due bambini.'] }));
    const usage: UsageRecord[] = [];
    const entries = await recordTexture(aiWith(provider, usage), {
      turn: 1,
      character: { slug: 'voss', name: 'Florian Voss' },
      lead: 'lombardo',
      letter: 'Caro Giacomo, … ne ho una a Caldaro, Martha, con due bambini …',
      ledger: told,
    });
    expect(entries).toEqual([
      { turn: 1, teller: 'voss', audience: 'lombardo', fact: 'Ha una sorella a Caldaro, Martha, con due bambini.' },
    ]);
    expect(usage).toMatchObject([{ role: 'analyst', purpose: 'ledger', character: 'voss' }]);
    const sent = provider.requests[0];
    expect(sent.user).toContain('Compra un Maigret');
    expect(sent.user).not.toContain('gerani');
  });

  it('is plain JSON for the Engine state', () => {
    expect(ledgerSchema.parse(told)).toEqual(told);
    expect(ledgerSchema.safeParse([{ turn: 1, teller: 'voss', fact: 'x' }]).success).toBe(false);
  });
});
