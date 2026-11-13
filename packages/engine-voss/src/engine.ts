import type { Cast, Engine, Finding } from '@imbustai/story-runtime';
import { vossStorySchema, type VossStory } from './schema';
import { endingDetail, vossDies } from './mechanics/december';
import { initialState, vossStateSchema, type VossState } from './mechanics/state';
import { applyTurn } from './pipeline/ledger';
import { generateTurn, validateDraft, vossEffectsSchema, type VossEffects } from './pipeline/turn';

// engine-voss: plays the Voss story (Rome, 1987). The mechanics
// (`mechanics/`) decide each Turn and the Ending in code; the writing
// pipeline (`pipeline/`) turns the Turn plan into Letters. One Hook is still a
// stub:
//   Epilogues and the closing batch                             Imbustai/imbustai-app#42

export const VOSS_ENGINE_ID = 'engine-voss';

export { vossStateSchema, type VossState };

export { vossEffectsSchema, type VossEffects };

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
    const { letter, transferOrder } = story.opening;
    return {
      state: initialState(story),
      opening: [
        {
          key: `opening:${letter.from}`,
          kind: 'letter',
          from: letter.from,
          storyDate: letter.storyDate,
          body: letter.body,
          // The Lead's own decree travels in the opening envelope.
          enclosures: [
            { key: 'transfer_order', kind: 'document', title: transferOrder.title, body: transferOrder.body },
          ],
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

  generateTurn: (ctx, view, request) => generateTurn(ctx, view, request),

  // Deterministic: it runs again after every admin edit.
  validateDraft: async (_ctx, view, draft) => validateDraft(view, draft),

  // The state was decided when the batch was planned; the admin edits Letters,
  // never effects. The Ledger then reads the Letters as sent.
  applyTurn: (ctx, view, approved) => applyTurn(ctx, view, approved),

  resolveEnding({ story, state }) {
    if (state.ending === null) return null;
    return { key: state.ending, detail: endingDetail(story, state) };
  },

  async generateEpilogue() {
    throw new NotBuiltYet('generateEpilogue', 42);
  },
};
