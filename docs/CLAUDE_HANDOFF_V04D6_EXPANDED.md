# CLAUDE DEVELOPMENT HANDOFF — PRINCESS OF THREE REALMS v0.4d.6 (EXPANDED)
## Royal Kingdom Interactions · Pet Companions · Castle Moat & Underwater Kingdom · Transformation Freedom · Comprehensive Game Audit

You are continuing **the existing playable Phaser/TypeScript project**. Do **not** rebuild it.

### Repository and release safety

- Repository: `rossgragert-dev/princess-three-realms`
- **Work only on:** `development/v04d6-player-feedback`
- Previous approved, deployed preview baseline: `6fb0a6d91bc21dd6645c175f7923f975ec34396f` (v0.4d.5, "Infinite Adventures").
- This development branch was created from that baseline and currently contains the prior handoff document; the implementation of v0.4d.6 has **not yet been verified or accepted**. Confirm live branch state before editing.
- Read **`docs/V04D6_PLAYER_FEEDBACK_HANDOFF.md` in full**, and treat its original four requests and acceptance tests as mandatory. Read relevant existing v0.4d implementation docs, tests, and the current changelog.
- **Preserve the stable iPad release, `main`, and `gh-pages`.** Publish only to an isolated preview using the established workflow. No promotion or stable overwrite without explicit owner approval.
- Preserve save compatibility with existing localStorage (`ptr_save_v1`), existing quest flags, furniture, gallery art, owned cosmetics, stickers, puzzle-library memory, race records, and optional narration. Introduce compatible fields with robust defaults and sanitation; never wipe a player's save.

### The player's priorities — all must be implemented

1. **Talking tree regression:** Solving the tree's puzzle must visibly make it move aside so the gate opens; preserve the open state on reload.
2. **Royal Kitchen:** Tap a topping picture to select it (selected card is clearly highlighted), then tap the specific point on the cake, cookies, pizza, or ice cream to place that topping. Do not randomly place on single-tap. Undo and cancellation work. Each completed dish must stay assembled and visible on its own counter/display stand across scene changes/reloads, until explicitly redecorated or eaten.
3. **Pajamas:** Add several adorable pajamas as genuine clothing assets in the wardrobe. They must appear in thumbnails, full-body preview, and the in-world princess sprite; save and reload normally.
4. **King/Queen mission travel:** The existing mission picture chooser in the throne room should transport directly to the selected adventure. Keep dialog, cancel and back, and existing walkable connections.
5. **Pet care:** The princess must be able to **feed, give water to, and play with** her chosen pet; make each interaction visual, interactive, and repeatable.
6. **Castle moat and underwater realm:** The courtyard needs a convincing, accessible **castle moat** where the player can approach water from the castle grounds, enter as a mermaid, and discover **a substantial new underwater explorable area** (not a recolored grotto/race, not a small single-screen backdrop).
7. **Transformation freedom from first launch:** The form tray must offer princess, unicorn and mermaid **from the very beginning** of a fresh game, with natural land/water transitions. Existing character encounters should teach/explain abilities, not unlock them.

### 0. Audit first, then implement and improve

1. Inspect the checked-out branch and compare it with the v0.4d.5 commit. Map architecture for `src/scenes/WorldScene.ts`, `UIScene.ts`, `src/world/story.ts`, `kingdomStory.ts`, `maps.ts`, `castleMaps.ts`, `kingdomMaps.ts`, `src/content/kingdom.ts`, `src/actors/transformations.ts`, `src/systems/saveManager.ts`, art-generator scripts and browser tests.
2. **Run baseline tests/build/real-Chrome smoke tests** before modifications. Record any preexisting failures separately.
3. Review game on child-friendly touch interaction, clarity of prompts, readability, art cohesion, sound, input responsiveness, mis-taps, object collisions, missing feedback, navigation, performance, portrait/landscape layout, autosave, and optional narration.
4. **Fix additional concrete issues you find**, especially regressions, stuck players, unresponsive scenes, misleading UI, save corruption, or overlapping touch targets. Include regression tests. Prioritize player-reported features first. Avoid speculative redesigns of accepted mechanics; record larger subjective changes as recommendations instead of silently replacing systems.
5. Report defects found, root cause, changes, tests and unresolved issues. Do not claim device testing that wasn't performed.

### 1. Tree: visible gate opening again

- Core location: Whispering Woods `tree` in `src/world/story.ts`; its gate `TREE_GATE_OPEN` in `src/world/maps.ts`. `WorldScene.buildObjects` captures `treeSprite` and `applyFlags(true)` is supposed to tween it four tiles left.
- Verify whether current build actually has the sprite and animates after solving `tree_sound`; fix root cause rather than adding a detached animation. Check screen framing/camera, sprite identity/depth, tween start/end, gate tile update, collisions and player pathing.
- Differentiate this blocking tree from the distinct `ancient_tree` objects in the Enchanted Woods. Verify those environmental-magic reactions too.
- On completion the tree should clearly move, gate should be traversable. On reload it stays safely aside. Replays do not duplicate first-time rewards.
- Reduced-effects mode can snap to the new position with a gentle cue. Cover with automated tests and screenshots.

### 2. Kitchen: precision placement, permanent displays, eat/change

- Current implementation: `src/ui/creativePanels.ts` `runBake`; on simple topping taps `put(key)` uses randomized polar coordinates. Replace with **select → highlight → tap a valid food surface → precise placement**. Optional drag support is fine if touch-to-place works independently.
- The selected topping stays selected until she picks another. All cards have friendly large touch targets. Tapping outside the valid food polygon does not place randomly; maintain logical placement inside visible food.
- Provide undo (last topping), done/save, and cancel/back that preserves the previous finished item. Ice cream should place scoops/toppings predictably using geometry appropriate to a cone rather than choosing random stack offsets.
- Save four independent assembled designs (cake, cookies, pizza, ice cream), each with capped and sanitized topping lists and normalized local positions. Save only whitelisted topping keys. Render these actual toppings on top of the correct dish in-world on separate existing kitchen counters, not merely a generic stock sprite.
- Tapping a displayed item brings an obvious picture-first choice: **redecorate / eat / leave**. Redecorate loads its existing saved design. Eating produces a happy little reaction, clears only that specific finished item and does not affect rewards or other dishes. Items persist across reload until eaten or replaced.
- Touch + pointer tests and actual browser screenshots, including incorrect taps, undo, cancellation, reload and one-dish isolation. Preserve gallery painting functionality.

### 3. Pajama collection

- Add four immediately owned, distinct pajamas: pink hearts two-piece, lavender stars two-piece, blue moon/cloud nightgown, rainbow bedtime set (or equally coherent designs).
- Draw actual pixel-art clothing in the project's generated pipeline. Relevant files include `src/content/appearance.ts`, `src/art/compose.ts`, `src/art/looks.ts`, `src/scenes/StationScene.ts`, `tools/art_wardrobe.py`, `tools/art_overworld.py` and `tools/gen_art.py`. `src/content/wardrobeIndex.ts` is **generated**, not manually maintained.
- Validate real full-body, portrait and overworld appearance (including animations), multiple hair/skin/color selections, crown/accessory layering, bedtime and reload. Avoid invisible outfit IDs. They can be worn at any time; do not forcibly equip at bedtime.

### 4. Throne-room mission picture travel

- `src/world/kingdomStory.ts` currently shows images to choose `woods`, `meadow`, `shore`, `garden` but only speaks matching dialog. Wire the choices to existing safe `WorldScene.travel` via a narrow context callback.
- Destination mapping: tree -> `woods/from_courtyard`; unicorn -> `meadow/from_woods`; mermaid -> `shore/from_woods`; flower -> `garden/from_courtyard`. Verify spawn names against map definitions.
- Both parents offer travel, with brief optional exposition and a sparkle/fade; cancel stays in throne. Never trigger a transition while choice modal is open and never leave `busy` stuck. Mission entrances, returning home and existing saved progress remain valid.
- No mandatory objectives, flags, or chapter completion for any transport choice.

### 5. Pet companions: active care, not just a decorative pet

**Current baseline:** The Pet Keeper in the courtyard lets players choose a cat, dog, pony or bird with four looks (see `src/content/kingdom.ts` `PetChoice`, `src/world/kingdomStory.ts` `pet_keeper`). A pet appears and wanders in the bedroom (`WorldScene.buildPet`), and tapping it runs `petHappy`, but there is **no feed / water / play system** yet.

**Implement a joyful, simple pet-care loop:**

- Tap the pet in the bedroom to open a **large picture-only care menu** with three clear icons: **food bowl, water bowl, toy/ball**; include back/close. Integrate with current bedroom layout: do not block furniture editing, bed interaction, pet wandering or player movement.
- **Feed:** Choose a safe, species-appropriate treat/food (picture cards, at least a couple of options if practical), visibly set down a food bowl and let the pet approach, eat with a distinct movement and react happily (tail wag, happy bounce, chirp, hearts). No pressure, food costs, or inventory limits.
- **Give water:** Place/fill an identifiable water dish; pet walks to it, drinks, water ripples/sparkles and happy feedback. Refill anytime. **Water must not be confused with feeding**.
- **Play:** Launch an active mini-interaction that varies by species (dog fetch ball, cat chase yarn, pony playful trot/follow, bird flutter toward toy). Child should *do* something—tap a toy/target, throw and watch, or guide play—rather than receive only a dialog box. Provide replay and exit. Pet actions must work with the chosen look.
- Optionally let the pet follow her in the courtyard or visit a small pet area, *only after* the bedroom experience works and pathing is safe; do not spawn pets into underwater maps or block doorways.
- Persist the pet identity and cosmetic look and any gentle play/history/care personalization as additive fields. Switching pets with the Keeper must reset/associate correct care data without corrupting old saves. Reward attention with cheerful feedback, **not** strict hunger/thirst/fatigue meters, pet death, neglect messages or real-time urgency. Pet care must never gate story progress or impose negative consequences.
- Use dedicated action states and cleanup for pet wander timers, collisions, scenes, modal close, reduced effects and reload. Large taps, picture prompts and friendly sounds. Include tests for all four species and multiple repeated interactions.

### 6. Castle moat accessible from the courtyard + substantial NEW underwater kingdom

**Vision:** An exciting place the princess can discover *immediately* beside her castle, with a beautiful surface moat and mysterious underwater secrets accessible in mermaid form. It must be an explorable area with meaningful travel, not only a race minigame or a re-used grotto.

**Map architecture:**

- Existing `courtyard` is 40x30 and already has important links to Woods, Festival, Garden, Bedroom, Conservatory, Throne and Pip/Pet Keeper. Map layout lives in `src/world/maps.ts`; existing water rules in `src/world/navigation.ts` and `src/world/terrain.ts`.
- Design a **visible castle moat/stone bridge setting connected directly to the courtyard**. You may extend/refactor the courtyard bounds and shoreline **or** create an adjacent mixed land/water `moat` scene reached by a clear courtyard entrance, provided a player can *see and reach the water from the courtyard*, not solely from an unexplained teleport menu. Preserve existing courtyard entrances, walkable lanes, garden plots and quest objects.
- Make the moat feel like castle architecture: stone embankment, arched bridge, reflections, reeds/lilies, water animation, portcullis outflow, stones and safe shore access. Child can walk along the bank, inspect the moat, transform into a mermaid at the shoreline and swim. No dangerous fall state or hard failure.
- The surface water links to a **new, separate underwater realm**, e.g. `moat_depths`, with at least **two recognizably different explorable subregions** and preferably a connected `sunken_passage` area (a distinct scene if manageable): a submerged castle arch, ancient mosaic or sunken tower, colorful coral/shell gardens, luminous fish, a hidden treasure nook, a secret passage, aquatic NPC/friendly creature and optional creative environmental interactions.
- Give the area **several child-friendly activities** that reuse existing picture-first learning systems without repeating the old grotto: e.g. help a friendly fish family find their way, match shell colors or patterns, restore glowing mosaics, discover a chest or explore a short tide-tunnel. Challenges should have hints, be replayable, be optional and never lock the player into a timed or punitive mode. Use existing royalty/sticker rules to prevent repeat exploitation.
- Make the underwater presentation visibly distinct: layered water/caustic lighting, kelp that gently sways, bubbles, distant castle foundations, plants/fish and polished original pixel art. Movement and camera should feel open and responsive on an iPad; preserve screen space for joystick/transform controls.
- Create reliable two-way entrances (courtyard <-> moat shore <-> underwater entrance). Mermaid can return to safe shallows, transform back to princess/unicorn and walk out; reload/save in an underwater room must land as mermaid on a valid water tile; a Home escape must be safe. No one-way portal, spawn trap, inaccessible exit or soft-lock.
- If implementing `SceneId` additions, update **all** known-scene tables, validators, `SAFE_SPAWN`, `getMaps`, navigation/guide scene graph, story routing, intro/arrival behavior, environmental magic, save sanitizer, map tests and any screenshots/tests enumerating scene IDs. Avoid new quest flag prerequisites for entry.
- Maintain original Moonpool Shore, Shimmering River and Grotto behaviors/quests as separate places; don't rename/reparent them without a strong, tested reason.

### 7. All forms available from the beginning (safe from any starting point)

**Current gating verified:** `src/actors/transformations.ts` `availableForms(flags)` includes princess by default, unicorn after `WILLA_MET`, mermaid after `RAINBOW_BRIDGE_OPEN`. `UIScene.toggleTray/placeTray` hides locked forms. `planFormChange` refuses mermaid outside mixed water areas. `WorldScene` sanitizes incompatible map/form combinations; `src/systems/saveManager.ts` currently hard-codes water scenes `grotto` and `river`.

- From the very first fresh launch in the courtyard, show **three usable form icons**: princess, unicorn, mermaid. Existing `WILLA_MET` / `RAINBOW_BRIDGE_OPEN` continue to track **story events** and gate rewards/paths where appropriate, but they no longer gate the *ability to transform*. Rework any story lines that falsely claim the player is receiving the ability for the first time.
- Princess <-> unicorn works safely on suitable land immediately. Mermaid requires water (no swimming across castle floors). **The user must have a discoverable way to become a mermaid early through the new moat**, with a friendly picture cue/path or guided walk to the nearest *reachable* shoreline. If the player taps mermaid in the initial courtyard but is far from water, do not simply disappear the icon or return a silent bonk—show an intelligible picture/voice hint and guide her to the accessible moat.
- Do not add an uncontrolled mermaid-on-land mode. Preserve collision rules. On reaching water, the transformation should be accompanied by an attractive but short animation; water entry/exit feels intentional. A request to become princess/unicorn underwater should direct the player to shore or a surface exit rather than change into an unwalkable form.
- Analyze `planFormChange` edge cases (two connected land/water tiles, blocked shoreline, changing rapidly, entering deep-water maps, clicking transformations while steering). Avoid erroneous fallbacks and hardcoded assumptions about only `shore`, `river` and `grotto`.
- Keep all previously earned forms valid for old saves. Update tests to expect all three forms at new game. Existing Willa / mermaid tutorial scenes become optional narrative learning, not mandatory unlocks.
- Preserve unicorn horn magic, mermaid bubbles, princess wand, speed differences and existing environmental reactions.

### Art, audio, quality and accessibility

- Preserve the approved pixel-art visual identity. Favor handcrafted original generated art (current pipeline) and consistent sprite scale/depth. Do not import random unlicensed images.
- Audio should be warm and pleasant, no persistent crackle. Maintain optional narration/captions, reduce-motion mode, sensible particle caps, and no mandatory reading for children.
- Scale interface for real iPad landscape and portrait and iPhone where already supported. No overlapping controls, invisible tap targets, clipped menus or text-only navigation. Avoid timer-based failure, punishment or lost progress; all adventures should be replayable.
- Keep code modular: pure rules + unit tests for saved state, form planning, pet-care actions, kitchen data and travel destination mapping. Avoid bloating `WorldScene.ts` further when a focused controller/module is practical.
- Evaluate performance: Phaser object/timer/tween lifecycle, animations and draw calls; avoid unbounded live effects or unreachable object references. Ensure scene restart leaves no orphan listeners.

### Sequencing / implementation plan

1. **Audit and reproduce bugs.** Review previous v0.4d.5 acceptance and v0.4d.6 original handoff; make a defect register.
2. Fix talking-tree regression and kitchen touch placement/persistence; implement throne transports and wardrobe art with tests.
3. Implement pet feeding, water and play, including UI/animations/persistence and controls.
4. Design and build moat access and the new underwater area; integrate maps, navigation, visuals and exploration activities.
5. Make form selection free from first launch, integrated with the moat, including a friendly shoreline guidance flow. Recheck early story dialog.
6. Perform holistic polish/fix pass, test full save migration, publish isolated preview and report results.

The dependency ordering between the moat and form changes may be adjusted sensibly; do not publish a broken interim build.

### Acceptance gates (must demonstrate, not merely assert)

**Automated unit checks**
- Run and keep the existing `v0.4d.5` 366-test baseline passing (or explain exact changed tests); extend with kitchen, wardrobe, pet-care, moat transitions, safe spawns and transformations-from-start coverage.
- Validate `sanitize` with old v0.4d.5 and earlier saves, malformed keys, missing new fields and fresh defaults.
- Pathfinding/reachability: from the fresh courtyard start reach moat, become mermaid, reach underwater areas, return to courtyard, then navigate to original destinations without a wall or unreachable tile.

**Real browser smoke and acceptance (touch events)**
- Solve talking-tree puzzle, see sprite position change, cross opened gate and reload.
- Cake: select a specific topping (highlight), place two toppings at two *different exact tap coordinates*, undo, save, leave/return/reload, verify placements; redecorate without losing previous item if canceled; eat and confirm item disappears while independent cookie remains.
- Equip all four pajamas; verify in-world look, full/portrait previews, sleep and reload.
- King and Queen: test each four-way travel image, return path and canceled chooser.
- Each pet: feed, water, play, observe distinct reactions, exit/cancel, rearrange bedroom furniture, reload and switch pet type.
- Fresh game: all three forms visibly selectable; unicorn works without unlocking anything. Go from courtyard to accessible moat, enter water as mermaid, explore both underwater regions, interact with two activities, return to dry land safely, reload from underwater and from land.
- Confirm earlier puzzle-library games, race modes, garden, gallery, bedroom furniture, transformation combat/spells, tutorial hints and optional narration still work.

**Evidence and handoff**
- Report branch and exact commits, changed files, tests run and results, screens/short clips where useful (screenshots under `docs/screenshots/browser/v04d6/`), fresh-save and upgrade-save verification, known limitations.
- Explicitly distinguish **browser-simulated touch** from a **physical iPad sign-off**. If physical device testing wasn't done, mark it outstanding.
- Deliver a playable isolated preview URL and verify it loads after deployment. **Do not promote to stable.**
- At end give a short prioritized follow-up list for any optional improvements identified during your review; never characterize untested features as accepted.

### Important implementation caution

The existing core stories and achievements must continue working even though the child can transform earlier and travel faster: available powers are **not identical** to completed quests. Story milestones still come from actual quest completion. The new underwater realm is additional to, not a substitute for, the existing grotto and river. The new pet-care system is a joyful play system, not a pet-survival simulator.

**Begin by reading the referenced handoff, inspecting the code and presenting a compact audit+implementation plan, then carry out the changes on the specified isolated development branch.**
