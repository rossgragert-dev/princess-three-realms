# Changelog
## 0.3.0 "Royal Wardrobe & Enchanted Vanity"
- Bedroom: pink-gold armoire and lit-mirror vanity open two full-screen, picture-only customization scenes (8 dresses, 10 dress colours, 6 shoes, 5 cape/gloves/wings, 6 hairstyles, 10 hair colours, 6 tiaras, 3 earrings, 5 necklaces, 4 face accents, 6 skin tones).
- Choices recolour the animated overworld princess and mermaid (same animations), save automatically, survive scene changes, transformations and reloads.
- 13 earnable wearables tied to Chapter 1 quests and finds (2 new sparkle finds), "new!" reveal, locked silhouettes, older saves migrate.
- Tests 94 -> 124; new Chrome drivers `v03.mjs`, `v03b.mjs`.
## 0.2.0 "Picture-first + Bedroom Rewards"
- Narration optional (default off): picture-bubble dialogue, letter-card puzzle, visual hint hand, lightbulb hint button; speaker/replay only when narration is on.
- Bedroom: 12 hotspots, 12 earnable items (quest, puzzle, NPC gift, hidden find, chests), picture picker with locked silhouettes, "new item" reveal, glowing Home button, saved decor, v0.1 save migration.
- New: butterfly hidden spot (courtyard), chest rewards (creek/shore/grotto), Nana's canopy-bed gift, 10 new pixel-art items + wall shelf.
- Tests 73 -> 94. Standalone site rebuilt.
## 0.1.0b "Standalone Edition"
- `site/`: deployable static website (no npm/Vite/Actions). `tools/build-standalone.sh` rebuilds it. `.nojekyll` included; `gh-pages` branch prepared.
- Verified from a GitHub-Pages-style sub-path in Chrome: full Chapter 1, offline PWA, viewports, save/resume, narration behaviour.
- 81 temporary offline-TTS (CMU Flite) narration clips with provenance; new `flite` engine in `tools/make_tts_clips.py`. Replaceable without a rebuild.
## 0.1.0a "First Light"
- First real-browser run (Chrome + Phaser 3.90.0): Chapter 1 completes end to end; real screenshots in docs/screenshots/browser.
- Fixed: story form-change blocked by busy flag; stale tree sprite crashing later scenes; duplicate spoken prompt; settings layout; underwater look; stale count tray.
- Added: optional on-screen d-pad (parent toggle), portrait hint, narration scripts by character and scene, TTS/clip tooling with provenance, local browser verification tools.
- Still open: Vite build, CI/Pages run, Safari/iPad pass, recorded narration.
## 0.1.0
- Deterministic pixel-art pipeline; five data-driven maps; pure game-rule engines; Phaser scenes written; PWA files; CI workflows.
