import { describe, expect, it } from 'vitest';
import { officeAnswer, promptReplyDate } from '../mechanics/calendar';
import { routeOfficeLetter } from '../mechanics/offices';
import type { ReadLetter } from '../mechanics/signals';
import { adelaide, misread, office, play, story, understood, voss, warm } from './script';

const trustOver = (turns: ReadLetter[][]) => play(turns).states.map((s) => s.trust);
const six = (letters: () => ReadLetter[]) => Array.from({ length: 6 }, letters);

describe('the Turn calendar (§1)', () => {
  it("dates the Player's Letters of Turn N on D_N, every fourteen days from 14 September", () => {
    const { plans } = play(six(() => [voss()]));
    expect(plans.map((p) => p.submissionDate)).toEqual([
      '1987-09-14',
      '1987-09-28',
      '1987-10-12',
      '1987-10-26',
      '1987-11-09',
      '1987-11-23',
    ]);
  });

  it('dates a prompt reply D_N + 8–10 days', () => {
    expect(promptReplyDate(story, 1, 0)).toBe('1987-09-22');
    expect(promptReplyDate(story, 1, 0.5)).toBe('1987-09-23');
    expect(promptReplyDate(story, 1, 0.9999)).toBe('1987-09-24');
  });

  it('answers in batch N+1 after two weeks, N+2 after three or four, N for a forward, and drops what falls after the Game', () => {
    expect(officeAnswer(story, 1, 2)).toEqual({ date: '1987-10-05', batch: 2 });
    expect(officeAnswer(story, 1, 3).batch).toBe(3);
    expect(officeAnswer(story, 1, 4).batch).toBe(3);
    expect(officeAnswer(story, 6, 2).batch).toBe(7);
    expect(officeAnswer(story, 3, 0).batch).toBe(3);
    expect(officeAnswer(story, 7, 2).batch).toBeNull();
  });

  it('sends the clipping of the teacher with batch 3 and Lattanzi\'s with batch 5', () => {
    const { plans } = play(six(() => [voss()]));
    expect(plans.map((p) => p.dispatches.map((d) => d.key))).toEqual([
      [],
      [],
      ['clipping_murder_3'],
      [],
      ['clipping_lattanzi'],
      [],
    ]);
  });
});

describe('office routing (§1.1, §5.2)', () => {
  it('sends only the documents whose request keys the Letter carries', () => {
    const [a] = routeOfficeLetter(story, 'stato_civile', 1, ['luca_name']);
    expect(a).toMatchObject({ kind: 'answer', batch: 2, partial: false });
    expect(a.documents).toEqual(['stato_civile_morte_luca', 'stato_civile_nascita_luca']);
  });

  it('never sends a document before it exists: the teacher\'s scene report only after 23 October', () => {
    const early = routeOfficeLetter(story, 'procura', 1, ['murders_1987'])[0];
    expect(early.documents).toEqual(['procura_sopralluogo_cortesi', 'procura_sopralluogo_ferri']);
    const late = routeOfficeLetter(story, 'procura', 3, ['murders_1987'])[0];
    expect(late.documents).toContain('procura_sopralluogo_benvenuti');
  });

  it('answers a vague request partially, asking for specifics', () => {
    expect(routeOfficeLetter(story, 'anagrafe', 1, [])).toEqual([
      expect.objectContaining({ office: 'anagrafe', kind: 'answer', partial: true, documents: [], batch: 3 }),
    ]);
  });

  it('forwards a request to the wrong office «per competenza» in the same batch; the right office answers on its own time', () => {
    const answers = routeOfficeLetter(story, 'stato_civile', 1, ['trial_ref']);
    expect(answers[0]).toMatchObject({ kind: 'forward', office: 'stato_civile', batch: 1, forwardedTo: ['cancelleria', 'procura', 'scientifica'] });
    expect(answers.slice(1).map((a) => [a.office, a.batch, a.forwardedFrom])).toEqual([
      ['cancelleria', 3, 'stato_civile'],
      ['procura', 2, 'stato_civile'],
      ['scientifica', 3, 'stato_civile'],
    ]);
  });

  it('the Garbatella forwards everything to the Mobile; the Mobile answers for itself', () => {
    expect(routeOfficeLetter(story, 'garbatella', 1, []).map((a) => [a.kind, a.office, a.batch])).toEqual([
      ['forward', 'garbatella', 1],
      ['answer', 'mobile', 2],
    ]);
    expect(routeOfficeLetter(story, 'mobile', 1, []).map((a) => [a.kind, a.office, a.batch])).toEqual([['answer', 'mobile', 2]]);
  });

  it('delivers the documents, their evidence and their clues when the answer arrives', () => {
    const { states, plans } = play([[office('cancelleria', { requestKeys: ['trial_ref'] })], [voss()], [voss()]]);
    expect(states[1].documents).toEqual([]);
    expect(plans[2].offices[0]).toMatchObject({ office: 'cancelleria', turn: 1 });
    expect(states[2].evidence).toEqual(['P3']);
    expect(states[2].clues.K12.deliveredIn).toBe(3);
  });
});

describe('the teacher in Turn 1 (§5)', () => {
  it('asked to warn her, Voss visits her in batch 1 and knows what she told him', () => {
    const { plans } = play([[voss({ asksToWarnBenvenuti: true })]]);
    expect(plans[0].voss?.passages).toEqual(['voss_visits_benvenuti']);
    expect(plans[0].voss?.unlocks).toContain('benvenuti_visit');
  });

  it('the Mobile answers coldly in batch 2; the Procura remembers her in its first answer after 22 October, and a search then needs one proof', () => {
    const { plans, states } = play([
      [office('mobile', { reportsBenvenuti: true }), office('procura', { reportsBenvenuti: true })],
      [voss()],
      [office('procura', { requestKeys: ['murders_1987'] })],
    ]);
    expect(plans[1].offices.find((o) => o.office === 'mobile')?.fixedLetter?.key).toBe('mobile_reply_benvenuti');
    expect(plans[1].offices.find((o) => o.office === 'procura')?.passages).toEqual([]);
    expect(states[2].benvenutiReported).toBe(true);
    // Turn 3's answer is written on 2 November, after the murder: batch 4.
    const after = play([[voss()]], states[2]).plans[0];
    expect(after.offices.find((o) => o.office === 'procura')?.passages).toEqual(['procura_remembers_benvenuti']);
  });
});

describe("Voss's trust (§4.1)", () => {
  it('follows the four typical courses of the table', () => {
    expect(trustOver(six(() => [warm()]))).toEqual([4, 6, 8, 10, 10, 10]);
    expect(trustOver(six(() => [voss({ shares: true })]))).toEqual([3, 4, 5, 6, 7, 8]);
    expect(trustOver(six(() => [voss()]))).toEqual([2, 2, 2, 2, 2, 2]);
    const accused = six(() => [voss({ shares: true })]);
    accused[1] = [voss({ shares: true, accuses: true })];
    expect(trustOver(accused)).toEqual([3, 1, 2, 3, 4, 5]);
  });

  it('an accusation makes the next Letter cold: no layer, no step, no Texture', () => {
    const { plans } = play([[voss({ asksAbout1977: true, accuses: true })]]);
    expect(plans[0].voss).toMatchObject({ cold: true, signatures: [], layer: { granted: null } });
  });

  it('after layer 4 an accusation costs nothing', () => {
    const { final } = play(warmToLayer4());
    const { states, plans } = play([[warm({ accuses: true })]], final);
    expect(states[0].trust).toBe(10);
    expect(plans[0].voss?.cold).toBe(false);
  });

  it('costs −1 from the second Turn in a row without a Letter to Voss', () => {
    expect(trustOver([[warm()], [], [], [], [voss()]])).toEqual([4, 4, 3, 2, 2]);
  });
});

/** Turns 1–5 of the friend: layers 1, 2, 3, 4 in batches 1, 2, 4, 5. */
function warmToLayer4(): ReadLetter[][] {
  return [
    [warm({ asksAbout1977: true })],
    [warm({ asksAboutCareer: true })],
    [warm()],
    [warm({ doubtsLineups: true })],
    [warm()],
  ];
}

describe("Voss's layers (§4.2)", () => {
  it('tells one layer per batch, once its gates are met: 1 on a 1977 question, 2 with trust and a career question, 3 after the murder, 4 at high trust after layer 3', () => {
    const { plans, final } = play(warmToLayer4());
    expect(plans.map((p) => p.voss?.layer.granted)).toEqual([1, 2, null, 3, 4]);
    expect(final.layers).toEqual({ '0': 0, '1': 1, '2': 2, '3': 4, '4': 5 });
    expect(final.ladders.luca).toBe(2);
    expect(final.clues.K12.deliveredIn).toBe(2);
  });

  it('layer 2 waits for trust 4 even when asked', () => {
    const { plans } = play([[voss({ asksAboutCareer: true })], [voss({ shares: true })], [voss({ shares: true })]]);
    expect(plans.map((p) => p.voss?.layer.granted)).toEqual([null, null, 2]);
  });

  it('with layer 4\'s door open but trust short, Voss circles layer 3', () => {
    const turns = warmToLayer4().map((t) => t.map((l) => (l.kind === 'voss' ? { ...l, signals: { ...l.signals, takesFearSeriously: false } } : l)));
    turns[4] = [voss()];
    const { plans } = play(turns);
    expect(plans[4].voss?.trust).toBe(6);
    expect(plans[4].voss?.layer).toMatchObject({ granted: null, circling: true });
  });
});

describe("Voss's ladders (§4.3)", () => {
  const arg = (ladder: 'target' | 'killer' | 'luca', toStep: 1 | 2, basis = 'Perché…') => ({ ladder, toStep, basis });

  it('a bare assertion moves nothing: Voss asks «perché?»', () => {
    const { plans, final } = play([[voss({ clues: understood('K1') })], [voss({ ladderArguments: [arg('killer', 1, '')] })]]);
    expect(final.ladders.killer).toBe(0);
    expect(plans[1].voss?.bare).toEqual(['killer']);
  });

  it('respects each step\'s first batch and facts: the killer climbs from batch 2, with K1 understood', () => {
    const early = play([[voss({ clues: understood('K1'), ladderArguments: [arg('killer', 1)] })]]);
    expect(early.final.ladders.killer).toBe(0);
    const withoutK1 = play([[voss()], [voss({ ladderArguments: [arg('killer', 1)] })]]);
    expect(withoutK1.final.ladders.killer).toBe(0);
    const ok = play([[voss()], [voss({ clues: understood('K1'), ladderArguments: [arg('killer', 1)] })]]);
    expect(ok.final.ladders.killer).toBe(1);
  });

  it('climbs one step per batch at most', () => {
    const { final } = play([[voss()], [voss({ clues: understood('K1'), ladderArguments: [arg('killer', 1), arg('killer', 2)] })]]);
    expect(final.ladders.killer).toBe(1);
  });

  it('the target ladder is dark until the teacher dies', () => {
    const { plans, final } = play([[voss()], [voss()], [voss({ ladderArguments: [arg('target', 1)] })], [voss({ ladderArguments: [arg('target', 1)] })]]);
    expect(plans[2].voss?.ladders.target).toEqual({ step: 0, lit: false });
    expect(final.ladders.target).toBe(1);
  });

  it("Lattanzi sends every ladder on step 1 back to 0 before Voss reads Turn 5; step 2 stays, and an argument climbs back at once", () => {
    const turns: ReadLetter[][] = [
      [office('cancelleria', { requestKeys: ['trial_ref'] }), voss()],
      [voss({ clues: understood('K1'), ladderArguments: [arg('killer', 1)] })],
      [voss({ ladderArguments: [arg('luca', 1)] })],
      [voss({ ladderArguments: [arg('killer', 2), arg('target', 1)] })],
    ];
    const before = play(turns).final;
    expect(before.ladders).toEqual({ target: 1, killer: 2, luca: 1 });
    const after = play([[voss({ ladderArguments: [arg('target', 1)] })]], before).final;
    expect(after.ladders).toEqual({ target: 1, killer: 2, luca: 0 });
  });

  it('the target reaches step 2 with the date argued, or once layer 4 is told', () => {
    const lit = [[voss()], [voss()], [voss()], [voss({ ladderArguments: [arg('target', 1)] })]];
    const noDate = play([...lit, [voss({ ladderArguments: [arg('target', 1)] })], [voss({ ladderArguments: [arg('target', 2)] })]]);
    expect(noDate.final.ladders.target).toBe(1);
    const date = play([...lit, [voss({ ladderArguments: [arg('target', 1)] })], [voss({ tellsTheDate: true, ladderArguments: [arg('target', 2)] })]]);
    expect(date.final.ladders.target).toBe(2);
    expect(date.final.vossKnowsDate).toBe(true);
  });
});

describe('doors (§4.4)', () => {
  it("when the Lead writes to no office, Voss points at the next door he hasn't opened, never at what is behind it", () => {
    const { plans } = play([
      [voss()],
      [voss(), office('cancelleria', { requestKeys: ['trial_ref'] })],
      [voss()],
      [voss()],
      [voss()],
    ]);
    expect(plans.map((p) => p.voss?.door?.office ?? null)).toEqual(['cancelleria', null, 'procura', 'procura', 'procura']);
  });
});

describe('clues and their re-approach (§3)', () => {
  it('gives one new Aldo clue per Voss Letter: K2 in b1 … K7 in b6', () => {
    const { plans } = play(six(() => [voss()]));
    expect(plans.map((p) => p.voss?.aldoClue?.key)).toEqual(['K2', 'K3', 'K4', 'K5', 'K6', 'K7']);
    expect(plans[1].voss?.aldoClue?.bridge).toMatch(/medico della mutua/);
  });

  it('an ignored or misread clue comes back from another side at most twice, in its windows; a misread one carries the wrong lead', () => {
    const { plans, final } = play([[voss({ clues: [misread('K1', 'la setta')] })], ...six(() => [voss()]).slice(0, 5)]);
    const k1 = plans.map((p) => p.voss?.reapproaches.find((r) => r.key === 'K1') ?? null);
    expect(k1.map((r) => (r ? r.how.slice(0, 20) : null))).toEqual([null, 'Voss: Rosa che grida', null, 'Il registro dei coll', null, null]);
    expect(k1[1]?.wrongLead).toBe('la setta');
    expect(final.clues.K1.reapproaches).toBe(2);
  });

  it('an understood clue stops coming back and stays understood', () => {
    const { plans, final } = play([[voss({ clues: understood('K1') })], [voss()], [voss()], [voss()]]);
    expect(plans.flatMap((p) => p.voss?.reapproaches ?? []).filter((r) => r.key === 'K1')).toEqual([]);
    expect(final.clues.K1.status).toBe('understood');
  });

  it('ignores the reader on clues the Player has not received yet', () => {
    const { final } = play([[voss({ clues: understood('K6') })]]);
    expect(final.clues.K6.status).toBe('unseen');
  });
});

describe("Adelaide and the Panorama (§3.4)", () => {
  it('writes from batch 2, her first Letter fixed; is a contact from Turn 3; Panorama clues by their latest batch', () => {
    const { plans } = play(six(() => [voss()]));
    expect(plans[0].adelaide).toBeNull();
    expect(plans[1].adelaide).toMatchObject({ fixedLetter: { key: 'adelaide_first_letter' }, panoramaClues: ['I1', 'I2'] });
    expect(plans[1].adelaide?.newClues).toEqual(['K8', 'K9']);
    expect(plans[2].adelaide?.panoramaClues).toEqual(['I3', 'I4']);
    expect(plans[2].adelaide?.newClues).toEqual(['K10']);
  });

  it('deduced in Turn N ≤ 6, the reveal comes in batch N; otherwise in batch 6, «l\'ho visto io»', () => {
    const deduced = play([[voss()], [voss()], [adelaide({ deducesPanorama: true })]]);
    expect(deduced.plans[2].adelaide?.reveal).toEqual({ variant: 'deduced' });
    expect(deduced.final.clues.K11.deliveredIn).toBe(3);
    const seen = play(six(() => [voss()]));
    expect(seen.plans[5].adelaide).toMatchObject({ reveal: { variant: 'seen' }, fixedLetter: { key: 'adelaide_reveal' } });
    expect(seen.plans[5].adelaide?.signatures.find((x) => x.key === 'ernesto')?.showpiece).toBe(true);
  });

  it('accusing one tenant is not a deduction: the accused slips in the next batch', () => {
    const { plans, final } = play([[voss()], [voss()], [adelaide({ accusesOneTenant: true })], [voss()]]);
    expect(final.panorama.deducedInTurn).toBeNull();
    expect(plans[3].adelaide?.accusedTenantSlips).toBe(true);
  });
});

describe('Signatures', () => {
  it("Voss's wine at most every other Letter; the back's showpiece once, in batch 2", () => {
    const { plans } = play(six(() => [voss()]));
    const wine = plans.map((p) => p.voss?.signatures.find((s) => s.key === 'wine')?.ordinary);
    expect(wine).toEqual([true, false, true, false, true, false]);
    const back = plans.map((p) => p.voss?.signatures.find((s) => s.key === 'back')?.showpiece);
    expect(back).toEqual([false, true, false, false, false, false]);
    expect(plans[0].voss?.exclusive).toEqual([['wine', 'back']]);
  });
});

describe('the evidence', () => {
  it('P8 counts once the cancellations are told to an authority with the pattern understood; P9 once the two halves are joined', () => {
    const turns: ReadLetter[][] = [
      ...six(() => [voss()]).slice(0, 5),
      [voss({ clues: understood('K3', 'K4') }), office('procura', { reportsCancellations: true, joinsAriaAndRigoletto: true })],
    ];
    expect(play(turns).final.evidence).toEqual(['P8', 'P9']);
  });

  it('the search needs two proofs already held, and Aldo named', () => {
    const turns: ReadLetter[][] = [
      [office('cancelleria', { requestKeys: ['trial_ref'] })],
      [voss()],
      [voss()],
      [office('procura', { namesAldo: true, citesEvidence: ['P3', 'P1'] })],
    ];
    expect(play(turns).final.december).toBeNull();
  });
});
