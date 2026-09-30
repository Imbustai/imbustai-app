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
