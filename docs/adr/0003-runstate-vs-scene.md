# ADR 0003 - Rule logic in game modules, orchestration in scene

## Status

Accepted — refined by ADR 0004 (the scene no longer holds rendering and input itself).

## Context

UI and gameplay changes happen frequently. Mixing rendering/input details with core rule logic creates regression risk and slows changes.

## Decision

- Keep core rules in `src/game/*` modules.
- Keep Phaser orchestration, rendering, and input in `src/scenes/GameScene.ts`.
- Use shared types to enforce consistent contracts.

## Consequences

- Easier debugging by layer (logic vs UI).
- Lower risk when iterating store and overlays.
- Clearer extension path for new entities or effects.

