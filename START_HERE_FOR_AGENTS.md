# Snake Agent Quickstart

This file is the fastest onboarding path for an agent working on `Personal Projects/Snake`.

## Read In This Order

1. `CLAUDE.md` (guardrails and scope)
2. `README.md` (product scope and current milestones)
3. `docs/architecture.md` (module map and data flow)
4. `docs/agent-playbooks.md` (task-based execution guide)
5. `docs/doc-maintenance.md` (what docs to update after code changes)

## Project Glossary

- `run`: one timed gameplay session.
- `meta`: persistent progression (`totalPoints`, `talentLevels`, `runCount`) in local storage.
- `talent`: upgrade definition from catalog with level/cost rules.
- `store`: end-of-run overlay used to inspect and upgrade talents.
- `orb`: target entity collected repeatedly during a run.
- `pickup`: non-orb entity with dedicated spawn rules and on-collect behavior.
- `orb_yield`: active gameplay talent; each level adds +10% to orb score gain.
- `passive_income`: active gameplay talent; each level adds +1 point/s while the run is active.
- `vision_bonus_orb`: talent that unlocks `vision_clarity_orb` pickup spawns (+3% chance/level/sec).
- `no_walls`: talent that switches boundary mode to `wrap-around` (no wall deaths).
- `vision_clarity_orb`: white pickup, no points, applies a temporary vision boost.

## Naming Convention

- Keep technical IDs stable and descriptive (`talent.id`, effect IDs, stat keys), independent from UI copy.
- UI labels/descriptions can be humorous and can change without forcing code-level renames.
- During the current single-user phase, save continuity is optional; schema changes can reset storage when needed.

## If Request Mentions X, Open Y

- Run timer, collisions, start/stop phases -> `src/game/runState.ts`, `src/game/types.ts`
- Spawn behavior, orb appearance -> `src/game/spawnSystem.ts`
- Pickup definitions, on-collect effects -> `src/game/pickupCatalog.ts`
- Fog of war / vision radius -> `src/game/visibility.ts`, `src/scenes/GameScene.ts`
- Store cards, popup, click behavior -> `src/scenes/GameScene.ts`, `src/game/metaState.ts`
- Talent definitions, availability, costs -> `src/game/talentCatalog.ts`
- Effect computation and run stat modifiers -> `src/game/effects/schema.ts`, `src/game/effects/engine.ts`
- Talent images, art, icons -> `docs/talent-art-guide.md`

## Known Gotchas

- Store click-through bugs can happen if end-screen inputs remain interactive while store is open.
- Keep `runCommitted` semantics intact: run points should be committed once when run ends.
- Visibility must hide entities outside vision radius both in logic and render path.
- Keep store UI-only changes separate from gameplay effect activation unless explicitly requested.
- Pickup spawn caps are per pickup type (not global across all pickups).

## Storage Policy TODO

- TODO: Keep `snake-meta` simple; if save schema changes again, prefer a clean reset over legacy migration code unless continuity is explicitly requested.

## Quick Validation Before Handoff

- `npm run build`
- Verify one full run lifecycle: `waiting_start -> running -> ended`
- Verify store flow: open -> inspect card -> upgrade -> close without side effects
