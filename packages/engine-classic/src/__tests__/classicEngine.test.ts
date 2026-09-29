import { describe, expect, it } from 'vitest';
import {
  MockProvider,
  applyLetterEdits,
  createAiAccess,
  createHookContext,
  reviewDraft,
  type GameView,
  type HookContext,
  type UsageRecord,
} from '@imbustai/story-runtime';
import { classicEngine, upgradeLegacyState } from '../engine';
import {
  actForTurn,
  applyGameStateUpdates,
  generateTurnBatch,
  initialRuntimeState,
} from '../engine/turnProcessor';
import { validateDraft } from '../validator';
import type { RuntimeState, StoryConfig } from '../types';
import { VOSS_STORY } from '../../seed/voss';
import { mockHandler, seeded } from './helpers';

// The Hooks must play exactly as the pre-Engine pipeline did: same letters,
// same dates, same findings, same next state.

const story = classicEngine.schema.data.parse(VOSS_STORY);
const GAME = 'game-1';

function context(provider: MockProvider, turn: number, usage?: UsageRecord[]): HookContext {
  return createHookContext({
    gameId: GAME,
    turn,
    ai: createAiAccess({ provider, turn, onUsage: (u) => usage?.push(u) }),
  });
}

function view(state: RuntimeState, turn: number, submission: GameView<StoryConfig, RuntimeState>['submission']) {
  return { gameId: GAME, story, state, turn, history: [], submission };
}

const SUBMISSION = [
  { to: 'voss', body: 'Caro Voss, dimmi della scena.' },
  { to: 'comune', body: 'Richiedo i registri.' },
];

describe('classicEngine', () => {
  it('validates the seed and its fresh state with its own schemas', () => {
    expect(story.slug).toBe(VOSS_STORY.slug);
    expect(() => classicEngine.schema.state.parse(initialRuntimeState(story))).not.toThrow();
  });

  it('starts a game like the old start-game route', async () => {
    const { state, opening } = await classicEngine.startGame(context(new MockProvider(() => ({})), 0), {
      gameId: GAME,
      story,
      realStartDate: '2026-09-29',
    });
    expect(state).toEqual(initialRuntimeState(story, '2026-09-29'));
    const openers = story.characters.filter((c) => c.opening_letter.trim() !== '');
    expect(opening.map((l) => l.from)).toEqual(
      [...openers].sort((a, b) => a.sort_order - b.sort_order).map((c) => c.slug),
    );
    expect(opening.every((l) => l.kind === 'letter' && l.enclosures.length === 0)).toBe(true);
  });

  it('falls back to the unsigned first letter when no character opens', async () => {
    const bare: StoryConfig = {
      ...story,
      first_letter: 'Benvenuto.',
      characters: story.characters.map((c) => ({ ...c, opening_letter: '' })),
    };
    const { opening } = await classicEngine.startGame(context(new MockProvider(() => ({})), 0), {
      gameId: GAME,
      story: bare,
      realStartDate: '2026-09-29',
    });
    expect(opening).toHaveLength(1);
    expect(opening[0].from).toBe('');
    expect(opening[0].body).toBe('Benvenuto.');
  });

  it('names contacts from the cast and checks submissions like the old submit route', () => {
    const state = initialRuntimeState(story);
    const v = view(state, 1, []);
    const cast = classicEngine.cast(story).correspondents.map((c) => c.slug);
    expect(classicEngine.contacts(v).every((slug) => cast.includes(slug))).toBe(true);
    expect(classicEngine.contacts(v)).toEqual(
      story.characters.filter((c) => state.unlocked_npcs.includes(c.slug)).map((c) => c.slug),
    );

    const rule = (letters: typeof SUBMISSION) => classicEngine.validateSubmission(v, letters)[0]?.rule;
    expect(rule(SUBMISSION)).toBeUndefined();
    expect(rule(Array(5).fill(SUBMISSION[0]))).toBe('too_many_letters');
    expect(rule([{ to: 'voss', body: '   ' }])).toBe('invalid_letter');
    expect(rule([{ to: 'voss', body: 'x'.repeat(8001) }])).toBe('invalid_letter');
    const locked = story.characters.find((c) => !state.unlocked_npcs.includes(c.slug))!;
    expect(rule([{ to: locked.slug, body: 'Salve.' }])).toBe('recipient_locked');
  });

  it('plays a Turn through the Hooks exactly as the old pipeline did', async () => {
    const state = initialRuntimeState(story);
    const turn = 1;

    // The old pipeline, called directly.
    const legacy = await generateTurnBatch({
      story,
      state,
      history: [],
      playerLetters: SUBMISSION.map((l) => ({ recipient_slug: l.to, content: l.body })),
      ai: createAiAccess({ provider: new MockProvider(mockHandler(['voss', 'comune'])), turn }),
      random: seeded(`${GAME}:${turn}`),
      turnNumber: turn,
    });
    const legacyNext = applyGameStateUpdates(state, legacy.gameStateUpdates, legacy.responses);
    legacyNext.current_act = Math.max(legacyNext.current_act, actForTurn(story, legacyNext.current_turn));

    // The same Turn through the Engine contract.
    const usage: UsageRecord[] = [];
    const ctx = context(new MockProvider(mockHandler(['voss', 'comune'])), turn, usage);
    const v = view(state, turn, SUBMISSION);
    const draft = await classicEngine.generateTurn(ctx, v, { kind: 'batch' });
    const findings = await reviewDraft(classicEngine, ctx, v, draft);
    const next = await classicEngine.applyTurn(ctx, v, draft);

    expect(draft.letters.map((l) => [l.key, l.from, l.storyDate, l.body])).toEqual(
      legacy.responses.map((r) => [r.character_slug, r.character_slug, r.story_date, r.content]),
    );
    expect(draft.submissionDate).toBe(state.story_date);
    expect(draft.adminNotes).toEqual([legacy.narratorNotes]);
    expect(findings).toEqual(
      legacy.warnings.map(({ character_slug, ...w }) => (character_slug ? { ...w, letterKey: character_slug } : w)),
    );
    expect(next).toEqual(legacyNext);
    expect(usage.map((u) => [u.role, u.purpose, u.character])).toEqual([
      ['writer', 'orchestrator', undefined],
      ['writer', 'npc_letter', 'voss'],
      ['writer', 'npc_letter', 'comune'],
    ]);
  });

  it('regenerates one Letter, keeping the others and their dates', async () => {
    const state = initialRuntimeState(story);
    const v = view(state, 1, SUBMISSION);
    const draft = await classicEngine.generateTurn(
      context(new MockProvider(mockHandler(['voss', 'comune'])), 1),
      v,
      { kind: 'batch' },
    );

    const provider = new MockProvider(mockHandler(['voss', 'comune']));
    const regen = await classicEngine.generateTurn(context(provider, 1), v, {
      kind: 'letter',
      draft,
      letterKey: 'comune',
      guidance: 'Più breve.',
    });

    expect(provider.requests.map((r) => r.tool.name)).toEqual(['npc_letter']);
    expect(regen.letters.find((l) => l.key === 'voss')).toEqual(draft.letters.find((l) => l.key === 'voss'));
    expect(regen.letters.find((l) => l.key === 'comune')!.storyDate).toBe(
      draft.letters.find((l) => l.key === 'comune')!.storyDate,
    );
  });

  it('re-validates admin edits against the stored plan', async () => {
    const state = initialRuntimeState(story);
    const v = view(state, 1, SUBMISSION);
    const ctx = context(new MockProvider(mockHandler(['voss', 'comune'])), 1);
    const draft = await classicEngine.generateTurn(ctx, v, { kind: 'batch' });
    const edited = applyLetterEdits(draft, [{ key: 'voss', body: 'Testo rivisto.' }]);

    const { plan } = draft.effects as { plan: Parameters<typeof validateDraft>[0]['plan'] };
    const expected = validateDraft({
      story,
      state,
      plan,
      letters: edited.letters.map((l) => ({
        character_slug: l.from,
        content: l.body,
        story_date: l.storyDate,
        date_sent: '1999-01-01',
        metadata: {
          clues_revealed: [],
          facts_referenced: l.from === 'voss' ? ['victim1_cause'] : [],
        },
      })),
      turnDate: state.story_date,
    });
    expect(await classicEngine.validateDraft(ctx, v, edited)).toEqual(
      expected.map(({ character_slug, ...w }) => (character_slug ? { ...w, letterKey: character_slug } : w)),
    );
    expect(edited.effects).toBe(draft.effects);
  });

  it('never ends a game on its own', () => {
    expect(classicEngine.resolveEnding(view(initialRuntimeState(story), 1, []))).toBeNull();
  });

  it('upgrades a pre-engine runtime_state so the schema accepts it', () => {
    const upgraded = classicEngine.schema.state.parse(upgradeLegacyState({ current_turn: 3 }, story));
    expect(upgraded.current_turn).toBe(3);
    expect(upgraded.unlocked_npcs).toEqual(initialRuntimeState(story).unlocked_npcs);
  });
});
