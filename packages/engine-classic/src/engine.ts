import { z } from 'zod';
import type {
  Cast,
  DraftBatch,
  Engine,
  Finding,
  GameView,
  Json,
  OutgoingLetter,
  PlayerLetter,
} from '@imbustai/story-runtime';
import type {
  LetterRecord,
  PlayerTurnLetter,
  RuntimeState,
  StoryConfig,
  ValidationWarning,
} from './types';
import { storyConfigSchema, runtimeStateSchema } from './schemas';
import { npcLetterSchema, type BatchLetter } from './schema/npcLetter';
import { turnPlanSchema, type TurnPlan } from './schema/turnPlan';
import { openingLetters, resolveStartDate } from './engine/gameStart';
import {
  actForTurn,
  applyGameStateUpdates,
  generateTurnBatch,
  initialRuntimeState,
} from './engine/turnProcessor';
import { validateDraft } from './validator';

// engine-classic: the July planner→writer engine (orchestrator plan → one
// scoped writer call per replying character → canon validator), moved as it
// was and plugged into the platform through the Engine contract. The old Voss
// story stays on it, archived.

export const CLASSIC_ENGINE_ID = 'engine-classic';

/** The classic limit when a story sets none (stories.settings.max_letters_per_turn). */
const DEFAULT_MAX_LETTERS = 4;
const MAX_LETTER_LENGTH = 8000;

/**
 * What a classic draft carries besides its Letters: the orchestrator's plan
 * (a single-letter regenerate reuses its briefs), the state updates applied on
 * approve, what each writer reported beside its letter, and the findings of
 * the plan itself (a reply to an unknown character).
 */
const effectsSchema = z.object({
  plan: z.unknown(),
  game_state_updates: z.record(z.unknown()).default({}),
  letters: z
    .record(
      z.object({
        date_sent: z.string().default(''),
        metadata: npcLetterSchema.shape.metadata,
      }),
    )
    .default({}),
  plan_findings: z
    .array(
      z.object({
        rule: z.string(),
        severity: z.enum(['warning', 'error']),
        message: z.string(),
        character_slug: z.string().optional(),
      }),
    )
    .default([]),
});
type ClassicEffects = z.infer<typeof effectsSchema>;

function parseEffects(effects: Json): ClassicEffects {
  return effectsSchema.parse(effects ?? {});
}

/** A stored plan, or a stand-in when an old draft has none (edits still validate). */
function planOf(effects: ClassicEffects): TurnPlan {
  const parsed = turnPlanSchema.safeParse(effects.plan);
  return parsed.success
    ? parsed.data
    : turnPlanSchema.parse({ replies: [{ character_slug: 'x', brief: 'x' }] });
}

// ─── Between contract shapes and the classic ones ──────────────────────────

/** Delivered Letters as the orchestrator and writers read them. */
function letterRecords(view: GameView<StoryConfig, RuntimeState>): LetterRecord[] {
  return view.history.flatMap((letter) => {
    const slug = letter.direction === 'in' ? letter.from : letter.to;
    // Legacy rows without a character (the unsigned first letter) stay out.
    if (!slug) return [];
    return [
      {
        role: letter.direction === 'in' ? ('ai' as const) : ('user' as const),
        character_slug: slug,
        content: letter.body,
        story_date: letter.storyDate || view.state.story_date,
        turn_number: 0,
      },
    ];
  });
}

function playerTurnLetters(submission: PlayerLetter[]): PlayerTurnLetter[] {
  return submission.map((l) => ({ recipient_slug: l.to, content: l.body }));
}

/** A draft's Letters back in the shape the validator and the writers produced. */
function batchLetters(letters: OutgoingLetter[], effects: ClassicEffects): BatchLetter[] {
  return letters.map((letter) => {
    const meta = effects.letters[letter.key];
    return {
      character_slug: letter.from,
      date_sent: meta?.date_sent ?? '',
      content: letter.body,
      metadata: meta?.metadata ?? { clues_revealed: [], facts_referenced: [] },
      story_date: letter.storyDate,
    };
  });
}

function toDraft(input: {
  letters: BatchLetter[];
  plan: TurnPlan;
  gameStateUpdates: Record<string, unknown>;
  narratorNotes: string;
  turnDate: string;
  planWarnings: ValidationWarning[];
}): DraftBatch {
  const seen = new Map<string, number>();
  const letters: OutgoingLetter[] = [];
  const meta: ClassicEffects['letters'] = {};
  for (const letter of input.letters) {
    // One Letter per character is the norm; a second one still gets its own key.
    const n = (seen.get(letter.character_slug) ?? 0) + 1;
    seen.set(letter.character_slug, n);
    const key = n === 1 ? letter.character_slug : `${letter.character_slug}#${n}`;
    letters.push({
      key,
      kind: 'letter',
      from: letter.character_slug,
      storyDate: letter.story_date,
      body: letter.content,
      enclosures: [],
    });
    meta[key] = { date_sent: letter.date_sent, metadata: letter.metadata };
  }
  const effects: ClassicEffects = {
    plan: input.plan,
    game_state_updates: input.gameStateUpdates,
    letters: meta,
    plan_findings: input.planWarnings,
  };
  return {
    letters,
    submissionDate: input.turnDate,
    effects: effects as unknown as Json,
    adminNotes: input.narratorNotes ? [input.narratorNotes] : [],
  };
}

function toFinding(warning: ValidationWarning): Finding {
  const { character_slug, ...rest } = warning;
  return character_slug ? { ...rest, letterKey: character_slug } : rest;
}

function adminGuidanceLetter(guidance: string | undefined): PlayerTurnLetter[] {
  const text = guidance?.trim();
  if (!text) return [];
  // The steering note rides along as operator context for the orchestrator.
  return [
    {
      recipient_slug: '__admin_note__',
      content: `[ADMIN GUIDANCE — not a player letter; follow these instructions for this turn]\n${text}`,
    },
  ];
}

/**
 * Games created before the engine may lack runtime_state fields; fill them
 * from a fresh start so the state schema accepts them.
 */
export function upgradeLegacyState(raw: unknown, story: StoryConfig): unknown {
  const rs = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return { ...initialRuntimeState(story), ...rs };
}

// ─── The Engine ─────────────────────────────────────────────────────────────

export const classicEngine: Engine<StoryConfig, RuntimeState> = {
  id: CLASSIC_ENGINE_ID,
  schema: { data: storyConfigSchema, state: runtimeStateSchema },
  maxLettersPerTurn: DEFAULT_MAX_LETTERS,

  async startGame(_ctx, { story, realStartDate }) {
    const startDate = resolveStartDate(story, realStartDate);
    const opening: OutgoingLetter[] = openingLetters(story, startDate).map((l) => ({
      key: `opening:${l.character_slug}`,
      kind: 'letter',
      from: l.character_slug,
      storyDate: l.story_date,
      body: l.content,
      enclosures: [],
    }));
    if (opening.length === 0) {
      // Legacy single first_letter: unsigned, so it has no sender ('').
      opening.push({
        key: 'opening',
        kind: 'letter',
        from: '',
        storyDate: startDate,
        body: story.first_letter.trim() || '…',
        enclosures: [],
      });
    }
    return { state: initialRuntimeState(story, realStartDate), opening };
  },

  cast(story): Cast {
    return {
      // Classic stories never named the player's character.
      lead: { slug: 'player', name: 'Player', kind: 'person' },
      correspondents: story.characters.map((c) => ({
        slug: c.slug,
        name: c.name,
        role: c.role,
        kind: 'person' as const,
      })),
    };
  },

  contacts({ story, state }) {
    return story.characters
      .filter((c) => state.unlocked_npcs.includes(c.slug))
      .map((c) => c.slug);
  },

  validateSubmission({ story, state }, submission) {
    const max = story.settings.max_letters_per_turn ?? DEFAULT_MAX_LETTERS;
    if (submission.length > max) {
      return [
        {
          rule: 'too_many_letters',
          severity: 'error',
          message: `At most ${max} letters per turn.`,
        },
      ];
    }
    const findings: Finding[] = [];
    for (const letter of submission) {
      if (!letter.body.trim() || letter.body.length > MAX_LETTER_LENGTH) {
        findings.push({ rule: 'invalid_letter', severity: 'error', message: 'Empty or too long.' });
      } else if (!state.unlocked_npcs.includes(letter.to)) {
        findings.push({
          rule: 'recipient_locked',
          severity: 'error',
          message: `"${letter.to}" cannot be written to yet.`,
        });
      }
    }
    return findings;
  },

  async generateTurn(ctx, view, request) {
    const base = {
      story: view.story,
      state: view.state,
      history: letterRecords(view),
      playerLetters: [...playerTurnLetters(view.submission), ...adminGuidanceLetter(request.guidance)],
      ai: ctx.ai,
      random: ctx.random,
      turnNumber: view.turn,
    };

    if (request.kind === 'batch') {
      const batch = await generateTurnBatch(base);
      return toDraft({
        letters: batch.responses,
        plan: batch.plan,
        gameStateUpdates: batch.gameStateUpdates,
        narratorNotes: batch.narratorNotes,
        turnDate: batch.turnDate,
        planWarnings: batch.planWarnings,
      });
    }

    // One character again, reusing the stored plan; every other Letter is kept.
    const previous = parseEffects(request.draft.effects);
    const target = request.draft.letters.find((l) => l.key === request.letterKey);
    if (!target) throw new Error(`No letter "${request.letterKey}" in the draft.`);
    const batch = await generateTurnBatch({
      ...base,
      reusePlan: turnPlanSchema.parse(previous.plan),
      onlyCharacter: target.from,
    });
    const kept = batchLetters(
      request.draft.letters.filter((l) => l.from !== target.from),
      previous,
    );
    return toDraft({
      letters: [...kept, ...batch.responses],
      plan: batch.plan,
      gameStateUpdates: batch.gameStateUpdates,
      narratorNotes: batch.narratorNotes,
      turnDate: batch.turnDate,
      planWarnings: [],
    });
  },

  async validateDraft(_ctx, view, draft) {
    const effects = parseEffects(draft.effects);
    const warnings = validateDraft({
      story: view.story,
      state: view.state,
      plan: planOf(effects),
      letters: batchLetters(draft.letters, effects),
      turnDate: view.state.story_date,
    });
    return [...effects.plan_findings, ...warnings].map(toFinding);
  },

  async applyTurn(_ctx, view, approved) {
    const effects = parseEffects(approved.effects);
    const next = applyGameStateUpdates(
      view.state,
      {
        clues_found: [],
        npcs_to_unlock: [],
        dynamic_npc_proposals: [],
        ...(effects.game_state_updates as object),
      },
      approved.letters.map((l) => ({ story_date: l.storyDate })),
    );
    // Keep the persisted act on schedule with the turn number, so a turn the
    // orchestrator under-progressed doesn't leave the story stuck a step behind.
    next.current_act = Math.max(next.current_act, actForTurn(view.story, next.current_turn));
    return next;
  },

  // Classic games never end on their own: the admin closes them.
  resolveEnding() {
    return null;
  },

  async generateEpilogue() {
    throw new Error('engine-classic has no Epilogue.');
  },
};
