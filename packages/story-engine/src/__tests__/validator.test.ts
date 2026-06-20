import { describe, expect, it } from 'vitest';
import { validateDraft, hasErrors } from '../validator';
import type { RuntimeState, StoryConfig } from '../types';
import type { TurnPlan } from '../schema/turnPlan';
import type { BatchLetter } from '../schema/npcLetter';
import { VOSS_STORY } from '../../seed/voss';

const state: RuntimeState = {
  current_turn: 2,
  current_act: 1,
  story_date: '2025-08-02',
  unlocked_npcs: ['voss', 'comune'],
  clues_found: [],
};

function plan(overrides: Partial<TurnPlan> = {}): TurnPlan {
  return {
    replies: [{ character_slug: 'voss', brief: 'reply', facts_to_use: [], clues_to_release: [] }],
    game_state_updates: {
      clues_found: [],
      npcs_to_unlock: [],
      dynamic_npc_proposals: [],
    },
    narrator_notes: '',
    ...overrides,
  };
}

function letter(overrides: Partial<BatchLetter> = {}): BatchLetter {
  return {
    character_slug: 'voss',
    date_sent: '2025-08-03',
    story_date: '2025-08-03',
    content: 'Caro Mercier, procediamo.',
    metadata: { clues_revealed: [], facts_referenced: [] },
    ...overrides,
  };
}

describe('knowledge_scope', () => {
  it('flags a letter referencing a fact outside the sender scope as ERROR', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan(),
      letters: [
        letter({
          character_slug: 'comune',
          metadata: { clues_revealed: [], facts_referenced: ['victim1_cause'] }, // voss/medico only
        }),
      ],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'knowledge_scope' && w.severity === 'error')).toBe(true);
  });

  it('flags verbatim leak of out-of-scope fact content in prose', () => {
    const fact = VOSS_STORY.facts.find((f) => f.fact_key === 'victim1_cause')!;
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan(),
      letters: [letter({ character_slug: 'comune', content: `Egregio, ${fact.content}` })],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'knowledge_scope')).toBe(true);
  });

  it('flags a GM brief assigning out-of-scope facts', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan({
        replies: [{ character_slug: 'comune', brief: 'x', facts_to_use: ['victims_tattoo'], clues_to_release: [] }],
      }),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'knowledge_scope')).toBe(true);
  });

  it('passes a properly scoped batch with zero warnings', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan({
        replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: ['victim1_cause'], clues_to_release: [] }],
      }),
      letters: [letter({ metadata: { clues_revealed: [], facts_referenced: ['victim1_cause'] } })],
      turnDate: '2025-08-02',
    });
    expect(warnings).toEqual([]);
  });
});

describe('timeline_order', () => {
  it('flags letters dated before the player turn as ERROR', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan(),
      letters: [letter({ story_date: '2025-08-01' })],
      turnDate: '2025-08-02',
    });
    expect(warnings.filter((w) => w.rule === 'timeline_order' && w.severity === 'error').length).toBeGreaterThan(0);
  });

  it('warns when a letter lands after the character reply window', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan(),
      letters: [letter({ story_date: '2025-09-15' })], // voss max +2d
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'timeline_order' && w.severity === 'warning')).toBe(true);
  });
});

describe('clue_act', () => {
  it('warns when a clue is released before its act', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state, // act 1
      plan: plan(),
      letters: [letter({ metadata: { clues_revealed: ['clue_cardinal_points'], facts_referenced: [] } })], // act 3 clue
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'clue_act')).toBe(true);
  });

  it('errors on a clue key that does not exist', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan({ game_state_updates: { clues_found: ['clue_nonexistent'], npcs_to_unlock: [], dynamic_npc_proposals: [] } }),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.severity === 'error' && w.message.includes('clue_nonexistent'))).toBe(true);
  });
});

describe('fact_consistency', () => {
  it('errors on briefs referencing unknown fact keys', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state,
      plan: plan({
        replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: ['fact_made_up'], clues_to_release: [] }],
      }),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'fact_consistency' && w.severity === 'error')).toBe(true);
  });
});

describe('state_sanity', () => {
  it('errors on act regression', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: { ...state, current_act: 3 },
      plan: plan({ game_state_updates: { clues_found: [], npcs_to_unlock: [], act_progression: 2, dynamic_npc_proposals: [] } }),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(warnings.some((w) => w.rule === 'state_sanity' && w.message.includes('regression'))).toBe(true);
  });

  it('warns (not errors) on unknown unlock when dynamic NPCs are allowed', () => {
    const warnings = validateDraft({
      story: VOSS_STORY, // allow_dynamic_npcs: true
      state,
      plan: plan({ game_state_updates: { clues_found: [], npcs_to_unlock: ['nuovo_testimone'], dynamic_npc_proposals: [] } }),
      letters: [],
      turnDate: '2025-08-02',
    });
    const hit = warnings.find((w) => w.message.includes('nuovo_testimone'));
    expect(hit?.severity).toBe('warning');
  });

  it('errors on dynamic proposals when the story disables them', () => {
    const noDynamic: StoryConfig = { ...VOSS_STORY, allow_dynamic_npcs: false };
    const warnings = validateDraft({
      story: noDynamic,
      state,
      plan: plan({
        game_state_updates: {
          clues_found: [],
          npcs_to_unlock: [],
          dynamic_npc_proposals: [{ slug: 'x', name: 'X', role: '', personality_notes: '', reason: '' }],
        },
      }),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(hasErrors(warnings)).toBe(true);
  });
});

describe('ending_conditions', () => {
  it('passes when final-act flags match exactly one ending', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: { ...state, current_act: 5, victim_saved: true, killer_identified: true },
      plan: plan(),
      letters: [],
      turnDate: '2025-08-02',
    });
    expect(warnings.filter((w) => w.rule === 'ending_conditions')).toEqual([]);
  });
});

describe('optional modules (genre-agnostic stories)', () => {
  it('a story with no facts/clues/acts/endings only gets timeline + sanity checks', () => {
    const bare: StoryConfig = {
      ...VOSS_STORY,
      facts: [],
      clues: [],
      acts: [],
      endings: [],
    };
    const warnings = validateDraft({
      story: bare,
      state,
      plan: plan({
        replies: [{ character_slug: 'voss', brief: 'x', facts_to_use: [], clues_to_release: [] }],
      }),
      letters: [letter()],
      turnDate: '2025-08-02',
    });
    expect(warnings).toEqual([]);
  });
});
