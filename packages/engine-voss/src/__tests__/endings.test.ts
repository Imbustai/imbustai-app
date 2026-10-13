import { describe, expect, it } from 'vitest';
import type { ReadLetter } from '../mechanics/signals';
import { verdict } from '../mechanics/december';
import { adelaide, misread, office, play, playThroughHooks, story, understood, voss, warm } from './script';

// Scripted 8-Turn Games, one per Ending (§6–§9 of "the eight Turns and the
// Endings"): reader outputs only, no model calls. Each reaches its Ending
// through the Engine's Hooks, as the platform plays it.

const quiet = (): ReadLetter[] => [voss()];

/** The archivist (§6): offices from Turn 1, few Letters to Voss, a Letter to the Procura in Turn 6 with P1, P3, P4. */
const archivist: ReadLetter[][] = [
  [
    office('stato_civile', { requestKeys: ['luca_name'] }),
    office('cancelleria', { requestKeys: ['trial_ref'] }),
    office('procura', { requestKeys: ['trial_ref', 'luca_name'] }),
  ],
  quiet(),
  [office('anagrafe', { requestKeys: ['victim_names'] }), voss()],
  quiet(),
  quiet(),
  [office('procura', { namesAldo: true, citesEvidence: ['P1', 'P3', 'P4'], linksToLuca: true })],
  quiet(),
  quiet(),
];

/** The friend (§6): writes mostly to Voss, about himself and 1977; in Turn 6 tells him the date. */
function friend(turn8: ReadLetter[] = [warm()]): ReadLetter[][] {
  const target = (toStep: 1 | 2, basis: string) => ({ ladder: 'target' as const, toStep, basis });
  return [
    [warm({ asksAbout1977: true })],
    [warm({ asksAboutCareer: true })],
    [warm(), adelaide({ deducesPanorama: true })],
    [warm({ doubtsLineups: true, ladderArguments: [target(1, "L'assassino conta chi ha mandato via Luca, non i testimoni.")] })],
    [warm({ ladderArguments: [target(1, 'Lattanzi non c\'entra: chi uccide conta chi ha mandato via Luca.')] })],
    [warm({ tellsTheDate: true, ladderArguments: [target(2, 'Il 17 dicembre è un giovedì ed è il giorno in cui morì Luca.')] })],
    [warm()],
    turn8,
  ];
}

/** The distracted player (§6): one Letter a Turn, following the sect, then Armando, then Lattanzi. */
function distracted(turn7: ReadLetter[] = quiet(), turn8: ReadLetter[] = [adelaide()]): ReadLetter[][] {
  return [
    [voss({ clues: [misread('K1', 'la setta')] })],
    quiet(),
    quiet(),
    quiet(),
    [voss({ clues: [misread('K5', 'Lattanzi')] })],
    quiet(),
    turn7,
    turn8,
  ];
}

describe('the six Endings, from scripted reader outputs', () => {
  it('Ending 1: Voss dies, the killer stays unknown', async () => {
    const { ending, endings } = await playThroughHooks(distracted());
    expect(endings.slice(0, 7)).toEqual([null, null, null, null, null, null, null]);
    expect(ending?.key).toBe('dead_unknown');
    expect(ending?.detail).toMatchObject({ number: 1, route: 'otherwise', arrest: null, verdict: null });
  });

  it('Ending 2: Voss dies, Aldo is named only in Turn 8 and flees', async () => {
    const { ending } = await playThroughHooks(distracted(quiet(), [office('procura', { namesAldo: true })]));
    expect(ending?.key).toBe('dead_fled');
    expect(ending?.detail).toMatchObject({ number: 2, aldoNamedInTurn: 8, verdict: null });
  });

  it('Ending 3: Voss dies, Aldo named in Turn 7 is stopped on the 18th; a name in the dark acquits him of the three', async () => {
    const { ending, state } = await playThroughHooks(distracted([office('procura', { namesAldo: true })]));
    expect(ending?.key).toBe('dead_caught');
    expect(state.december).toEqual({ route: 'otherwise', arrest: 'C', turn: 7 });
    const v = verdict(story, state);
    expect(v.score).toBe(2); // P12 + P7
    expect(v.guilty).toEqual([]);
    expect(v.voss).toBe('murder');
    expect(v.procedure).toBe('formal');
    expect(v.dates.verdict).toBe('1989-05-12');
  });

  it('Ending 3 with the paper: P1, P3 and the confession make the dispositivo tell the whole truth', async () => {
    const turns = distracted([office('procura', { namesAldo: true })]);
    turns[0] = [office('cancelleria', { requestKeys: ['trial_ref'] }), voss()];
    turns[2] = [office('anagrafe', { requestKeys: ['victim_names'] }), voss()];
    const { ending, state } = await playThroughHooks(turns);
    expect(ending?.key).toBe('dead_caught');
    const v = verdict(story, state);
    expect(v.evidence.map((e) => e.key)).toEqual(['P1', 'P3', 'P7', 'P11', 'P12']);
    expect(v.score).toBe(10);
    expect(v.guilty).toEqual(['cortesi', 'ferri', 'benvenuti']);
    expect(v.procedure).toBe('summary');
    expect(v.dates.verdict).toBe('1988-03-18');
  });

  it('Ending 4: the friend tells Voss the date; he sleeps at Mario\'s and Aldo leaves unnamed', async () => {
    const { ending, state } = await playThroughHooks(friend());
    expect(state.december?.route).toBe('voss_hides');
    expect(ending?.key).toBe('saved_unknown');
  });

  it('Ending 5: the same, and Turn 8 names Aldo to the Procura', async () => {
    const { ending } = await playThroughHooks(friend([warm(), office('procura', { namesAldo: true })]));
    expect(ending?.key).toBe('saved_fled');
  });

  it('Ending 6 (A): the archivist\'s Letter of Turn 6 brings the search of via Carini', async () => {
    const { ending, state } = await playThroughHooks(archivist);
    expect(state.december).toEqual({ route: 'search', arrest: 'A', turn: 6 });
    expect(ending?.key).toBe('saved_caught');
    const v = verdict(story, state);
    expect(v.score).toBeGreaterThanOrEqual(story.verdict.all);
    expect(v.guilty).toEqual(['cortesi', 'ferri', 'benvenuti']);
    expect(v.voss).toBeNull();
    expect(v.procedure).toBe('summary');
  });

  it('Ending 6 (B): a stakeout asked of the Mobile in Turn 7 catches Aldo on the stairs', async () => {
    const turn7 = [office('mobile', { statesDate: true, vossAsTarget: true, calendarReasoning: true })];
    const { ending, state } = await playThroughHooks(distracted(turn7, [voss()]));
    expect(state.december).toEqual({ route: 'stakeout', arrest: 'B', turn: 7 });
    expect(ending?.key).toBe('saved_caught');
    expect(verdict(story, state).voss).toBe('attempted');
  });

  it('Ending 6 (B): Voss, convinced it is Aldo, calls Palumbo on the 17th', async () => {
    const killer = (toStep: 1 | 2, basis: string) => ({ ladder: 'killer' as const, toStep, basis });
    const turns: ReadLetter[][] = [
      [office('cancelleria', { requestKeys: ['trial_ref'] }), voss()],
      [voss({ clues: understood('K1'), ladderArguments: [killer(1, 'Rosa non viveva sola: chi ha cresciuto Luca?')] })],
      quiet(),
      [voss({ ladderArguments: [killer(2, 'Nel certificato del 1977 c\'è un Ferrante Aldo, capotreno: è il tuo Aldo.')] })],
      quiet(),
      quiet(),
      quiet(),
      quiet(),
    ];
    const { ending, state } = await playThroughHooks(turns);
    expect(state.ladders.killer).toBe(2);
    expect(state.december).toEqual({ route: 'voss_knows', arrest: 'B', turn: 7 });
    expect(ending?.key).toBe('saved_caught');
  });
});

describe('what the Endings send in batches 7 and 8', () => {
  it('Endings 1–3: the clipping of Voss\'s death in batch 7, his last Letter accepting the invitation', () => {
    const { plans } = play(distracted([office('procura', { namesAldo: true })]).slice(0, 7));
    const b7 = plans[6];
    expect(b7.dispatches.map((d) => d.key)).toEqual(['clipping_voss_dead', 'clipping_termini']);
    expect(b7.voss).toMatchObject({ lastLetter: true, invitation: 'accepts', passages: ['voss_invitation'] });
  });

  it('Endings 4 and 5: nothing public in batch 7, so the Player writes Turn 8 not knowing', () => {
    const { plans } = play(friend());
    expect(plans[6].dispatches).toEqual([]);
    expect(plans[6].voss).toMatchObject({ lastLetter: false, invitation: 'hides' });
    expect(plans[7].voss?.fixedLetter).toEqual({ key: 'voss_after_unknown', variants: [] });
  });

  it('Ending 5 named only in Turn 8: Voss\'s Letter takes the name from Lombardo\'s', () => {
    const { plans } = play(friend([warm(), office('procura', { namesAldo: true })]));
    expect(plans[7].voss?.fixedLetter?.key).toBe('voss_after_fled');
    expect(plans[7].voss?.fixedLetter?.variants).toEqual(['Aldo è stato nominato solo nel Turno 8']);
  });

  it('Ending 6 (A): the Procura reports the search in batch 7 with the clipping; Voss\'s Letter after the 17th, unconfessed', () => {
    const { plans } = play(archivist);
    const b7 = plans[6];
    expect(b7.offices.find((o) => o.office === 'procura')).toMatchObject({ turn: 6, search: true });
    expect(b7.dispatches.map((d) => d.key)).toEqual(['clipping_search']);
    expect(b7.voss?.invitation).toBeNull();
    expect(plans[7].voss?.fixedLetter).toEqual({
      key: 'voss_after_caught',
      variants: ['Lo strato 4 non è mai arrivato', 'Finale 6 (A), perquisizione prima del 17'],
    });
    expect(plans[7].ending).toBe('saved_caught');
  });

  it('Ending 6 (B) stakeout: the clipping of the stairs in batch 7', () => {
    const turn7 = [office('mobile', { statesDate: true, vossAsTarget: true, calendarReasoning: true })];
    const { plans } = play(distracted(turn7, [voss()]));
    expect(plans[6].dispatches.map((d) => d.key)).toEqual(['clipping_stairs']);
    expect(plans[7].voss?.fixedLetter?.variants).toContain("L'appostamento l'ha chiesto il Giocatore (strada 2)");
  });

  it("Adelaide's farewell takes the Ending's variant; Ending 6 is the full text", () => {
    expect(play(distracted()).plans[7].adelaide?.fixedLetter).toEqual({
      key: 'adelaide_farewell',
      variants: ['Finale 1, Voss morto, ignoto'],
    });
    expect(play(archivist).plans[7].adelaide?.fixedLetter).toEqual({ key: 'adelaide_farewell', variants: [] });
  });

  it('Voss is no longer a contact once dead, and the Game is over after Turn 8', async () => {
    await expect(playThroughHooks(distracted(quiet(), [voss()]))).rejects.toThrow(/"voss" is not a contact/);
    const { final } = play(distracted());
    expect(final.ending).toBe('dead_unknown');
    expect(() => play([quiet()], final)).toThrow(/ended/);
  });
});
