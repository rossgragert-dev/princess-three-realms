# Living Kingdom v0.4 - implementation status

## v0.4a Comfort & Home - IMPLEMENTED (preview only)
- Pure data: `decorCatalog.ts` (STARTERS, STARTER_ROOM, new slots), `roomThemes.ts` (WALLS, FLOORS, themedTile), `saveManager.ts` (roomTheme + dpad migration).
- Scenes/UI: `UIScene` (pad, A, magic, HUD, tray), `dialoguePanel.ts` (portrait + text), `RoomDesignerScene` (wallpaper/floor), `WorldScene` (contextual A, magic, cue).
- Art: `tools/art_home.py` (original pixel art, deterministic via `gen_art.py`).
- Tests: `src/tests/v04a.test.ts` plus updated decor/wardrobe tests (141 pass).
- Browser verification (local headless Chrome via `tools/local-verify`): `v04a.mjs`, plus Chapter 1 (`chapter.mjs`), `v02`, `v03`, `v03b` regression - all pass.

## Not yet verified
- iPad Safari, real touch on a physical device, and whether a 5-year-old understands the controls. See IPAD_TEST_PLAN.md.
- Playwright e2e specs have not been realigned with the new dialogue (pre-existing `chapter01.spec` failure).

## Remaining
- v0.4b Family & Meadow (fireworks, wand workshop, unicorn tag)
- v0.4c Growing & Swimming (garden, new water maps, mermaid minigames)
