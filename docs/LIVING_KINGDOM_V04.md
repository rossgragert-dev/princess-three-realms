# Princess of Three Realms — v0.4: The Living Kingdom
**Implementation specification (not yet implemented)**

**Approved direction (Nov 4, 2026):** Keep original colorful SNES-style art and v0.3 wardrobe/vanity. Restore written text/dialogue but **not voiceover**. Make touch controls child-friendly and permanent. Expand decorating (starter furniture, wallpaper, floors), add a unicorn tag game, magical fireworks with the King, wand workshop with the Queen, a persistent garden, and meaningful new mermaid areas and games.

Repository: `rossgragert-dev/princess-three-realms`
Preview: `https://rossgragert-dev.github.io/princess-three-realms/preview/`
Stable release: root URL, **DO NOT PROMOTE** without user approval.

## Release approach

The scope is large. Implement and push in **three complete, independently testable subreleases**, each updating `main/site/` and the mobile `/preview/`:
- **v0.4a — Comfort & Home:** picture+text dialogue, always-visible d-pad, increased movement speed, A/interact and magic/action controls, simple HUD, room starter items, wall/floor customization. Every old save migrates.
- **v0.4b — Family & Meadow:** accessible King/Queen NPCs with portraits/dialogue; magical fireworks, the Queen's wand workshop, unicorn tag, and additional art. All replayable.
- **v0.4c — Growing & Swimming:** persistent garden simulator, two genuinely explorable connected water areas, at least two different mermaid minigames, collectibles, and final polish.

Do not call v0.4 complete after only one subrelease. Maintain prior playability after each push and report exactly which parts shipped.

## Design goals for a five-year-old
- Play and exploration first, emergent-learning opportunities naturally embedded.
- **Visible dialogue text + friendly portrait + optional picture cues. NO spoken narration by default or in regular child flow.** Retain existing sound effects/music and optional narration technical assets for future use; do not trigger voice automatically. Adult can read the text aloud if desired.
- Tap to advance dialogue; **never auto-advance after four seconds** or while child is observing the text. Large Next arrow. Dialogue modal does not leak movement inputs to the world.
- Every activity has big visual controls, instructions demonstrated by animation and pictures, unlimited retries, no damage/death/timers that end in failure, no real-money purchase or external links. Game can be enjoyed without reading dialogue.
- Family is supportive and warm. The King helps with colorful **in-game magical fireworks**, not real-world fireworks techniques. Use no frequent flashing/strobe; support reduced effects.
- Child should be able to return to cozy home at any time without losing an ongoing puzzle or garden state.
- A low-pressure reward loop: activities grant stickers, room decor or dress/wand styles, with no grinding or compulsory repeat for progression.

## 0.4a: Controls / HUD / dialogue

### Current architecture
- Phaser 3.90.0, logical 512x384, FIT landscape, `src/scenes/WorldScene.ts` + `UIScene.ts`; `src/ui/touchTargets.ts`.
- Existing d-pad is in `UIScene.ts` and depends on `state.settings.dpad` (currently false); movement repeats while held. 
- Existing movement constants in `src/actors/transformations.ts`: `FORM_SPEED = { princess:62, unicorn:104, mermaid:80 }` logical pixels/sec.
- Four-direction animated player is `src/actors/player.ts`; preserve tile navigation, collisions, transforms and camera.
- Current v0.3 custom scenes `WardrobeScene`, `VanityScene` and `StationScene` must be preserved.
- Save `ptr_save_v1` state sanitizer is `src/systems/saveManager.ts`; preserve progress across all past versions.

### New HUD composition

Landscape logical screen:
- Top slim strip: left small **Home** and **Book**, center star count, right **Goal hint** and subtle grown-up gear; avoid text labels unless requested.
- Bottom left: **permanent four-way d-pad**, easy one-thumb use, at least 44 **CSS** pixels per actionable target at tested phone/iPad scale; support pressing and holding smoothly, release on pointerup, pointercancel, lost focus or modal. Make diagonal optional and nonessential.
- Bottom right: two distinct large controls: **A / interact** (hand or speech icon, context sensitive: talk/open/plant/collect) and **magic** (wand/rainbow/bubbles per form). The **A** and magic buttons should be separated enough to avoid false taps.
- Place **form switch** in a reachable middle-bottom/side button or small radial icon tray that does not overlap the d-pad/action region, Home, or text panels.
- Hide or disable movement/buttons appropriately while a full-screen station, dialogue, or picker is active. Never allow taps on UI to also move the world. Keep tap-to-walk as a secondary optional convenience, but d-pad should work immediately on first play.
- Strong visual indication when a world object is in range of A. If out of range, A can walk toward a highlighted object, then interact, without requiring precision taps; no misleading active state.
- UI layout must respect iPhone/iPad viewport and Safari safe areas, 4:3 scaling, screen edges and zoom gestures. No important object behind controls. For small phone landscape consider reducing world view or rearranging buttons rather than covering the action.
- Save `settings.dpad` migration: old saves should become d-pad-on without overriding other settings. Prefer make d-pad an unconditional default rather than rely on a legacy false value. If preserving user setting, provide optional adult alternative but **new/old saves start ON**.
- Expose an easy parent-only control for SFX/music volume and reduced-effects, not in the child's action cluster.

### Movement speed

Increase initial speeds by ~25–35% with feel-based tuning:
- Princess from 62 to **84 logical px/s**.
- Unicorn from 104 to **132 logical px/s** (tag can use a separate fair speed modifier).
- Mermaid from 80 to **104 logical px/s**.
Do not rush tile movement so it skips interaction events, triggers double warps, changes pathfinding/collision rules, or breaks animation. Keep idle/walk/gallop/swim synchronized. If testers find speeds too fast, expose a grown-up pace slider rather than reverting to sluggish defaults.

### Text/dialogue

- Display legible short text inside picture bubble/panel, with clear high-contrast game-font styling and portrait + optional pictograms.
- Limit child-facing dialogue to 1–2 brief sentences per panel, usually one. Text does not require narration to continue, but never use auto-advance; play a small pulse on Next arrow after a delay if necessary.
- Make no-reading visual interactions still usable (picture puzzle interfaces stay intact). Keep game text in localization-friendly content data. Fonts must render sharply and wrap without clipping across iPad and phone landscape.
- User wants **text and dialogue**, not the current picture-only dialogue. Do not delete all visual prompts; combine them.

## 0.4a: Expanded bedroom design

### Starter furniture
- Existing 12 earned pieces and 12 hotspots remain owned/saved exactly as before.
- Add **at least 14 starter furniture/decor items**, all available to a new save before quests: e.g. basic bed, pink chair, wooden chair, little couch, toy basket, dresser, desk, reading cushion, floor pillow, plain rug, striped rug, plant stand, small lamp, wall hanging, plus mirror/curtain variants.
- Ensure new furniture fits defined slot categories or deliberately add non-overlapping new slots for chairs/desk/lounge. Expand the room footprint only if needed without breaking the wardrobe, vanity, doorway, quest lamp, or collisions.
- Start room partly furnished with editable starter items, but do NOT pre-complete the Star Lamp `LAMP_PLACED` quest or block a clear place to put it. Existing saves must retain their prior placements; new starter defaults apply only if appropriate.
- Allow freely swapping already-owned pieces with no cost or penalty; picking another item changes only the room.
- When a quest unlocks a unique item, keep its reward moment and compatibility with older saves. Never require buying furniture.

### Room color / floor customization
- Add a recognizable **paintbrush / wallpaper swatch** interaction in the bedroom that opens a large picture-based room designer, separate from wardrobe/vanity.
- **At least 8 wallpaper/wall palettes** (pink, lavender, mint, sky blue, cream, floral, starry purple, rainbow accents) and **6 floor types** (light wood, dark wood, cream tiles, pastel tiles, patterned carpet, royal rug-floor). Each choice must be a visibly distinct tile/pattern, not simply flat recolor.
- Show a miniature room or direct live full-room preview and large thumbnail swatches; update as soon as child taps, save immediately; one-tap Back.
- Tile changes must be **cosmetic only**: don't alter pathfinding passability, spawns, hotspot positions or overlay decorations.
- Dedicated `roomTheme` save state with safe migration and explicit fallback for old saves. Optional contrast checks: wall objects, furniture and avatars must remain legible on every palette.
- Room themes and basic starter furniture are free from the beginning. More wallpapers/floors may be earned later.

## 0.4b: Family activities

### King: magical fireworks festival
- Add father **King** to palace courtyard/castle festival garden with a clear portrait and short readable, friendly dialogue. Tapping/talking launches a contained `FireworksScene` (or reused minigame runner).
- She chooses from **6 colors** and at least **5 designs** (star, heart, flower, spiral, rainbow). Add launch arrangement choices (single, pair, three in a sequence). Each sends a stylized magical firework animation above the castle, not a real-world tutorial.
- Unlimited tries; option to arrange a short nighttime show. A simple picture-only controller plus optional dialogue from King. No spark/flash seizure risk: modest brightness, gradual fade, no strobe, respect reduced effects and sound controls.
- Each different design can fill one page of a collectible fireworks sticker book; first play gives a small room reward.
- All effects must be performant on mobile and have no unbounded particle buildup or leaking timers.

### Queen: wand workshop
- Add mother **Queen** NPC, preferably in a small castle garden/workshop area, dialogue and portrait. Opens `WandWorkshopScene`.
- Create at least **6 wand shapes** (star, moon, flower, heart, crystal, seashell), **8 wand colors**, and **4 spell sparkle/trail variants**; allow mix-and-match and save.
- Start with several free options, make special variants earnable; never require completing a long quest to use the workshop.
- Show enlarged wand previews + princess holding it in a detailed figure. Equip selected wand persistently, and reflect its handle/head color or sparkle in princess magic animation and action effect where size permits.
- The wand isn't a new combat system; it is a creative/cosmetic wand for helping/growing/casting.

### Unicorn tag
- Create an accessible new **Unicorn Meadow** connected to existing Enchanted Wilds, with a friendly unicorn NPC.
- Explain tag by short picture + text demonstration. Player uses unicorn form; touching/tagging the friendly unicorn transfers role or completes a short round.
- Simple AI that follows/chases/evades fairly, no impossible speed/edge-camping. Allow three rounds, with a visible heart/star tally and a cheerful celebration; **no failure state** and no countdown needed for winning. Keep a stop/return-home exit. Start other unicorn slow enough to catch; include an idle assist if child struggles.
- Prevent blocked collision tiles, pathfinding loops, out-of-bounds teleports, double tag triggers and overlapping collision surfaces.
- Replayable. Give a one-time optional reward (ribbon or meadow decor) then stickers/celebrations on repeat, no repeated unlock farming.
- Consider a "follow the unicorn" chase variation only after base tag is solid.

## 0.4c: Garden and Crystal Seas expansion

### Gardening simulator
- Make an accessible **Royal Garden** (existing courtyard plot expanded or dedicated scene) with at least **12** planting spots, and a picture seed basket.
- At least **4 flowers** (sunflower, rose, tulip, rainbow bloom) and **4 vegetables** (carrot, pumpkin, tomato, strawberry or pea—keep simple recognizable pictures).
- Plant → water → sprout → grow → harvest (vegetables) or bloom (flowers); show each stage with charming animated visual progress.
- No forced real-time waiting, daily login requirement or crop death; use a deterministic **action-based** growth loop, e.g. water + explore/tap/sunshine event, with no penalty. Avoid endless taps: no more than a few actions per crop.
- Plot data saved per plot with safe validation; persist through scene changes, reload and offline. Seed inventory should not softlock; starter/replenishable seeds always available.
- A small harvest basket shows acquired crops visually. Vegetables can be gifts to animal friends; flowers can decorate the castle or unlock a crown/bedroom vase. Optional picture recognition, color matching and counting.
- Include grown-up notes documenting outcomes, but no quiz grade/failure.

### Mermaid exploration and minigames
- Add at least **two genuinely new navigable water locations** linked sensibly to existing shore/grotto, e.g. **Moonlit Lagoon** and **Coral Gardens** (or a kelp maze), with different art/obstacles/NPCs/treasures.
- Preserve safe form switching on shore, mermaid-only underwater movement, valid spawn/warp, reachable exits and home return. Add `SceneId`s and spawn migration safely.
- **Bubble Garden** minigame: create/push bubbles into the correct-color coral rings or match bubble shapes in a low-pressure underwater environment. Use the mermaid's magic button. Replayable, with optional gentle hint.
- **Seahorse Hide-and-Seek** (or Shell Sorting): find friendly seahorses behind kelp/coral (no failure timer), with picture-based count tally. Distinct from existing starfish counting and pearl placement.
- Optional exploration hidden pearls, colorful shells, friendly sea turtles, coral secrets and collectible bedroom/vanity rewards.
- Add more underwater scenery (coral arches, kelp sway, shimmering sand, schools of friendly fish), but ensure clarity and iPad performance. Fix washed-out grotto tint only if improved look can be verified without muddying colors.
- No combat, drowning meters or scary hazards.

## Implementation architecture

- Keep existing Phaser TypeScript scenes and standalone `site/` build. **Do not rewrite from scratch** or introduce an npm installation dependency for deploying.
- New pure modules: `src/content/roomThemes.ts`, `src/systems/gardenState.ts`, `src/systems/minigameProgress.ts`, `src/content/wands.ts` or comparable. Keep progress and UI logic testable outside Phaser.
- Prefer data-driven minigame definitions with one-time reward flags, clear states, save safety and replay modes. Existing quest engine for first-time flags and reward reveal. No duplicate rewards on replays.
- Reuse artwork pipeline `tools/gen_art.py` and separate art modules with deterministic outputs; add new assets to `public/assets/manifest.json` and source index as generated, not hardcoded. Keep source art + sprites in repo.
- Add family portraits, activity props, buttons/icons, flora and aquatic sprites. Keep all palettes cohesive with existing v0.3 princess art.
- Retain UI modal/pointer arbitration and test with d-pad held while opening panels; fix v0.2 intermittent decor picker races if rediscovered. State changes should not unpause world movement unexpectedly.
- Save handling `ptr_save_v1` with migrations from v0.1/v0.2/v0.3 and corrupt data, preserving appearance, decor placements, wardrobe unlocked wearables, quests, stars, room themes, garden plots, minigame rewards, and current valid scene.
- Make new scenes discoverable without exhausting the first chapter: castle family activities available early, unicorn game after unicorn unlocked, mermaid games after mermaid unlocked. Use picture map cues or readable signs.
- No voiceover in child flow; text + portraits + icons. Preserve existing audio system behind parent options and SFX/music as separate settings.
- Implement automated tests with node:test where possible plus existing Chrome drivers and updated Playwright specs; bring Playwright e2e intro regression into alignment instead of ignoring it forever.
- Child UI has optional parent tutorial but should work without reading. Buttons maintain 44 CSS px min actual viewport size.
- Each subrelease: typecheck with real Phaser typings, logic tests, browser gameplay regression, subpath preview, mobile viewports, offline cache, save/resume and screenshot review. Don't equate local screenshot or CI success with real iPad Safari verified.
- Fix caching/isolation: `/preview/` and stable root stay separate, rebuild `site/` + precache hash, publish preview by pushing to `main`; **don't touch `gh-pages`** until explicit release approval. No ZIP routine handoffs.

## Acceptance criteria for full v0.4
1. Chapter 1 and v0.3 wardrobe/vanity/room decorating still work and all existing saves load.
2. D-pad always visible during exploration; left thumb movement faster and stable; right thumb A and magic buttons reliable; UI does not overlap on mobile.
3. Text dialogue works, picture cues remain, no auto voice or timed auto-advance.
4. New saves have starter furniture and can freely change wall and floor look; existing saves keep all placements/ownership.
5. King fireworks game and Queen wand workshop function, save relevant selections and are replayable.
6. Unicorn tag features fair AI and safe finish/exit, no fail state.
7. Garden has >=12 plots, >=8 plants, growth/harvest and persistent state.
8. Two new explorable underwater maps and >=2 distinct mermaid games; no blocked spawns.
9. At least one earned optional room/outfit/wand reward from each major activity, idempotent.
10. No regression to stored home app release; /preview/ link updated per phase with browser screenshots and documented iPad-specific open questions.

## Child playtesting priority
Before declaring v0.4 complete, observe whether the child can: steer with one hand; identify when/where to press A vs magic; understand how to enter games; switch wall/floor styles; start and stop tag; create a firework; plant and harvest one crop; return home from the lagoon. Use this to simplify rather than merely add explanatory text.
