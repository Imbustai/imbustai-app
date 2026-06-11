import { describe, expect, it } from 'vitest';
import {
  buildNpcContext,
  buildOrchestratorContext,
  correspondenceFor,
  factsForCharacter,
  gmOnlyFacts,
} from '../context/scopedContext';
import type { LetterRecord, RuntimeState } from '../types';
import { VOSS_STORY } from '../../seed/voss';

// The Phase 1 gate test: Comune's context must exclude everything only Voss
// (or the GM) knows — the structural fix for the prototype's knowledge bleed.

const state: RuntimeState = {
  current_turn: 2,
  current_act: 2,
  story_date: '2025-08-20',
  unlocked_npcs: ['voss', 'comune'],
  clues_found: [],
};

const history: LetterRecord[] = [
  { role: 'ai', character_slug: 'voss', content: 'Caro Mercier, il trauma cranico senza effrazione mi dice che Bellini conosceva il suo assassino.', story_date: '2025-08-03', turn_number: 1 },
  { role: 'user', character_slug: 'voss', content: 'Caro Voss, raccontami della scena.', story_date: '2025-08-02', turn_number: 1 },
  { role: 'user', character_slug: 'comune', content: 'Spett.le Ufficio, richiedo i registri anagrafici di Marco Bellini.', story_date: '2025-08-02', turn_number: 1 },
];

const VOSS_ONLY_FACTS = ['victim1_cause', 'murder2_date', 'victims_tattoo', 'false_witness_gang'];
const GM_ONLY_FACTS = ['murder4_planned', 'pattern_four', 'red_herring_three', 'killer_identity_open'];

describe('factsForCharacter', () => {
  it('comune scope excludes voss-only and GM-only facts', () => {
    const keys = factsForCharacter(VOSS_STORY, 'comune', state.current_act).map((f) => f.fact_key);
    for (const k of [...VOSS_ONLY_FACTS, ...GM_ONLY_FACTS]) expect(keys).not.toContain(k);
    expect(keys).toContain('victim1_address');
    expect(keys).toContain('anagrafe_records');
    expect(keys).toContain('victim1_identity'); // public
  });

  it('voss scope excludes GM-only secrets and other characters private facts', () => {
    const keys = factsForCharacter(VOSS_STORY, 'voss', state.current_act).map((f) => f.fact_key);
    for (const k of GM_ONLY_FACTS) expect(keys).not.toContain(k);
    expect(keys).not.toContain('tod_window'); // medico_legale only
    expect(keys).toContain('victim1_cause');
  });

  it('respects reveal_act gating', () => {
    const act1 = factsForCharacter(VOSS_STORY, 'voss', 1).map((f) => f.fact_key);
    expect(act1).not.toContain('murder2_date'); // reveal_act 2
    const act2 = factsForCharacter(VOSS_STORY, 'voss', 2).map((f) => f.fact_key);
    expect(act2).toContain('murder2_date');
  });

  it('gmOnlyFacts returns exactly the unattributed secrets', () => {
    expect(gmOnlyFacts(VOSS_STORY).map((f) => f.fact_key).sort()).toEqual([...GM_ONLY_FACTS].sort());
  });
});

describe('buildNpcContext (comune)', () => {
  const comune = VOSS_STORY.characters.find((c) => c.slug === 'comune')!;
  const ctx = buildNpcContext({
    story: VOSS_STORY,
    state,
    character: comune,
    brief: { character_slug: 'comune', brief: 'Rispondi alla richiesta anagrafica.', facts_to_use: ['anagrafe_records'], clues_to_release: [] },
    history,
    playerLetters: [{ recipient_slug: 'comune', content: 'Sollecito la mia richiesta.' }],
    replyWindow: { earliest: '2025-08-25', latest: '2025-08-30' },
  });
  const full = `${ctx.system}\n${ctx.user}`;

  it('contains no voss-only or GM-only fact content or keys', () => {
    for (const key of [...VOSS_ONLY_FACTS, ...GM_ONLY_FACTS]) {
      expect(full).not.toContain(key);
    }
    expect(full).not.toContain('trauma cranico'); // victim1_cause content
    expect(full).not.toContain('5 novembre'); // murder4_planned content
  });

  it('contains no correspondence with other characters', () => {
    expect(full).not.toContain('conosceva il suo assassino'); // voss letter
    expect(full).not.toContain('raccontami della scena'); // player→voss letter
    expect(full).toContain('registri anagrafici di Marco Bellini'); // own letter
  });

  it('contains its own scoped facts and the brief', () => {
    expect(full).toContain('anagrafe_records');
    expect(full).toContain('Rispondi alla richiesta anagrafica.');
    expect(full).toContain('2025-08-25'); // reply window
  });
});

describe('buildOrchestratorContext', () => {
  it('the GM sees everything: all facts (incl. secrets) and all letters', () => {
    const ctx = buildOrchestratorContext({
      story: VOSS_STORY,
      state,
      history,
      playerLetters: [{ recipient_slug: 'voss', content: 'Nuova lettera.' }],
    });
    const full = `${ctx.system}\n${ctx.user}`;
    for (const key of GM_ONLY_FACTS) expect(full).toContain(key);
    expect(full).toContain('conosceva il suo assassino');
    expect(full).toContain('registri anagrafici');
  });
});
