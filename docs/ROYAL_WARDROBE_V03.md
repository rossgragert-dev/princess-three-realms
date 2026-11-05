# Princess of Three Realms — v0.3: The Royal Wardrobe & Vanity

**Status:** implementation specification, not implemented.
**Base:** current `main` v0.2 picture-first + bedroom decoration, `main/site/` preview deployment.
**Preview:** https://rossgragert-dev.github.io/princess-three-realms/preview/
**Stable:** https://rossgragert-dev.github.io/princess-three-realms/ (DO NOT PROMOTE).

## Goal

Build two substantial **new screens**, each opened from a beautiful interactive object inside the existing bedroom:

1. **Royal Wardrobe** — dresses, dress colors, shoes, gloves, capes, and wearable outfit accessories.
2. **Enchanted Vanity** — hairstyle, hair color, tiaras/crowns, jewelry, and age-appropriate playful face accents.

On both screens, show a **larger, deliberately higher-detail princess** than the in-world sprite, rendered as original crisp 16-bit-inspired pixel art, wearing the exact currently selected combination. A change should show immediately on the preview and the most visible choices (especially dress color, hairstyle and hair color) must show in the existing animated top-down overworld sprite.

This is a cozy creative play feature, not a beauty rating system. No grades, ideals, body alteration, gender assumptions, or comparative praise; every option is lovely. Support free experimentation, ownership and save/resume. Pictures only for the child, with readable adult-only labels in documentation.

## Current architecture to preserve

- `src/config/gameConfig.ts` registers Phaser scenes and uses 512x384 logical resolution with FIT scaling.
- `src/scenes/WorldScene.ts` owns all five maps; `src/scenes/UIScene.ts` owns the HUD and modal surfaces.
- `src/actors/player.ts` uses a direction-animated `princess` spritesheet; `tools/gen_art.py` generates sheets and animation entries with directions down/up/left/right.
- `src/systems/saveManager.ts` stores under `ptr_save_v1`; `src/types/game.ts` declares `GameState`.
- Bedroom decorating is via `src/content/decorCatalog.ts`, `src/ui/decorUi.ts` and bed-room scene hotspots in `src/world/maps.ts`.
- Existing deploy workflow `.github/workflows/pages.yml` copies the committed `main/site/` into `/preview/` and keeps the stable `gh-pages` release unchanged. Do NOT alter its promotion behavior, build architecture, or branch policy.
- Current Chapter 1 quest flags, existing decorations, transformations, picture-first puzzles and local saves must all continue working.

## Bedroom entrances

Add **two recognizable distinct props and tappable interaction hotspots** in the existing bedroom:
- An ornate pink-and-gold **wardrobe / armoire**, with animated sparkling door handles, opens `WardrobeScene`.
- A **vanity table with an illuminated mirror**, a jewelry box and little perfume/flower decorations, opens `VanityScene`.

Place so neither obstructs the bedroom entrance, navigation, existing 12 decoration hotspots, other props, or the quest lamp. Ensure pathfinding can approach each from a free floor tile. Props should remain recognizable in the small top-down room. If there is a collision conflict, change prop position or footprint instead of removing decor slots. Use distinctive wardrobe/dressing-mirror picture icons as interaction cues.

Make both starter stations available on a new save and in migrated v0.1/v0.2 saves. Keep cosmetic selection separate from bedroom furniture ownership (no accidental locking or quest gating of core access). Exiting returns to the exact bedroom location, with selection preserved.

## Royal Wardrobe screen

Full-screen native Phaser scene, distinct pink-and-gold **royal dressing room** visual identity. Large, crisp, detailed front-facing princess preview at center or left, ideally **96x144 native pixels or more** rendered with integer scaling. Do NOT just scale up the 24px-ish overworld sprite; draw new detailed character layers with shading, folds, ribbons, textures and a recognizable face. Small sparkle/pose animation acceptable; prioritize visual quality and readability over complexity.

Large picture-only tabs for dress, fabric color, shoes, cape/gloves and accessories; picture cards arranged in a horizontally pageable carousel/grid. No text is needed to use it. Each card displays an actual thumbnail of the option, not a generic button. Changing tabs must not reset selections. Tapping a choice instantly updates the full preview, and a visible sparkle/check indicates the equipped choice. A huge easy-to-hit back/accept button saves and returns to the room. No complex drag-and-drop, no timers, no scrolling the whole web page.

**Initial content targets:**
- At least 8 visually distinct dress silhouettes (e.g., classic royal ball gown; garden dress; starry night dress; rainbow princess gown; rose-petal dress; sea-glass dress; fairy-sparkle gown; festival dress), each more than a simple solid-color recolor.
- At least 10 dress color palettes / swatches: pink, lavender, purple, blue, teal, mint, red, yellow/gold, peach, white/silver. Color choice independent of the selected dress design where art permits.
- At least 5 shoe choices (slippers, boots, jeweled shoes, etc.).
- At least 4 cape/glove or shoulder-accessory choices, with explicit none option.
- At least 4 dresses available by default; remaining dresses reward exploration, puzzles or small gentle tasks (see rewards).
- No paid currency, energy or purchases. All free color palettes and basics accessible immediately.

## Enchanted Vanity screen

Full-screen native Phaser scene with a **cozy magical mirror** setting, visually distinct from the wardrobe: carved gold mirror frame, glowing stars, flowers, jewelry boxes, hair ribbons. A close-up or 3/4-view **high-detail princess bust/head** (at least 96x112 native pixels) or a similarly detailed full-length preview. Larger facial and hair art than the gameplay sprite, with accurate selected dress neckline and accessories.

Large picture-only tabs for hair shape, hair color, tiara, earrings, necklace and gentle makeup/face accents. Minimum:
- 6 truly different hairstyles (long down, short bob, ponytail, two braids, bun, loose curls) with aligned layering and silhouette changes.
- 10 hair colors (blonde, strawberry blonde, light brown, dark brown, black, auburn, copper, platinum, pastel pink, lavender; palette choices should remain playful and optional).
- 6 tiaras/crowns (including none and at least two unlocked by default).
- 6 necklaces / pendants and 4 earring styles (including none).
- 5 makeup/face-accent presets (including **none**): subtle rosy cheeks, star freckles, glitter/sparkle cheeks, fantasy butterfly accent. Keep age-appropriate and playful, no realistic heavy adult cosmetics. Avoid gender/beauty value judgments.
- If using visual swatch cards, include enough contrast for younger children and avoid relying on color alone to show selected state.

Changing a selection instantly updates the large princess, and the user can switch back and forth between both screens while retaining everything.

## Sprite architecture (critical)

Implement a small **appearance model** in an isolated pure-logic module and a deterministic generated-art pipeline:

`PrincessAppearance = { dressId, dressColorId, shoesId, accessoryId, hairstyleId, hairColorId, tiaraId, earringsId, necklaceId, faceAccentId }`

Exact names may differ, but use **stable IDs**, separately listed unlocks and selections, a safe defaults function, and robust sanitation. The save data must remain backward-compatible with v0.1 and v0.2 under the existing save key. Do not overwrite decoration ownership, quest flags, stars, puzzle progress, music preferences or location. Malformed option IDs or locked selections safely fall back to owned defaults. No losing favorite outfits when switching forms.

**High-detail preview:** generate reusable transparent layers at identical canvas dimensions and landmarks for body/skin, dress, hair, tiara, jewelry, face accents. Ensure the foreground/back ordering is correct: hair back > body/dress > face > hair front > ornaments. Use real art for each hairstyle and dress silhouette; palette swap independently for color selections. Re-compose preview on tap without stutter on an iPad. Save both front/full-length and vanity portrait variants as necessary.

**Overworld animation:** update princess four-direction idle/walk/cast sprites to reflect dress color and hair color and a clearly discernible hair silhouette, while keeping current gameplay collision, movement speed, origins, animation keys and frame layout. Show crown/accessory only if it reads clearly at gameplay resolution, otherwise use the close-up screens for fine detail. Update `Player` visual appearance after exiting customization, without requiring a game restart or interrupting form-change logic.

**Mermaid continuity:** preserve hair color and, if feasible without animation glitches, hairstyle across mermaid form; do not accidentally show a princess dress underwater. Unicorn form stays functional and unchanged in this milestone.

Avoid generating a gigantic static cross-product of all choices (which would blow up assets/offline precache); favor separable synchronized overlay sprites or dynamic textures / deterministic per-component recolors. Keep the large preview and overworld palettes coherent and pixel-crisp, avoid WebGL-only shaders, and test in Chromium and iPad Safari. If runtime recolor cache is used, key it and constrain memory; preserve source pixel palette mapping.

## Rewards and unlocks

- Provide a joyful assortment of dresses, accessories, hair styles and colors from the start. The feature should be fun before earning anything.
- Add a small catalog of **optional unlockable wearables** tied to existing Chapter 1 task completion flags without requiring players to redo Chapter 1 or losing earned items on upgraded saves. Examples:
  - Help Pip -> bunny hair ribbon
  - Rainbow bridge -> rainbow gown
  - Marina -> pearl necklace
  - Wishing star -> star tiara
  - Hidden butterfly -> butterfly hair clip
  - Garden sequence -> flower crown
- Add one or two new obvious sparkle-hidden accessories without disrupting current story gates. Optional-only; no artificial grind.
- On an old save with completed source flags, grant corresponding wearables upon migration/entry and display any reveal at an appropriate non-disruptive point. Reuse or generalize the existing earned-item reveal for small wearable thumbnails.
- Distinguish **unlock ownership** from **equipped appearance**; unlocking does not automatically replace the child's preferred outfit. Existing bedroom decor reward flags continue to work.

## UX for a non-reading five-year-old

- Image-first UI. No narration requirement.
- Buttons/cards at least 44 CSS px on common iPhone/iPad sizes, larger where possible, with hit areas separated so a swipe/tap never accidentally selects a neighbor.
- Two large entrance objects in the bedroom and a very clear close/back control within each view.
- Character preview should occupy approximately 40–55% of each screen; controls remain visible without scrolling the page.
- Direct immediate preview on tap, crisp pixel art, little sparkle/twirl for selection and optional mirrored turn pose.
- All equipped options should be visually distinguishable; avoid deceptive selected status when item is locked.
- If an item is locked, show its silhouette plus a picture of where it comes from, and do not charge or expose external links.
- No accidental double taps and no four-second auto-advance on customization screens.
- Provide explicit "none" choices for jewelry and face decorations.
- Respect reduced motion and sound-off settings. Preserve game save across reload and offline launches.

## Implementation plan

1. **Survey** current art, bedroom tiles and `Player` animation contract. Write brief decisions in `docs/ROYAL_WARDROBE_IMPLEMENTATION.md`.
2. **Pure data / tests:** catalog and appearance state, unlock rules, sanitization, save migration, texture selection and outfit state. Add tests before heavy asset work.
3. **Art:** update `tools/art_chars.py`, add `tools/art_wardrobe.py` or equivalent, wire `tools/gen_art.py` into deterministic asset generation, preview sheets for eight dresses, hairstyles, colors and accessories.
4. **Scenes:** add `WardrobeScene.ts`, `VanityScene.ts` and shared picture-card selection controls. Register scenes in game config and preload art through manifest. Keep modal/pointer arbitration sound.
5. **World integration:** real furniture props/hotspots, enter/exit without bad spawning, render chosen look in `Player`, reward reveals, save after selection.
6. **Browser validation:** complete original Chapter 1 and bedroom decorating, plus enter wardrobe, change dress/palette, change hair/tiara/jewelry at vanity, leave room, walk, switch form, reload, offline, and repeat. Test portrait + landscape viewport sizes and rapid tapping; this especially matters because v0.2 had an intermittent decor-picker tap race.
7. **Publish:** rebuild the precompiled `site/` via the existing no-npm toolchain, commit source + `site/` to `main`, push normally (no force), verify Pages success, give the **/preview/** link. Never manually promote or touch `gh-pages` without explicit authorization.

## Acceptance gates

- Both wardrobe and vanity are **separate real full-screen Phaser views** entered from two tappable bedroom props; they are not just modifications to the existing decoration picker.
- Princess is genuinely more detailed in both customization screens, with layered poses, dresses and hair.
- Dress color and hairstyle/hair color are clearly visible in the actual moving princess sprite in Chapter 1 and persist across world transitions, form changes and reload.
- At least 8 dresses, 10 dress colors, 6 hairstyles, 10 hair colors, plus choices of shoes, tiaras, jewelry and subtle face accents.
- Several rewards are earned from Chapter 1 and can be equipped without overwriting previous bedroom decorating choices.
- Pictures and controls are understandable without reading or speech.
- Old saved game migrated without losing progress; failed/unknown IDs sanitize safely.
- Existing 94-test baseline and full Chapter 1 flow do not regress; added coverage for outfit saves and all UI interactions.
- Real-browser screenshots of **both new screens**, several outfit examples, and the resulting in-world princess. Pass 10 or more repeated open/tap/close cycles to stress touch selection.
- Static development preview updated and verified; stable root URL unchanged.

## Known constraints

- The existing `site/` build depends on the available official Phaser 3.90.0 runtime and an esbuild binary, but not the npm registry. Keep this production pathway intact.
- Published preview and stable are under the same GitHub Pages origin but different subpaths; do not break separate offline/service-worker scopes.
- Do not call the feature finished solely on typechecks or logic tests. Browser testing and real iPad review are essential.
