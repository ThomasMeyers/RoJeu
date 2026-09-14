# Snake Agent Quickstart

This file is the fastest onboarding path for an agent working on `Personal Projects/Snake`.

## Current Scope (decided 12/09/2026)

- **Target: desktop keyboard only.** Mobile / touch support is out of scope and was never
  implemented (no swipe handler exists) — do not add one without an explicit request.
- **No deployment.** The game is shared by giving repo access; the recipient runs it locally
  (`npm install`, `npm run dev`). Do not add hosting, CI, or deploy config.
- Known gaps, tracked in `IMPLEMENTATION_PLAN.md` (M5): no lint/format config, and the
  "slime trail" visual effect from the original plan was never built.
- Pure game logic is covered by Vitest (`src/game/*.test.ts`); the scene and the `render/` +
  `ui/` modules are not, so a green suite does not prove anything still renders — do a manual
  run check too.
- Z-order trap: end-screen objects and the sudoku button carry no explicit `depth`, so their
  stacking depends on creation order in `GameScene.create()`. Do not reorder it casually.

## Scene Flow

- `TitleScene` (shown on every launch) -> "Lancer une nouvelle partie" -> `StoryScene`
  (intro beats, then mission brief) -> `GameScene`.
- `TitleScene` -> "Continuer" (enabled only when `hasSavedMeta()`) -> `GameScene` directly.
- New game over an existing save asks for confirmation, then `clearMetaState()`. The save is
  recreated only when the mission CTA is clicked, so quitting mid-intro leaves no save.
- There is no way back to the menu from `GameScene` (out of scope, decided 14/09/2026).

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
- `intro beat`: one line of the new-game intro (`INTRO_BEATS`), revealed by typewriter unless its
  effect is `punchline` (shown whole, faded in). `shake` shakes the camera when the typewriter
  reaches the beat's `effectTrigger` word (or on entry without one). Rushing the line past that
  word shows the beat's `effectSkipQuip` under the text.
- `mission brief`: the screen after the intro, whose CTA creates the save and starts `GameScene`.
- `rejected names`: joke titles cycled by clicking the placeholder title on the menu.

## Naming Convention

- Keep technical IDs stable and descriptive (`talent.id`, effect IDs, stat keys), independent from UI copy.
- UI labels/descriptions can be humorous and can change without forcing code-level renames.
- During the current single-user phase, save continuity is optional; schema changes can reset storage when needed.

## If Request Mentions X, Open Y

- Run timer, collisions, start/stop phases -> `src/game/runState.ts`, `src/game/types.ts`
- Spawn behavior, orb appearance -> `src/game/spawnSystem.ts`
- Pickup definitions, on-collect effects -> `src/game/pickupCatalog.ts`
- Fog of war / vision radius -> `src/game/visibility.ts`, `src/render/boardRenderer.ts`
- Store cards, popup, click behavior -> `src/ui/storeCardGrid.ts`, `src/ui/storeView.ts`, `src/game/metaState.ts`
- HUD, end screen -> `src/ui/hudView.ts`, `src/ui/endScreenView.ts`
- Board / slug / entity drawing, colors, geometry -> `src/render/boardRenderer.ts`, `src/render/layout.ts`
- Key bindings, mouse wheel -> `src/input/keyboardControls.ts`
- Game loop, phase orchestration -> `src/scenes/GameScene.ts`
- Talent definitions, availability, costs -> `src/game/talentCatalog.ts`
- Effect computation and run stat modifiers -> `src/game/effects/schema.ts`, `src/game/effects/engine.ts`
- Talent images, art, icons -> `docs/talent-art-guide.md`
- Title screen, new game / continue, reset confirmation -> `src/scenes/TitleScene.ts`, `src/game/metaState.ts`
- Intro text, mission text, title copy, rejected names -> `src/game/storyCatalog.ts`
- Typewriter / beat progression rules -> `src/game/storySequencer.ts`; staging -> `src/scenes/StoryScene.ts`
- Keyboard-focusable menu buttons -> `src/ui/menuButton.ts`

## Known Gotchas

- Store click-through bugs can happen if end-screen inputs remain interactive while store is open.
- Keep `runCommitted` semantics intact: run points should be committed once when run ends.
- Visibility must hide entities outside vision radius both in logic and render path.
- Keep store UI-only changes separate from gameplay effect activation unless explicitly requested.
- Pickup spawn caps are per pickup type (not global across all pickups).

## Storage Policy TODO

- TODO: Keep `snake-meta` simple; if save schema changes again, prefer a clean reset over legacy migration code unless continuity is explicitly requested.

## Quick Validation Before Handoff

- `npm test` (unit tests on pure game logic)
- `npm run build`
- Verify the entry flow: menu -> new game -> intro -> mission CTA -> `GameScene`, and
  "Continuer" after a reload
- Verify one full run lifecycle: `waiting_start -> running -> ended`
- Verify store flow: open -> inspect card -> upgrade -> close without side effects
