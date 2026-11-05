# v0.3 "The Royal Wardrobe & Enchanted Vanity" - implementation notes

Spec: `docs/ROYAL_WARDROBE_V03.md`. Preview build only; the stable release is untouched.

## What a player sees
- Bedroom has two new props with bobbing picture cues (wardrobe icon / mirror icon): a pink-gold **armoire** (west wall) and a **vanity with a lit mirror** (east wall). Neither blocks the door, the 12 decor slots or the quest lamp. The princess walks to the front of the furniture and the full-screen scene opens; closing returns to the exact spot.
- **Royal Wardrobe** (full body, 96x144 native, shown 2x): tabs = dress, dress colour, shoes, cape/gloves/wings.
- **Enchanted Vanity** (portrait, 112x140 native, shown 2x in a gold lit mirror): tabs = hairstyle, hair colour, tiara, earrings, necklace, face sparkles, skin tone.
- A small mirror/wardrobe button jumps between the two screens. Big green check = done. No text, timers, drag-and-drop, or auto-advance.
- Cards show a **real thumbnail of her wearing that option**; equipped = gold frame **and** check badge (not colour alone); locked = dark silhouette + padlock + a picture of where it comes from; tapping a locked card wiggles the padlock and changes nothing. Tapping the princess twirls her (sparkles only when reduced-effects is on).
- Selecting happens on release (<14 px movement, same card), swipe >40 px turns pages, pager buttons only appear when there is more than one page. Every selection saves immediately.

## Content (all counts meet or exceed the spec)
| Slot | Options |
|---|---|
| Dresses | 8 (4 from the start: Royal Ball Gown, Garden, Rose-Petal, Festival; 4 earned) |
| Dress colours | 10 |
| Shoes | 6 |
| Cape / gloves / wings | none + 5 |
| Hairstyles | 6 (long, bob, ponytail, braids, bun, curls) |
| Hair colours | 10 |
| Tiaras / headwear | none + 6 (gold tiara default) |
| Earrings | none + 3 |
| Necklaces | none + 5 |
| Face accents | none + 4 |
| Skin tones | 6 (bonus) |

### Unlocks (tied to Chapter 1 flags)
Pip's carrots -> bunny ribbon; rainbow bridge -> rainbow gown; Marina helped -> pearl strand; wishing star -> star tiara; hidden butterfly -> butterfly clip; garden sequence -> flower crown; grotto chest -> starry-night dress; shore chest -> sea-glass dress; creek chest -> shell necklace; pearl placed -> pearl shoes; wand lit -> butterfly wings. **New sparkle finds:** fairy dust in the woods (fairy-sparkle gown), moonstone on the shore (moon cape).
Ownership (`wardrobe.unlocked`) is separate from what is equipped (`appearance`). Earning something shows a "new!" reveal with a real picture of the wearable and a wardrobe/mirror cue. A save that already finished quests is migrated: the first three are celebrated on arrival in the bedroom, the rest are simply in the wardrobe.

## Architecture
- `src/content/appearance.ts` - pure data/logic: catalog with stable ids, `sanitizeWardrobe` (never throws; locked/unknown ids fall back to defaults), `selectOption` (refuses locked), `grantForFlag`. Saved under the existing `ptr_save_v1` key, backward compatible.
- Art is **marker-colour layers** (dress / hair / skin drawn in unique marker RGBs) so no cross-product assets exist: `wd_full` (52 cells) and `wd_port` (45 cells) atlases. `src/art/compose.ts` (pure, unit tested with real atlas pixels) remaps markers to the chosen ramps and stacks layers: hair-back > body > shoes > dress > necklace > front accessories > face accent > hair-front > earrings > tiara.
- Overworld: per-hairstyle sheets + tiara overlay sheets are recoloured into two live canvas textures, `princess_look` and `mermaid_look`, with the same frame layout and the same animation keys as before. The dress colour, hairstyle, hair colour, skin tone and tiara therefore carry into walking/idle/casting, survive map changes, form changes (mermaid keeps hair colour and skin tone) and reloads.
- `StationScene` (+ `WardrobeScene`, `VanityScene`) is an overlay like the sticker book: World and UI are paused, the scene resumes them and emits `station-closed` on close; the look is refreshed on close.
- Tools: `tools/art_wardrobe.py`, `tools/art_overworld.py`, `tools/gen_art.py` (deterministic), previews in `docs/art_preview/`.

## Verification (this session, local Chrome 1024x768 + 768x1024; Phaser 3.90.0 esbuild bundle)
- `tsx --test`: 124/124 (30 new: model, migration, atlas composition, station placement/reachability, hidden finds).
- `tools/local-verify/v03.mjs`: both screens open/tap/close, equip dress/colour/cape/hair/tiara/jewellery/face/skin, switch button, reload keeps the look, **12 open/tap/close cycles clean**, 30 rapid taps + pager hammering, double-tap accept, locked item refuses, player uses `princess_look` - all pass.
- `tools/local-verify/v03b.mjs`: sparkle find -> reveal -> owned but not auto-equipped; mermaid uses `mermaid_look`; three full outfits visible in the world; portrait viewport hit targets (cards 138 CSS px, tab pitch 66 CSS px).
- Regression: `chapter.mjs` (Chapter 1 completes, 12 decor placed) and `v02.mjs` pass.
- Screenshots: `docs/screenshots/browser/v3_*`, `v3b_*`, `v3_outfit_combinations.png`, `v3_outfits_in_world.png`.

## Not verified (be honest)
Real iPad Safari / touch feel; whether the 5-year-old understands the picture tabs; Vite production build (esbuild bundle used here); Playwright; sound on these screens (no new audio clips were recorded); the first-time-player reveal queue with many pending items on a real older save beyond the automated migration test.

## Known limits
Wardrobe thumbnails are generated at runtime per page (12 pooled canvas textures). The spec's "no 4 s auto-advance" holds: neither scene has timers except the optional twinkle tween. Reduced-effects disables twirl, twinkles, cue bobbing.
