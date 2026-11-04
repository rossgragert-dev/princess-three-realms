# Princess bedroom: decorating and rewards (v0.2)

Everything here is picture-only. A child never has to read or hear anything to earn, find, or place an item.

## How it plays
1. Earn an item (table below). A **"new thing!"** moment appears: big picture on a golden card, turning rays, sparkles, who gave it, and a "go home" cue.
2. The **Home button glows** whenever something earned is not yet in the room.
3. In the bedroom, hotspots that can take something new **sparkle**. Tap a hotspot: a bottom sheet shows big picture cards for that spot.
   - Full colour = yours; tap to put it in the room (it pops in with sparkles). Tap the placed one again to take it away.
   - Dark silhouette with a padlock = not yet; the small picture beside the lock shows who or where it comes from (Pip, Willa, Marina, a chest, a sparkle...). Tapping it just wobbles.
4. An item lives in one place at a time (placing it elsewhere moves it). All 12 can be on show at once.
5. The room is saved after every change and restored on reload. Old v0.1 saves are migrated (lamp, rug, vase, shell mobile).

## Hotspots (12 across 8 categories)
| Slot | Category | Holds |
|---|---|---|
| slot_bed | Bed | Canopy Bed |
| slot_rug | Rug | Rainbow Rug |
| slot_lamp | Lamp | Star Lamp |
| slot_wall_a / b / c | Wall decor | Shell Mirror, Mermaid Wall Art, Butterfly Painting (any of them in any wall spot) |
| slot_plush_a / b | Plush/toy | Bunny Pillow, Unicorn Plush |
| slot_shelf | Shelf decor | Flower Pot |
| slot_window | Window/curtain | Moon Curtain |
| slot_accent / accent_b | Small furniture/accent | Crystal Nightstand, Treasure Chest |

## The 12 items and how they are earned
| Item | Earned by | Source type |
|---|---|---|
| Bunny Pillow | Pip's carrots counted (PIP_CARROTS_DONE) | NPC gift |
| Unicorn Plush | Rainbow bridge repaired (RAINBOW_BRIDGE_OPEN) | NPC gift (Willa) |
| Shell Mirror | Marina's starfish found (MARINA_HELPED) | NPC gift |
| Mermaid Wall Art | Pearl pushed to its place (PEARL_PLACED) | Puzzle |
| Star Lamp | Wishing star taken (STAR_1_FOUND) | Quest |
| Canopy Bed | Star Lamp placed in the room (LAMP_PLACED) | NPC gift (Nana) |
| Rainbow Rug | Shell rhyme puzzle (SHELLS_MATCHED, optional) | Puzzle |
| Flower Pot | Garden seed-water-flower sequence (GARDEN_SEQUENCED, optional) | Puzzle |
| Butterfly Painting | Hidden sparkle in the far south-west corner of the castle garden (BUTTERFLY_FOUND) | Hidden exploration |
| Treasure Chest | Chest in the forest creek (CREEK_CHEST) | World chest |
| Moon Curtain | Chest on the beach (SHORE_CHEST) | World chest |
| Crystal Nightstand | Chest in the grotto (GROTTO_CHEST) | World chest |

One quest flag unlocks exactly one item (`DECOR[id].flag`), through the same idempotent `completeFlag` that already protects rewards from being farmed.
The main story path still only needs the Star Lamp placed to finish Chapter 1; everything else is bonus.

## Where it lives in code
- `src/content/decorCatalog.ts`: slots, items, placement rules, save sanitising (pure, unit tested in `src/tests/decor.test.ts`).
- `src/ui/decorUi.ts`: picker and reveal. `src/scenes/WorldScene.ts`: room rendering, sparkle marks, reveal queue. `src/world/story.ts`: `decorate()`, chests, hidden find.
- Art: `tools/art_props.py` (deterministic Pillow; re-run `python3 tools/gen_art.py`).
