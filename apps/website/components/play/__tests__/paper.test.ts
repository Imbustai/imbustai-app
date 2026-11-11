import { describe, expect, it } from 'vitest';
import { keepLineBreaks, splitClipping } from '../paper';

describe('a clipping', () => {
  it('reads its leading bold lines as headline and deck, the rest as the article', () => {
    const body = '**PRESO IL «GIUSTIZIERE»**\n**Arrestato sulle scale**\n\nRoma. Ieri sera la polizia…\n\nSecondo capoverso.';
    expect(splitClipping(body)).toEqual({
      headline: 'PRESO IL «GIUSTIZIERE»',
      deck: ['Arrestato sulle scale'],
      paragraphs: ['Roma. Ieri sera la polizia…', 'Secondo capoverso.'],
    });
  });

  it('has no headline when the text starts plainly', () => {
    expect(splitClipping('Roma. Una notizia.')).toEqual({ headline: '', deck: [], paragraphs: ['Roma. Una notizia.'] });
  });
});

describe('a handwritten Letter', () => {
  it('keeps single line breaks, which Markdown would otherwise join', () => {
    expect(keepLineBreaks('Caro Giacomo,\n\nun abbraccio,\nFlorian')).toBe('Caro Giacomo,\n\nun abbraccio,  \nFlorian');
  });
});
