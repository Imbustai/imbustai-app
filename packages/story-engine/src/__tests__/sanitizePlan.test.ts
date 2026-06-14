import { describe, expect, it } from 'vitest';
import { sanitizePlan } from '../engine/turnProcessor';
import type { RuntimeState } from '../types';
import type { TurnPlan } from '../schema/turnPlan';
import { VOSS_STORY } from '../../seed/voss';

// Regression tests for the three model-slip classes the live 10-turn sim hit.
// The engine reconciles the orchestrator's proposal against canon before any
// writer runs, so these never reach a letter.

const state: RuntimeState = {
  current_turn: 6,
  current_act: 2,
  story_date: '2025-08-22',
  unlocked_npcs: ['voss', 'comune'],
  clues_found: [],
};

function plan(over: Partial<TurnPlan>): TurnPlan {
  return {
    replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: [], clues_to_release: [] }],
    game_state_updates: { clues_found: [], npcs_to_unlock: [], dynamic_npc_proposals: [] },
    narrator_notes: '',
    ...over,
  };
}

describe('sanitizePlan — act progression', () => {
  it('drops a regression (act 5 → would set 2 below current)', () => {
    const out = sanitizePlan(VOSS_STORY, { ...state, current_act: 5 }, plan({
      game_state_updates: { clues_found: [], npcs_to_unlock: [], act_progression: 2, dynamic_npc_proposals: [] },
    }));
    expect(out.game_state_updates.act_progression).toBeUndefined();
  });

  it('clamps a jump (act 2 → 5) down to at most current+1', () => {
    const out = sanitizePlan(VOSS_STORY, state, plan({
      game_state_updates: { clues_found: [], npcs_to_unlock: [], act_progression: 5, dynamic_npc_proposals: [] },
    }));
    expect(out.game_state_updates.act_progression).toBe(3);
  });

  it('allows a legal single-step advance', () => {
    const out = sanitizePlan(VOSS_STORY, state, plan({
      game_state_updates: { clues_found: [], npcs_to_unlock: [], act_progression: 3, dynamic_npc_proposals: [] },
    }));
    expect(out.game_state_updates.act_progression).toBe(3);
  });
});

describe('sanitizePlan — fact scope', () => {
  it('strips a fact the character does not know from facts_to_use', () => {
    // victim1_appointment is known by medico_legale + sofia_russo, NOT voss.
    const out = sanitizePlan(VOSS_STORY, state, plan({
      replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: ['victim1_appointment', 'victim1_cause'], clues_to_release: [] }],
    }));
    expect(out.replies[0].facts_to_use).toEqual(['victim1_cause']);
  });
});

describe('sanitizePlan — clue keys', () => {
  it('drops a fact key mistakenly used as a clue (victims_tattoo is a fact)', () => {
    const out = sanitizePlan(VOSS_STORY, state, plan({
      game_state_updates: { clues_found: ['victims_tattoo', 'clue_tattoos'], npcs_to_unlock: [], dynamic_npc_proposals: [] },
    }));
    expect(out.game_state_updates.clues_found).toEqual(['clue_tattoos']);
  });

  it('drops a clue not yet available at the effective act', () => {
    // clue_cardinal_points is act_available 3; at act 2 it must be removed.
    const out = sanitizePlan(VOSS_STORY, state, plan({
      replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: [], clues_to_release: ['clue_cardinal_points', 'clue_tattoos'] }],
    }));
    expect(out.replies[0].clues_to_release).toEqual(['clue_tattoos']);
  });
});

describe('sanitizePlan — unlocks', () => {
  it('drops a non-existent character unlock when dynamic NPCs are off', () => {
    const story = { ...VOSS_STORY, allow_dynamic_npcs: false };
    const out = sanitizePlan(story, state, plan({
      game_state_updates: { clues_found: [], npcs_to_unlock: ['sofia_russo', 'ghost'], dynamic_npc_proposals: [] },
    }));
    expect(out.game_state_updates.npcs_to_unlock).toEqual(['sofia_russo']);
  });
});
