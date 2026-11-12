import { z } from 'zod';
import type { HostAiAccess } from '../ai/access';
import type { Correspondent, Finding, IsoDate, OutgoingKind, PlayerLetter } from '../contract';

// The AI player of a Run: it writes as the Lead from exactly what a Player
// would have on the table — the Letters delivered so far and the Contacts —
// and nothing else. No Story data, no Engine state, no admin notes.

/** How the AI player plays; one per Run. */
export interface Persona {
  key: string;
  name: string;
  /** Told to the player model, in the second person. */
  brief: string;
}

/** The three player styles a Story is proven against. */
export const PERSONAS = {
  methodical: {
    key: 'methodical',
    name: 'Methodical',
    brief:
      'You are methodical. You keep track of every name, date and place you were given, you ask precise ' +
      'questions one thread at a time, you check what one correspondent says against another, and you ' +
      'write to whoever can confirm a fact before you build on it.',
  },
  warm: {
    key: 'warm',
    name: 'Warm and chatty',
    brief:
      'You are warm and chatty. You write long, personal letters: you ask your correspondents about ' +
      'themselves, you tell them about your own days and worries, you digress, and the case comes up ' +
      'in between. You care more about the people than about procedure.',
  },
  impulsive: {
    key: 'impulsive',
    name: 'Impulsive',
    brief:
      'You are impulsive. You write short letters, jump to a theory early and say it out loud, accuse ' +
      'or confront when something smells wrong, change subject abruptly and sometimes ignore what you ' +
      'were asked. You act on hunches rather than waiting for proof.',
  },
} as const satisfies Record<string, Persona>;

/** Keys of the built-in personas. */
export type PersonaKey = keyof typeof PERSONAS;

/** One delivered Letter as the Player reads it. */
export interface VisibleLetter {
  direction: 'in' | 'out';
  turn: number;
  /** The sender of a received Letter, or the recipient of one of the Lead's own. */
  correspondent: string;
  kind: OutgoingKind;
  storyDate: IsoDate;
  body: string;
  enclosures: { title: string; body: string }[];
}

/** Everything the AI player sees: what a Player's screen shows, nothing more. */
export interface PlayerView {
  lead: Correspondent;
  /** Who can be written to this Turn. */
  contacts: Correspondent[];
  /** Delivered Letters, both directions, oldest first. */
  letters: VisibleLetter[];
  /** The Turn about to be written: 1 for the first. */
  turn: number;
  maxLettersPerTurn: number;
}

const playerTurnSchema = z.object({
  letters: z.array(z.object({ to: z.string(), body: z.string() })),
});

function renderLetter(letter: VisibleLetter, lead: string): string {
  const head =
    letter.direction === 'in'
      ? `FROM ${letter.correspondent} TO ${lead}`
      : `FROM ${lead} (you) TO ${letter.correspondent}`;
  const kind = letter.kind === 'letter' ? '' : ` [${letter.kind}]`;
  const enclosures = letter.enclosures
    .map((e) => `\n\n[Enclosed: ${e.title}]\n${e.body}`)
    .join('');
  return `--- ${head}${kind} · ${letter.storyDate || 'undated'} ---\n${letter.body}${enclosures}`;
}

function systemPrompt(view: PlayerView, persona: Persona): string {
  return [
    `You are playing an epistolary mystery game as ${view.lead.name}. The whole game happens by post: ` +
      'you read the letters you received and you write letters back. You know only what those letters say.',
    persona.brief,
    'Write the way a real person playing this game would: react to what you were actually told, follow ' +
      'up on what interests your character, and try to get to the bottom of the story. Write every letter ' +
      'in the language your correspondents write to you in. Sign as your character. Write only the letter ' +
      'itself: no date line, no notes about the game.',
    `Each turn you may send between 1 and ${view.maxLettersPerTurn} letters, each to a different ` +
      'correspondent from the list you are given. You cannot write to anyone else.',
  ].join('\n\n');
}

function userPrompt(view: PlayerView, rejected: Finding[]): string {
  const contacts = view.contacts
    .map((c) => `- ${c.slug}: ${c.name}${c.role ? ` (${c.role})` : ''}`)
    .join('\n');
  const correspondence =
    view.letters.map((l) => renderLetter(l, view.lead.name)).join('\n\n') || '(No letters yet.)';
  const retry =
    rejected.length > 0
      ? '\n\nYour previous letters were not accepted:\n' +
        rejected.map((f) => `- ${f.message}`).join('\n') +
        '\nWrite this turn again so that it is accepted.'
      : '';
  return (
    `Your correspondence so far:\n\n${correspondence}\n\n` +
    `This is turn ${view.turn}. You can write to (use the id before the colon as "to"):\n${contacts}` +
    retry
  );
}

/** The player model wrote nothing that can be posted. */
export class PlayerTurnError extends Error {}

/**
 * One Turn of the AI player: up to `maxLettersPerTurn` Letters, each to a
 * current Contact. Letters to anyone else are dropped, like an envelope with
 * no valid address; a Turn with none left is an error.
 * @category Utilities
 */
export async function writePlayerTurn(
  ai: HostAiAccess,
  input: { view: PlayerView; persona: Persona; rejected?: Finding[] },
): Promise<PlayerLetter[]> {
  const { view, persona } = input;
  const reply = await ai.structured('player', {
    purpose: 'run:player',
    system: systemPrompt(view, persona),
    user: userPrompt(view, input.rejected ?? []),
    schema: playerTurnSchema,
    maxTokens: 8000,
  });

  const reachable = new Set(view.contacts.map((c) => c.slug));
  const seen = new Set<string>();
  const letters: PlayerLetter[] = [];
  for (const letter of reply.letters) {
    const to = letter.to.trim();
    const body = letter.body.trim();
    if (!body || !reachable.has(to) || seen.has(to)) continue;
    seen.add(to);
    letters.push({ to, body });
    if (letters.length === view.maxLettersPerTurn) break;
  }
  if (letters.length === 0) {
    throw new PlayerTurnError(`The AI player wrote no Letter to a current Contact on Turn ${view.turn}.`);
  }
  return letters;
}
