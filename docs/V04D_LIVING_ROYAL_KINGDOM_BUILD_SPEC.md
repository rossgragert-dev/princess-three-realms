# Princess of Three Realms — v0.4d: A Living Royal Kingdom
## iPad playtest feedback, implementation contract and acceptance gates

Status: development specification and targeted hotfix branch, **not a finished v0.4d game release**.
Source baseline: v0.4c on `main`, preview/stable separated.
Branch: `development/v04d-living-royal-kingdom`.

## Design rule

This is an open, child-directed magical world. No rabbit conversation, story beat, star, sticker, game, or order of quests may prevent entering the world's major areas or trying its ordinary activities. Characters suggest ideas; never impose a linear checklist. Completed activities remain replayable. Child-friendly touch targets, picture-first prompts, positive reinforcement, existing saves and offline iPad play take priority over feature quantity.

## Workstream 0: regression hotfixes (must pass before expanding)

1. Dialogue: dismiss/advance by tapping **outside** the message panel as well as the green arrow; a touch that opened a message cannot dismiss it; tapping narration replay must not advance. All other overlays need an obvious exit, but puzzles must not silently submit or erase progress on outside taps.
2. Crown HUD: give it an action (Royal Stickerbook/achievements) and a discernible pressed response. Do not leave decorative HUD elements that look like buttons. Reassess portrait empty blue bands and scale/UI placement in actual iPad Safari; keep controls anchored.
3. Remove the Pip dependency from tree sounds and other areas. Convert objective indicator to optional suggestions. Preserve already earned transformations and rewards.
4. Mermaid-form shoreline stranding: check passable cell, shore adjacency, landing coordinate, joystick motion and cross-scene spawns before/after transform. Validate both entering water and returning to land, even after saved reloads and blocked shore edges; include reproducible regression tests.
5. Pearl: permanently retain first completion/reward but allow resetting the pearl to its starting lane position and pushing it repeatedly using bubbles. Give a clear, large 'play again' cue at the socket; no reward farming, and never reset `PEARL_PLACED` achievement.
6. Doorway routing: each edge/direction should have a single destination, never two adjacent auto-warps. Test approaching all transitions by both joystick and tap-to-walk.
7. Bedroom: remove obsolete free-floating wardrobe and vanity icons after physical props are used; make actual furniture the tap targets; ensure no invisible blocker or stale overlay remains.
8. Butterflies: reaching the matching flower should visibly complete the action: landing animation, nectar/sparkles, flower bloom, friendly sound, success line, saved progress and optional replay. A wrong flower gently flutters; do not punish.
9. Lantern clearing: the opened path must contain purposeful content (e.g. storybook stump, glow-tree friend, discovery and optional repeatable activity); add celebratory 'you opened the clearing' feedback and return path. Do not unlock an empty clearing.
10. Enchanted Woods: brighten tiles/lighting to a luminous, colorful fantasy woodland (glowing flowers, fireflies, warm grass, pastel accents). Arrival from a south-going trail MUST put the player at the **north** edge of the new map, walking south into the scene, with a return exit at the north edge.

## Target world topology (no ambiguous exits)

```text
                             [Throne Room] -- [Royal Gallery]
                                  |
   [King's Garden Labyrinth] -- [Courtyard] -- [Whispering Woods] -- [Moonpool Shore] -- [Shimmering River]
           (west path)            |                |                           |
                              [Bedroom]       [Unicorn Meadow]          [Underwater Grotto]
                                                    |
                                            [Enchanted Woods]

        [Throne Room] -- [Royal Magic Garden] -- [Greenhouse of Seeds]
                                  |
                           [Royal Kitchen]
```

- Courtyard WEST border: King's Garden Labyrinth only. Remove the little castle decoration in the old Festival Garden; integrate optional fireworks play in a small magical clearing rather than removing an existing activity.
- Courtyard EAST border: Whispering Woods only.
- Courtyard large north castle gate: working door to Throne Room.
- Courtyard bedroom door: bedroom only. The former north-east side door must be physically and visually distinct (Royal Gallery door, or reroute via Throne Room); no duplicate destination to greenhouse.
- Garden through a *different* intentional doorway (Throne Room garden arch, or a labeled gate); not the same border as the Woods. Its greenhouse enters a new greenhouse room containing seed packets, potted trees, shrubs and ornaments; NOT the Queen's existing conservatory/workshop.
- King's labyrinth: replace small fake castle with a simple hedge maze with clear junctions, visual hints and king at the center; no penalties/required tasks.
- Castle interior: Throne Room with both parents on thrones, accessible kitchen and gallery. Preserve existing Queen's wand workshop as an optional facility, relocating its entrance to a distinct side room rather than discarding it.
- Add explicit map ID, save sanitizer, guide/route registry, spawn pairs, reciprocal exits and tests for every new room.

## Workstream 1: bedroom, sleep and pets

- A real, readable princess bed, ideally canopy with headboard/pillows/blanket/shadow, consistently sized with other furniture. Fix or retire older tiny bed art instead of leaving a second fake bed. Keep furnishings movable where appropriate, and test furniture reachability.
- Tapping or pressing A beside a real bed opens picture-first 'Sleep' and 'Not now'. On Sleep: princess approaches bed, tucked-in frame, soft dimming/moon/sleep symbol, 1-3-second fade, morning sun with birds/sparkles; no global clock, no waiting, no actual night/day simulation. Increase optional `nightsSlept`, save safely. A repeat nap is harmless.
- Pet-adoption NPC in the main courtyard available on first entry. Four species: **cat, dog, pony, bird**. At least four looks/colors for each species. Picture cards with easy selection, no currency or chore prerequisite, confirmation, celebration. Pet appears in bedroom (bird may perch, pony occupies designated wide pet nook), moves/blinks/relaxes where safe, never blocks exits or furniture editing. Return to NPC to swap type and color freely. Save pet species/variant, sanitize invalid values and migrate older saves.
- Retain manual wardrobe and vanity editing and re-entry after reload.

## Workstream 2: castle and creative play

- **Throne Room:** recognizable royal hall, large symmetrical thrones with king and queen seated, warm lighting, carpets, banners and castle doors. Tap either parent for OPTIONAL visual suggestion cards showing an unvisited character/place. Selecting a card may highlight a route; no teleport without user action, and no mission gating. When all characters have been visited, suggest replay/free creative activities.
- **Royal Kitchen:** four distinct free-play activities — make a giant layered cake, decorate cookies, assemble pizza, and create colorful ice cream scoops. Drag/tap picture ingredients, unlimited retries, no clock or penalty, amusing oversized food payoff, optional save of creations or stickers.
- **Royal Gallery:** free painting with finger brushes, sizable canvas, color palette, stamp shapes, undo and clear with confirmation, optional room/gallery display of finished picture. Keep strokes locally/offline and cap storage to avoid bloating saves; preserve artwork between visits.
- Entrance/exit reachability and iPad portrait/landscape tap targets must work in every room.

## Workstream 3: expanded garden and greenhouse

- Replace six isolated flower plots with an appropriately large freely editable garden: numerous flowers plus small trees, bushes, paths, hedges, benches, fountains, birdbaths, arches, statues and decorative ornaments.
- Teach planting once in a short 3-step guided introduction: choose packet, place, water. After that, unlimited free design without progress gates. Collection lives in separate Greenhouse: choose visually distinct packets, plants and ornaments and carry/use them in Garden mode.
- Garden design should support move, rotate if useful, put away, undo, collision/no blocking essential paths, and be resilient to save migrations. Save placements by stable IDs with strict bounds/quantity sanitization.
- Butterfly matching changes a **visible** state: butterfly glides to corresponding color, lands, sparkles, flowers respond, and repeat option appears. Wrong color: gentle flutter and try again. No invisible completion.

## Workstream 4: large replayable literacy/puzzle library

- Every core puzzle family has at least **10 unique authored challenges** (minimum 5 before release), across phoneme/picture, rhyme, counting, shape/visual matching, pattern continuation, sequence/story order, and nature/garden puzzles. Avoid repeating only B=ball or red-blue alternating.
- Shuffle without immediate repeats and persist recent challenge IDs where useful. Tier 1 is highly pictorial with two or three answers; Tier 2 adds more distractors/longer patterns; Tier 3 adds multi-step reasoning. Advance difficulty gently with repeated successes, allow easier replay, and never lock other activities behind scores.
- All vocabulary/answers must match actual visual glyphs/speech keys. New narration may fall back to speech synthesis, but on-device narration must be tested when enabled. Picture-first with read-aloud option.
- Replaying does not re-award permanent stickers/decor or delete previous progress. Test at least 30 consecutive activities, save/reload, no repeated immediate puzzle, graceful hint/exit, and difficulty variation.

## Workstream 5: forest and mermaid racing

- Forest lantern game: clearer start/observe/repeat/try prompts, light up next lantern visibly, replay patterns of varying length (tiered, 5-10 variations), success animation; enchanted clearing houses an activity/discovery instead of empty floor.
- River racing should feel like a classic approachable 2D racing game: mermaid remains near a comfortable fixed screen position, background/course scrolls, horizontal/thumb steering dodges floating kelp/rocks and guides through hoops. Free Swim and Friendly Race have NO time penalties; optional Star Challenge offers replayable gentle goals. Always show prominent exit; never lose progress. Consider a true loop circuit with recognizable lap marker as an alternative, but choose a single clear implementation for this milestone.
- Avoid two independent joystick inputs competing for the same touch; bubble casting while steering, multitouch release, retry, camera and portrait iPad are regression gates.

## Save and release contract

- Preserve all v0.4c saves: flags, stickers, bedroom furniture, appearance, wardrobe, wand, garden, race records and offline settings.
- Add only additive, sanitized optional state for new systems (pets, sleep, garden placements, gallery art, variant cycle). Avoid irreversible migrations and unbounded arrays.
- Default new save values must be safe and playable. Test empty saves, v0.4b saves, v0.4c saves and malformed optional fields.
- All code must pass TypeScript, unit tests, one full Chapter 1 regression, bedroom decor, mermaid transform and pearl replay, navigation/reachability, puzzle variety, 6x enter/exit leak test, and actual headless Chromium viewport tests; manual **real iPad Safari** signoff is still required for touch/sound.
- Builds stay on an isolated branch until approved. Publish preview only after standalone bundle and route tests pass. Do not update stable `gh-pages` until explicit manual workflow_dispatch with `promote=true`. Never interpret commit-message text as permission.
- GitHub public repo standard runners are normally free; account 100% usage may refer to other private repos or storage. Keep automatic unit/build CI on main/PR, run heavy Playwright manually, keep artifacts only briefly. If workflows cannot run, build locally and publish precompiled static site through an approved branch deployment workflow; never bypass tests silently.

## Delivery order (separate review gates)

1. Hotfixes, navigation and moonpool/pearl stability.
2. Castle topology + throne room + garden labyrinth.
3. Bedroom sleep, pet selection/animation and icon cleanup.
4. Large greenhouse/garden and butterfly effects.
5. Kitchen + gallery creation tools.
6. 10+ puzzle variants per family, difficulty ramp and forest/river arcade redesign.
7. Full device/regression signoff and **manual stable promotion** only after approval.

## Currently implemented on the v0.4d development branch

- Dialogue background touch advances messages.
- Crown taps open the Stickerbook.
- Tree puzzle and carrot game no longer depend on a preliminary bunny conversation.
- Mermaid shore transition snaps onto checked passable destination rather than swimming from a temporarily invalid land tile.
- Pearl achievement is separate from its current lane position: it can be replayed with bubble pushes and reset by tapping it at the end.
- Release workflow promotion requires an explicit manual input; no commit-message trigger.
- CI no longer triggers every development-branch push; automatic jobs are scoped to main/PR and manual full browser checks.

**These commits have not been compiled, playtested or published yet. Everything else in this specification is a pending implementation item, not a claim that the game has been upgraded.**
