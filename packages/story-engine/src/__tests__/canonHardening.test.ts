import { describe, expect, it } from 'vitest';
import {
  buildNpcContext,
  factsForCharacter,
  validateDraft,
  hasErrors,
  resolveStoryDate,
  computeVisibleFrom,
  type RuntimeState,
  type StoryConfig,
} from '../index';
import type { TurnPlan } from '../schema/turnPlan';
import type { BatchLetter } from '../schema/npcLetter';
import { VOSS_STORY } from '../../seed/voss';

// Phase 5 hardening: focused canon + time guarantees beyond the per-rule
// Phase 1 unit tests. These encode the quality bar (knowledge boundary,
// timeline order, fact consistency, time mapping) as executable assertions.

const baseState: RuntimeState = {
  current_turn: 5,
  current_act: 3,
  story_date: '2025-10-01',
  unlocked_npcs: ['voss', 'comune', 'medico_legale', 'sofia_russo'],
  clues_found: [],
};

function plan(replies: TurnPlan['replies']): TurnPlan {
  return {
    replies,
    game_state_updates: { clues_found: [], npcs_to_unlock: [], dynamic_npc_proposals: [] },
    narrator_notes: '',
  };
}

function letter(slug: string, over: Partial<BatchLetter> = {}): BatchLetter {
  return {
    character_slug: slug,
    date_sent: '2025-10-03',
    story_date: '2025-10-03',
    content: 'Testo.',
    metadata: { clues_revealed: [], facts_referenced: [] },
    ...over,
  };
}

describe('knowledge boundary — every character pair', () => {
  // No character may have, in scope, a fact whose known_by excludes them
  // (unless public). Exhaustive over the whole Voss cast.
  it('no scope contains another character private fact', () => {
    for (const character of VOSS_STORY.characters) {
      const scope = factsForCharacter(VOSS_STORY, character.slug, 5);
      for (const fact of scope) {
        const allowed = fact.is_public || fact.known_by.includes(character.slug);
        expect(allowed, `${character.slug} should not know ${fact.fact_key}`).toBe(true);
      }
    }
  });

  it('GM-only secrets reach no character scope at any act', () => {
    const gmOnly = VOSS_STORY.facts.filter((f) => !f.is_public && f.known_by.length === 0);
    expect(gmOnly.length).toBeGreaterThan(0);
    for (const act of [1, 2, 3, 4, 5]) {
      for (const character of VOSS_STORY.characters) {
        const keys = factsForCharacter(VOSS_STORY, character.slug, act).map((f) => f.fact_key);
        for (const secret of gmOnly) {
          expect(keys).not.toContain(secret.fact_key);
        }
      }
    }
  });

  it('built NPC context never contains another NPC private fact content', () => {
    // medico_legale knows tod_window + victim1_cause; comune must not see them.
    const comune = VOSS_STORY.characters.find((c) => c.slug === 'comune')!;
    const ctx = buildNpcContext({
      story: VOSS_STORY,
      state: baseState,
      character: comune,
      brief: { character_slug: 'comune', brief: 'Rispondi.', facts_to_use: [], clues_to_release: [] },
      history: [
        { role: 'ai', character_slug: 'medico_legale', content: 'Decesso tra le 22:00 e le 23:30.', story_date: '2025-09-01', turn_number: 2 },
      ],
      playerLetters: [{ recipient_slug: 'comune', content: 'Richiesta.' }],
      replyWindow: { earliest: '2025-10-06', latest: '2025-10-11' },
    });
    const full = `${ctx.system}\n${ctx.user}`;
    expect(full).not.toContain('tod_window');
    expect(full).not.toContain('22:00'); // medico_legale's letter must not bleed in
    expect(full).not.toContain('trauma cranico');
  });
});

describe('validator catches the three classic bleed/hole scenarios', () => {
  it('Comune voicing a Voss-only fact → error (knowledge bleed)', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: baseState,
      plan: plan([{ character_slug: 'comune', brief: 'x', facts_to_use: [], clues_to_release: [] }]),
      letters: [letter('comune', { metadata: { clues_revealed: [], facts_referenced: ['false_witness_gang'] } })],
      turnDate: '2025-10-01',
    });
    expect(hasErrors(warnings)).toBe(true);
  });

  it('a reply dated before the letter it answers → error (timeline)', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: baseState,
      plan: plan([{ character_slug: 'voss', brief: 'x', facts_to_use: [], clues_to_release: [] }]),
      letters: [letter('voss', { story_date: '2025-09-20' })],
      turnDate: '2025-10-01',
    });
    expect(warnings.some((w) => w.rule === 'timeline_order' && w.severity === 'error')).toBe(true);
  });

  it('a brief inventing a non-existent fact → error (fact consistency)', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: baseState,
      plan: plan([{ character_slug: 'voss', brief: 'x', facts_to_use: ['ghost_fact'], clues_to_release: [] }]),
      letters: [letter('voss')],
      turnDate: '2025-10-01',
    });
    expect(warnings.some((w) => w.rule === 'fact_consistency')).toBe(true);
  });

  it('a fully in-scope, in-order batch → zero warnings', () => {
    const warnings = validateDraft({
      story: VOSS_STORY,
      state: baseState,
      plan: plan([{ character_slug: 'voss', brief: 'x', facts_to_use: ['victim1_cause'], clues_to_release: [] }]),
      letters: [letter('voss', { metadata: { clues_revealed: [], facts_referenced: ['victim1_cause'] } })],
      turnDate: '2025-10-01',
    });
    expect(warnings).toEqual([]);
  });
});

describe('time mapping — editor rules → story_date + visible_from', () => {
  it('story_date lands inside each character editor-configured window', () => {
    const turnDate = '2025-10-01';
    for (const character of VOSS_STORY.characters) {
      const { story_date } = resolveStoryDate({
        turnDate,
        character,
        seed: `g:1`,
      });
      const earliestMs = new Date(`${turnDate}T00:00:00Z`).getTime() + character.reply_delay_min_days * 86400000;
      const latestMs = new Date(`${turnDate}T00:00:00Z`).getTime() + character.reply_delay_max_days * 86400000;
      const got = new Date(`${story_date}T00:00:00Z`).getTime();
      expect(got).toBeGreaterThanOrEqual(earliestMs);
      expect(got).toBeLessThanOrEqual(latestMs);
    }
  });

  it('visible_from respects the configured real-world window and waking hours', () => {
    const cfg = VOSS_STORY.time_config.visible_delay!;
    const now = new Date('2026-06-12T09:00:00');
    for (let i = 0; i < 50; i++) {
      const iso = computeVisibleFrom(cfg, now)!;
      const target = new Date(iso);
      const deltaMin = (target.getTime() - now.getTime()) / 60000;
      // Same-day deliveries fall in the window; wrapped ones jump to >= 8:00.
      expect(target.getHours()).toBeGreaterThanOrEqual(8);
      expect(target.getHours()).toBeLessThan(23);
      expect(deltaMin).toBeGreaterThanOrEqual(cfg.min_minutes);
    }
  });

  it('disabled delay → null visible_from (instant reveal)', () => {
    expect(computeVisibleFrom({ enabled: false, min_minutes: 30, max_minutes: 180 })).toBeNull();
  });
});

describe('genre-agnostic: a moduleless story validates with only universal rules', () => {
  it('no facts/clues/acts/endings → only timeline + state_sanity can fire', () => {
    const bare: StoryConfig = { ...VOSS_STORY, facts: [], clues: [], acts: [], endings: [] };
    const warnings = validateDraft({
      story: bare,
      state: { ...baseState, current_act: 1 },
      plan: plan([{ character_slug: 'voss', brief: 'x', facts_to_use: [], clues_to_release: [] }]),
      letters: [letter('voss', { story_date: '2025-10-03' })],
      turnDate: '2025-10-01',
    });
    const rules = new Set(warnings.map((w) => w.rule));
    for (const r of rules) expect(['timeline_order', 'state_sanity']).toContain(r);
  });
});
