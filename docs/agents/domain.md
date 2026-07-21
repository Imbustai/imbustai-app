# Domain Docs

## Before exploring

- Read root `CONTEXT-MAP.md` when it exists, then each context’s `CONTEXT.md` relevant to the work.
- Read applicable system-wide ADRs in `docs/adr/` and context-scoped ADRs.
- If these files do not exist, proceed silently; create them only when a domain term or decision is resolved.

## Layout

This is a multi-context monorepo:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                     ← system-wide decisions
├── apps/
│   └── website/
│       ├── CONTEXT.md
│       └── docs/adr/
└── packages/
    ├── story-engine/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    ├── ds/
    │   ├── CONTEXT.md
    │   └── docs/adr/
    └── i18n/
        ├── CONTEXT.md
        └── docs/adr/
```

## Consumer rules

Use the glossary’s established vocabulary in issues, proposals, hypotheses, and tests. If a needed concept is absent, reconsider the wording or record the gap for domain modeling.

Explicitly surface conflicts with existing ADRs rather than silently overriding them.
