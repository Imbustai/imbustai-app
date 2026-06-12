import type { RuntimeState, StoryCharacter, StoryConfig, StoryFact } from '../types';

// Story-AGNOSTIC prompt templates. Every narrative detail is injected from
// story data; optional modules (facts/acts/clues/endings) render only when
// the story uses them (architecture §2). No 350-line hardcoded story prompts.

function localeOf(story: StoryConfig): string {
  return story.settings.locale ?? 'it';
}

function section(title: string, body: string): string {
  return `## ${title}\n${body}`;
}

export function orchestratorSystemPrompt(opts: {
  story: StoryConfig;
  state: RuntimeState;
}): string {
  const { story, state } = opts;
  const parts: string[] = [];

  parts.push(
    `You are the Game Master of "${story.title}", an interactive epistolary story. ` +
      `The player exchanges letters with the story's characters. You orchestrate the narrative: ` +
      `you decide which characters reply this turn and brief each one — you NEVER write the letters yourself.`,
  );
  parts.push(
    section(
      'Your responsibilities',
      [
        '- Decide which characters reply to this turn (every character the player wrote to should normally reply; others may write spontaneously when the story calls for it).',
        '- Write a specific brief per replying character: what to say, what to withhold, how to spin it. Reference facts and clues by their exact keys.',
        '- Never instruct a character to use a fact outside their knowledge scope (each fact lists who knows it).',
        '- Keep continuity: never contradict established facts or earlier letters.',
        '- Update game state (clues found, characters to unlock, act progression) only when justified.',
        '- Observe the player: update the psychological profile and adapt pacing and difficulty to their style.',
        '- narrator_notes are internal notes for the human reviewer — candid strategy talk is welcome there.',
      ].join('\n'),
    ),
  );

  parts.push(
    section(
      'Characters',
      story.characters
        .map((c) => {
          const lines = [
            `- "${c.slug}" — ${c.name} (${c.role}). ${c.backstory}`.trim(),
            `  Personality: ${JSON.stringify(c.personality)}`,
            c.hidden_agenda ? `  Hidden agenda (secret): ${c.hidden_agenda}` : '',
            c.knowledge_notes ? `  Knows: ${c.knowledge_notes}` : '',
            `  Unlocked: ${state.unlocked_npcs.includes(c.slug) ? 'yes' : 'no'}` +
              (Object.keys(c.unlock_rules).length > 0
                ? ` (unlock rules: ${JSON.stringify(c.unlock_rules)})`
                : ''),
          ].filter(Boolean);
          return lines.join('\n');
        })
        .join('\n'),
    ),
  );

  if (story.facts.length > 0) {
    parts.push(
      section(
        'Canon facts (the registry of truth — who knows what)',
        story.facts
          .map((f) => {
            const audience = f.is_public
              ? 'public'
              : f.known_by.length > 0
                ? `known by: ${f.known_by.join(', ')}`
                : 'GM-ONLY SECRET';
            const act = f.reveal_act != null ? `, from act ${f.reveal_act}` : '';
            return `- [${f.fact_key}] (${audience}${act}) ${f.content}`;
          })
          .join('\n'),
      ),
    );
  }

  if (story.acts.length > 0) {
    const current = story.acts.find((a) => a.act_number === state.current_act);
    parts.push(
      section(
        'Act structure',
        story.acts
          .map(
            (a) =>
              `- Act ${a.act_number} "${a.title}" (turns ${a.turn_min}${a.turn_max ? `–${a.turn_max}` : '+'}): ${JSON.stringify(a.goals)}` +
              (Object.keys(a.reveal_rules).length > 0
                ? ` | reveal rules: ${JSON.stringify(a.reveal_rules)}`
                : ''),
          )
          .join('\n') +
          (current ? `\nCurrent act: ${current.act_number} ("${current.title}").` : ''),
      ),
    );
  }

  if (story.clues.length > 0) {
    parts.push(
      section(
        'Clue catalog',
        story.clues
          .map(
            (c) =>
              `- [${c.clue_key}] (${c.reliability}, ${c.category}, from act ${c.act_available}` +
              (c.source_character_slug ? `, via ${c.source_character_slug}` : '') +
              `) ${c.description}`,
          )
          .join('\n') +
          `\nAlready found by the player: ${state.clues_found.length > 0 ? state.clues_found.join(', ') : 'none'}.`,
      ),
    );
  }

  if (story.endings.length > 0) {
    parts.push(
      section(
        'Possible endings',
        story.endings
          .map(
            (e) =>
              `- [${e.ending_key}] "${e.title}" when ${JSON.stringify(e.conditions)}: ${e.narrative_guidance}`,
          )
          .join('\n'),
      ),
    );
  }

  if (story.allow_dynamic_npcs) {
    parts.push(
      section(
        'Dynamic characters',
        'You may PROPOSE new characters via game_state_updates.dynamic_npc_proposals when the story needs them. Proposals require human approval before the character exists — never have a proposed character reply in the same turn.',
      ),
    );
  }

  if (state.psych_profile && Object.keys(state.psych_profile).length > 0) {
    parts.push(
      section(
        'Player psychological profile (your own running analysis — use it to personalize briefs)',
        JSON.stringify(state.psych_profile),
      ),
    );
  }

  parts.push(
    section(
      'Game state',
      `Turn: ${state.current_turn}. In-fiction date: ${state.story_date}. ` +
        `Unlocked characters: ${state.unlocked_npcs.join(', ')}.`,
    ),
  );

  parts.push(
    section(
      'Output',
      `Respond ONLY by calling the turn_plan tool. All letters and briefs must be written in the story's language: ${localeOf(story)}.`,
    ),
  );

  return parts.join('\n\n');
}

export function npcWriterSystemPrompt(opts: {
  story: StoryConfig;
  character: StoryCharacter;
  facts: StoryFact[];
  replyWindow: { earliest: string; latest: string };
}): string {
  const { story, character, facts, replyWindow } = opts;
  const parts: string[] = [];

  parts.push(
    `You are ${character.name} (${character.role}) in the epistolary story "${story.title}". ` +
      `You write ONE letter to the player, fully in character. Write in ${localeOf(story)}.`,
  );
  parts.push(
    section(
      'Who you are',
      [
        character.backstory,
        `Personality: ${JSON.stringify(character.personality)}`,
        character.hidden_agenda ? `Your hidden agenda (never state it openly): ${character.hidden_agenda}` : '',
        character.knowledge_notes ? `What you know in general: ${character.knowledge_notes}` : '',
      ]
        .filter(Boolean)
        .join('\n'),
    ),
  );

  if (facts.length > 0) {
    parts.push(
      section(
        'Everything you know (your COMPLETE knowledge — you know nothing beyond this and your own correspondence)',
        facts.map((f) => `- [${f.fact_key}] ${f.content}`).join('\n'),
      ),
    );
  }

  parts.push(
    section(
      'Hard rules',
      [
        '- You only know the facts listed above and what appears in your own correspondence. If the player asks about something outside your knowledge, react naturally (confusion, referral, refusal) — NEVER invent canon facts.',
        '- Follow the Game Master brief, but stay in character.',
        `- date_sent must be between ${replyWindow.earliest} and ${replyWindow.latest} (your realistic reply time).`,
        '- In metadata.facts_referenced, list the key of EVERY fact above that your letter draws on. In metadata.clues_revealed, list clue keys the brief told you to release.',
        '- NEVER write the date inside the letter content (no "[Data: ...]" header, no date line). The platform shows the date separately; you only set the date_sent field.',
        '- Respond ONLY by calling the npc_letter tool. The letter (salutation, body, signature) goes entirely in `content`.',
      ].join('\n'),
    ),
  );

  return parts.join('\n\n');
}
