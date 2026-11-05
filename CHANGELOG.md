# Changelog
## 0.4.0a.1 "Free to Play & Sparkle" (preview)
- Joystick: the four-way pad is now a true analog joystick (translucent base, movable knob, 8 directions, dead zone, speed follows how far the thumb pushes). Smooth diagonals; collision is axis-separated with corner easing so she slides along walls, never clips, never crosses water, never double-warps. Tap-to-walk still works and is cancelled cleanly by the stick. The stick, A and magic work at the same time (3 pointers). Releases on modal, blur, pointer cancel and scene change. Walk speeds unchanged (84/132/104).
- Free decorating: bedroom fixed slots are gone. A Decorate button (top strip, bedroom only) opens Decorate Mode with 9 picture categories (beds, tables, seats, rugs, plants & flowers, toys, lamps, storage, wall & window), big thumbnails, ghost preview (green check / red cross, dashed nearest-safe-tile suggestion), tap or drag to aim, move, flip, put away, undo. About 50 pieces, 25 of them new art, all free from the start except the earned rewards (canopy bed, Star Lamp and the other quest rewards). Two free beds. Small items can stand on tables.
- Fixed fixtures: wardrobe permanently back-left, vanity back-right, door, easel, window/shelf wall anchors and Nana stay put. Every placement is checked so the door, both stations, the easel and Nana stay reachable (flood-fill from the doorway). Nothing is silently moved or deleted.
- Saves: same key, new versioned `bedroomLayout`; v0.1-v0.4a slot layouts migrate to free positions with every earned item kept; invalid/hostile layouts are cleaned, never wiped. The Star Lamp quest completes when the lamp is anywhere in the room after leaving Decorate Mode.
- Sparkle wand: the princess's magic button fires a visible sparkling star bolt with a trail (up to 6 tiles, 420 ms cooldown, gentle aim assist inside a 50 degree cone, stops on walls). It makes trees blossom and drop apples, the courtyard fountain shoot a tall spray for four seconds (repeatable), flowers and bushes bloom, mushrooms glow, and the castle gate and ribbon shimmer with butterflies. Effects are temporary and friendly; reduced-effects mode keeps it gentle. Unicorn bloom/rainbow and mermaid bubble powers are unchanged. New sounds: wand, shimmer, spray.
- Tests 141 -> 177; new Chrome drivers `v04a1.mjs` (joystick, decorate, migration, mobile) and `wand.mjs` (projectile, reactions, real two-finger touch); `chapter.mjs` now decorates through the new mode.
## 0.4.0a "Living Kingdom: Comfort & Home" (preview)
- Controls: permanent four-way pad (bottom-left, slide-to-steer), two large buttons bottom-right (A = interact, magic = form spell), simplified top HUD (Home, Book, star count, goal hint), form tray in bottom-middle. Parent-only gear is faint. Pad releases on modals/blur. Tap-to-walk still works.
- A button: highlights the nearest friend/thing, walks there first if far, nudges gently if nothing is near. Briefly locked after a room screen closes so a double-tap can't reopen it.
- Faster walking: princess 84, unicorn 132, mermaid 104 px/s (about +35%/+27%/+30%).
- Written dialogue: portrait + large text panel, no voiceover by default, tap to advance, never auto-advances.
- Bedroom starts furnished: 15 free starter pieces (chairs, couch, dresser, desk, rugs, lamp, curtain, etc.) with free swapping; Star Lamp spot stays empty so the quest is unchanged.
- Room designer (easel): 8 wallpapers and 6 floors, live preview, saved immediately, cosmetic only. `roomTheme` in saves; older saves migrate and keep all placements.
- `settings.dpad` now migrates to ON; "On-screen arrows" and "Captions" removed from parent settings.
- Tests 124 -> 141; new Chrome driver `v04a.mjs`; older drivers updated for the new HUD.
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
