# Context Map

## Contexts

- [Story runtime](./packages/story-engine/CONTEXT.md) — stories, engines, games, turns, letters and runs: the language of playing an epistolary story and testing it

## Relationships

- **Website → Story runtime**: the website drives the turn lifecycle (submit, generate, review, approve) and renders letters; at each Hook the runtime hands control to the Story's Engine.
- **Engines → Story runtime**: each Engine is its own package; it plugs into the runtime's Hooks and owns the schema of its Stories' data.
