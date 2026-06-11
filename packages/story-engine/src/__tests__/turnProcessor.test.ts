import { describe, expect, it } from 'vitest';
import {
  applyGameStateUpdates,
  generateTurnBatch,
  initialRuntimeState,
} from '../engine/turnProcessor';
import { normalizeCharacterSlug } from '../engine/normalize';
import { MockProvider, type StructuredRequest } from '../ai/provider';
import { hasErrors } from '../validator';
import type { LetterRecord } from '../types';
import { VOSS_STORY } from '../../seed/voss';

// Mock GM: replies come from every character the player wrote to, using only
// in-scope facts. Mock writers echo the brief into a letter.
function mockHandler(playerRecipients: string[]) {
  return (request: StructuredRequest): unknown => {
    if (request.tool.name === 'turn_plan') {
      return {
        replies: playerRecipients.map((slug) => ({
          character_slug: slug,
          brief: `Rispondi al giocatore come ${slug}.`,
          facts_to_use: slug === 'voss' ? ['victim1_cause'] : [],
          clues_to_release: [],
        })),
        game_state_updates: { clues_found: [], npcs_to_unlock: [] },
        narrator_notes: 'nota interna',
      };
    }
    // npc_letter — slug is recoverable from the system prompt's first line.
    const slug = VOSS_STORY.characters.find((c) => request.system.includes(`You are ${c.name}`))!.slug;
    return {
      character_slug: slug,
      date_sent: '1999-01-01', // deliberately out of window: TimeService must fix it
      content: `Lettera di ${slug} al giocatore.`,
      metadata: { facts_referenced: slug === 'voss' ? ['victim1_cause'] : [], clues_revealed: [] },
    };
  };
}

describe('normalizeCharacterSlug', () => {
  it('resolves prototype-style aliases generically', () => {
    const chars = VOSS_STORY.characters;
    expect(normalizeCharacterSlug('voss', chars)).toBe('voss');
    expect(normalizeCharacterSlug('Agente Voss', chars)).toBe('voss');
    expect(normalizeCharacterSlug('agente_voss', chars)).toBe('voss');
    expect(normalizeCharacterSlug("Ufficio Anagrafe del Comune", chars)).toBe('comune');
    expect(normalizeCharacterSlug('sconosciuto_totale', chars)).toBeNull();
  });
});

describe('generateTurnBatch', () => {
  const state = initialRuntimeState(VOSS_STORY);

  it('produces a dated, validated batch with one letter per replying NPC', async () => {
    const provider = new MockProvider(mockHandler(['voss', 'comune']));
    const batch = await generateTurnBatch({
      story: VOSS_STORY,
      state,
      history: [],
      playerLetters: [
        { recipient_slug: 'voss', content: 'Caro Voss, dimmi della scena.' },
        { recipient_slug: 'comune', content: 'Richiedo i registri.' },
      ],
      provider,
      seed: 'game1:1',
    });

    expect(batch.responses).toHaveLength(2);
    // 1 orchestrator + 2 writers = 3 calls (Option A shape)
    expect(provider.requests).toHaveLength(3);
    // TimeService overrode the bogus proposed dates into each window
    const voss = batch.responses.find((r) => r.character_slug === 'voss')!;
    const comune = batch.responses.find((r) => r.character_slug === 'comune')!;
    expect(voss.story_date >= '2025-08-03' && voss.story_date <= '2025-08-04').toBe(true);
    expect(comune.story_date >= '2025-08-07' && comune.story_date <= '2025-08-12').toBe(true);
    expect(hasErrors(batch.warnings)).toBe(false);
    expect(batch.narratorNotes).toBe('nota interna');
  });

  it('is deterministic: regenerating yields identical dates', async () => {
    const make = () =>
      generateTurnBatch({
        story: VOSS_STORY,
        state,
        history: [],
        playerLetters: [{ recipient_slug: 'comune', content: 'Richiesta.' }],
        provider: new MockProvider(mockHandler(['comune'])),
        seed: 'game1:1',
      });
    const [a, b] = [await make(), await make()];
    expect(a.responses[0].story_date).toBe(b.responses[0].story_date);
  });

  it('writer calls receive only scoped context (no cross-NPC leakage)', async () => {
    const provider = new MockProvider(mockHandler(['comune']));
    const history: LetterRecord[] = [
      { role: 'ai', character_slug: 'voss', content: 'SEGRETO-VOSS-XYZ nella lettera.', story_date: '2025-08-03', turn_number: 1 },
    ];
    await generateTurnBatch({
      story: VOSS_STORY,
      state,
      history,
      playerLetters: [{ recipient_slug: 'comune', content: 'Sollecito.' }],
      provider,
      seed: 'game1:2',
    });
    const writerCall = provider.requests.find((r) => r.tool.name === 'npc_letter')!;
    expect(`${writerCall.system}${writerCall.user}`).not.toContain('SEGRETO-VOSS-XYZ');
    const gmCall = provider.requests.find((r) => r.tool.name === 'turn_plan')!;
    expect(gmCall.user).toContain('SEGRETO-VOSS-XYZ'); // GM sees everything
  });

  it('skips unknown plan slugs with an error warning instead of crashing', async () => {
    const provider = new MockProvider((req) =>
      req.tool.name === 'turn_plan'
        ? {
            replies: [{ character_slug: 'personaggio_inventato', brief: 'x' }],
            game_state_updates: {},
            narrator_notes: '',
          }
        : {},
    );
    const batch = await generateTurnBatch({
      story: VOSS_STORY,
      state,
      history: [],
      playerLetters: [{ recipient_slug: 'voss', content: 'Ciao.' }],
      provider,
      seed: 'game1:3',
    });
    expect(batch.responses).toHaveLength(0);
    expect(hasErrors(batch.warnings)).toBe(true);
  });

  it('single-NPC regenerate reuses the plan and calls only that writer', async () => {
    const planProvider = new MockProvider(mockHandler(['voss', 'comune']));
    const first = await generateTurnBatch({
      story: VOSS_STORY,
      state,
      history: [],
      playerLetters: [
        { recipient_slug: 'voss', content: 'a' },
        { recipient_slug: 'comune', content: 'b' },
      ],
      provider: planProvider,
      seed: 'game1:4',
    });

    const regenProvider = new MockProvider(mockHandler(['voss', 'comune']));
    const regen = await generateTurnBatch({
      story: VOSS_STORY,
      state,
      history: [],
      playerLetters: [
        { recipient_slug: 'voss', content: 'a' },
        { recipient_slug: 'comune', content: 'b' },
      ],
      provider: regenProvider,
      seed: 'game1:4',
      reusePlan: first.plan,
      onlyCharacter: 'comune',
    });
    expect(regenProvider.requests.every((r) => r.tool.name === 'npc_letter')).toBe(true);
    expect(regenProvider.requests).toHaveLength(1);
    expect(regen.responses).toHaveLength(1);
    expect(regen.responses[0].character_slug).toBe('comune');
    // Same seed → same date as the original batch (no date shuffling on regen)
    expect(regen.responses[0].story_date).toBe(
      first.responses.find((r) => r.character_slug === 'comune')!.story_date,
    );
  });
});

describe('applyGameStateUpdates + initialRuntimeState', () => {
  it('initial state derives from story config', () => {
    const state = initialRuntimeState(VOSS_STORY);
    expect(state).toMatchObject({
      current_turn: 0,
      current_act: 1,
      story_date: '2025-08-02',
      unlocked_npcs: ['voss', 'comune'],
    });
  });

  it('advances turn, date, act and merges unlocks/clues uniquely', () => {
    const state = initialRuntimeState(VOSS_STORY);
    const next = applyGameStateUpdates(
      { ...state, clues_found: ['clue_triangle_scene'] },
      {
        clues_found: ['clue_triangle_scene', 'clue_appointment_21'],
        npcs_to_unlock: ['sofia_russo'],
        act_progression: 2,
        dynamic_npc_proposals: [],
      },
      [{ story_date: '2025-08-09' }],
    );
    expect(next.current_turn).toBe(1);
    expect(next.story_date).toBe('2025-08-09');
    expect(next.current_act).toBe(2);
    expect(next.clues_found).toEqual(['clue_triangle_scene', 'clue_appointment_21']);
    expect(next.unlocked_npcs).toContain('sofia_russo');
  });

  it('never regresses the act', () => {
    const state = { ...initialRuntimeState(VOSS_STORY), current_act: 3 };
    const next = applyGameStateUpdates(
      state,
      { clues_found: [], npcs_to_unlock: [], act_progression: 2, dynamic_npc_proposals: [] },
      [],
    );
    expect(next.current_act).toBe(3);
  });
});
