# Snake Agent Quickstart

This file is the fastest onboarding path for an agent working on `Personal Projects/Snake`.

## Current Scope (decided 12/09/2026)

- **Target: desktop keyboard only.** Mobile / touch support is out of scope and was never
  implemented (no swipe handler exists) — do not add one without an explicit request.
- **No deployment.** The game is shared by giving repo access; the recipient runs it locally
  (`npm install`, `npm run dev`). Do not add hosting, CI, or deploy config.
- Known gaps, tracked in `docs/implementation-plan.md` (M5): no lint/format config, and the
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
- `GameScene` -> `FinaleScene` when `ending_unlock` is bought in the store, or from the end-screen
  "Relire le discours" button once owned. Every visit starts again at the riddle. `FinaleScene`
  ends on `TitleScene`.

## Read In This Order

1. `CLAUDE.md` (guardrails and scope)
2. `docs/project-notes.md` (product scope, backlog and store spec; `README.md` is the
   player-facing landing page and deliberately says nothing about the finale)
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
- `ending_unlock`: last talent (row 4, 10 000 p., every other talent maxed). No gameplay effect:
  buying it opens `FinaleScene`.
- `finale`: riddle (complete three lines by typing; wrong answers show a rotating quip, no reset)
  -> speech -> closing card -> title screen.
- `speech screen`: one screen of the speech. Its `lines` are revealed one per input and stay on
  screen; its optional `aside` fades in below, small and italic, once every line is out. ↑/← goes
  back one whole screen, shown complete.
- `finale secret`: riddle answers + speech + closing, base64-encoded in `src/game/finaleSecret.ts`
  from the git-ignored `finale.local.json` (ADR 0005).

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
- Finale riddle, answer tolerance, quips, labels -> `src/game/finaleRiddle.ts`, `src/game/finaleCatalog.ts`
- Finale speech progression (screens, lines, aside, rewind) -> `src/game/finaleSpeech.ts`
- Finale answers, speech, closing text -> `finale.local.json`, then `npm run encode-finale`
  (never edit `src/game/finaleSecret.ts` by hand)
- Finale staging, typing, paragraph navigation -> `src/scenes/FinaleScene.ts`, `src/ui/typedTextBlock.ts`

## Known Gotchas

- Store click-through bugs can happen if end-screen inputs remain interactive while store is open.
- Keep `runCommitted` semantics intact: run points should be committed once when run ends.
- Visibility must hide entities outside vision radius both in logic and render path.
- Keep store UI-only changes separate from gameplay effect activation unless explicitly requested.
- Pickup spawn caps are per pickup type (not global across all pickups).
- Never commit finale content in clear: not `finale.local.json`, and not the real riddle answers in
  tests, docs or commit messages. Only the generated base64 `finaleSecret.ts` is versioned.
- Phaser replays its pending key queue on every new key until the frame ends (its duplicate guard
  only compares with the previous event), so a burst of keys within one frame can reach a `keydown`
  handler twice. `FinaleScene` handles each native event once (`handledKeyEvents`); `StoryScene`
  does not, so a very fast double press can skip an intro beat.

## Storage Policy TODO

- TODO: Keep `snake-meta` simple; if save schema changes again, prefer a clean reset over legacy migration code unless continuity is explicitly requested.

## Quick Validation Before Handoff

- `npm test` (unit tests on pure game logic)
- `npm run build`
- Verify the entry flow: menu -> new game -> intro -> mission CTA -> `GameScene`, and
  "Continuer" after a reload
- Verify one full run lifecycle: `waiting_start -> running -> ended`
- Verify store flow: open -> inspect card -> upgrade -> close without side effects
- If the finale changed: `npm run dev-save` gives a console snippet seeding a save ready to buy
  `ending_unlock` (`-- ending` for one that already owns it). Then buy the talent, solve the riddle,
  read to the closing card, and check the replay button on the end screen
