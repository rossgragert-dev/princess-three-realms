# v0.4b.1 — Royal Family portraits and iPad release

This is an artwork/default-look patch on top of the verified v0.4b gameplay. No quests, movement controls, spells, rewards, or dialogue were changed.

## Royal family
- King: short brown moustache and beard; medium-brown, shoulder-length curly hair; dark-framed glasses. Existing crown and red/blue royal clothing remain.
- Queen: long, softly flowing lighter-brown hair. Existing lilac gown, crown, and wand remain.
- Princess: default hairstyle `long` (existing straight silhouette), default hair colour `light_brown`. The six hairstyles and ten hair-colour choices remain editable in the Enchanted Vanity.
- Existing saves retain their selected hair style and hair colour, including blonde. The new default only applies where a valid saved choice does not exist.

## Build and publication
- Generated family assets are defined by `tools/art_family.py` and `tools/gen_art.py`. Deployment rebuilds them deterministically with Pillow, copies only three updated sheets into the standalone game, and stamps a fresh offline service-worker cache.
- `src/content/appearance.ts` and the checked-in standalone `site/app.js` both use the new default colour. The default preview swatch in `tools/art_wardrobe.py` matches.
- The Pages workflow promotes the release when a commit explicitly contains `[ipad-release]`; ordinary pushes stay preview-only. Its manual `workflow_dispatch promote=true` option remains intact.
- Validate Chrome/iPad Safari in both portrait and landscape. Open the stable root URL and the /preview/ URL; confirm royal sprites, default princess, editable hairstyle and colour, Fireworks, Workshop, Meadow Tag, offline reload, and no lost save data.
- The automated Pages step checks PNG dimensions and the presence of expected pixel colours, but does not replace hands-on iPad testing.
