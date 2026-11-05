# Princess of Three Realms — v0.4a.1: Free to Play & Sparkle
**Implementation specification — not yet implemented.**
**Priority:** Complete this update *before* beginning v0.4b (King fireworks, Queen wand workshop, unicorn tag).
**Repo:** `rossgragert-dev/princess-three-realms`; `main` source + `site/` auto-publish to `/preview/`.
**Stable:** `gh-pages` and the root iPad release must remain unchanged.

## Player-directed goals

1. Replace the four-arrow d-pad with a genuinely comfortable **virtual joystick** for exploration.
2. Let a five-year-old open a **bedroom furniture catalog** and place/move/remove furniture **where she chooses**, not just at preset hotspots.
3. Keep **shelf(s), the interactive wardrobe, and the interactive vanity permanently fixed**. Put the wardrobe in the **back-left** and vanity in the **back-right** corners of the bedroom.
4. Add real, visible **sparkling wand projectiles** that can hit and magically transform environmental objects. Tree shots make flowers/fruit appear; fountain shots send water higher. These are friendly, non-combat environmental reactions, with visual reward.
5. Preserve v0.4a (written dialogue/no voice), v0.3 (dress-up + vanity), existing Chapter 1, decorations and 0.4b+ roadmap.

## Surveyed architecture (as of v0.4a)

- `src/scenes/UIScene.ts`: pad pointer tracking around bottom-left `pad`, `setHeld` resolves only 4 cardinal axes; `handlers.dpad` triggers `WorldScene.dpadStep`; A at (458,318), magic at (386,344), form tray centered bottom.
- `src/actors/player.ts`: tile-to-tile movement and animation; `src/world/navigation.ts` and `WorldScene` implement grid passability and tap-to-walk. `src/actors/transformations.ts` contains movement speeds.
- Bedroom map `src/world/maps.ts`: 24x18 tiles (16px each), entrance at x11–12 y17, spawn near (11,15); original furniture slots generated from `SLOTS`; wardrobe currently x1,y10 and vanity x21,y13, not in top corners; shelf x20,y2; `nana` NPC and `paint_station` exist.
- `src/content/decorCatalog.ts`: STARTERS + 12 earned items, `SLOTS` and `placeDecor` enforce fixed locations and item uniqueness; `src/ui/decorUi.ts` bottom-sheet picker; `WorldScene.renderDecor()` uses slot coordinates.
- `src/systems/saveManager.ts` saves `ptr_save_v1`, current `bedroom: Record<slotId,itemId>` and `roomTheme`; migrated saves must retain unlocked items and dress-up settings.
- `src/world/maps.ts` has nonreactive tree props `tree_a/tree_b` and courtyard fountain `fountain` with `fountain_flow` animation; `WorldScene.magicPress` and `Player.cast()` are existing hooks.
- Current game is Phaser 3.90 with TypeScript and deterministic Python art generator. Build static `site/` with existing no-npm pipeline; update the mobile preview by commit/push to `main`. No ZIPs.

## A. Joystick: real analog movement, not a painted d-pad

### Look and interaction
- A large translucent circular **base** and a visibly movable **thumb knob** live in the lower-left safe touch zone. Touch inside base and drag/hold to move. Knob follows the finger but clamps to radius; neutral automatically springs to center on release.
- Support eight directions (including diagonals) using normalized input. Preserve existing four-facing sprite art until eight-direction animations are available; pick nearest 4 facing but **do not force 4-direction movement**. Movement must be smooth with no choppy tile-turn pauses.
- On real iPads, movement speed must feel intuitive and consistent in diagonals; normalize the vector so diagonals are not faster. Use a small dead zone and optionally analog magnitude to slow movement for tiny thumb displacements (good for precise room navigation). Do not let sliding off the joystick stop movement unintentionally; stay tracked to the captured pointer until release/cancel.
- Tapping world to pathfind remains an optional convenience; joystick steering immediately interrupts the automated path without teleport, route remnants or stale callbacks.
- Let the right thumb press **A** or **magic** while the left holds the joystick. On gesture cancel, focus loss, modal opening, scene transition and pointerup/outside, neutralize movement. If another finger touches the game, do not steal the joystick pointer.
- UI respects 512x384 logical screen, all iPhone/iPad portrait/landscape scales and safe areas; minimum 44 **actual CSS px** target sizes at tested sizes. Give landscape priority. The joystick must not overlap the A/magic/form-switcher or obscure quest interactables.
- Keep tile-based collision/world objects and quest warps authoritative. Movement must not slide through walls, cross water when the current form cannot, double-trigger warps, or skip `onStep` story events. Implement a reliable continuous collision sweep/axis slide or equivalent; **do not simply update sprite.x/y and ignore the grid**.
- Preserve current speed boosts (princess 84, unicorn 132, mermaid 104 logical px/s), unless evidence from testing justifies minor tuning. Keep transform, camera, idle/walk and save tile consistent with movement.
- For automation expose a test-only joystick position/active vector hook; test cardinal, diagonal, slow/fast radius, multipointer and release. Document decisions.

## B. Bedroom: open furniture inventory and free placement

### Core UX
- Add a clearly discoverable **furniture / decorate button** that appears when the princess is in her bedroom (e.g. bed/chair icon near top). Pressing it enters **Decorate Mode** and pauses free-roam movement. It is available before finishing Chapter 1.
- In Decorate Mode, show an attractive **categorized furniture catalog** with big picture thumbnails (beds, tables, seating, rugs, plants/flowers, toys, wall decor, lighting, storage). The room remains visible. Child picks an owned item, taps a desired **valid spot** in the room, sees a semitransparent/outlined preview and presses a large check mark to place. Alternatively support drag-drop; never make dragging mandatory. A huge X/back cancels safely.
- Support **move** (tap an already placed movable object), **rotate/flip** where appropriate (2–4 cardinal poses, optional), **put away** (return to inventory), and **undo last action**. Choices save on confirmation. Never delete a purchased/earned object from ownership.
- Add a friendly furniture-inventory presentation: starters available immediately; earned rewards show alongside them; locked collectibles (if shown) remain clearly recognizable with picture hint and padlock. Browsing catalog doesn't accidentally walk the princess. Close mode to return to adventure without moving her.
- Add at least **two bed choices immediately** (simple cozy bed + one different frame; existing special canopy bed stays earnable), plus generous options for **tables**, little desks, chairs, plants, flowers, dollies/dolls, balls, stuffed animals (rabbit/unicorn/bear/cat), toy baskets and lamps. Produce original SNES-style sprites, clear silhouettes at room scale and thumbnails. Existing 15 starter furniture pieces and 12 quest rewards MUST remain available.
- Baseline pieces can be placed more than once if appropriate (e.g. flowers, chairs, dolls, balls) with a modest object cap; unique earned reward items (e.g. Star Lamp, Unicorn Plush) remain unique. Represent **instances** with stable IDs and positions, not `slotId -> itemId` for movable floor furniture.
- Use **grid snapping to 16px tiles** to simplify placing, but allow the child to choose valid tiles freely. Furniture with different footprints (e.g. 2x2 bed vs 1x1 ball) must have proper tile-footprint metadata. Wall items snap along suitable wall anchors, floor rugs/flowers occupy floor tiles. Sort sprites by base Y, keep rugs behind furniture, prevent clipping with walls.
- Add positive feedback on valid placements (green sparkle/outline), and a calm red/gray preview when invalid with a suggestion for nearest safe tile. **Never silently reposition** to a radically different location.

### Fixed fixtures (non-movable)
- **Wardrobe** must be at **back-left corner** of bedroom (near x2–4 y4–6 in the 24x18 map, adjust safely for actual prop dimensions).
- **Vanity** must be at **back-right corner** (near x19–21 y4–6).
- Interactive shelving/wall shelf(s), architectural windows, exit, required Star Lamp quest target, paint easel, and any critical quest triggers remain **static**. They still open wardrobe/vanity/room designer when approached or tapping A; decoration mode cannot cover them.
- Mark these fixtures visually and in placement rules as fixed, not selectable in movable catalog. Keep accessible walking tiles in front of both stations.
- The King/Queen/minigame additions from v0.4b must remain unobstructed by any room editor change.

### Navigation/footprint safety
- Do not let the player block the bedroom door, spawn, path to wardrobe/vanity/paint easel, Nana, Star Lamp quest hotspot, or an entire region of the room. On each placement, check tile occupancy **and flood-fill reachability** from the bedroom doorway to required interactions. Reject invalid placement before it is saved.
- For decorative items intended to sit on tables/shelves, use explicit layer/surface attachments, not full blocking floor cells. Guarantee reachable hotspots.
- Make dynamic placed items participate in `WorldScene` collision/nav grid and tap selection, with occupancy rebuilt on relevant changes. A/magic targets should still resolve when furniture nearby.
- Recompute collision correctly on removal/rotation; never trap the princess in furniture on reload. If loading an outdated/corrupt save, validate or safely move the invalid furniture into inventory, not lose the collectible.

### Migration and saved state
- Preserve `SAVE_KEY='ptr_save_v1'`; introduce a versioned `bedroomLayout: { instanceId, itemId, tileX, tileY, rotation, anchor? }[]` (or equivalent) alongside or as a replacement for `bedroom`.
- Translate existing `bedroom` hotspot placements from v0.1/v0.2/v0.3/v0.4a into equivalent free locations when valid. **Do not wipe player room layouts**. For items at now-blocked stations, remap to nearby safe spaces or return them to the available catalog, with explicit migration tests.
- Preserve `unlockedDecor`, old wardrobe/appearance/roomTheme, quest flags, stars, stickerbook, form, position and other settings. Existing reward ownership is idempotent. Star Lamp placement must still complete the Chapter 1 quest when placed in a designated accessible lamp fixture or valid lamp location; choose and document exact condition.
- Add upper bounds on movable furniture to keep performance and mobile battery reasonable, and test that limitations are gentle.

## C. Wand: sparkling projectile + living environment reactions

### Core mechanic
- Press **magic** as princess: play wand casting gesture and visibly launch a small shimmering projectile from the wand/hand toward her facing direction or the nearest eligible target within a gentle forward cone. Consider a subtle aim guide or a brief target highlight so a five-year-old can succeed without precision aiming.
- Projectile physically travels through the map with light trails / sparkle particles and a cheerful sound, not just a static animation on the player. Speed and range should feel immediate (roughly 4–7 tiles), with a short child-friendly cooldown (e.g. 350–500ms). A single tap launches one shot, repeat taps are safe; no excessive particle accumulation.
- Detect overlap with map and sprite colliders; stop on an obstacle or successful target, and fade safely if no target. Only **friendly** environmental effects, never health, damage or combat. Respect reduced-motion/flash settings.
- Projectiles do not go through thick walls or hit underwater targets from land. Avoid triggering scene transitions, damaging NPCs, blocking interactions, or interfering with quest puzzles.
- Animation should inherit the selected wand's style/color where possible (v0.4b will add the Queen's wand workshop), without requiring unfinished v0.4b code.

### Initial reactive target set (at least 5)
1. **Trees**: blossom colorful flowers and/or sprout fruit, briefly twinkle. Use variants or random-but-seeded outcomes. Avoid covering the player path or entrances.
2. **Courtyard fountain**: taller spout/animated water jets for a few seconds, bubbles/sparkles and water sound, then gently settle. Repeatable.
3. **Flower bushes / garden plants**: grow bright blooms and sway.
4. **Mushrooms / magical stones**: glow with patterned stars or little lights for a while.
5. **Castle banners or decorative ornaments**: gently shimmer / change accent color / release a few butterflies.

Each reactive entity should have an explicit **spell target component/data field**, with id, location or bounds, response type, optional repeat/temporary state, and safe render layering. Keep effects temporary by default so saves do not balloon. One-time discovery secrets may use explicit flags but do not create infinite reward farming.

### Other forms
- **Unicorn** magic retains existing bloom/rainbow ability, perhaps emits forward rainbow sparkles with equivalent friendly object reactions when appropriate. Do not break bridge/puzzle mechanics.
- **Mermaid** magic retains bubble-casting logic for grotto; can show a visible bubble projectile/reaction, but do not block required pearl puzzle or future aquatic games. If not implementing projectile for these forms now, clearly distinguish the princess-specific effect while preserving old form ability.

## D. Technical validation / delivery

1. Update art through `tools/gen_art.py` (source art + generated assets + manifest) for joystick, furniture including dolls/balls/stuffed animals, wand projectile, flower/fruit/tree/fountain spell reactions and static wardrobe/vanity positions.
2. Keep pure modules for joystick vector filtering (unit-test diagonal normalization, dead zone), furniture inventory/footprint/validation/migration, and spell targeting/reaction eligibility. Phaser scenes should own rendering/pointer UI, not all game rules.
3. Add robust tests (no regressions to existing 141 tests), including 20 repeated furniture placements across categories, 10 move/undo/remove cycles, no blocked exit, save reload, old-save migrations, joystick multitouch with A/magic, 10 repeated shots at tree/fountain, reduced-effects, and mode transition safety.
4. **Chrome full Chapter 1** from fresh save through LAMP_PLACED, including wand tree/fountain interactions, bedroom free furniture and v0.3 Wardrobe/Vanity/RoomDesigner; also verify old v0.4a save migration.
5. Run mobile landscape + portrait viewports, real-Phaser typings, offline/service worker subpath, static `site/` regression. Fix Playwright intro test if possible; report CI blockers distinctly.
6. Capture actual game browser screenshots: joystick/HUD, furniture catalog, item ghost placement, furnished bedroom with static corner wardrobe/vanity, tree blossom after spell, active fountain spray.
7. Rebuild `site/`; commit all source and built site to `main`; push and verify GitHub Pages preview. **NEVER** touch `gh-pages` or click promote. Provide `/preview/` link and specific iPad checks. No ZIP handoffs.

### Priority / sequencing

**Phase 1:** joystick and responsive input (test together with both A and magic).
**Phase 2:** furniture model/migration + static corner stations and catalogue.
**Phase 3:** free placement UI/collision/art, then full end-to-end quest regression.
**Phase 4:** projectile engine and reactions; repeated casts + regressions.
**Phase 5:** deployment and mobile review.

An attractive, functioning and touch-friendly result matters more than just ticking boxes. This is a focused **v0.4a.1** milestone before the already-planned v0.4b family minigames.
