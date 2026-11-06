# v0.4c "The Kingdom Beyond" — implementation notes

Branch `development/v04c-kingdom-beyond` (from v0.4b.3). Published to the **preview** only; the stable iPad release is untouched.

## Map of the new code
| Area | Files |
|---|---|
| Maps (data) | `src/world/kingdomMaps.ts` (Enchanted Woods 40x30, Royal Magic Garden 36x28, Shimmering River 48x26), `src/world/mapKit.ts` (shared map helpers), `src/world/riverCourse.ts` |
| Environmental magic | `src/world/envMagic.ts` (pure rules), `src/scenes/kingdomLayer.ts` (sprites + temporary effects), `src/world/spells.ts` (`'env'` target kind) |
| Activities / story | `src/world/kingdomStory.ts`, `src/world/race.ts`, `src/content/kingdom.ts` (state machines + save block), `src/content/puzzleBank.ts` (9 new optional puzzles) |
| Rewards | `src/content/kingdomRewards.ts`, `stickers.ts`, `furniture.ts`, `family.ts` (`EXTRA_DECOR`) |
| Art | `src/art/kingdomArt.ts` (all `px_*` and `decor_*` textures drawn at runtime, no new asset files) |
| HUD | `UIScene.showRaceHud / pickOne` (big exit button, checkpoint pips, optional timer, picture chooser) |

## Design rules kept
- Picture first; narration optional (all new clips `required: false`); no mandatory reading; large separated choices.
- Nothing is ever lost: wrong answers give hints, wrong butterfly flowers just flutter, missed rings cost nothing, the race exit leaves rewards intact.
- Secrets are quest-flag gates (`WOODS_SECRET`, `GARDEN_SECRET`, `RIVER_SECRET`, `LANTERNS_LIT`, `RHYME_BRIDGE`), so they persist and cannot trap the player.
- Spell effects are temporary and bounded (`MAX_ACTIVE_ENV_FX = 24`); only grown flowers, fountain colour, finished activities and race records are saved.
- v0.4b.2 responsive scaling is untouched: the new HUD pieces are anchored with the same `L` offsets.

## How it was verified (honest scope)
- Unit: 294 tests (incl. 30 new) and `tsc` clean.
- Real Chrome (headless, SwiftShader): `v04c-smoke`, `v04c-woods`, `v04c-garden`, `v04c-river`, `v04c-viewports` plus the existing `chapter`, `viewports`, `unicorn`, `wand`, `v04b` drivers.
- **Not verified:** real iPad Safari/touch feel, audio on device, and whether a 5-year-old can follow the activities. Playwright and the GitHub `ci` job still cannot run in this environment (pre-existing npm install failure).
