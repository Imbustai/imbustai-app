# Markdown as canonical letter content

Letters are persisted as Markdown text, edited through the open-source Tiptap editor, and rendered only through the design system’s `LetterContent` component. This preserves the existing text data, keeps content portable for AI and future exports, and gives every reader the same safe Markdown rendering rather than persisting editor-specific ProseMirror JSON.

## Consequences

The editor must convert between Markdown and its internal document model. Its supported formatting is intentionally limited to the documented Letter Markdown profile, and non-representable pasted content is preserved as plain text.

The Tester mailbox sets received Letters as paper (typed sheets, clippings, a hand per person; ticket #43). Those renderers read the same Letter Markdown but keep their own typography, so they are the one exception to `LetterContent`; everything the Player writes, and every admin view, goes through it.
