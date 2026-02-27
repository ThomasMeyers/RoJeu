# Agent Playbooks

Use these task-driven playbooks to avoid wide exploration.

## 1) Fix Gameplay Bug

### Read first

- `src/game/types.ts`
- `src/game/runState.ts`
- `src/game/spawnSystem.ts` (if entity-related)
- `src/game/boundary.ts` (if movement edge-related)

### Typical steps

1. Reproduce with current phase/inputs and identify if bug belongs to run logic or render logic.
2. Patch `src/game/*` first for rule correctness.
3. If visual mismatch remains, patch `src/scenes/GameScene.ts`.
4. Run `npm run build`.

### Gotchas

- Do not break first-input start semantics (`waiting_start`).
- Keep death reason consistency for end-screen subtitles.

## 2) Fix Store / Overlay UI Bug

### Read first

- `src/scenes/GameScene.ts`
- `src/game/metaState.ts`
- `src/game/talentCatalog.ts`

### Typical steps

1. Verify whether issue is data state (`metaState`) or interaction/render (`GameScene`).
2. Check store open/close and popup selection invariants.
3. Guard against input propagation and hidden interactive layers.
4. Run `npm run build`.

### Gotchas

- Prevent click-through from store to end-screen CTA.
- Preserve selected talent during repeated upgrades.
- Refresh both popup and card list after purchase.

## 3) Add Talent (UI-only)

### Read first

- `src/game/talentCatalog.ts`
- `src/game/metaState.ts`
- `src/scenes/GameScene.ts`

### Typical steps

1. Add catalog entry with `id/title/description/imageToken/maxLevel/costsByLevel/isAvailable/unlockRule/storeRow/storeOrder`.
2. Ensure `effectIdsByLevel` is present even if empty placeholders.
3. Validate unlock behavior (`unlockRule`) and max behavior (`MAX`).
4. Run `npm run build`.

### Gotchas

- Keep `costsByLevel.length >= maxLevel`.
- Do not activate gameplay effects unless requested.

## 4) Add Talent with Gameplay Effect

### Read first

- `src/game/talentCatalog.ts`
- `src/game/effects/schema.ts`
- `src/game/effects/engine.ts`
- `src/game/pickupCatalog.ts` (if the talent spawns pickups or applies timed effects)
- `src/game/runState.ts` (only if effect needs explicit runtime hook)

### Typical steps

1. Add effect definition in `effects/schema.ts`.
2. Reference effect ID in `talentCatalog.ts` level mapping.
3. Confirm run stat resolution reflects effect.
4. If dynamic behavior is needed, add minimal hook in `runState.ts`.
5. If the effect introduces pickups/buffs, define collect/spawn rules in `pickupCatalog.ts`.
6. Run `npm run build` and perform one manual run check.

### Gotchas

- Prefer declarative stat effects before runtime branching.
- Save compatibility is optional in this single-user project unless explicitly requested.
