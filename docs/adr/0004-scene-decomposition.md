# ADR 0004 - Split the Phaser scene into render, ui and input modules

## Status

Accepted

## Context

`src/scenes/GameScene.ts` had grown to 1440 lines — 56% of the codebase — holding the game loop,
every draw call, the HUD, the end screen, the whole talent store, and the input bindings in one
class with about forty private fields. ADR 0003 had deliberately parked all of that in the scene,
which was the right call while the scene was small. It no longer was: an upcoming main launch
screen would have landed in the same file.

## Decision

Keep ADR 0003's core split (rules in `src/game/*`, orchestration in the scene) and subdivide the
orchestration side along the layers the implementation plan had already named:

- `src/render/layout.ts` — board geometry and the shared palette, imported by everything that draws.
- `src/render/boardRenderer.ts` — stateless draw functions taking a `Graphics` and a `RunState`.
- `src/ui/hudView.ts`, `src/ui/endScreenView.ts`, `src/ui/storeView.ts`, `src/ui/storeCardGrid.ts` —
  one class per overlay, each owning its own game objects and exposing `create` / `setVisible` /
  `refresh`. Scene-supplied callbacks carry every action back out.
- `src/input/keyboardControls.ts` — key and wheel bindings wired to handlers.

`GameScene` keeps run and meta state, the fixed-step loop, and the phase orchestration in `redraw()`.

## Consequences

- The scene drops from 1440 to 182 lines; no module exceeds 500.
- A new screen is a new `ui/` class plus a branch in `redraw()`, not an edit to a god file.
- **Creation order is load-bearing.** End-screen objects and the sudoku button carry no explicit
  `depth`, so their stacking depends on the order they are added in `create()`. The refactor
  preserves that order exactly, and it must stay preserved.
- Views hold a live reference to `MetaState`; the scene mutates that object rather than reassigning
  it, so the store sees point changes without a re-wiring step.
- Nothing here is covered by the Vitest suite — these modules need Phaser and a canvas. Changes to
  them still require a manual run check.
