# Princess of Three Realms - Narration Recording Script

**Status: final voice recordings PENDING.** Until audio files exist the game falls back to a pulsing "next" arrow and (for grown-ups) captions.
Clips are looked up by key at `public/assets/audio/narration/<key>.m4a` (iOS Safari) with `<key>.ogg` as a fallback.
Any file with the right name replaces a temporary one: see "Replacing clips" below.

- Total lines: 185 (80 required)
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
| anywhere | `obj_kingdom` | The kingdom's magic is sleepy. Visit the woods, the garden and the river! |  | no |
| anywhere | `word_tree` | Tree. |  | no |
| anywhere | `word_log` | Log. |  | no |
| anywhere | `word_egg` | Egg. |  | no |
| anywhere | `word_chick` | Chick. |  | no |
| anywhere | `word_hen` | Hen. |  | no |
| anywhere | `word_star` | Star. |  | no |
| anywhere | `word_ladybug_1` | One! |  | no |
| anywhere | `word_ladybug_2` | Two! |  | no |
| anywhere | `word_ladybug_3` | Three! |  | no |
| anywhere | `word_red` | Red. |  | no |
| anywhere | `word_blue` | Blue. |  | no |
| anywhere | `word_yellow` | Yellow. |  | no |
| anywhere | `word_pink` | Pink. |  | no |
| anywhere | `race_pick` | Choose how to swim: free, friendly, or the star challenge! |  | no |
| anywhere | `race_go` | Swim through the shining rings! |  | no |
| anywhere | `race_done` | You did it! What a swim! |  | no |
| anywhere | `race_stars` | Star Challenge complete! |  | no |
| anywhere | `sticker_lanterns` | You lit the magic lanterns! |  | no |
| anywhere | `sticker_trees` | The old trees heard you! |  | no |
| anywhere | `sticker_rhyme_bridge` | You built the rhyme bridge! |  | no |
| anywhere | `sticker_storybook` | You told a story! |  | no |
| anywhere | `sticker_woods_gem` | You found a secret treasure in the woods! |  | no |
| anywhere | `sticker_garden` | You grew a garden! |  | no |
| anywhere | `sticker_butterflies` | You guided the butterflies! |  | no |
| anywhere | `sticker_ladybug` | You counted the ladybugs! |  | no |
| anywhere | `sticker_fountain` | You woke the garden fountain! |  | no |
| anywhere | `sticker_garden_gem` | You found a secret treasure in the garden! |  | no |
| anywhere | `sticker_river` | You swam the friendly race! |  | no |
| anywhere | `sticker_river_star` | You earned a river star! |  | no |
| anywhere | `sticker_river_pearls` | You woke the singing shells! |  | no |
| anywhere | `sticker_river_gem` | You found a secret treasure in the river! |  | no |
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
| anywhere | `atree_sound_s` | Listen! Which picture begins with the sss sound? |  | no |
| anywhere | `atree_sound_c` | Listen! Which picture begins with the kuh sound? |  | no |
| anywhere | `atree_sound_f` | Listen! Which picture begins with the fff sound? |  | no |
| anywhere | `hint_atree_s_1` | Sun. Sss, sss, sun. Do you hear the sss? |  | no |
| anywhere | `hint_atree_s_2` | Try the bright, shiny one! |  | no |
| anywhere | `hint_atree_c_1` | Cat. Kuh, kuh, cat. Do you hear the kuh? |  | no |
| anywhere | `hint_atree_c_2` | Try the furry one that purrs! |  | no |
| anywhere | `hint_atree_f_1` | Fish. Fff, fff, fish. Do you hear the fff? |  | no |
| anywhere | `hint_atree_f_2` | Try the one that swims! |  | no |
| anywhere | `success_sound_s` | Yes! Sun starts with sss! |  | no |
| anywhere | `success_sound_c` | Yes! Cat starts with kuh! |  | no |
| anywhere | `success_sound_f` | Yes! Fish starts with fff! |  | no |
| anywhere | `trees_done` | All the trees heard you! The woods are happier now! |  | no |
| anywhere | `bridge_rhyme_bee` | Which one rhymes with bee? |  | no |
| anywhere | `bridge_rhyme_frog` | Which one rhymes with frog? |  | no |
| anywhere | `hint_bee_1` | Bee, tree. They sound the same at the end! |  | no |
| anywhere | `hint_bee_2` | Sun does not sound like bee. Try the other one. |  | no |
| anywhere | `hint_frog_1` | Frog, log. They sound the same at the end! |  | no |
| anywhere | `hint_frog_2` | Ball does not sound like frog. Try the other one. |  | no |
| anywhere | `success_rhyme_cat` | Cat and hat! They rhyme! |  | no |
| anywhere | `success_rhyme_bee` | Bee and tree! They rhyme! |  | no |
| anywhere | `success_rhyme_frog` | Frog and log! They rhyme! |  | no |
| anywhere | `story_egg` | Put the pictures in order. What happens first? |  | no |
| anywhere | `story_day` | Put the pictures in order: night, morning, flowers! |  | no |
| anywhere | `hint_story_1` | First there is an egg. Then a chick. |  | no |
| anywhere | `hint_story_2` | Egg, chick, hen. Tap them in that order. |  | no |
| anywhere | `hint_day_1` | First the star. Then the sun. |  | no |
| anywhere | `hint_day_2` | Star, sun, flower. Tap them in that order. |  | no |
| anywhere | `success_story_egg` | Egg, chick, hen! What a story! |  | no |
| anywhere | `success_story_day` | Star, sun, flower! A lovely story! |  | no |

## Willa the woodland fairy (`willa`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| woods | `willa_intro` | Your magic can change you! Tap the unicorn to try. |  | yes |
| woods | `bridge_bloom_prompt` | Now trot over the bridge, and make the flowers bloom! |  | yes |
| woods | `need_unicorn` | Only a unicorn can fix this. Tap the magic wand and choose the unicorn! |  | yes |
| shore | `form_wrong_terrain` | Let us go to the glowing spot first. Follow the sparkles! |  | yes |
| shore | `shore_intro` | Look! Sparkly water. Tap it to become a mermaid! |  | yes |
| anywhere | `willa_meadow` | Follow the path north. A friend is waiting in the meadow! |  | no |
| anywhere | `woods_intro` | These woods are magical! The old trees whisper. Let us wake them up. |  | no |
| anywhere | `obj_lanterns` | Tap the stone, watch the lanterns glow, then tap them in the same order. |  | no |
| anywhere | `lanterns_watch` | Watch the lanterns glow. Then tap them in the same order. |  | no |
| anywhere | `lanterns_again` | Tap the glowing one next. You can do it! |  | no |
| anywhere | `lanterns_done` | The lanterns are lit! A secret path is open. Go and see what is waiting! |  | no |
| anywhere | `woods_done` | The woods are bright again. Thank you, Princess! |  | no |
| anywhere | `bridge_done` | The rhyme bridge is ready. Let us cross! |  | no |
| anywhere | `blossom_hi` | The glow blossom sings for you! Tap it again any time you like. |  | no |

## The King (`king`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| anywhere | `king_hello` | Hello, Princess! Shall we light up the night sky? Tap the launch pad! |  | no |
| anywhere | `king_again` | Ooh, so pretty! Let us make more fireworks! |  | no |
| anywhere | `king_fading` | Oh dear! The magic in our kingdom is getting sleepy. Will you help wake it up? |  | no |
| anywhere | `throne_king_hi` | Welcome home, Princess! Tap a picture to pick an adventure, or go anywhere you like! |  | no |
| anywhere | `throne_woods` | The Whispering Woods! Walk out the east path and say hello to the friendly tree. |  | no |
| anywhere | `throne_garden` | The Royal Magic Garden! Go out the front doors and through the flower archway. |  | no |

## The Queen (`queen`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| anywhere | `queen_hello` | Welcome to my wand workshop! Come and make your very own wand. |  | no |
| anywhere | `queen_again` | What a lovely wand! Would you like to change it? |  | no |
| anywhere | `queen_fading` | The Enchanted Woods, the Royal Garden and the Shimmering River are waiting for you! |  | no |
| anywhere | `throne_queen_hi` | Hello, my little star! Where would you like to play today? Tap a picture! |  | no |
| anywhere | `throne_meadow` | The Unicorn Meadow! Follow the forest path to find Dapple. |  | no |
| anywhere | `throne_shore` | The Moonpool Shore! Walk through the woods to the sparkling water. |  | no |

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
| anywhere | `river_intro` | Welcome to the river! Swim through the shining rings and listen to its song. |  | no |
| anywhere | `river_hint` | Tap the post to start a race. Or swim and play with the shells! |  | no |
| anywhere | `river_pearls_hint` | Tap the singing shells with your bubbles. Can you wake four? |  | no |
| anywhere | `river_pearls_done` | Listen! The river is singing! Thank you! |  | no |

## Nana Bluebird (`nana`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| courtyard | `garden_sequence` | Help the garden grow! Put the pictures in order: first the seed. |  | yes |
| courtyard | `hint_sequence_1` | First comes the seed. Then the water. |  | yes |
| courtyard | `hint_sequence_2` | Seed, water, flower. Tap them in that order. |  | yes |
| courtyard | `success_garden_grow` | Look at the flower grow! Beautiful! |  | yes |
| bedroom | `nana_return` | Look! Our rainbow is brighter. Let us put your new lamp in your room! |  | yes |
| bedroom | `lamp_placed` | What a beautiful room, Princess! |  | yes |
| anywhere | `garden_intro` | Welcome to the Royal Garden! Pick a seed, plant it, and give it water. |  | no |
| anywhere | `garden_plant` | Tap a seed packet. Then tap a flower bed. |  | no |
| anywhere | `garden_water` | Now tap the seed to give it water! |  | no |
| anywhere | `garden_fountain_hint` | Grow three flowers and the fountain will sing again! |  | no |
| anywhere | `garden_done` | Look at all your flowers! The garden is so happy. |  | no |
| anywhere | `fountain_ready` | Lots of flowers! Touch the fountain! |  | no |
| anywhere | `fountain_back` | The fountain is dancing again! Thank you, Princess! |  | no |
| anywhere | `fountain_tired` | The fountain is sleepy. Grow three flowers to wake it. |  | no |
| anywhere | `butterfly_ask` | Butterflies love their own colors. Take each one to the matching flower! |  | no |
| anywhere | `butterflies_done` | Every butterfly found its flower! |  | no |
| anywhere | `ladybug_count` | Tap each ladybug to count it. |  | no |
| anywhere | `hint_ladybug_1` | Ladybugs hide near the flowers. |  | no |
| anywhere | `hint_ladybug_2` | One ladybug is sparkling. Tap it! |  | no |
| anywhere | `success_ladybugs` | Three ladybugs! Thank you! |  | no |

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

## anywhere (119)

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
| king | `king_fading` | Oh dear! The magic in our kingdom is getting sleepy. Will you help wake it up? |
| queen | `queen_fading` | The Enchanted Woods, the Royal Garden and the Shimmering River are waiting for you! |
| narrator | `obj_kingdom` | The kingdom's magic is sleepy. Visit the woods, the garden and the river! |
| willa | `woods_intro` | These woods are magical! The old trees whisper. Let us wake them up. |
| willa | `obj_lanterns` | Tap the stone, watch the lanterns glow, then tap them in the same order. |
| willa | `lanterns_watch` | Watch the lanterns glow. Then tap them in the same order. |
| willa | `lanterns_again` | Tap the glowing one next. You can do it! |
| willa | `lanterns_done` | The lanterns are lit! A secret path is open. Go and see what is waiting! |
| willa | `woods_done` | The woods are bright again. Thank you, Princess! |
| tree | `atree_sound_s` | Listen! Which picture begins with the sss sound? |
| tree | `atree_sound_c` | Listen! Which picture begins with the kuh sound? |
| tree | `atree_sound_f` | Listen! Which picture begins with the fff sound? |
| tree | `hint_atree_s_1` | Sun. Sss, sss, sun. Do you hear the sss? |
| tree | `hint_atree_s_2` | Try the bright, shiny one! |
| tree | `hint_atree_c_1` | Cat. Kuh, kuh, cat. Do you hear the kuh? |
| tree | `hint_atree_c_2` | Try the furry one that purrs! |
| tree | `hint_atree_f_1` | Fish. Fff, fff, fish. Do you hear the fff? |
| tree | `hint_atree_f_2` | Try the one that swims! |
| tree | `success_sound_s` | Yes! Sun starts with sss! |
| tree | `success_sound_c` | Yes! Cat starts with kuh! |
| tree | `success_sound_f` | Yes! Fish starts with fff! |
| tree | `trees_done` | All the trees heard you! The woods are happier now! |
| tree | `bridge_rhyme_bee` | Which one rhymes with bee? |
| tree | `bridge_rhyme_frog` | Which one rhymes with frog? |
| narrator | `word_tree` | Tree. |
| narrator | `word_log` | Log. |
| tree | `hint_bee_1` | Bee, tree. They sound the same at the end! |
| tree | `hint_bee_2` | Sun does not sound like bee. Try the other one. |
| tree | `hint_frog_1` | Frog, log. They sound the same at the end! |
| tree | `hint_frog_2` | Ball does not sound like frog. Try the other one. |
| tree | `success_rhyme_cat` | Cat and hat! They rhyme! |
| tree | `success_rhyme_bee` | Bee and tree! They rhyme! |
| tree | `success_rhyme_frog` | Frog and log! They rhyme! |
| willa | `bridge_done` | The rhyme bridge is ready. Let us cross! |
| tree | `story_egg` | Put the pictures in order. What happens first? |
| tree | `story_day` | Put the pictures in order: night, morning, flowers! |
| narrator | `word_egg` | Egg. |
| narrator | `word_chick` | Chick. |
| narrator | `word_hen` | Hen. |
| narrator | `word_star` | Star. |
| tree | `hint_story_1` | First there is an egg. Then a chick. |
| tree | `hint_story_2` | Egg, chick, hen. Tap them in that order. |
| tree | `hint_day_1` | First the star. Then the sun. |
| tree | `hint_day_2` | Star, sun, flower. Tap them in that order. |
| tree | `success_story_egg` | Egg, chick, hen! What a story! |
| tree | `success_story_day` | Star, sun, flower! A lovely story! |
| nana | `garden_intro` | Welcome to the Royal Garden! Pick a seed, plant it, and give it water. |
| nana | `garden_plant` | Tap a seed packet. Then tap a flower bed. |
| nana | `garden_water` | Now tap the seed to give it water! |
| nana | `garden_fountain_hint` | Grow three flowers and the fountain will sing again! |
| nana | `garden_done` | Look at all your flowers! The garden is so happy. |
| nana | `fountain_ready` | Lots of flowers! Touch the fountain! |
| nana | `fountain_back` | The fountain is dancing again! Thank you, Princess! |
| nana | `fountain_tired` | The fountain is sleepy. Grow three flowers to wake it. |
| nana | `butterfly_ask` | Butterflies love their own colors. Take each one to the matching flower! |
| nana | `butterflies_done` | Every butterfly found its flower! |
| nana | `ladybug_count` | Tap each ladybug to count it. |
| narrator | `word_ladybug_1` | One! |
| narrator | `word_ladybug_2` | Two! |
| narrator | `word_ladybug_3` | Three! |
| nana | `hint_ladybug_1` | Ladybugs hide near the flowers. |
| nana | `hint_ladybug_2` | One ladybug is sparkling. Tap it! |
| nana | `success_ladybugs` | Three ladybugs! Thank you! |
| narrator | `word_red` | Red. |
| narrator | `word_blue` | Blue. |
| narrator | `word_yellow` | Yellow. |
| narrator | `word_pink` | Pink. |
| coralie | `river_intro` | Welcome to the river! Swim through the shining rings and listen to its song. |
| willa | `blossom_hi` | The glow blossom sings for you! Tap it again any time you like. |
| king | `throne_king_hi` | Welcome home, Princess! Tap a picture to pick an adventure, or go anywhere you like! |
| queen | `throne_queen_hi` | Hello, my little star! Where would you like to play today? Tap a picture! |
| king | `throne_woods` | The Whispering Woods! Walk out the east path and say hello to the friendly tree. |
| queen | `throne_meadow` | The Unicorn Meadow! Follow the forest path to find Dapple. |
| queen | `throne_shore` | The Moonpool Shore! Walk through the woods to the sparkling water. |
| king | `throne_garden` | The Royal Magic Garden! Go out the front doors and through the flower archway. |
| coralie | `river_hint` | Tap the post to start a race. Or swim and play with the shells! |
| coralie | `river_pearls_hint` | Tap the singing shells with your bubbles. Can you wake four? |
| coralie | `river_pearls_done` | Listen! The river is singing! Thank you! |
| narrator | `race_pick` | Choose how to swim: free, friendly, or the star challenge! |
| narrator | `race_go` | Swim through the shining rings! |
| narrator | `race_done` | You did it! What a swim! |
| narrator | `race_stars` | Star Challenge complete! |
| narrator | `sticker_lanterns` | You lit the magic lanterns! |
| narrator | `sticker_trees` | The old trees heard you! |
| narrator | `sticker_rhyme_bridge` | You built the rhyme bridge! |
| narrator | `sticker_storybook` | You told a story! |
| narrator | `sticker_woods_gem` | You found a secret treasure in the woods! |
| narrator | `sticker_garden` | You grew a garden! |
| narrator | `sticker_butterflies` | You guided the butterflies! |
| narrator | `sticker_ladybug` | You counted the ladybugs! |
| narrator | `sticker_fountain` | You woke the garden fountain! |
| narrator | `sticker_garden_gem` | You found a secret treasure in the garden! |
| narrator | `sticker_river` | You swam the friendly race! |
| narrator | `sticker_river_star` | You earned a river star! |
| narrator | `sticker_river_pearls` | You woke the singing shells! |
| narrator | `sticker_river_gem` | You found a secret treasure in the river! |
| narrator | `hint_together` | Let's do it together! |
| narrator | `retry_gentle` | Let's try again! |
