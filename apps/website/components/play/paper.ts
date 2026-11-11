// How fixed pieces are read off their Markdown before they are set as paper.

/** A clipping: the leading **bold** lines are headline and deck. */
export function splitClipping(body: string): { headline: string; deck: string[]; paragraphs: string[] } {
  const lines = body.split('\n');
  const heads: string[] = [];
  while (lines.length > 0 && /^\*\*.+\*\*$/.test(lines[0].trim())) {
    heads.push((lines.shift() as string).trim().slice(2, -2));
  }
  const paragraphs = lines
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return { headline: heads[0] ?? '', deck: heads.slice(1), paragraphs };
}

/** Markdown joins single line breaks; a Letter's address and signature need them kept. */
export function keepLineBreaks(markdown: string): string {
  return markdown.replace(/([^\n])\n(?=[^\n])/g, '$1  \n');
}
