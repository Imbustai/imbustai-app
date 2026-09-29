// PROTOTYPE — throwaway. Walks the fake Engine from start to Epilogue through
// the prototype host, to show the Engine contract end to end (#20).

import { describe, expect, it } from 'vitest';
import { fakeEngine } from '../prototype-engine-contract/fakeEngine';
import { PrototypeHost, type FakeAnswer } from '../prototype-engine-contract/prototypeHost';

const story = {
  characters: [
    { slug: 'voss', name: 'Ispettore Voss', address: 'Via Tiburtina 12, Roma' },
    { slug: 'adelaide', name: 'Adelaide Bellucci', address: 'Via Lanciani 42, Roma' },
  ],
  archive: { slug: 'archivio', name: 'Archivio di Stato', address: 'Corso Rinascimento 40, Roma' },
  culprit: 'Aldo',
  turns: 3,
  startDate: '1987-03-02',
  opening: 'Caro Lombardo, ho bisogno di lei.',
};

const answer: FakeAnswer = (role, purpose, { system }) => {
  if (purpose === 'ledger') return { texture: [`turn texture (${role})`] };
  if (purpose === 'epilogue:pm') return 'Signor Commissario, la Corte ha deciso.';
  const who = purpose.replace('reply:', '');
  const tone = system.includes('Guidance:') ? 'più caldo' : 'freddo';
  return { body: `Risposta di ${who}, tono ${tone}.`, texture: ['vino di Termeno'] };
};

describe('Engine contract prototype', () => {
  it('plays a testing Game from the opening envelope to the tribunal Epilogue', async () => {
    const host = new PrototypeHost(fakeEngine, answer);
    const game = await host.start('game-1', story, 'testing');

    // startGame: the opening envelope is delivered unreviewed; archive not yet a Contact.
    expect(game.history).toEqual([expect.objectContaining({ direction: 'in', key: 'opening' })]);
    expect(host.contacts(game).map((c) => c.slug)).toEqual(['voss', 'adelaide']);

    // validateSubmission rejects a Letter to a non-Contact and a fourth Letter.
    const rejected = await host.submit(game, [
      { to: 'archivio', body: 'x' },
      { to: 'voss', body: 'a' },
      { to: 'voss', body: 'b' },
      { to: 'adelaide', body: 'c' },
    ]);
    expect(rejected.map((f) => f.rule).sort()).toEqual(['not_a_contact', 'too_many']);
    expect(game.status).toBe('awaiting_player');

    // Turn 1: two Letters, one asking for the archive.
    await host.submit(game, [
      { to: 'voss', body: 'Scriverò all’archivio per il fascicolo del processo.' },
      { to: 'adelaide', body: 'Mi racconti del portiere.' },
    ]);
    expect(game.status).toBe('turn_draft');
    expect(game.draft!.letters.map((l) => [l.key, l.kind])).toEqual([
      ['reply:voss', 'letter'],
      ['reply:adelaide', 'letter'],
      ['dispatch:archive', 'dispatch'],
    ]);

    // Regenerate one Letter with guidance: only that Letter changes.
    const adelaideBefore = game.draft!.letters[1];
    await host.regenerate(game, 'reply:voss', 'Più caldo, parla del vino.');
    expect(game.draft!.letters[0].body).toContain('più caldo');
    expect(game.draft!.letters[1]).toEqual(adelaideBefore);

    // An admin edit that echoes the Player is caught by validateDraft.
    await host.edit(game, 'reply:adelaide', 'Mi racconti del portiere, dice lei? Il portiere…');
    expect(game.findings).toEqual([expect.objectContaining({ rule: 'no_echo', letterKey: 'reply:adelaide' })]);
    await host.edit(game, 'reply:adelaide', 'Armando? Un sant’uomo, quasi.');
    expect(game.findings).toEqual([]);

    await host.approve(game);
    expect(game.status).toBe('awaiting_player');
    expect(game.turn).toBe(2);
    expect(game.state.archiveUnlocked).toBe(true);
    expect(game.state.ledger).toEqual(['turn texture (analyst)']);
    // The Player's Letters enter history dated by the Engine's clock.
    expect(game.history.filter((l) => l.direction === 'out').map((l) => l.storyDate)).toEqual(['1987-03-02', '1987-03-02']);
    expect(host.contacts(game).map((c) => c.slug)).toContain('archivio');

    // Turn 2: the archive answers with an Enclosure, written by the clerk.
    await host.submit(game, [{ to: 'archivio', body: 'Richiedo il certificato di famiglia di Luca M.' }]);
    expect(game.draft!.letters[0].enclosures).toEqual([
      expect.objectContaining({ key: 'certificate', kind: 'document', body: 'Patrigno: Aldo' }),
    ]);
    await host.approve(game);

    // Turn 3 (last): the Player names the culprit → resolveEnding → closing batch.
    await host.submit(game, [{ to: 'voss', body: 'Il colpevole è Aldo, il suo compagno di scacchi.' }]);
    await host.approve(game);
    expect(game.ending).toEqual({ key: 'caught', detail: { score: 1 } });
    expect(game.status).toBe('epilogue_draft');
    expect(game.draft!.submissionDate).toBeUndefined();
    expect(game.draft!.letters).toEqual([
      expect.objectContaining({
        kind: 'epilogue',
        from: 'pm',
        enclosures: [expect.objectContaining({ key: 'dispositivo', body: 'Aldo: colpevole.' })],
      }),
    ]);

    // The closing batch is reviewed like any draft; approving it completes the Game.
    await host.approve(game);
    expect(game.status).toBe('completed');
    expect(game.history.at(-1)).toEqual(expect.objectContaining({ kind: 'epilogue' }));
    await expect(host.submit(game, [{ to: 'voss', body: 'Ancora?' }])).rejects.toThrow('completed');

    // Every model call was metered by role, purpose and Turn.
    expect(game.usage.map((u) => `${u.turn}:${u.role}:${u.purpose}`)).toEqual([
      '1:writer:reply:voss',
      '1:writer:reply:adelaide',
      '1:writer:reply:voss',
      '1:analyst:ledger',
      '2:clerk:reply:archivio',
      '2:analyst:ledger',
      '3:writer:reply:voss',
      '3:analyst:ledger',
      '3:writer:epilogue:pm',
    ]);
  });

  it('auto-sends a released Game straight through to completion when drafts are clean', async () => {
    const host = new PrototypeHost(fakeEngine, answer);
    const game = await host.start('game-2', story, 'released');
    for (let turn = 1; turn <= 3; turn++) {
      await host.submit(game, [{ to: 'adelaide', body: `Lettera numero ${turn}.` }]);
    }
    expect(game.ending!.key).toBe('escaped');
    expect(game.status).toBe('completed');
    expect(game.history.at(-1)).toEqual(expect.objectContaining({ kind: 'dispatch', from: 'il-messaggero' }));
  });

  it('rejects a Story document that does not fit the Engine schema', async () => {
    const host = new PrototypeHost(fakeEngine, answer);
    await expect(host.start('game-3', { ...story, turns: 0 }, 'testing')).rejects.toThrow();
  });
});
