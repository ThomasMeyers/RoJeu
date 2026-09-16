# Talent Art Guide

How to generate and integrate talent images for the store.

## Art Direction

- **Style:** Warm storybook cartoon — soft black outlines, rounded friendly shapes
- **Palette:** Earth tones (greens, browns, warm amber highlights) on a dark charcoal background (`#1a2233`)
  — this is the background painted *inside* the artwork. Verified against the shipped icons, whose
  top-left pixel sits between `#1d2635` and `#222a35`. Do not confuse it with `STORE_CARD_IMAGE_BG`
  (`0x2a2518`, `src/render/layout.ts`): that warm brown is only the fallback square drawn when a
  talent has no image.
- **Mood:** Cozy adventure, not gloomy. Whimsical and humorous
- **Output:** 512x512 PNG, square, no text, no frame/border. Downscale before committing:
  the first five icons were committed at 2048x2048 (~7 MB each) for something rendered at
  72-140 px. Do not add more of those.

## Slug Character Sheet

The player character is a slug (limace). When a talent features the slug, use this description for consistency:

> The slug is a cute, chubby cartoon slug with warm golden-olive skin, darker olive spots on its back, two round-tipped antennae, small dot eyes with a happy squint, rosy cheeks, and a rounded body with visible belly segments. Soft black outlines, warm storybook illustration style.

**Reference image:** `public/assets/talents/orb_yield.png` (the original slug icon). Attach this as a reference when generating slug-featuring icons in Gemini.

## Gemini Prompt Template

### Base style prompt (prepend to every talent icon)

```
Square icon for a video game talent shop. Warm storybook cartoon illustration style with soft black outlines, rounded friendly shapes, and earth-tone colors (greens, browns, warm amber highlights). Dark charcoal background (#1a2233). The subject should be centered, fill most of the frame, and have a clear readable silhouette that works at small sizes. No text. No frame or border. 512x512 PNG.
```

### For talents featuring the slug

1. Attach `public/assets/talents/orb_yield.png` as a reference image in Gemini
2. Prepend the character sheet:

```
Character reference: The slug is a cute, chubby cartoon slug with warm golden-olive skin, darker olive spots on its back, two round-tipped antennae, small dot eyes with a happy squint, rosy cheeks, and a rounded body with visible belly segments. Soft black outlines, warm storybook illustration style. Match the exact same character design, proportions, and color palette as the attached reference image.
```

3. Then add the base style prompt + talent-specific description starting with "The same slug character..."

### For talents without the slug

Just use the base style prompt + a description of the object/concept.

### When to use the slug vs standalone object

- Use the slug when the talent is about the slug doing something (drooling, singing, drinking coffee)
- Use a standalone object when the concept reads better at 72px without a character (lightbulb, globe)

## Code Integration Checklist

After generating the image:

1. **Save the image** to `public/assets/talents/{talent_id}.png` (e.g., `speed_boost_pickup.png`)
2. **Add `imageAsset`** to the talent entry in `src/game/talentCatalog.ts`:
   ```ts
   imageAsset: 'talent_{talent_id}',
   ```
3. **That's it.** The rest is automatic:
   - `preload()` in `GameScene.ts` auto-loads all talents with `imageAsset` from the catalog
   - Linear filtering is applied automatically for smooth downscaling
   - Store cards render the sprite at 72x72 instead of the text placeholder
   - The detail popup renders the sprite at 140x140
   - Locked state: tinted amber (`0x887755`) + 60% alpha
   - Deeply locked state: image hidden, shows "?" text fallback

## Existing Talent Icons

| Talent ID | Title | Has Slug? | File |
|-----------|-------|-----------|------|
| `orb_yield` | Bave baveuse | Yes | `orb_yield.png` |
| `passive_income` | Chanson francaise | Yes | `passive_income.png` |
| `vision_bonus_orb` | Filsdeputemalumiere | No (lightbulb) | `vision_bonus_orb.png` |
| `no_walls` | Around the world | No (globe) | `no_walls.png` |
| `speed_boost_pickup` | Ptit kawa ou kwa ? | Yes | `speed_boost_pickup.png` |
| `ending_unlock` | Le skill de fin... | Yes | `ending_unlock.png` |
