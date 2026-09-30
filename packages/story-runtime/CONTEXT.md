# Story runtime

How an epistolary story is stored, played turn by turn, and tested. Engines plug into this context; each one owns the shape of its Stories' data.

## Language

### Stories and engines

**Story**:
A sellable piece of interactive epistolary fiction, bound to exactly one Engine; its content is data shaped by that Engine's schema.
_Avoid_: scenario, game (a Game is one playthrough)

**Engine**:
A package that defines how one kind of Story is stored (its data schema) and played (its algorithm), plugged into the turn lifecycle through Hooks.
_Avoid_: story engine, game master

**Hook**:
A named point in the turn lifecycle where the platform hands control to the Story's Engine, such as starting a Game or generating a Turn's replies.
_Avoid_: phase, event

### Play

**Game**:
One playthrough of a Story, created from a paid order or by a Run.
_Avoid_: session, match

**Player**:
The human playing a Game.
_Avoid_: user (inside a story)

**Lead**:
The in-fiction investigator the Player writes as; every Character addresses the Lead.
_Avoid_: protagonist, player character, Mercier

**Character**:
An in-fiction correspondent of a Story who writes Letters to the Lead and can be written to.
_Avoid_: NPC

**Contact**:
A Character the Player can currently write to in a Game.

**Turn**:
The Player's batch of Letters (at most three) together with every Letter and Dispatch it triggers.
_Avoid_: exchange, phase, round

**Letter**:
A piece of correspondence written by the Player or by a Character.

**Dispatch**:
A short telegram or newspaper clipping sent to the Lead on its own, carrying a scheduled event; the Player never sends one.
_Avoid_: event letter, notification

**Subplot**:
A self-contained thread with its own resolution, carried by one Character alongside the main mystery.
_Avoid_: side quest, side story

**Ending**:
The outcome of a Game, decided by the Engine from what the Player actually did, never at a model's discretion.

**Epilogue**:
A Letter delivered after the final Turn that needs no reply, such as the tribunal's verdict.

**Enclosure**:
A text-only document or clipping slipped inside a Letter's envelope, such as a certificate; the admin may reword it, only the Engine decides which a Letter carries, and the Player never encloses anything.
_Avoid_: attachment

**Closing batch**:
The Epilogues and Dispatches the Engine writes once it resolves an Ending; it has no Player Letters, is reviewed like any Turn, and sending it completes the Game.
_Avoid_: final turn, epilogue turn

### Letter writing

**Plot key**:
A fact the Story fixes because the mystery depends on it — the culprit, the victims, the evidence, the timeline; no Character may invent or alter one.
_Avoid_: canon fact, clue

**Texture**:
Invented, non-decisive detail — tastes, décor, weather, habits — that makes a Letter concrete; Characters must supply it and it may never touch a Plot key.
_Avoid_: flavour, filler

**Ledger**:
The per-Game record of every piece of Texture that reached the Player, so later Letters stay consistent with it.

**Signature**:
An optional authored trait of a Character that seeds its Texture; its showpiece use happens at most once per Story, so it never becomes a tic.
_Avoid_: quirk, catchphrase

### Models

**Model role**:
What a model call is for — `writer` (Characters' Letters, Epilogues), `clerk` (offices, documents), `analyst` (reader, reply-rule checker) or `player` (Runs only); Engines ask for AI by role, never by model.

**Model profile**:
The model and effort serving each Model role in one Game, optionally overridden for a single Character; the Story sets a default, the admin or a Run can override it at start, and the Game keeps the profile it started with.
_Avoid_: model config, provider setting

### Quality assurance

**Run**:
A QA Game in which an AI writes as the Lead, Turns are approved automatically, and a cost cap stops it; its models are parameters of the Run.
_Avoid_: simulation, sim, test game
