import {
  createAiAccess,
  seededRandom,
  type AiProvider,
  type StructuredRequest,
  type UsageRecord,
} from '@imbustai/story-runtime';
import { VOSS_STORY } from '../../seed/voss';

/** The hook-context parts generateTurnBatch needs, as the platform builds them. */
export function hookParts(provider: AiProvider, seed: string, usage?: UsageRecord[]) {
  return {
    ai: createAiAccess({ provider, turn: 0, onUsage: (u) => usage?.push(u) }),
    random: seeded(seed),
  };
}

/** The platform's random(label) for a Game and Turn named by `seed`. */
export function seeded(seed: string) {
  return (label: string) => seededRandom(`${seed}:${label}`);
}

// Mock GM: replies come from every character the player wrote to, using only
// in-scope facts. Mock writers echo the brief into a letter.
export function mockHandler(playerRecipients: string[]) {
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
