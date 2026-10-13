import { z } from 'zod';
import type { Cast, Engine, Finding } from '@imbustai/story-runtime';
import { vossStorySchema, type VossStory } from './schema';
import { endingDetail, vossDies } from './mechanics/december';
import { initialState, vossStateSchema, type VossState } from './mechanics/state';
import type { TurnPlan } from './mechanics/turn';

// engine-voss: plays the Voss story (Rome, 1987). The mechanics
// (`mechanics/`) decide each Turn and the Ending in code; the Hooks that need
// the writing pipeline are stubs until those tickets build them:
//   writing pipeline (writer views, checker, editing pass)      Imbustai/imbustai-app#41
//   Epilogues and the closing batch                             Imbustai/imbustai-app#42

export const VOSS_ENGINE_ID = 'engine-voss';

export { vossStateSchema, type VossState };

/**
 * What a Voss draft carries in `effects`: the state after the batch, computed
 * by `playTurn` from the reader's signals, and the plan the Letters were
 * written from. `applyTurn` returns the state on approve.
 */
export const vossEffectsSchema = z.object({ state: vossStateSchema, plan: z.unknown() });
export interface VossEffects {
  state: VossState;
  plan: TurnPlan;
}

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
      state: initialState(story),
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

  // Adelaide once her first Letter (batch 2) has arrived, Armando once the
  // Panorama is revealed; Voss no more once he is dead.
  contacts({ story, state }) {
    const open = new Set(story.correspondents.filter((c) => c.contactableFromStart).map((c) => c.slug));
    if (state.batch >= 2) open.add('adelaide');
    if (state.panorama.revealBatch !== null && state.panorama.revealBatch <= state.batch) open.add('armando');
    if (vossDies(state.december) && state.batch >= story.calendar.deadlines.stakeout) open.delete('voss');
    return story.correspondents.map((c) => c.slug).filter((slug) => open.has(slug));
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

  // The state was decided when the batch was planned; the admin edits Letters,
  // never effects.
  async applyTurn(_ctx, view, approved) {
    const { state } = vossEffectsSchema.parse(approved.effects);
    if (state.batch !== view.turn) {
      throw new Error(`engine-voss: effects are for batch ${state.batch}, not Turn ${view.turn}`);
    }
    return state;
  },

  resolveEnding({ story, state }) {
    if (state.ending === null) return null;
    return { key: state.ending, detail: endingDetail(story, state) };
  },

  async generateEpilogue() {
    throw new NotBuiltYet('generateEpilogue', 42);
  },
};
