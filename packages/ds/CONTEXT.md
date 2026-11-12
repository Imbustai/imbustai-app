# Design system

The shared components every app renders with. This glossary covers how a Letter's text is authored, stored and shown.

## Letter content

**Letter Markdown**:
The canonical, persisted plain-text representation of a letter’s authored content. It is edited through a rich-text surface and rendered consistently wherever a letter is read.
_Avoid_: HTML letter, ProseMirror document, editor JSON

**Letter Markdown profile**:
The supported authored subset: paragraphs, headings, bold, italic, bullet and numbered lists, blockquotes, horizontal rules, links, and tables. Images, embeds, raw HTML, and other unsupported Markdown are excluded; links open in a separate tab with protective relationship attributes.

**Rich-text prose field**:
A human-authored narrative field edited as Letter Markdown through Tiptap. Structured JSON and configuration fields are not rich-text prose fields and remain plain textareas.
_Avoid_: JSON editor, configuration editor

**Rich-text toolbar**:
The shared editing controls available in every rich-text prose field: undo, redo, headings, bold, italic, lists, blockquotes, horizontal rules, links, and tables.

**Rich-text heading**:
An editor-supported heading level from H1 through H6. The rich-text component does not restrict heading levels based on the context in which it is used.

**Rich-text heading control**:
The shared H1–H6 heading dropdown displayed by every rich-text prose field.

**Letter body renderer**:
The single component that turns Letter Markdown into readable content. It renders only the body; page-level components own sender, recipient, date, and surrounding layout.

**Letter length**:
The maximum length of a player letter is measured against its persisted Letter Markdown string, including formatting syntax.

**Letter authoring mode**:
A rich-text, visual editing experience with no raw-Markdown source mode. Letter Markdown remains the persisted representation.

**Letter table**:
A plain, Markdown-compatible table with a header row and ordinary body cells. It has no merged cells, column resizing, or cell-level styling; the header row is its only visual distinction.

**Unsupported pasted content**:
Pasted formatting outside the Letter Markdown profile is converted to its readable plain text rather than being retained as markup or discarded.

**Letter line break**:
A paragraph boundary created with Enter; Shift+Enter creates a compact line break within the same paragraph, such as in a signature or address block.
