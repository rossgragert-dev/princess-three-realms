# v0.4a.1 implementation notes - Free to Play & Sparkle

## Joystick (`src/input/joystick.ts`, `src/world/steer.ts`, `UIScene`, `Player.steer`)
- Pure maths: `stickFromOffset` (normalised, dead zone 0.14, magnitude 0..1), `speedScale = 0.3 + 0.7*mag`, `facingFor` with hysteresis. Base centre (64,316), radius 58 logical px (touch radius +14). Smallest hit area is about 88 CSS px on a 390 px-wide portrait phone.
- Movement is authoritative on the tile grid: `steerMove` moves X and Y separately in 4 px sub-steps against a 10x6 px foot box, easing round corners by up to 1.5 px. Furniture, water, trees and gates are in the same grid (`makeGrid(..., furnBlocked)`).
- Pointer capture is by id, so A/magic/wand can be pressed while the stick is held (`activePointers: 3`). The stick releases on modal, blur, hidden, pointerup/cancel/out and scene change. `window.__ptr.stick(x,y,mag)` is a test-only override.

## Furniture (`src/content/furniture.ts`)
- Instances `{id,item,x,y,flip?}` in `state.bedroomLayout`. Kinds: big (blocks), small (walked over, may stand on a table), rug (under everything), wall (row y=2 anchors), window (curtain anchors x=6 and x=15).
- `checkPlacement` returns `{ok}` or `{ok:false, why}` and never mutates. `nearestValid` gives the dashed suggestion. `LayoutEditor` wraps place/move/flip/putAway/undo (20 steps).
- Rules: 40-item cap, per-piece copy limits, reserved aprons (door, both stations, easel, Nana), flood-fill reachability from the doorway with at most 3 sealed tiles, wall tiles for windows/shelf/crown reserved.
- Save migration: `sanitize()` converts old `bedroom` slot maps with `migrateLegacy` (items placed in free positions near their old spot, canopy bed replaces the cozy bed), cleans arrays with `sanitizeLayout`, and writes `bedroom: {}`. Earned items not in the room stay in the toy box (the Home/Decorate buttons glow via `unplacedEarned`).
- Star Lamp: `LAMP_PLACED` is set by `lampPlaced(ctx)` when Decorate Mode closes and any `star_lamp` is in the layout.

## Wand (`src/world/spells.ts`, `WorldScene.shootWand`)
- Explicit target data (`SPELL_PROPS`, flower ground tiles, mushroom frames). `aim` picks the best target inside a 50 degree cone, else straight ahead; `fly` walks the bolt up to 6 tiles and stops on the first target or solid tile; `Effects` keeps temporary reactions (re-triggerable); `ready` enforces the 420 ms cooldown.
- Reactions: tree blossom + apples, fountain spray (timer-driven, extended by repeat shots), flower bloom, mushroom glow, banner shimmer + butterflies. Reduced effects: no trail or spin, fewer particles, shorter tweens.
- Art: `tools/art_fx.py` (fx_bolt, trail, petal, apple, drop, jet, glow, flutter), furniture art `tools/art_decor.py`; regenerate with `python3 tools/gen_art.py`.

## Verification
Unit: `npm test` (177). Real Chrome (puppeteer-core, headless, SwiftShader): `tools/local-verify/v04a1.mjs`, `wand.mjs`, `chapter.mjs`, `v03.mjs`, `v03b.mjs`.
