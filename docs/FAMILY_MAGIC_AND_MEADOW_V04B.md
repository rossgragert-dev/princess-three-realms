# Princess of Three Realms — v0.4b: Family Magic & Unicorn Meadow
**Implementation handoff; specification only.** This document does not signify completed gameplay.

**Repository:** `rossgragert-dev/princess-three-realms`
**Starting point:** v0.4a.1 (analog joystick, free-placement bedroom, spell projectiles, text dialogue, wardrobe + vanity)
**Development preview:** https://rossgragert-dev.github.io/princess-three-realms/preview/
**Stable iPad game:** https://rossgragert-dev.github.io/princess-three-realms/ — **DO NOT PROMOTE or touch gh-pages.**

## First: fix princess wand facing (user-requested correction)

Currently `WorldScene.shootWand()` (see `src/scenes/WorldScene.ts`) computes:
```ts
const a = aim(from, DIRS[this.player.dir], targets);
const f = fly(from, a.dir, targets, (x, y) => !this.grid.passable(x, y));
```
`src/world/spells.ts` implements `aim` with a cone-based auto-target/assist, which changes the projectile's direction when scenery is near. **Remove auto-targeting from princess wand shots.**

- Fire **exactly** along `DIRS[this.player.dir]`: up/down/left/right as shown by the actual character orientation at the moment the button is pressed. The projectile must remain on that trajectory even if an interactable object lies slightly off to one side.
- Use the **same explicit direction** for visual spawn offset, tween trajectory, and `fly()` collision checks. Retain friendly object collision reactions and 6-tile range. Do not home, curve, snap or redirect at any point.
- A *direct hit* on a tree, flower, fountain, mushroom or banner may still activate its effect. A near miss should travel straight past and not activate it. Verify each target's collision radius feels forgiving without silently retargeting. If the current hit radius is unreasonably huge, reduce or define consistent target hitboxes separately.
- When using analog joystick diagonals, the sprite chooses one of four cardinal facings; wand uses **that same visible facing**. Firing while moving must work with the left thumb held, no steering interference.
- Keep cooldown, sparkles, reduced-effects mode, repeat casts, existing quest abilities and mermaid/unicorn magic unchanged.
- Retire or rename the now-unused `aim` helper and rewrite tests that assumed cone auto-aim: assert exact direction, direct hit, near miss, blocked collision, cardinal facing and thumb+shoot multitouch. No stale tests passing obsolete behavior.
- This wand correction must be completed, verified, and included before publishing the first v0.4b preview.

## Goal of v0.4b

A lively, non-scary fairy-tale kingdom where the princess can spend time with her mother, father, and a unicorn friend. Add **three genuine replayable minigames/activities**:
1. **Magical Fireworks Festival with the King** — colorful creative fireworks.
2. **The Queen's Wand Workshop** — design and equip a personal wand.
3. **Unicorn Tag in the Meadow** — play tag with another unicorn.

Make the activities available organically through familiar explorable castle/forest locations, not a detached games menu. They are **optional**, independent of Chapter 1's required story, and accessible early: King and Queen before Chapter 1 finishes, unicorn tag once unicorn form is unlocked.

## Shared child UX and art requirements

- Suitable for a five-year-old who is beginning to recognize letters. Text dialogue is allowed, with character portrait and optional picture cues. **No voiceover and no auto-advance.** Child can act using pictures and demonstration without reading text.
- No lives, health/damage, failure timers, lives lost, sharp flashing or shaming. Child can stop, retry and replay without penalty.
- Keep bright consistent **16-bit SNES-style original pixel art**. Actual new character sprites, animated portraits, magic props, visual rewards, custom icons and scenery—no emoji/colored squares masquerading as art.
- A and Magic buttons and joystick must stay usable in world areas; in minigame screens controls should be context-specific, well separated and big enough on small mobile devices. Hide irrelevant world controls in modal minigame screens.
- Music/SFX optional, no new voice. Honor reduced-effects and sound settings.
- Follow existing `src/config/gameConfig.ts` Phaser 3.90 architecture, 512x384 FIT logic, `src/scenes/UIScene.ts`, `src/actors/player.ts`, data-driven world maps and `tools/gen_art.py`.
- Any new systems should save safely and preserve all v0.1–v0.4a.1 quest flags, room furniture layouts, equipped wardrobe, room color/floor, stars, and existing form behavior.

## Activity A: The King and the Magical Fireworks Festival

**Where:** A new magical festival clearing just beside the palace courtyard (or a contained new castle garden map connected by an obvious path); the King is a welcoming, interactive NPC standing beside a magical launch dais and picture sign.

**Experience:**
- The King warmly invites the princess (brief portrait/text). A picture-guided demo shows: choose a color → choose a shape → tap the sky to launch.
- A dedicated `FireworksScene` shows the nighttime castle silhouette, deep blue/purple sky, stars and a safe magical launch platform.
- **At least 6 colors** (pink, gold, blue, green, violet, rainbow), **5 distinct designs** (star, heart, flower, spiral, rainbow), and **3 launch modes** (one, two, or three in a short sequence); big graphical icons/preview cards.
- Show magical particle trails, bursts that visibly match the selected shapes/colors, mild camera-free ambience. Support tap sky to place a burst; launch never requires dragging. An optional queue of three fireworks can create a tiny show.
- Unlimited practice, no counting down, and an easy Back/Home return to the King without changing player location unexpectedly. No instructions or technical steps for building real fireworks.
- First completed fireworks session unlocks a **Festival Star Garland** room decoration or matching dress accessory; individual designs can unlock picture stickers, idempotent. Subsequent fireworks remain replayable for creative enjoyment.
- Accessibility: no rapid strobe/flash, bright full-screen white flashes, explosive alarm sounds or unbounded particles. Reduced-effects mode uses slower fewer particles with an equivalent readable display.

## Activity B: The Queen's Wand Workshop

**Where:** The Queen waits inside an accessible castle conservatory/workshop adjacent to the courtyard (or a small connected garden alcove); she is a clearly different NPC from Nana and the King, with detailed original art and portrait.

**Experience:**
- A separate `WandWorkshopScene` (not the wardrobe/vanity scene) displays a large, detailed wand on a velvet pedestal and/or the princess holding it.
- The player mixes **at least 6 wand head shapes:** star, moon, flower, heart, crystal, seashell; **at least 8 colors:** pink, gold, blue, mint, lavender, red, pearl, rainbow; **at least 4 trails:** star sparkles, butterflies, flower petals, shimmering bubbles.
- Selections show an immediate animated preview of the chosen wand and spell style; child uses large picture tabs/swatches without reading. Offer a visible check and Back.
- At least 3 wand heads, 6 colors and 2 trails available from the start, remaining styles gained through story exploration/activities or gentle optional tasks. Unlock progression must be separate from currently **equipped wand**.
- Save `equippedWand = { headId, colorId, trailId }` and `unlockedWandOptions` (stable IDs) with safe defaults and migrations; never overwrite outfit/appearance data.
- On exiting, current princess wand sprite should show the selected color/head where legible, and **wand projectile uses the equipped color/trail**. Projectiles are still straight-ahead per the prior section; cosmetics must not change aiming/collision/range.
- The Queen offers a small magical jewelry/flower surprise or wand-related sticker on first workshop completion. The workshop is always replayable.

## Activity C: Unicorn Tag in a new meadow

**Where:** A **new, reachable Unicorn Meadow** attached to the existing enchanted forest via an obvious path/warp (not a teleport-only minigame). Willa can point the way with a portrait/text and picture of a unicorn. The meadow has flowers, a rainbow brook and an original friendly unicorn companion.

**Experience:**
- Player arrives in unicorn form (or receives a gentle prompt to transform) and approaches the unicorn to start. Show a short visual demo that one unicorn lightly touches the other and a heart appears.
- Use the new analog joystick to **move freely**. The other unicorn walks/runs with friendly, fair AI. Initially companion should be **slower than the player** and occasionally pause to allow a tag. Optional 3 rounds; visible three-star tally with a satisfying celebration. Never end by declaring a loss or removing rewards.
- Use real tile collision and appropriate collision/contact radius, no blocked corners, no stuck loops, no impossible tag through a wall, no jitter or repeated score on overlap. Contact should count only on transition/round cooldown.
- After tag, alternate roles: companion chases the player at a gentle pace, gives a visible friendly heart-tag, then resumes next round. If child stops playing, the companion should slow, approach and invite—not trap.
- Pause/return-to-forest control accessible any time; if exiting mid-round preserve sensible world state and don't softlock the form/quest.
- First successful three-tag session unlocks a **Meadow Ribbon** wearable or **Unicorn Flower Cushion** bedroom decor. Repeat visits grant fun celebration/stickers, not duplicate loot.
- Distinct AI and collision logic should be testable in a pure module separate from Phaser.

## World integration

- Add King + Queen sprite art, dialogue portraits, short scripts in content, map warps and valid spawns. Don't place them on the Chapter 1 path tiles, other NPCs, story gates, fountain, interactive trees, room doorway, or new free furniture editor.
- New garden/festival and meadow areas must be reachable with the relevant form and safely escapable. Every new SceneId must be added to GameState/sanitizers/maps, safe-spawn rules and tests.
- New achievements and one-time unlocks should be separate from required Chapter 1 flags. Replayable activity states should not create infinite new reward cards.
- Exiting a minigame should restore the scene, form, health-free movement and position without A/joystick pointer leakage or duplicate dialogs.
- Existing v0.4c plans (planting simulator, expanded mermaid realm) are **not in scope** for this milestone.

## Implementation order and gates

1. **Wand facing fix** + unit tests + real-browser shots that deliberately miss a target to the side. Save on same committed branch; preserve current mobile preview until ready.
2. **Data model and art**: character sprites/portraits, wand option catalog, minigame progression and rewards, safe save migrations, maps and visual previews.
3. **King fireworks** and **Queen workshop** fully playable; real Chrome tests with screenshots, 10 repeated interactions, sound off and reduced effects.
4. **Unicorn meadow/tag** with fair AI, working forest transitions and full joystick controls. Test 3 complete tag rounds and 10 repeated runs.
5. **Full regression**: Chapter 1 from fresh save through LAMP_PLACED, v0.3 wardrobe/vanity, v0.4a room designer and free furniture placement, joystick multitouch, wand straight flight, old-save migration, offline subpath, portrait + landscape minimum 44 CSS px targets.
6. Update Playwright specs for changed UI/dialogue. Run real Phaser typecheck and existing Node/browser drivers. CI may have pre-existing e2e failures; report them honestly and do not claim passing tests not actually executed.
7. Rebuild `site/` and service-worker precache, commit source + assets + built site, push to `main` **without force**. Verify green Pages deployment and give the current mobile `/preview/` URL. **Do not modify gh-pages or promote**.
8. Provide actual browser screenshots of King + fireworks options and a burst, Queen + wand options and dressed princess, new meadow + tag in action, and a straight-line wand shot that passes a nearby off-axis object.

## Done means

The child can walk to the King, create a colorful fireworks show, visit the Queen, customize a wand, then travel to the meadow and play several rounds of tag as a unicorn. Everything persists appropriately, remains accessible without narration, and can be replayed without frustration. The wand shoots **where the princess visibly faces**, never at an automatically selected target. The published preview is testable on phone/iPad without downloading a ZIP. Stable root release is unchanged.
