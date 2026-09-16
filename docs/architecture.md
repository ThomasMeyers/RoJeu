# Snake Architecture Map

## Core Principle

Keep game rules in `src/game/*` and orchestration/render/input in `src/scenes/*`.

## Module Responsibilities

- `src/game/types.ts`
  - Shared domain types for run state, meta state, entities, phases, deaths, and stats.
- `src/game/runState.ts`
  - Pure run progression logic: direction queueing, step tick, collisions, score changes by source, run endings, timed effect lifecycle.
- `src/game/spawnSystem.ts`
  - Spawn/update presence of entities on grid (orb + pickup spawns, including per-type cap rules).
- `src/game/pickupCatalog.ts`
  - Declarative pickup definitions (spawn chance source, per-type limits, collect behavior, visual token/color).
- `src/game/boundary.ts`
  - Boundary rule resolver (`wall-kill` vs `wrap-around`) for movement outcomes.
- `src/game/visibility.ts`
  - Visibility utility used for fog and hidden entities.
- `src/game/metaState.ts`
  - Persistent progression lifecycle (`load`, `save`, unlock checks, upgrade checks, store item view models).
- `src/game/talentCatalog.ts`
  - Declarative talent catalog (title/description/levels/costs/availability/effect IDs/unlock rules/store row ordering).
- `src/game/storyCatalog.ts`
  - Declarative copy for the title screen, the intro beats (stable IDs + optional `shake` /
    `punchline` effect) and the mission brief.
- `src/game/storySequencer.ts`
  - Pure intro progression: typewriter reveal, "first input completes the line, next one advances",
    effect trigger timing and the `effectTriggerSkipped` flag behind the skip quip.
- `src/game/finaleRiddle.ts`
  - Pure finale riddle: answer normalisation (case, accents, punctuation, apostrophes, spaces),
    step progression without reset, wrong-answer quip rotation.
- `src/game/finaleSpeech.ts`
  - Pure finale speech progression: screens whose lines are revealed one by one, the optional aside
    once a screen is complete, rewind to a previous screen (shown whole), and the revealed-character
    count handed to the typed text block.
- `src/game/finaleCatalog.ts` + `src/game/finaleSecret.ts`
  - Finale copy in clear (riddle prompts, quips, labels) and the decoder for the generated base64
    secret (answers, speech screens, closing). `finaleSecret.ts` is written by
    `scripts/encode-finale.mjs` from the git-ignored `finale.local.json` (ADR 0005).
- `src/game/effects/schema.ts` + `src/game/effects/engine.ts`
  - Run stat modifier schema and effect aggregation pipeline (`orb_yield` boosts `orbPointsMultiplier`, `passive_income` boosts `passiveIncomePointsPerSecond`, `vision_bonus_orb` boosts pickup spawn chance, `no_walls` sets `boundaryMode` to `wrap-around`).
- `src/scenes/TitleScene.ts`
  - Menu shown on every launch: new game (with reset confirmation over an existing save),
    continue (enabled by `hasSavedMeta()`), rejected-names easter egg on the title.
- `src/scenes/StoryScene.ts`
  - Intro staging (per-line typewriter layout, camera shake, punchline fade, blinking ▼) and
    mission brief; its CTA writes a fresh save and starts `GameScene`.
- `src/scenes/FinaleScene.ts`
  - Ending staging: typed riddle input, speech screens (typewriter, line-by-line reveal, asides,
    rewind), closing card, fade back to `TitleScene`.
- `src/scenes/GameScene.ts`
  - Orchestration only: owns run + meta state, drives the fixed-step loop, delegates all
    drawing and interaction to the modules below.
- `src/render/layout.ts`
  - Board geometry (grid, cell size, offsets, centers) and the shared colour palette.
- `src/render/boardRenderer.ts`
  - Stateless draw functions for board, entities, slug and fog, plus the coffee pickup text pool.
- `src/ui/hudView.ts`
  - Top status bar, bottom status line, and the in-run `commit sudoku` button.
- `src/ui/endScreenView.ts`
  - Game-over overlay: title, contextual subtitle, run stats, restart/store CTAs, and the finale
    replay button (in place of the store hint) once `ending_unlock` is owned.
- `src/ui/storeView.ts`
  - Store chrome, scroll state and the talent detail popup.
- `src/ui/storeCardGrid.ts`
  - The talent card grid: layout maths, scroll clipping, per-card styling and locked states.
- `src/ui/menuButton.ts`
  - Mouse + keyboard menu button (hover, press, focus ring, disabled) used by the menu scenes.
- `src/ui/typedTextBlock.ts`
  - Centred typewriter text block (one text per wrapped line), shared by `StoryScene` and `FinaleScene`.
- `src/input/keyboardControls.ts`
  - Keyboard and wheel bindings, wired to scene-supplied handlers.

## Scene Flow

```mermaid
flowchart LR
  title[TitleScene] -->|new game, no save| story[StoryScene]
  title -->|new game, save exists| confirm{Confirm reset}
  confirm -->|yes: clearMetaState| story
  confirm -->|no| title
  title -->|continue: hasSavedMeta| game[GameScene]
  story -->|mission CTA: saveMetaState default| game
  game -->|buy ending_unlock, or replay button| finale[FinaleScene]
  finale -->|closing card| title
```

## Runtime Data Flow

```mermaid
flowchart TD
  userInput[UserInput] --> queueDir[queueDirection]
  queueDir --> runStep[stepRunTick]
  runStep --> pickupSpawn[pickupSpawnTick]
  pickupSpawn --> pickups[pickupEntities]
  runStep --> runState[RunState]
  runState --> redraw[GameSceneRedraw]
  redraw --> overlays[HudEndStoreOverlays]
  runState --> runEnded{RunEnded}
  runEnded -->|yes| commitMeta[CommitRunPoints]
  commitMeta --> metaState[MetaStateLocalStorage]
  metaState --> storeUi[StoreViewRefresh]
```

## State Separation

- `RunState`: ephemeral state for one run.
  - Includes timed effects and pickup spawn accumulators.
- `MetaState`: persistent progression across runs.
- Store UI reads and mutates `MetaState`, while run loop mutates `RunState`.

## Points Pipeline

- Score gains are applied by source (`orb`, `passive_income`) inside run logic.
- Source multiplier and global multiplier are resolved in run stats (`orbPointsMultiplier`, `globalPointsMultiplier`).
- Fractional results are preserved in run state remainder before adding whole points to score.

## Pickup and Buff Pipeline

- Pickup spawn chances are read from `RunStats.pickupSpawnChancePerSecond`.
- Spawn rolls happen once per elapsed second with catch-up on delayed frames.
- Pickup cap is enforced per pickup type (`maxConcurrent`).
- Pickup collect actions can grant points and/or timed effects.
- Timed effects are additive on matching stats and expire independently.

## Test Coverage

Unit tests live next to the module they cover, as `src/game/*.test.ts`, and run on Vitest
(`npm test`). They cover pure logic only — anything that needs Phaser or the DOM is out of scope.

- `boundary.test.ts`: `wall-kill` vs `wrap-around` resolution on every grid edge.
- `effects/engine.test.ts`: stat aggregation, unknown-effect tolerance, per-pickup spawn chances.
- `runState.test.ts`: phase transitions, direction queueing and reversal guard, wall/self collision,
  life loss vs run end, timer expiry, orb scoring with multipliers, fractional point carry-over,
  timed-effect vision and speed resolution.
- `storySequencer.test.ts`: typewriter reveal and carry-over, first input completes a line,
  beat advance, punchlines shown whole, `finished` on the last beat, unique intro beat IDs.
- `finaleRiddle.test.ts`: answer normalisation, exact words required, progression without reset,
  blank input ignored, quip rotation. It uses stand-in answers: the real ones never appear in clear.
- `finaleSpeech.test.ts`: screen normalisation, line-by-line reveal, screen transitions, rewind and
  already-reached screens shown whole, revealed-character offsets.
- `finaleCatalog.test.ts`: UTF-8 base64 round-trip, and the committed secret fits the riddle.
- `metaState.test.ts`: save loading and corrupt-save fallback, `hasSavedMeta` / `clearMetaState`, talent costs, unlock chains
  (`no_walls`, `speed_boost_pickup`, then `ending_unlock`), purchase side effects, level clamping, store view models.

Two things the suite deliberately does not prove:

- The scene and the `render/` + `ui/` modules are untested (they need Phaser and a canvas).
  A green suite is not a substitute for one manual run check.
- Spawn placement is random. Tests park an orb in a known cell so `ensureOrbSpawn` bails out early,
  which keeps `stepRun` deterministic; do the same rather than stubbing `Math.random`.

## Extension Points

- Add gameplay effect: define in `effects/schema.ts`, bind via `talentCatalog.ts`.
- Add talent UI behavior: `metaState.ts` for unlock/upgrade rule checks + `ui/storeView.ts` /
  `ui/storeCardGrid.ts` for presentation/interactions.
- Add pickup: declare in `pickupCatalog.ts`, wire chance via `effects/schema.ts`, render via `render/boardRenderer.ts`.
- Add entities: extend `EntityKind` in `types.ts`, spawn logic in `spawnSystem.ts`, render path in `render/boardRenderer.ts`.
