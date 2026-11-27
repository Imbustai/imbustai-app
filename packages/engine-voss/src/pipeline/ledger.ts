import { z } from 'zod';
import { recordTexture, type DraftBatch, type GameView, type HookContext } from '@imbustai/story-runtime';
import { deliver } from '../mechanics/clues';
import type { VossState } from '../mechanics/state';
import { markShowpiece } from '../mechanics/turn';
import type { VossStory } from '../schema';
import { correspondent, fill, sections } from './prompts';
import { effectsOf, jobsOf } from './turn';

// The Ledger's side of `applyTurn`: once a batch is approved, the Letters as
// the Player will read them (admin edits included) are read back on each
// Character's `analyst`. Three things are recorded in the state the mechanics
// planned:
// - the Texture each person's Letter adds, so later Letters stay consistent;
// - a free showpiece that was played (Adelaide's long P.S., the geranium), so
//   the mechanics never offer it again;
// - a clue a Character gave before its batch because the Lead asked directly
//   (Voss's 3 September, in batch 1), so it is not given later as new.

const reportSchema = z.object({
  showpieces: z.array(z.string()).describe('Keys of the listed showpieces the Letter really plays out'),
  clues: z.array(z.string()).describe('Keys of the listed clues whose fact the Letter states'),
});

export async function applyTurn(
  ctx: HookContext,
  view: GameView<VossStory, VossState>,
  approved: DraftBatch,
): Promise<VossState> {
  const { story, turn } = view;
  const { state: planned, plan } = effectsOf(approved);
  if (planned.batch !== turn) {
    throw new Error(`engine-voss: effects are for batch ${planned.batch}, not Turn ${turn}`);
  }
  let state = structuredClone(planned);

  for (const job of jobsOf(plan)) {
    if (job.type !== 'person') continue;
    const letter = approved.letters.find((l) => l.key === job.key);
    if (!letter?.body.trim()) continue;
    const c = correspondent(story, job.slug);
    try {
      const texture = await recordTexture(ctx.ai, {
        turn,
        character: { slug: c.slug, name: c.name },
        lead: story.lead.slug,
        letter: letter.body,
        ledger: state.ledger,
      });
      state.ledger.push(...texture);

      const allowed = job.slug === 'voss' ? plan.voss?.signatures : job.slug === 'adelaide' ? plan.adelaide?.signatures : [];
      const showpieces = (allowed ?? [])
        .filter((a) => a.showpiece && state.signatures[`${c.slug}.${a.key}`]?.showpiece === null)
        .map((a) => c.signatures.find((s) => s.key === a.key)!)
        .filter(Boolean);
      const clues = story.clues.filter((k) => k.from.includes(c.slug) && state.clues[k.key]?.deliveredIn === null);
      if (showpieces.length === 0 && clues.length === 0) continue;

      const report = await ctx.ai.structured('analyst', {
        purpose: 'ledger_report',
        character: c.slug,
        system: fill(story, 'ledger_report', { name: c.name, lead: story.lead.name }),
        user: sections(
          fill(story, 'ledger_showpieces'),
          showpieces.map((s) => `- ${s.key}: ${s.name}. ${s.showpiece}`).join('\n') || '(none)',
          fill(story, 'ledger_clues', { name: c.name }),
          clues.map((k) => `- ${k.key}: ${k.clue}`).join('\n') || '(none)',
          '## The Letter',
          letter.body,
        ),
        schema: reportSchema,
      });
      for (const key of report.showpieces) {
        if (showpieces.some((s) => s.key === key)) state = markShowpiece(state, c.slug, key, turn);
      }
      for (const key of report.clues) {
        if (clues.some((k) => k.key === key)) deliver(state, key, turn);
      }
    } catch (err) {
      // The batch is already sent: a Ledger that could not be read must not
      // leave the Turn half applied. The planned state stands for this Letter.
      console.warn(`[engine-voss] Ledger not recorded for ${c.slug}, Turn ${turn}`, err);
    }
  }
  return state;
}
