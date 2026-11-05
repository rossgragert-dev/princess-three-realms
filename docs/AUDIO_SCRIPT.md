# Princess of Three Realms - Narration Recording Script

**Status: final voice recordings PENDING.** Until audio files exist the game falls back to a pulsing "next" arrow and (for grown-ups) captions.
Clips are looked up by key at `public/assets/audio/narration/<key>.m4a` (iOS Safari) with `<key>.ogg` as a fallback.
Any file with the right name replaces a temporary one: see "Replacing clips" below.

- Total lines: 89 (80 required)
- Format: mono, 44.1 kHz, ~0.2 s of silence at each end, normalised to about -16 LUFS. Record each line separately.
- Sound lines say the *sound* ("buh"), never the letter name.
- Machine-readable copy of this table: `docs/narration_manifest.json` (used by `tools/make_tts_clips.py`).

## Replacing clips
1. Record or generate `<key>.m4a` (and optionally `.ogg`) and drop it in `public/assets/audio/narration/`.
2. `python3 tools/make_tts_clips.py --status` lists each key as `custom` (your file), `temp-tts` (generated) or `missing`.
3. Generated temporary clips are never overwritten by a re-run unless `--force`; your own files are never touched.

## Voice casting
| Speaker | Character | Direction |
|---|---|---|
| narrator | Storyteller | Warm, calm, unhurried grown-up voice; bedtime-story pace. |
| pip | Pip the bunny | Bright, bouncy and a little squeaky; quick and eager. |
| tree | The Talking Tree | Slow, deep, kindly and rumbly; long vowels. |
| willa | Willa the woodland fairy | Light, gentle and musical; slightly higher pitch. |
| king | The King | Warm, jolly and booming but gentle; a proud-parent tone. |
| queen | The Queen | Calm, kind and graceful; a soft storyteller tone. |
| dapple | Dapple the unicorn | Playful and giggly; quick and friendly. |
| bramble | Bramble the squirrel | Quick, cheerful and chatty; mid-high pitch. |
| marina | Marina the sea turtle | Soft, slow and wise; watery calm. |
| coralie | Coralie the seahorse | Sweet and bubbly; medium-high pitch. |
| nana | Nana Bluebird | Cozy, loving grandmother tone; slightly warbly. |
| shell | The Singing Shell | Playful sing-song; gentle echo is fine. |

# Part 1 - By character

## Storyteller (`narrator`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| courtyard | `word_carrot_1` | One! |  | yes |
| courtyard | `word_carrot_2` | Two! |  | yes |
| courtyard | `word_carrot_3` | Three! |  | yes |
| courtyard | `word_seed` | Seed. |  | yes |
| courtyard | `word_water` | Water. |  | yes |
| courtyard | `word_flower` | Flower. |  | yes |
| courtyard | `obj_pip` | Say hello to Pip the bunny! |  | yes |
| courtyard | `wand_lit` | Your star wand made it sparkle! |  | yes |
| woods | `word_ball` | Ball. |  | yes |
| woods | `word_cat` | Cat. |  | yes |
| woods | `word_sun` | Sun. |  | yes |
| woods | `transform_unicorn` | You are a unicorn! Trot over the flowers to make them bloom. |  | yes |
| woods | `word_tile_red` | Red. |  | yes |
| woods | `word_tile_blue` | Blue. |  | yes |
| woods | `obj_tree` | Walk through the woods and find the big talking tree. |  | yes |
| woods | `obj_bridge` | Find the broken rainbow bridge. Become a unicorn to fix it! |  | yes |
| woods | `chest_found` | A hidden treasure! |  | yes |
| woods | `bloom_cheer` | Flowers bloom wherever you trot! |  | yes |
| shore | `transform_mermaid` | You are a mermaid! You can swim anywhere in the water. |  | yes |
| shore | `obj_lake` | Tap the sparkly water to become a mermaid. |  | yes |
| grotto | `word_starfish_1` | One! |  | yes |
| grotto | `word_starfish_2` | Two! |  | yes |
| grotto | `word_starfish_3` | Three! |  | yes |
| grotto | `star_found` | You found the first wishing star! |  | yes |
| grotto | `word_hat` | Hat. |  | yes |
| grotto | `word_fish` | Fish. |  | yes |
| grotto | `obj_marina` | Swim down and help Marina the turtle. |  | yes |
| grotto | `obj_star` | Take the wishing star from the shiny stand. |  | yes |
| bedroom | `decor_tutorial` | Let's decorate your room! Tap a spot, then tap a picture. |  | yes |
| bedroom | `obj_home` | Tap the little house to go home and decorate your room. |  | yes |
| bedroom | `chapter_done` | More adventures are coming soon! |  | no |
| anywhere | `intro_welcome` | Let's play! Tap anywhere to walk. Tap your friends to say hello. |  | yes |
| anywhere | `controls_tap` | Tap the ground and the princess will walk there. |  | yes |
| anywhere | `quest_replay` | Tap the picture at the top to hear what to do next. |  | yes |
| anywhere | `transform_princess` | You are a princess again. |  | yes |
| anywhere | `sticker_pip` | You helped Pip the bunny count carrots! |  | yes |
| anywhere | `sticker_rainbow` | You fixed the rainbow bridge! |  | yes |
| anywhere | `sticker_marina` | You helped Marina the turtle! |  | yes |
| anywhere | `sticker_star` | You found the first wishing star! |  | yes |
| anywhere | `sticker_wand` | Your star wand made the stand sparkle! |  | yes |
| anywhere | `sticker_chest` | You found a hidden treasure! |  | yes |
| anywhere | `sticker_shell` | You found a treasure by the sparkly lake! |  | yes |
| anywhere | `sticker_pearl` | You found a treasure under the sea! |  | yes |
| anywhere | `ui_book` | This is your sticker book. Tap a sticker to hear its story. |  | yes |
| anywhere | `hint_together` | Let's do it together! |  | yes |
| anywhere | `retry_gentle` | Let's try again! |  | yes |

## Pip the bunny (`pip`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| courtyard | `pip_intro` | Hi, Princess! The rainbow is missing! Can you help me find three carrots first? |  | yes |
| courtyard | `pip_count_carrots` | Tap each carrot. Let's count them. How many can you find? | Warm, unhurried; pause after each sentence. | yes |
| courtyard | `hint_carrots_1` | I see one sparkling. Tap the sparkly carrot! |  | yes |
| courtyard | `hint_carrots_2` | Look in the garden by the flowers. Carrots like to hide. |  | yes |
| courtyard | `success_carrots` | Three carrots! Thank you, Princess! Now let us find the rainbow in the woods. |  | yes |

## The Talking Tree (`tree`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| woods | `tree_sound_b` | Listen carefully. Which picture begins with the buh sound? | Say the sound /b/ as "buh", not the letter name. | yes |
| woods | `hint_tree_1` | Ball. Buh, buh, ball. Do you hear the buh? |  | yes |
| woods | `hint_tree_2` | Try the round bouncy one! |  | yes |
| woods | `success_tree_sound` | Yes! Ball starts with buh. The path is open! |  | yes |

## Willa the woodland fairy (`willa`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| woods | `willa_intro` | Your magic can change you! Tap the unicorn to try. |  | yes |
| woods | `bridge_bloom_prompt` | Now trot over the bridge, and make the flowers bloom! |  | yes |
| woods | `need_unicorn` | Only a unicorn can fix this. Tap the magic wand and choose the unicorn! |  | yes |
| shore | `form_wrong_terrain` | Let us go to the glowing spot first. Follow the sparkles! |  | yes |
| shore | `shore_intro` | Look! Sparkly water. Tap it to become a mermaid! |  | yes |
| anywhere | `willa_meadow` | Follow the path north. A friend is waiting in the meadow! |  | no |

## The King (`king`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| anywhere | `king_hello` | Hello, Princess! Shall we light up the night sky? Tap the launch pad! |  | no |
| anywhere | `king_again` | Ooh, so pretty! Let us make more fireworks! |  | no |

## The Queen (`queen`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| anywhere | `queen_hello` | Welcome to my wand workshop! Come and make your very own wand. |  | no |
| anywhere | `queen_again` | What a lovely wand! Would you like to change it? |  | no |

## Dapple the unicorn (`dapple`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| anywhere | `dapple_hello` | Let us play tag! Run, run, run! |  | no |
| anywhere | `dapple_again` | Tag again? Yay! |  | no |
| anywhere | `dapple_form` | Tag is more fun as a unicorn! Tap the magic wand to become one. |  | no |

## Bramble the squirrel (`bramble`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| woods | `bramble_pattern` | The rainbow bridge is broken! Finish the pattern. Red, blue, red, blue. | Say the colors slowly, like a song. | yes |
| woods | `hint_pattern_1` | Red, blue, red... what comes next? |  | yes |
| woods | `hint_pattern_2` | It goes red, then blue, again and again. |  | yes |
| woods | `success_bridge_pattern` | The rainbow bridge is bright again! Hooray! |  | yes |

## Marina the sea turtle (`marina`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| grotto | `marina_intro` | Hello! Thank you for coming! Can you find my three starfish friends? |  | yes |
| grotto | `marina_find_starfish` | Tap each starfish to count it. |  | yes |
| grotto | `hint_starfish_1` | Starfish like to rest on the sand. Look down low. |  | yes |
| grotto | `hint_starfish_2` | One starfish is sparkling. Tap it! |  | yes |
| grotto | `success_starfish` | Three starfish! You found all my friends! Thank you! |  | yes |

## Coralie the seahorse (`coralie`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| grotto | `pearl_prompt` | Use your bubbles to push the pearl to the shiny shell. |  | yes |
| grotto | `pearl_pushed` | Pop! Bubbles can push the pearl. One more! |  | yes |

## Nana Bluebird (`nana`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| courtyard | `garden_sequence` | Help the garden grow! Put the pictures in order: first the seed. |  | yes |
| courtyard | `hint_sequence_1` | First comes the seed. Then the water. |  | yes |
| courtyard | `hint_sequence_2` | Seed, water, flower. Tap them in that order. |  | yes |
| courtyard | `success_garden_grow` | Look at the flower grow! Beautiful! |  | yes |
| bedroom | `nana_return` | Look! Our rainbow is brighter. Let us put your new lamp in your room! |  | yes |
| bedroom | `lamp_placed` | What a beautiful room, Princess! |  | yes |

## The Singing Shell (`shell`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| grotto | `shell_rhyme_cat` | Which one rhymes with cat? | Elongate the "at" sound. | yes |
| grotto | `hint_rhyme_1` | Cat, hat. They sound the same at the end! |  | yes |
| grotto | `hint_rhyme_2` | Fish does not sound like cat. Try the other one. |  | yes |
| grotto | `success_shell_rhyme` | Cat and hat! They rhyme! Thank you! |  | yes |

# Part 2 - By scene (playing order of the chapter)

## courtyard (17)

| Speaker | Key | Line |
|---|---|---|
| pip | `pip_intro` | Hi, Princess! The rainbow is missing! Can you help me find three carrots first? |
| pip | `pip_count_carrots` | Tap each carrot. Let's count them. How many can you find? |
| narrator | `word_carrot_1` | One! |
| narrator | `word_carrot_2` | Two! |
| narrator | `word_carrot_3` | Three! |
| pip | `hint_carrots_1` | I see one sparkling. Tap the sparkly carrot! |
| pip | `hint_carrots_2` | Look in the garden by the flowers. Carrots like to hide. |
| pip | `success_carrots` | Three carrots! Thank you, Princess! Now let us find the rainbow in the woods. |
| nana | `garden_sequence` | Help the garden grow! Put the pictures in order: first the seed. |
| narrator | `word_seed` | Seed. |
| narrator | `word_water` | Water. |
| narrator | `word_flower` | Flower. |
| nana | `hint_sequence_1` | First comes the seed. Then the water. |
| nana | `hint_sequence_2` | Seed, water, flower. Tap them in that order. |
| nana | `success_garden_grow` | Look at the flower grow! Beautiful! |
| narrator | `obj_pip` | Say hello to Pip the bunny! |
| narrator | `wand_lit` | Your star wand made it sparkle! |

## woods (21)

| Speaker | Key | Line |
|---|---|---|
| tree | `tree_sound_b` | Listen carefully. Which picture begins with the buh sound? |
| narrator | `word_ball` | Ball. |
| narrator | `word_cat` | Cat. |
| narrator | `word_sun` | Sun. |
| tree | `hint_tree_1` | Ball. Buh, buh, ball. Do you hear the buh? |
| tree | `hint_tree_2` | Try the round bouncy one! |
| tree | `success_tree_sound` | Yes! Ball starts with buh. The path is open! |
| willa | `willa_intro` | Your magic can change you! Tap the unicorn to try. |
| narrator | `transform_unicorn` | You are a unicorn! Trot over the flowers to make them bloom. |
| bramble | `bramble_pattern` | The rainbow bridge is broken! Finish the pattern. Red, blue, red, blue. |
| narrator | `word_tile_red` | Red. |
| narrator | `word_tile_blue` | Blue. |
| bramble | `hint_pattern_1` | Red, blue, red... what comes next? |
| bramble | `hint_pattern_2` | It goes red, then blue, again and again. |
| bramble | `success_bridge_pattern` | The rainbow bridge is bright again! Hooray! |
| willa | `bridge_bloom_prompt` | Now trot over the bridge, and make the flowers bloom! |
| narrator | `obj_tree` | Walk through the woods and find the big talking tree. |
| narrator | `obj_bridge` | Find the broken rainbow bridge. Become a unicorn to fix it! |
| narrator | `chest_found` | A hidden treasure! |
| narrator | `bloom_cheer` | Flowers bloom wherever you trot! |
| willa | `need_unicorn` | Only a unicorn can fix this. Tap the magic wand and choose the unicorn! |

## shore (4)

| Speaker | Key | Line |
|---|---|---|
| narrator | `transform_mermaid` | You are a mermaid! You can swim anywhere in the water. |
| willa | `form_wrong_terrain` | Let us go to the glowing spot first. Follow the sparkles! |
| willa | `shore_intro` | Look! Sparkly water. Tap it to become a mermaid! |
| narrator | `obj_lake` | Tap the sparkly water to become a mermaid. |

## grotto (19)

| Speaker | Key | Line |
|---|---|---|
| marina | `marina_intro` | Hello! Thank you for coming! Can you find my three starfish friends? |
| marina | `marina_find_starfish` | Tap each starfish to count it. |
| narrator | `word_starfish_1` | One! |
| narrator | `word_starfish_2` | Two! |
| narrator | `word_starfish_3` | Three! |
| marina | `hint_starfish_1` | Starfish like to rest on the sand. Look down low. |
| marina | `hint_starfish_2` | One starfish is sparkling. Tap it! |
| marina | `success_starfish` | Three starfish! You found all my friends! Thank you! |
| coralie | `pearl_prompt` | Use your bubbles to push the pearl to the shiny shell. |
| narrator | `star_found` | You found the first wishing star! |
| shell | `shell_rhyme_cat` | Which one rhymes with cat? |
| narrator | `word_hat` | Hat. |
| narrator | `word_fish` | Fish. |
| shell | `hint_rhyme_1` | Cat, hat. They sound the same at the end! |
| shell | `hint_rhyme_2` | Fish does not sound like cat. Try the other one. |
| shell | `success_shell_rhyme` | Cat and hat! They rhyme! Thank you! |
| narrator | `obj_marina` | Swim down and help Marina the turtle. |
| narrator | `obj_star` | Take the wishing star from the shiny stand. |
| coralie | `pearl_pushed` | Pop! Bubbles can push the pearl. One more! |

## bedroom (5)

| Speaker | Key | Line |
|---|---|---|
| nana | `nana_return` | Look! Our rainbow is brighter. Let us put your new lamp in your room! |
| narrator | `decor_tutorial` | Let's decorate your room! Tap a spot, then tap a picture. |
| nana | `lamp_placed` | What a beautiful room, Princess! |
| narrator | `obj_home` | Tap the little house to go home and decorate your room. |
| narrator | `chapter_done` | More adventures are coming soon! |

## anywhere (23)

| Speaker | Key | Line |
|---|---|---|
| narrator | `intro_welcome` | Let's play! Tap anywhere to walk. Tap your friends to say hello. |
| narrator | `controls_tap` | Tap the ground and the princess will walk there. |
| narrator | `quest_replay` | Tap the picture at the top to hear what to do next. |
| narrator | `transform_princess` | You are a princess again. |
| king | `king_hello` | Hello, Princess! Shall we light up the night sky? Tap the launch pad! |
| king | `king_again` | Ooh, so pretty! Let us make more fireworks! |
| queen | `queen_hello` | Welcome to my wand workshop! Come and make your very own wand. |
| queen | `queen_again` | What a lovely wand! Would you like to change it? |
| dapple | `dapple_hello` | Let us play tag! Run, run, run! |
| dapple | `dapple_again` | Tag again? Yay! |
| dapple | `dapple_form` | Tag is more fun as a unicorn! Tap the magic wand to become one. |
| willa | `willa_meadow` | Follow the path north. A friend is waiting in the meadow! |
| narrator | `sticker_pip` | You helped Pip the bunny count carrots! |
| narrator | `sticker_rainbow` | You fixed the rainbow bridge! |
| narrator | `sticker_marina` | You helped Marina the turtle! |
| narrator | `sticker_star` | You found the first wishing star! |
| narrator | `sticker_wand` | Your star wand made the stand sparkle! |
| narrator | `sticker_chest` | You found a hidden treasure! |
| narrator | `sticker_shell` | You found a treasure by the sparkly lake! |
| narrator | `sticker_pearl` | You found a treasure under the sea! |
| narrator | `ui_book` | This is your sticker book. Tap a sticker to hear its story. |
| narrator | `hint_together` | Let's do it together! |
| narrator | `retry_gentle` | Let's try again! |
