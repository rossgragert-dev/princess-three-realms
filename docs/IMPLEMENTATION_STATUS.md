# Implementation status - v0.1 "The Magical Beginning"

Date: 2026-11-04. **Nothing in this project has been run in a browser.** The authoring environment could not reach
the npm registry (DNS failure direct; 403 policy denial via proxy), so Phaser, Vite and Playwright were never installed.
Per instructions, development continued without installs and the architecture stays on Phaser 3.90 + TypeScript + Vite.

## Verified (executed here)

| Area | Evidence |
|---|---|
| Game rules: save/sanitize, quest chain and rewards, puzzle hint ladder, counting de-dupe, navigation/A*, transformations, guide routing | `npm run test:logic` -> **71 tests pass** (node:test via tsx) |
| Five maps: dimensions, spawns valid per form, reachability with gates open/closed, creek grove unicorn-only, bridge collision after repair, warps target real spawns, spawns never on warp tiles | `world.test.ts`, `content.test.ts` |
| Content integrity: every narration key referenced by puzzles/scripts/stickers/objectives exists; every picture name exists in the generated frame index; 4 mandatory puzzles | `content.test.ts` |
| Pixel-art pipeline: deterministic Pillow generation of tiles, characters, props, UI, manifest, icons, frame index | `python3 tools/gen_art.py`, previews in `docs/art_preview/` |
| Type correctness of all non-Phaser code, and of scene code **against a permissive stub** (Phaser types = any) | `tsc` stub run: 0 errors. This catches typos, wrong imports and misuse of our own modules, **not** misuse of the Phaser API |
| Syntax of every scene/UI module | `esbuild` bundle of `src/main.ts` (phaser external) succeeds |
| Static map renders | `docs/screenshots/*.png` are composites of real map data + real generated art drawn by `tools/render_preview.py`. **They are not Phaser screenshots.** |

## Written but NOT run (awaiting runtime validation)

- All Phaser scenes: Boot, Title, World (map build, tilemap layer, camera centring, tap-to-walk, auto-approach, warps, transformations, guide trail, bedroom decor), UI (HUD, modals), Stickerbook, ParentSettings.
- Dialogue and puzzle panels (touch handling, tweens, hand hints, idle timers).
- Audio playback paths (WebAudio unlock, `<audio>` narration, procedural SFX/music, ducking) and the dev-only browser voice.
- PWA: `manifest.webmanifest`, `sw.js`, `tools/make_precache.mjs`, Home Screen install, offline play.
- Playwright specs in `tests/e2e/` (chapter 1 walk-through, responsive, audio replay) and `playwright.config.ts`.
- GitHub Actions `ci.yml` and `pages.yml` (no remote exists; `gh` token invalid here, so Actions could not be checked). No unrelated repository was touched.

## Outstanding tasks

1. **Narration recordings (blocking for a non-reader).** 81 lines are scripted in `docs/AUDIO_SCRIPT.md` (80 required). Without clips each line reports "missing": the dialogue panel shows a pulsing arrow and the child must tap to continue; puzzles still work but are silent. Chapter 1 is **not complete for a 5-year-old until these are recorded.**
2. **Browser-based acceptance testing:** run `npm install`, `npm run build`, `npm run test:e2e`, then the manual iPad pass in `docs/IPAD_TEST_PLAN.md`.
3. `npm install` once to produce `package-lock.json` (CI uses `npm install` until one is committed).

## Known risks to check first at runtime

- Cross-scene input: WorldScene and UIScene both listen to pointer events. UIScene.blocksPointer() guards HUD and modals; confirm no double handling.
- Tilemap built from the `tiles` spritesheet (`addTilesetImage('tiles','tiles',16,16,0,0,0)`): confirm frame indices line up.
- Camera bounds trick that centres the bedroom (smaller than the 512x384 view).
- Animation keys come from `manifest.json`; a typo shows as a missing-animation console warning, not a crash.
- Form-tray button placement in UIScene (`toggleTray`) was written quickly; verify layout on iPad.
- Bedroom decorating is a tap-to-cycle on glowing spots inside WorldScene (no separate BedroomScene / tray was built).
- Deviation: the optional d-pad setting exists in the save but no d-pad is rendered yet.

## Chapter 1 flow as implemented (data + story code)

Pip and carrots (count 3) -> talking tree (initial /b/ sound) -> Willa, unicorn unlocked -> rainbow bridge pattern (unicorn) ->
shore shimmer = mermaid -> dive -> Marina starfish (count 3) -> push pearl 4 times into the shell socket -> wishing star ->
home button -> Nana -> tap the glowing table spot to place the lamp. Optional: shell rhyme, garden sequence, three chests, wand pedestal, unicorn blooms.
