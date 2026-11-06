# Changelog
## 0.4.0b.3 "Enchanted Forms" (preview)
- **Mermaid bubble wand:** she now carries an underwater wand (gold-banded stick, shell fan, glowing pearl in her equipped wand colour) that reads in all four facings. Magic fires a pearly bubble from the wand tip, straight the way she faces (no aiming help). A bubble that truly passes through the pearl rolls it one spot along its glowing lane (22 → 24 → 26 → 28); the last lands in the shell socket, awards `PEARL_PLACED` and celebrates. Wrong directions, off-axis shots and bubbles from the far side never move it. A soft glow and chevrons beside the pearl show where to stand and which way to face. The A button now only explains the puzzle. Step is derived from the pearl's real position, so old saves and re-entered scenes stay correct.
- **Unicorn flower trail:** pink, yellow, lavender, blue and white flowers bloom behind her on grass only (not paths, water, sand or floors), for joystick and tap-to-move alike; denser when galloping. 3–5 s life, pop in and dissolve with a sparkle. Fixed pool of 28 sprites (10 with reduced effects), no tiles, no collision, no save data.
- **Unicorn horn magic:** energy gathers at the horn tip, then a short rainbow beam leaves the tip along her real facing (measured per direction). The beam wakes scenery it reaches (flowers, trees, mushrooms, fountains); Chapter 1 bloom spots work as before. Works while moving.
- Tests: `pearl.test.ts`, `trail.test.ts`; Chrome drivers `pearl.mjs`, `unicorn.mjs`; `chapter.mjs` now finishes the pearl with bubbles.

## 0.4.0b.2 "Full-Screen iPad" (preview)
- **Responsive display:** the fixed 512x384 FIT canvas is replaced by `Phaser.Scale.EXPAND`. The authored 512x384 area is the guaranteed-visible minimum; the game grows along whichever axis the screen is longer, so the canvas fills the whole viewport with no side bars, no stretching and the same crisp integer-less nearest-neighbour pixels. Gameplay coordinates, collision and maps are unchanged.
- **World:** the camera simply sees more map on wide screens (and more vertically in portrait); bounds follow the real camera size, are re-applied on rotation/resize without moving the player, and maps smaller than the screen are centred on the map colour. Bedroom decorating centres the room above the bottom sheet on any shape.
- **HUD:** joystick, A, wand/magic, form tray, home/book/decorate, hint, goal bubble and star counter are anchored to the real left/right/top/bottom edges and re-laid out on resize. Dialogue sits on the bottom edge; puzzles, reveals, counting tray and tag panel are centred. Touch targets keep their size.
- **Menus and minigames** (Title, Wardrobe, Vanity, Room Designer, Fireworks, Wand Workshop, Stickerbook, Parent Settings, station screens, Boot): 512x384 stage is centred with full-bleed backdrops and dimmers; pointer positions are converted to stage coordinates.
- **Home Screen:** manifest `display: standalone`, `orientation: any`; rotation nudges the scale manager so the canvas refits.
- Tests: new `src/tests/stage.test.ts` (responsive sizing, stage fit, HUD bounds); `tools/local-verify/viewports.mjs` runs five viewports in real Chrome (coverage, no stretch, HUD bounds, tap-to-move).

## 0.4.0b "Family Magic & Unicorn Meadow" (preview)
- **Wand fix (first):** the princess's wand no longer auto-aims. The projectile spawns, tweens and collides along the single direction she visibly faces (up/down/left/right). Only a direct hit activates a target; objects beside the line are passed. Sparkle visuals, reactions, cooldown (420 ms), range (6 tiles) and the two-thumb use are unchanged. Unit tests prove nearby off-axis targets cannot redirect a shot; a real-Chrome driver shoots straight past a tree.
- **King's Fireworks Festival:** new Festival Garden west of the courtyard. The King and a launch dais open a night-sky screen with the castle silhouette. 6 colours, 5 designs (star, heart, flower, spiral, rainbow) and 1/2/3 rockets in a row; tap the sky to launch. Unlimited practice, no timers. No strobe or full-screen flash; at most 3 bursts and 96 particles each (reduced effects: slower, 40 particles). First completed session (3 launches) gives the Festival Star Garland decoration, once.
- **Queen's Wand Workshop:** new Conservatory off the courtyard. A dedicated workshop screen with an animated preview: 6 wand heads (star, moon, flower, heart, crystal, seashell), 8 colours (adds mint, red, pearl, rainbow), 4 magical trails (star sparkles, butterflies, flower petals, bubbles). 3 heads, 6 colours and 2 trails are open from the start; the rest are earned by exploring (fireworks, tag, the shore, the first star, the rainbow bridge, Marina). Locked choices show a dark shape, a padlock and a picture of where they come from. The equipped wand is saved (`equippedWand`, `unlockedWand`) and shown in the projectile and its trail during normal play. Cosmetic only: aim, range and collision never change.
- **Unicorn Tag:** Unicorn Meadow, reached by a path north of the Whispering Woods once Willa is met. Dapple is a friendly unicorn who plays tag for 3 rounds with a star tally; she is slower than the player, pauses to catch her breath, never traps the child, invites the child to play if they stop, and gives up gracefully. No failure state, no timer, exit at any time. The first completed 3-tag session unlocks the Unicorn Flower Cushion. Pure AI module `src/world/tag.ts` with unit tests.
- Saves: new `equippedWand`, `unlockedWand`, `activities` fields with sanitizers; old saves migrate with the default wand. New SceneIds `festival`, `conservatory`, `meadow` have safe spawns and exits.
- New original pixel art (generated deterministically by `tools/art_family.py`): King, Queen, Dapple, 48 wand heads, 8 projectile colours, trail sprites, firework icons, launch dais, castle silhouette, wand bench, garland, cushion, heart.
- Tests: 218 unit tests (was 181), new `tests/e2e/family.spec.ts`, and real-Chrome drivers `tools/local-verify/v04b.mjs` and `wand.mjs`.

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
