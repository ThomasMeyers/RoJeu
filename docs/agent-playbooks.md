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
3. If visual mismatch remains, patch `src/ui/storeCardGrid.ts` (cards) or `src/ui/storeView.ts` (chrome, popup).
4. Run `npm test`, then `npm run build`.

### Gotchas

- Do not break first-input start semantics (`waiting_start`).
- Keep death reason consistency for end-screen subtitles.

## 2) Fix Store / Overlay UI Bug

### Read first

- `src/scenes/GameScene.ts`
- `src/game/metaState.ts`
- `src/game/talentCatalog.ts`

### Typical steps

1. Verify whether issue is data state (`metaState`) or interaction/render (`ui/storeView.ts`, `ui/storeCardGrid.ts`).
2. Check store open/close and popup selection invariants.
3. Guard against input propagation and hidden interactive layers.
4. Run `npm test`, then `npm run build`.

### Gotchas

- Prevent click-through from store to end-screen CTA.
- Preserve selected talent during repeated upgrades.
- Refresh both popup and card list after purchase.

## 3) Add Talent (UI-only)

### Read first

- `src/game/talentCatalog.ts`
- `src/game/metaState.ts`
- `src/scenes/GameScene.ts`
- `docs/talent-art-guide.md` (for image generation)

### Typical steps

1. Add catalog entry with `id/title/description/imageToken/imageAsset/maxLevel/costsByLevel/isAvailable/unlockRule/storeRow/storeOrder`.
2. Generate a talent icon following `docs/talent-art-guide.md` and save to `public/assets/talents/{talent_id}.png`.
3. Set `imageAsset: 'talent_{id}'` in the catalog entry.
4. Ensure `effectIdsByLevel` is present even if empty placeholders.
5. Validate unlock behavior (`unlockRule`) and max behavior (`MAX`).
6. Run `npm test`, then `npm run build`.

### Gotchas

- Keep `costsByLevel.length >= maxLevel`.
- Do not activate gameplay effects unless requested.
- For slug-featuring icons, always attach the reference image for character consistency (see art guide).

## 4) Add Talent with Gameplay Effect

### Read first

- `src/game/talentCatalog.ts`
- `src/game/effects/schema.ts`
- `src/game/effects/engine.ts`
- `src/game/pickupCatalog.ts` (if the talent spawns pickups or applies timed effects)
- `src/game/runState.ts` (only if effect needs explicit runtime hook)
- `docs/talent-art-guide.md` (for image generation)

### Typical steps

1. Add effect definition in `effects/schema.ts`.
2. Reference effect ID in `talentCatalog.ts` level mapping.
3. Generate a talent icon following `docs/talent-art-guide.md` and save to `public/assets/talents/{talent_id}.png`.
4. Set `imageAsset: 'talent_{id}'` in the catalog entry.
5. Confirm run stat resolution reflects effect.
6. If dynamic behavior is needed, add minimal hook in `runState.ts`.
7. If the effect introduces pickups/buffs, define collect/spawn rules in `pickupCatalog.ts`.
8. Run `npm test`, then `npm run build`, and perform one manual run check.

### Gotchas

- Prefer declarative stat effects before runtime branching.
- Save compatibility is optional in this single-user project unless explicitly requested.
- For slug-featuring icons, always attach the reference image for character consistency (see art guide).

## 5) Edit Intro, Mission or Title Copy

### Read first

- `src/game/storyCatalog.ts`
- `src/scenes/StoryScene.ts` (only if the staging changes)

### Typical steps

1. Edit or add an entry in `INTRO_BEATS` with a new stable `id` (never reuse the wording as ID).
2. Pick an optional effect: `shake` (camera shake, timed by `effectTrigger`: the word whose first
   letter fires it; add `effectSkipQuip` to scold players who reveal the line before it) or `punchline` (big text, fade-in,
   input locked briefly). A new effect needs a type in `storySequencer.ts` and staging in `StoryScene.ts`.
3. Title, subtitle, rejected names and mission text live in `TITLE_SCREEN` / `MISSION_BRIEF`.
4. Run `npm test`, then `npm run build`, and play through the intro once.

### Gotchas

- The placeholder title `*Insert Name Of The Game Here*` is intentional: do not "fix" it.
- Rewording a beat can drop its `effectTrigger` word: a catalog test fails if it does.
- Long beats wrap onto several lines; keep them under about three lines at 22px.
- The save is only created by the mission CTA: do not move `saveMetaState` earlier without asking.
