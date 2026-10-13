import { z } from 'zod';
import type { VossStory } from '../schema';

// The per-Game state of engine-voss: everything the mechanics remember
// between Turns. Plain JSON, persisted in games.runtime_state. `batch` counts
// the batches the Player has been sent: 0 after the opening envelope, N after
// batch N.

const step = z.number().int().min(0).max(2);
const ladderKey = z.enum(['target', 'killer', 'luca']);

const clueStateSchema = z.object({
  /** The batch the Player first received it in; null = not yet. */
  deliveredIn: z.number().int().nullable(),
  status: z.enum(['unseen', 'ignored', 'misread', 'understood']),
  /** How many times it came back from another side (at most `voss.maxReapproaches`). */
  reapproaches: z.number().int(),
  /** The batches of the reapproach entries already used or passed. */
  usedWindows: z.array(z.number().int()),
  wrongLead: z.string().nullable(),
});
export type ClueState = z.infer<typeof clueStateSchema>;

const pendingAnswerSchema = z.object({
  /** answer: the office answers; forward: it sends the request on «per competenza» (to `forwardedTo`). */
  kind: z.enum(['answer', 'forward']),
  office: z.string(),
  /** The Turn whose Letter it answers. */
  turn: z.number().int(),
  /** The batch it arrives in; it is dropped if there is none. */
  batch: z.number().int(),
  /** The date the office writes it. */
  date: z.string(),
  documents: z.array(z.string()),
  /** The request matched nothing the office holds: it asks for specifics. */
  partial: z.boolean(),
  /** The office that forwarded the request «per competenza», if any. */
  forwardedFrom: z.string().nullable(),
  /** For a forward: the offices it went to. */
  forwardedTo: z.array(z.string()),
  /** What the answer must also address: `benvenuti` (the teacher reported), `search` (its outcome). */
  topics: z.array(z.enum(['benvenuti', 'search'])),
});
export type PendingAnswer = z.infer<typeof pendingAnswerSchema>;

export const vossStateSchema = z.object({
  schemaVersion: z.literal(2),
  /** Batches sent so far. */
  batch: z.number().int().min(0).max(8),
  trust: z.number().int(),
  /** Consecutive Turns without a Letter to Voss. */
  silentTurns: z.number().int(),
  /** Layer → the batch it was told in. Layer 0 is the opening envelope. */
  layers: z.record(z.string(), z.number().int()),
  /** The gate questions the Lead has ever asked (Voss remembers them). */
  asked: z.object({ about1977: z.boolean(), aboutCareer: z.boolean(), doubtsLineups: z.boolean() }),
  ladders: z.object({ target: step, killer: step, luca: step }),
  /** Voss knows the date of the attack, with a reason, from a Letter that reached him by 14 Dec. */
  vossKnowsDate: z.boolean(),
  clues: z.record(z.string(), clueStateSchema),
  /** Panorama clues (I1–I9) → the batch they arrived in. */
  panoramaClues: z.record(z.string(), z.number().int()),
  panorama: z.object({
    deducedInTurn: z.number().int().nullable(),
    revealBatch: z.number().int().nullable(),
    variant: z.enum(['deduced', 'seen']).nullable(),
    /** A Turn whose Letter accused one tenant: Adelaide brings an extra clue in the next batch. */
    accusedInTurn: z.number().int().nullable(),
  }),
  /** Offices the Lead has written to, ever (a door is open once he has). */
  officesWritten: z.array(z.string()),
  pending: z.array(pendingAnswerSchema),
  /** Documents the Player has received. */
  documents: z.array(z.string()),
  /** Evidence the Player holds, P-keys. */
  evidence: z.array(z.string()),
  /** Things told to an authority that the verdict or the routes count. */
  told: z.object({
    benvenuti: z.boolean(),
    cancellations: z.boolean(),
    ariaAndRigoletto: z.boolean(),
    bulb: z.boolean(),
    lucaLink: z.boolean(),
    vossConfession: z.boolean(),
  }),
  /** The first Turn whose Letter to an authority asked for a stakeout that holds (§7, route 2). */
  stakeoutTurn: z.number().int().nullable(),
  /** Aldo named to an authority: the first Turn he was. */
  aldoNamedInTurn: z.number().int().nullable(),
  /** Voss went to see the teacher (Turn 1, if asked). */
  benvenutiVisited: z.boolean(),
  /** The Lead reported the teacher to the Procura before she died. */
  benvenutiReported: z.boolean(),
  /** Signatures: the last batch the ordinary was allowed in, and the showpiece's batch. */
  signatures: z.record(z.string(), z.object({ lastOrdinary: z.number().int().nullable(), showpiece: z.number().int().nullable() })),
  /** Unlocked knowledge keys per correspondent (their writer view grows). */
  unlocks: z.record(z.string(), z.array(z.string())),
  /** The 17 December, once decided. */
  december: z
    .object({
      route: z.enum(['search', 'stakeout', 'voss_knows', 'voss_hides', 'otherwise']),
      arrest: z.enum(['A', 'B', 'C']).nullable(),
      /** The Turn whose Letters decided it. */
      turn: z.number().int(),
    })
    .nullable(),
  /** The Ending, once Turn 8 is applied. */
  ending: z.string().nullable(),
});
export type VossState = z.infer<typeof vossStateSchema>;
export type LadderKey = z.infer<typeof ladderKey>;

/** The state of a new Game, after the opening envelope (batch 0). */
export function initialState(story: VossStory): VossState {
  const clues: Record<string, ClueState> = {};
  for (const c of story.clues) {
    const inEnvelope = c.firstBatch === 0;
    clues[c.key] = {
      deliveredIn: inEnvelope ? 0 : null,
      status: inEnvelope ? 'ignored' : 'unseen',
      reapproaches: 0,
      usedWindows: [],
      wrongLead: null,
    };
  }
  const signatures: VossState['signatures'] = {};
  for (const c of story.correspondents) {
    for (const s of c.signatures) signatures[`${c.slug}.${s.key}`] = { lastOrdinary: null, showpiece: null };
  }
  return {
    schemaVersion: 2,
    batch: 0,
    trust: story.voss.trust.start,
    silentTurns: 0,
    layers: { '0': 0 },
    asked: { about1977: false, aboutCareer: false, doubtsLineups: false },
    ladders: { target: 0, killer: 0, luca: 0 },
    vossKnowsDate: false,
    clues,
    panoramaClues: {},
    panorama: { deducedInTurn: null, revealBatch: null, variant: null, accusedInTurn: null },
    officesWritten: [],
    pending: [],
    documents: [],
    evidence: [],
    told: {
      benvenuti: false,
      cancellations: false,
      ariaAndRigoletto: false,
      bulb: false,
      lucaLink: false,
      vossConfession: false,
    },
    stakeoutTurn: null,
    aldoNamedInTurn: null,
    benvenutiVisited: false,
    benvenutiReported: false,
    signatures,
    unlocks: {},
    december: null,
    ending: null,
  };
}
