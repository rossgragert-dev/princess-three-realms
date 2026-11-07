# Princess of Three Realms — v0.4d.6 Player-Testing Handoff

**Milestone:** Responsive Play, Persistent Kitchen Creations, Bedtime Wardrobe & Royal Mission Travel  
**Status:** Implementation specification only — features are **not** yet implemented or deployed.  
**Verified starting point:** `6fb0a6d91bc21dd6645c175f7923f975ec34396f` on `development/v04d-living-royal-kingdom`.  
**Working branch:** `development/v04d6-player-feedback`.  
**Deployment:** Preview only. Do **not** promote to stable or change `gh-pages` without explicit approval.

## Player feedback (source of truth)

1. The talking tree no longer visibly moves when its puzzle is solved; restore the satisfying movement.
2. Royal Kitchen decoration feels random. A child must be able to **tap a topping picture to select it (highlight the box), then tap an exact spot on the food to place it**. Finished cake, cookies, ice cream, and pizza must remain visibly displayed on their respective stands until deliberately changed or eaten.
3. Add **real pajama options** to the Royal Wardrobe. The selected pajamas must actually appear on the princess, not just in a menu.
4. The King and Queen already describe missions and show picture choices. **Tapping a mission picture should take the player to that location**, instead of merely delivering another line of dialogue.

## 1. Tree movement — regression, highest priority

**Relevant code:** `src/world/story.ts` (`case 'tree'`), `src/scenes/WorldScene.ts` (`buildObjects`, `treeSprite`, `applyFlags`), `src/world/maps.ts` (`tree_gate`), `src/world/kingdomStory.ts` and `src/scenes/kingdomLayer.ts` (different *ancient_tree* interactions).

- Reproduce the reported issue in a **new game** and in a **v0.4d.5 saved game**, with both touch and pointer input. Disambiguate the **gate-blocking talking tree in the Whispering Woods** from the four **ancient trees in the Enchanted Woods**; verify that both responses still function as designed.
- For the gate tree: successful `tree_sound` puzzle must visibly slide the tree out of the path (currently intended to be four tiles left via a 900ms tween), reveal an open, walkable gate, and celebrate. The animation must be obvious at typical iPad zoom and not occur offscreen due to camera or sprite positioning.
- Audit the sprite creation and animation trigger: `treeSprite` is captured conditionally during `buildObjects`; `applyFlags(true)` currently plays the tween only when `TREE_GATE_OPEN` is set. Ensure the correct sprite is tracked, the tween executes and depth is updated, and the gate flags / tile grid remain consistent.
- After returning to the area or reloading, the tree should remain in its **open** position with no flash or unintended reversal. Replay should remain possible without stealing existing rewards; don't reclose a previously completed gate merely for an animation.
- Add a regression covering new save, old save, solved, reload, reduced effects, and repeated interactions. In reduced-effects mode, immediately display the open state with a light cue rather than require animation.

## 2. Royal Kitchen — precise, touch-first decoration and persistent display

**Relevant code:** `src/ui/creativePanels.ts` (`runBake`; currently the `pointerup` handler calls `put(key)` which chooses random coordinates); `src/world/kingdomStory.ts` (`COOKING` and cooking interactions), `src/world/castleMaps.ts` (`KITCHEN_STATIONS`), `src/content/kingdom.ts` (`Kingdom`, default/sanitize), `src/scenes/WorldScene.ts` and `src/scenes/kingdomLayer.ts` (world visuals), `src/scenes/UIScene.ts` (`bake` modal).

**Desired child flow:**
1. Tap any cooking station (cake, cookies, pizza, ice cream). Display the food large, with **picture-only toppings** and sufficiently large tap targets.
2. Tap a topping picture. It gets a persistent, clear **gold/yellow outline + selected check or sparkle**; nothing is placed yet. Tap another picture to switch the selection.
3. Tap **any valid point on the food** to place precisely that topping there. Repeat taps to place more. Support optional drag-and-drop, but **do not require dragging**.
4. Tapping off the food should do nothing (or produce a gentle hint), not place randomly or shift an ingredient to an unexpected location. Restrict positions to the visible food surface. For ice cream, support placing scoops/toppings in the intended cone area without random shifts.
5. Keep Undo, Done and Back big and clear. Undo removes the **last placement**. Back/cancel discards *only the unfinished edits* and does not erase an already displayed food item.
6. On Done, the completed dish is visibly on the corresponding kitchen counter/stand in the world. It remains there when leaving, returning, reloading, or changing rooms. Maintain a **separate saved design for each of the four foods**, including base ID and normalized topping positions. Paint the assembled food, not just a generic stock icon.
7. Touching the displayed item/station offers a picture-first choice: **decorate/change it** (open editor with the saved toppings) or **eat it** (gentle bite/puff/sparkle, remove this displayed item only); optionally leave/cancel. Eating has no failure or punishment and cannot repeatedly grant rewards. If she changes her mind, no destructive reset.
8. Cap saved topping counts, bound coordinates and validate all keys on load. Reset invalid data safely. Do not affect gallery paintings, gardening, stickers, rewards or existing saves.

**UX:** Avoid tiny buttons, cursor-only affordances, random auto-placement and obscuring the food with selector cards. Support landscape and portrait iPad. Default to no topping selected or highlight the first topping *clearly* with a picture cue; either way, tap-selected placement must be obvious.

**Suggested data shape:** `kingdom.foodDisplays` keyed by `cook_cake | cook_cookies | cook_pizza | cook_icecream`, each `{ toppings: Array<{ key: string, u: number, v: number }> }` or null. `u/v` are normalized to the food's coordinate system for viewport-independent persistence. Keep authoritative allowed key lists in `COOKING` or a shared pure module; sanitize and clamp. Consider a pure editing model for easy tests.

## 3. Pajamas — wardrobe art and save compatibility

**Relevant code:** `src/content/appearance.ts` (`DRESSES`, `CATALOG`, save sanitation), `src/scenes/StationScene.ts` and `src/scenes/WardrobeScene.ts` (page and selection), `src/art/compose.ts`, `src/art/looks.ts`, `src/content/wardrobeIndex.ts` (**generated** atlas mapping), `tools/art_wardrobe.py`, `tools/art_overworld.py` and `tools/gen_art.py` (source art generator).

- Introduce **at least four cheerful, age-appropriate pajamas**, for example: pink heart two-piece, lavender stars two-piece, blue moon-and-cloud nightgown, and rainbow bedtime set.
- All are **freely available** (no quest gate). Present them as picture cards within the Royal Wardrobe—either among clothing choices with a clear pajama grouping or under a clearly recognizable pajama icon/tab. Keep existing dresses and equipment usable.
- Generate **real pixel art layers**, both full/portrait wardrobe previews and recognizable overworld sprites, including the correct neckline/sleeves/hem and pants/nightgown silhouette. Do **not** merely add IDs to `DRESSES` without creating matching `dress:<id>` atlas layers. Regenerate the sprite/atlas assets and generated index via the established art pipeline, not by hand-editing generated outputs.
- Selecting pajamas is immediate, repeatable and saved. They should remain equipped after sleep, scene travel and reload until the child chooses otherwise. Do not automatically change outfits when sleeping or force removal of tiaras/accessories; compositing must remain stable.
- Check color customization, hair/skin/tiara overlays, wardrobe thumbnails and princess overworld poses; no invisible dress or wrong-layer artifacts. No effects on mermaid appearance.

## 4. Royal mission portraits — actual fast travel

**Relevant code:** `src/world/kingdomStory.ts` (`throne_king` / `throne_queen` currently `pickOne` then only `say`), `src/world/story.ts` (`StoryCtx`), `src/scenes/WorldScene.ts` (`travel(scene,spawn)`, `makeCtx`), `src/world/maps.ts` and `src/world/kingdomMaps.ts` (valid spawns), `src/scenes/UIScene.ts` (`pickOne`).

- Keep each parent's short introduction and four big mission pictures:
  - Tree -> `woods`, spawn `from_courtyard` (Whispering Woods / tree mission).
  - Unicorn -> `meadow`, spawn `from_woods` (Unicorn Meadow).
  - Mermaid -> `shore`, spawn `from_woods` (Lake Shore / mermaid mission).
  - Flower -> `garden`, spawn `from_courtyard` (Royal Magic Garden).
- Tapping a picture should **initiate travel** once its chooser closes, with a quick sparkle/fade and a safe landing point. A brief mission explanation may be spoken before the fade but must not require a second travel selection.
- Tapping Back / cancel keeps her in the throne room. Do not teleport on menu opening or invalid taps.
- Introduce a narrow story-context travel callback (or mission destination map) that uses the **existing** `WorldScene.travel` save/fade/restart path, never hardcode an unsafe tile, and avoids duplicate transition / modal / stuck-busy races.
- Existing walking routes remain intact, and destination visits retain/earn their existing flags normally. The player may return home via standard doors/Home. Missions are always revisitable regardless of progress.
- The King and Queen must both offer the functional picture transport; the stories are invitations, not gates.

## QA, regression and acceptance

- Preserve all 366 passing baseline unit tests (the reported v0.4d.5 count), and add new pure tests for kitchen saved designs/sanitization, no random position on selection, Undo/cancel, eat/reset, one-station isolation and replay; pajama selections/migrations; mission destination map validity; and tree flag/state behavior.
- Build and run real Chrome/Playwright checks on **touch-capable** viewports (iPad portrait & landscape, plus desktop) with screenshots and explicit assertions:
  - Solve the tree, **observe a changed tree coordinate**, walk through gate and reload.
  - Select cherry (gold highlight), tap the cake **left edge**, observe cherry at the touched spot; choose a different topping, tap another spot; Undo; Done; navigate away/back/reload and verify both retained position and appearance.
  - Decorate a cookie independently, eat only the cookie, confirm cake persists.
  - Equip each pajama; verify all wardrobe thumbnails, in-world sprite and reload.
  - Talk to King, tap woods, arrive in woods with valid spawn; return; talk to Queen, tap garden; repeat unicorn and mermaid choices and cancellation.
- Check no duplicated scene handlers, no ghost taps through modals, no save corruption, no console errors and no broken overlays during iPad rotation; verify music/audio/reduced-effects settings still work.
- Produce an implementation report with commit SHA, changed files, screenshots, test counts and remaining limitations. **Preview deployment only**. Keep the approved v0.4d.5 and stable iPad build intact for comparison.

## Notes from source audit

- The existing kitchen code intentionally chooses random positions when an un-dragged topping is tapped; replace this design, don't add a minor visual highlight over the same behavior.
- The royal mission picture chooser is already present; missing behavior is navigation after selection, not new picture assets.
- The talking tree is represented by `treeSprite` / `TREE_GATE_OPEN`, while the Enchanted Woods have separate ancient-tree effects: test the precise regression rather than conflating these.
- The wardrobe's `wardrobeIndex.ts` is **generated**; changes to pajamas must include source art and generated assets, or the result will have invisible clothing.
