import { describe, expect, it } from 'vitest';
import { buildVossStory } from '../../seed/story';
import { vossStorySchema } from '../schema';

describe('the Voss Story document', () => {
  it('validates against the schema', () => {
    const result = vossStorySchema.safeParse(buildVossStory());
    expect(result.success ? [] : result.error.issues).toEqual([]);
  });
});

describe('the schema rejects a document that does not hold together', () => {
  function issuesAfter(mutate: (story: ReturnType<typeof buildVossStory>) => void): string[] {
    const story = buildVossStory();
    mutate(story);
    const result = vossStorySchema.safeParse(story);
    return result.success ? [] : result.error.issues.map((i) => i.message);
  }

  it('a document an office does not list', () => {
    expect(
      issuesAfter((s) => {
        s.documents.find((d) => d.key === 'regina_coeli_colloqui')!.holder = 'cancelleria';
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.stringContaining('regina_coeli_colloqui'),
      ]),
    );
  });

  it('a document asking for a request key nobody defined', () => {
    expect(
      issuesAfter((s) => {
        s.documents[0].requires = [['luca_nickname']];
      }),
    ).toEqual([expect.stringContaining('unknown request key "luca_nickname"')]);
  });

  it('a reserved term pointing at no Plot key', () => {
    expect(
      issuesAfter((s) => {
        s.reserved[0].plotKey = 'nowhere';
      }),
    ).toEqual(['unknown Plot key "nowhere"']);
  });

  it('a fixed text from a sender outside the cast', () => {
    expect(
      issuesAfter((s) => {
        s.texts[0].from = 'repubblica';
      }),
    ).toEqual([expect.stringContaining('unknown sender "repubblica"')]);
  });
});

describe('Paolo\'s review of the texts (PR #50)', () => {
  const story = vossStorySchema.parse(buildVossStory());
  const texts = Object.fromEntries(story.texts.map((t) => [t.key, t]));

  it('Adelaide\'s reveal encloses the notebook she says she copies word for word', () => {
    const reveal = texts.adelaide_reveal;
    expect(reveal.text).toContain('sul foglio qui accluso');
    expect(reveal.enclosures).toHaveLength(1);
    expect(reveal.enclosures[0].body).toContain('OPERAZIONE PANORAMA');
    expect(reveal.text).toContain('e adesso il ragioniere non c\'è più');
  });

  it('the porter is Armando De Marchi, so he is not mistaken for Luca\'s mechanic Proietti', () => {
    const porter = JSON.stringify(story.correspondents.find((c) => c.slug === 'armando'));
    expect(porter).toContain('Armando De Marchi');
    expect(porter).not.toContain('Proietti');
    expect(JSON.stringify(story)).not.toMatch(/Armando Proietti|PROIETTI Armando/);
  });

  it('every document that names Rosa Pace gives her date of birth', () => {
    for (const doc of story.documents.filter((d) => d.text.includes('PACE Rosa, nata'))) {
      expect(doc.text, doc.key).toContain('PACE Rosa, nata a Roma il 4 aprile 1932');
    }
  });
});
