# Snake Agent Quickstart

This file is the fastest onboarding path for an agent working on `Personal Projects/Snake`.

## Read In This Order

1. `AGENTS.md` (guardrails and scope)
2. `README.md` (product scope and current milestones)
3. `docs/architecture.md` (module map and data flow)
4. `docs/agent-playbooks.md` (task-based execution guide)
5. `docs/doc-maintenance.md` (what docs to update after code changes)

## Project Glossary

- `run`: one timed gameplay session.
- `meta`: persistent progression (`totalPoints`, `talentLevels`, `runCount`) in local storage.
- `talent`: upgrade definition from catalog with level/cost rules.
- `store`: end-of-run overlay used to inspect and upgrade talents.
- `rogie`: target entity to catch repeatedly during a run.

## If Request Mentions X, Open Y

- Run timer, collisions, start/stop phases -> `src/game/runState.ts`, `src/game/types.ts`
- Spawn behavior, Rogie appearance -> `src/game/spawnSystem.ts`
- Fog of war / vision radius -> `src/game/visibility.ts`, `src/scenes/GameScene.ts`
- Store cards, popup, click behavior -> `src/scenes/GameScene.ts`, `src/game/metaState.ts`
- Talent definitions, availability, costs -> `src/game/talentCatalog.ts`
- Effect computation and run stat modifiers -> `src/game/effects/schema.ts`, `src/game/effects/engine.ts`

## Known Gotchas

- Store click-through bugs can happen if end-screen inputs remain interactive while store is open.
- Keep `runCommitted` semantics intact: run points should be committed once when run ends.
- Visibility must hide entities outside vision radius both in logic and render path.
- Keep store UI-only changes separate from gameplay effect activation unless explicitly requested.

## Quick Validation Before Handoff

- `npm run build`
- Verify one full run lifecycle: `waiting_start -> running -> ended`
- Verify store flow: open -> inspect card -> upgrade -> close without side effects

