'use client';

import {
  Button,
  LetterContent,
  RichTextEditor,
  Select,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@imbustai/ds';
import { useState } from 'react';

const LETTER_DEMO = `# A letter heading

Dear reader,

This is **Markdown** written through the visual editor.

| Detail | Value |
| --- | --- |
| Format | Markdown |
| Reader | Shared component |

> A small quotation.

Yours sincerely,
The Imbustai team`;

export function RichTextDemo() {
  const [markdown, setMarkdown] = useState(LETTER_DEMO);
  return (
    <div style={{ display: 'grid', gap: 'var(--ds-space-6)' }}>
      <RichTextEditor value={markdown} onChange={setMarkdown} aria-label="Rich text editor demo" />
      <LetterContent markdown={markdown} />
    </div>
  );
}

export function TooltipDemo() {
  return (
    <TooltipProvider>
      <div style={{ display: 'flex', gap: 'var(--ds-space-4)', flexWrap: 'wrap' }}>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outline" size="sm">Hover me (top)</Button>
          </TooltipTrigger>
          <TooltipContent side="top">Tooltip on top</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outline" size="sm">Hover me (right)</Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>Tooltip on right</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button variant="outline" size="sm">Hover me (bottom)</Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Tooltip on bottom</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export function SelectDemo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ds-space-3)', maxWidth: '24rem' }}>
      <Select defaultValue="">
        <option value="" disabled>Choose an option…</option>
        <option value="a">Option A</option>
        <option value="b">Option B</option>
        <option value="c">Option C</option>
      </Select>
      <Select invalid defaultValue="">
        <option value="" disabled>Invalid select</option>
        <option value="x">Option X</option>
      </Select>
      <Select disabled defaultValue="">
        <option value="" disabled>Disabled select</option>
      </Select>
    </div>
  );
}
