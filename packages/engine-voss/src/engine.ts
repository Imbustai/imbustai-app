import { z } from 'zod';
import type { Cast, Engine, Finding } from '@imbustai/story-runtime';
import { vossStorySchema, type VossStory } from './schema';

// engine-voss: plays the Voss story (Rome, 1987). This package holds the
// Story document's schema; the Hooks that need the mechanics or the writing
// pipeline are stubs until those tickets build them:
//   mechanics (calendar, offices, Voss's state, clues, Endings)  Imbustai/imbustai-app#40
//   writing pipeline (writer views, checker, editing pass)      Imbustai/imbustai-app#41
//   Epilogues and the closing batch                             Imbustai/imbustai-app#42

export const VOSS_ENGINE_ID = 'engine-voss';

/**
 * Per-Game state. A placeholder until the mechanics ticket gives it trust,
 * layers, ladders, clues and evidence; passthrough so its fields survive.
 */
export const vossStateSchema = z.object({ schemaVersion: z.literal(1).default(1) }).passthrough();
export type VossState = z.infer<typeof vossStateSchema>;

class NotBuiltYet extends Error {
  constructor(hook: string, ticket: number) {
    super(`engine-voss: ${hook} is not built yet (Imbustai/imbustai-app#${ticket})`);
  }
}

export const vossEngine: Engine<VossStory, VossState> = {
  id: VOSS_ENGINE_ID,
  schema: { data: vossStorySchema, state: vossStateSchema },
  maxLettersPerTurn: 3,

  async startGame(_ctx, { story }) {
    const { letter } = story.opening;
    return {
      state: vossStateSchema.parse({}),
      opening: [
        {
          key: `opening:${letter.from}`,
          kind: 'letter',
          from: letter.from,
          storyDate: letter.storyDate,
          body: letter.body,
          enclosures: [],
        },
      ],
    };
  },

  cast(story): Cast {
    const { lead } = story;
    return {
      lead: { slug: lead.slug, name: lead.name, role: lead.role, address: lead.address, kind: 'person' },
      correspondents: story.correspondents.map((c) => ({
        slug: c.slug,
        name: c.name,
        role: c.role,
        address: c.address,
        kind: c.kind,
      })),
    };
  },

  // Who opens up later (Adelaide after her first Letter, Armando after the
  // reveal) is mechanics (#40); until then, those reachable from the start.
  contacts(view) {
    return view.story.correspondents.filter((c) => c.contactableFromStart).map((c) => c.slug);
  },

  validateSubmission(view, submission): Finding[] {
    const findings: Finding[] = [];
    if (submission.length > this.maxLettersPerTurn) {
      findings.push({
        rule: 'max_letters',
        severity: 'error',
        message: `At most ${this.maxLettersPerTurn} Letters per Turn.`,
      });
    }
    const contacts = new Set(this.contacts(view));
    for (const letter of submission) {
      if (!contacts.has(letter.to)) {
        findings.push({ rule: 'recipient', severity: 'error', message: `"${letter.to}" is not a contact.` });
      }
    }
    return findings;
  },

  async generateTurn() {
    throw new NotBuiltYet('generateTurn', 41);
  },

  async validateDraft() {
    throw new NotBuiltYet('validateDraft', 41);
  },

  async applyTurn() {
    throw new NotBuiltYet('applyTurn', 40);
  },

  // No Turn is ever applied until generateTurn exists, so no Game can end.
  resolveEnding() {
    return null;
  },

  async generateEpilogue() {
    throw new NotBuiltYet('generateEpilogue', 42);
  },
};
