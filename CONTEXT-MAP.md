# Context Map

## Contexts

- [Story runtime](./packages/story-runtime/CONTEXT.md) — stories, engines, games, turns, letters and runs: the language of playing an epistolary story and testing it
- [engine-voss](./packages/engine-voss/CONTEXT.md) — the Voss story's Engine: writer views, offices, trust, layers, ladders, clues, evidence, routes
- [Design system](./packages/ds/CONTEXT.md) — Letter Markdown: how a Letter's text is edited (rich-text editor), persisted and rendered

## Relationships

- **Website → Story runtime**: the website drives the turn lifecycle (submit, generate, review, approve) and renders letters; at each Hook the runtime hands control to the Story's Engine.
- **Engines → Story runtime**: each Engine is its own package; it plugs into the runtime's Hooks and owns the schema of its Stories' data.
- **Website → Design system**: every surface that shows or edits a Letter's text uses the DS `LetterContent` renderer and `RichTextEditor`; Letters stay Markdown strings in the runtime ([ADR 0003](./docs/adr/0003-markdown-as-canonical-letter-content.md)).
