import type {
  LetterRecord,
  PlayerTurnLetter,
  RuntimeState,
  StoryCharacter,
  StoryConfig,
  StoryFact,
} from '../types';
import type { TurnPlanReply } from '../schema/turnPlan';
import { orchestratorSystemPrompt, npcWriterSystemPrompt } from '../prompts/templates';

// Per-NPC knowledge scoping (architecture §5). This replaces the prototype's
// FullContextStrategy, which put every letter from every NPC in one thread —
// the root cause of knowledge bleed. Here, the writer call for character X
// receives ONLY X's persona, X's facts, X's correspondence, and the
// orchestrator's brief.

/** Facts character `slug` may draw on at the current act. */
export function factsForCharacter(
  story: StoryConfig,
  slug: string,
  currentAct: number,
): StoryFact[] {
  return story.facts.filter((fact) => {
    const inScope = fact.is_public || fact.known_by.includes(slug);
    if (!inScope) return false;
    return fact.reveal_act == null || fact.reveal_act <= currentAct;
  });
}

/** GM-only secrets: facts no character knows and that are not public. */
export function gmOnlyFacts(story: StoryConfig): StoryFact[] {
  return story.facts.filter((f) => !f.is_public && f.known_by.length === 0);
}

/** Only the letters exchanged with this character (both directions). */
export function correspondenceFor(history: LetterRecord[], slug: string): LetterRecord[] {
  return history.filter((l) => l.character_slug === slug);
}

export interface PromptContext {
  system: string;
  /** Single user message containing the structured context. */
  user: string;
}

export function buildNpcContext(opts: {
  story: StoryConfig;
  state: RuntimeState;
  character: StoryCharacter;
  brief: TurnPlanReply;
  history: LetterRecord[];
  playerLetters: PlayerTurnLetter[];
  /** Allowed in-fiction reply window, precomputed by TimeService. */
  replyWindow: { earliest: string; latest: string };
}): PromptContext {
  const { story, state, character, brief, history, playerLetters, replyWindow } = opts;
  const facts = factsForCharacter(story, character.slug, state.current_act);
  const letters = correspondenceFor(history, character.slug);
  const incoming = playerLetters.filter((l) => l.recipient_slug === character.slug);

  const system = npcWriterSystemPrompt({ story, character, facts, replyWindow });

  const parts: string[] = [];
  if (letters.length > 0) {
    parts.push('## Your past correspondence with the player (oldest first)');
    for (const letter of letters) {
      const direction = letter.role === 'user' ? 'LETTER RECEIVED FROM THE PLAYER' : 'LETTER YOU SENT';
      parts.push(`[${direction} — ${letter.story_date}]\n${letter.content}`);
    }
  }
  parts.push('## New letter(s) from the player this turn');
  if (incoming.length > 0) {
    for (const letter of incoming) parts.push(letter.content);
  } else {
    parts.push(
      '(The player did not write to you this turn; you are writing on your own initiative as instructed below.)',
    );
  }
  parts.push('## Game Master brief for your reply');
  parts.push(brief.brief);
  if (brief.facts_to_use.length > 0) parts.push(`Facts you may use: ${brief.facts_to_use.join(', ')}`);
  if (brief.clues_to_release.length > 0)
    parts.push(`Clues to weave in: ${brief.clues_to_release.join(', ')}`);
  if (brief.tone) parts.push(`Tone: ${brief.tone}`);
  parts.push('Now write your letter using the npc_letter tool.');

  return { system, user: parts.join('\n\n') };
}

export function buildOrchestratorContext(opts: {
  story: StoryConfig;
  state: RuntimeState;
  history: LetterRecord[];
  playerLetters: PlayerTurnLetter[];
}): PromptContext {
  const { story, state, history, playerLetters } = opts;

  const system = orchestratorSystemPrompt({ story, state });

  const parts: string[] = [];
  parts.push('## Full correspondence so far (oldest first)');
  if (history.length === 0) {
    parts.push('(none yet — beyond the story first letter)');
  }
  for (const letter of history) {
    const direction =
      letter.role === 'user'
        ? `PLAYER → ${letter.character_slug}`
        : `${letter.character_slug} → PLAYER`;
    parts.push(`[${direction} — ${letter.story_date}]\n${letter.content}`);
  }
  parts.push('## Player letters submitted THIS turn');
  for (const letter of playerLetters) {
    parts.push(`[PLAYER → ${letter.recipient_slug}]\n${letter.content}`);
  }
  parts.push('Produce the turn plan now using the turn_plan tool.');

  return { system, user: parts.join('\n\n') };
}
