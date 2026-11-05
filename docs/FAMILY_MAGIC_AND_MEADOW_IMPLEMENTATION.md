# v0.4b implementation notes: Family Magic & Unicorn Meadow

## Wand aiming
`src/world/spells.ts` no longer contains any aim assist. `facingVector(dir)` returns `DIRS[player.dir]`; the spawn offset, the tween end point and `fly()` all use that one vector. `fly()` returns the first target whose radius the line crosses (or whose blocking tile footprint it enters), else the wall or the 6-tile range. Radii are small (trees 0.75, bushes 0.65, fountain 1.45 tiles) so near misses pass.

## Data (src/content/family.ts, pure)
- Wand: heads, colours, trails, `START_OPTIONS`, `OPTION_EARN` (rules for the rest), `syncWandUnlocks` (idempotent, never removes), sanitizers (an equipped wand must use owned parts).
- Activities counters, rewards (`EXTRA_DECOR`, `grantDecor` once), fireworks palette and `burstPoints(shape, n)` (bounded, deterministic).

## Scenes
- `FireworksScene`, `WandWorkshopScene`: overlay scenes launched through `WorldScene.openStation` (World and UI paused, `station-closed` on exit). Hooks `window.__station` for tests.
- Unicorn Tag runs inside `WorldScene` (`startTag`, `tagTick`, `endTag`) using the pure `world/tag.ts`. `UIScene.setTagMode` hides irrelevant controls, shows the exit button and the 3-star tally, and ignores refreshes while on.
- Maps `festival`, `conservatory`, `meadow` in `world/maps.ts`; exits in `world/guide.ts`; safe spawns in `saveManager.ts`.

## Safety and accessibility
No failure states, no timers visible to the child, no auto-advancing dialogue, no strobe or full-screen flash (the fireworks glow is small and additive), hit boxes at least 58 logical px (about 44 CSS px on a phone held upright), reduced-effects halves counts and slows tweens, sound settings are honoured by the audio manager.

## Tests
`src/tests/family.test.ts`, `tag.test.ts`, `spells.test.ts`; `tests/e2e/family.spec.ts`; Chrome drivers in `tools/local-verify/`.
