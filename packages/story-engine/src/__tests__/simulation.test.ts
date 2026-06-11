import { describe, expect, it } from 'vitest';
import { applyGameStateUpdates, generateTurnBatch, initialRuntimeState } from '../engine/turnProcessor';
import { MockProvider, type StructuredRequest } from '../ai/provider';
import { hasErrors } from '../validator';
import type { LetterRecord, RuntimeState } from '../types';
import { VOSS_STORY } from '../../seed/voss';

// Adapted from the prototype's e2e gameWorkflow.test.ts (20-turn sim through
// 5 acts): drives the real engine — scoped contexts, TimeService, validator,
// state transitions — with a scripted GM/writer in place of live Claude.
// (The live-API 10-turn quality sim is the Phase 5 harness.)

const ACT_BY_TURN: Array<[number, number]> = [
  [4, 1],
  [8, 2],
  [15, 3],
  [20, 4],
  [99, 5],
];
const actForTurn = (turn: number) => ACT_BY_TURN.find(([max]) => turn <= max)![1];

// Player alternates: voss only / comune only / both (multi-letter turns).
function playerLettersForTurn(turn: number) {
  const both = turn % 3 === 0;
  if (both)
    return [
      { recipient_slug: 'voss', content: `Turno ${turn}: Voss, ho una teoria.` },
      { recipient_slug: 'comune', content: `Turno ${turn}: richiedo altri registri.` },
    ];
  return turn % 2 === 0
    ? [{ recipient_slug: 'comune', content: `Turno ${turn}: sollecito.` }]
    : [{ recipient_slug: 'voss', content: `Turno ${turn}: aggiornami sull'indagine.` }];
}

function scriptedProvider(state: RuntimeState, turn: number) {
  return new MockProvider((request: StructuredRequest) => {
    if (request.tool.name === 'turn_plan') {
      const recipients = playerLettersForTurn(turn).map((l) => l.recipient_slug);
      const targetAct = actForTurn(turn);
      return {
        replies: recipients.map((slug) => ({
          character_slug: slug,
          brief: `Turno ${turn}: rispondi in personaggio.`,
          facts_to_use: slug === 'voss' && targetAct >= 2 ? ['murder2_date'] : [],
          clues_to_release: [],
        })),
        game_state_updates: {
          act_progression: targetAct > state.current_act ? targetAct : undefined,
          clues_found: turn === 5 ? ['clue_tattoos'] : [],
          npcs_to_unlock: turn === 6 ? ['sofia_russo'] : [],
          victim_saved: turn >= 21 ? true : undefined,
          killer_identified: turn >= 21 ? true : undefined,
        },
        narrator_notes: `GM turno ${turn}`,
      };
    }
    const slug = VOSS_STORY.characters.find((c) => request.system.includes(`You are ${c.name}`))!.slug;
    return {
      character_slug: slug,
      date_sent: '',
      content: `Turno ${turn}: lettera di ${slug}.`,
      metadata: {
        facts_referenced: slug === 'voss' && actForTurn(turn) >= 2 ? ['murder2_date'] : [],
        clues_revealed: [],
      },
    };
  });
}

describe('multi-turn simulation (Voss, 22 turns through 5 acts)', () => {
  it('runs clean: monotone dates, correct acts, zero validator errors', async () => {
    let state = initialRuntimeState(VOSS_STORY);
    const history: LetterRecord[] = [];
    let totalWarnings = 0;

    for (let turn = 1; turn <= 22; turn++) {
      const playerLetters = playerLettersForTurn(turn);
      const previousDate = state.story_date;

      // Player letters enter the history at the current in-fiction date.
      for (const letter of playerLetters) {
        history.push({
          role: 'user',
          character_slug: letter.recipient_slug,
          content: letter.content,
          story_date: state.story_date,
          turn_number: turn,
        });
      }

      const batch = await generateTurnBatch({
        story: VOSS_STORY,
        state,
        history,
        playerLetters,
        provider: scriptedProvider(state, turn),
        seed: `simgame:${turn}`,
      });

      expect(hasErrors(batch.warnings), `turn ${turn}: ${JSON.stringify(batch.warnings)}`).toBe(false);
      totalWarnings += batch.warnings.length;
      expect(batch.responses.length).toBe(playerLetters.length);

      for (const response of batch.responses) {
        history.push({
          role: 'ai',
          character_slug: response.character_slug,
          content: response.content,
          story_date: response.story_date,
          turn_number: turn,
        });
        expect(response.story_date >= state.story_date).toBe(true);
      }

      state = applyGameStateUpdates(state, batch.gameStateUpdates, batch.responses);
      expect(state.story_date >= previousDate).toBe(true);
      expect(state.current_act).toBe(actForTurn(turn));
      expect(state.current_turn).toBe(turn);
    }

    // Quality bar shape (Phase 5 will enforce this against live Claude):
    expect(totalWarnings).toBe(0);
    expect(state.current_act).toBe(5);
    expect(state.unlocked_npcs).toContain('sofia_russo');
    expect(state.clues_found).toContain('clue_tattoos');
    expect(state.victim_saved).toBe(true);
    expect(state.killer_identified).toBe(true);
    // 22 turns of letters accumulated on both sides
    expect(history.filter((l) => l.role === 'user').length).toBeGreaterThanOrEqual(22);
    expect(history.filter((l) => l.role === 'ai').length).toBeGreaterThanOrEqual(22);
  });

  it('a moduleless story (no facts/acts/clues/endings) plays the same loop', async () => {
    const bare = {
      ...VOSS_STORY,
      facts: [],
      acts: [],
      clues: [],
      endings: [],
      characters: VOSS_STORY.characters.slice(0, 2),
    };
    let state = initialRuntimeState(bare);
    expect(state.current_act).toBe(1);
    const history: LetterRecord[] = [];

    for (let turn = 1; turn <= 3; turn++) {
      const playerLetters = [{ recipient_slug: 'voss', content: `Lettera ${turn}.` }];
      const provider = new MockProvider((req: StructuredRequest) =>
        req.tool.name === 'turn_plan'
          ? {
              replies: [{ character_slug: 'voss', brief: 'Rispondi.' }],
              game_state_updates: {},
              narrator_notes: '',
            }
          : {
              character_slug: 'voss',
              date_sent: '',
              content: `Risposta ${turn}.`,
              metadata: {},
            },
      );
      const batch = await generateTurnBatch({
        story: bare,
        state,
        history,
        playerLetters,
        provider,
        seed: `bare:${turn}`,
      });
      expect(batch.warnings).toEqual([]);
      state = applyGameStateUpdates(state, batch.gameStateUpdates, batch.responses);
    }
    expect(state.current_turn).toBe(3);
  });
});
