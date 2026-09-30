import { describe, expect, it } from 'vitest';
import { buildVossStory } from '../../seed/story';
import { vossStorySchema } from '../schema';
import { reservedTermsIn } from '../reserved';

const story = vossStorySchema.parse(buildVossStory());

describe('reservedTermsIn', () => {
  it('finds a Plot-key street in invented Texture', () => {
    const hits = reservedTermsIn(story, 'voss', 'Una signora di via Carini viene a denunciare il cane.');
    expect(hits.map((h) => h.pattern)).toEqual(['Carini']);
  });

  it('lets a sender write the names it knows', () => {
    expect(reservedTermsIn(story, 'voss', 'Il ragioniere si chiamava Ottavio Ferri.')).toEqual([]);
  });

  it('matches whole words only, ignoring case', () => {
    expect(reservedTermsIn(story, 'adelaide', 'pace all\'anima sua, disse la signora')).toEqual([]);
    expect(reservedTermsIn(story, 'adelaide', 'la SIGNORA PACE del terzo piano').map((h) => h.pattern)).toEqual(['signora Pace']);
  });
});

describe('writer views', () => {
  const writers = story.correspondents.filter((c) => c.writerView !== null);

  it.each(writers.map((c) => [c.slug, c] as const))('%s: carries no reserved term it may not write', (_slug, c) => {
    const view = [c.writerView, c.leadView, c.voice, ...c.examples.map((e) => e.text)].join('\n');
    expect(reservedTermsIn(story, c.slug, view).map((h) => h.pattern)).toEqual([]);
  });

  it('Voss does not know the answer: no stepfather, no railwayman, nothing about Aldo scheduled later', () => {
    const voss = story.correspondents.find((c) => c.slug === 'voss')!;
    const view = [voss.writerView, ...voss.examples.map((e) => e.text)].join('\n');
    for (const leak of ['Ferrante', 'patrigno', 'capotreno', 'ferroviere', 'Rigoletto', 'Caracalla', 'anniversario', 'nipote']) {
      expect(view).not.toContain(leak);
    }
  });

  it('Adelaide does not know the Panorama operation before the reveal', () => {
    const adelaide = story.correspondents.find((c) => c.slug === 'adelaide')!;
    const view = [adelaide.writerView, ...adelaide.examples.map((e) => e.text)].join('\n');
    for (const leak of ['Aldo', 'colletta', 'chi paga legge', 'svitata', 'Rigoletto', 'cappello', 'profumo']) {
      expect(view).not.toContain(leak);
    }
  });

  it('Rosa\'s coat is not a summer coat: the arrest was on 23 May', () => {
    const everything = JSON.stringify(story);
    expect(everything).not.toContain('piena estate');
    expect(everything).toContain('un cappotto marrone a fine maggio');
  });
});
