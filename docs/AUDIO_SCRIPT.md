# Princess of Three Realms v0.1 - Narration Recording Script

**Status: voice assets PENDING. No clip files exist yet.** The game looks up each clip by key and plays it from
`public/assets/audio/narration/<key>.m4a` (iOS Safari) with `<key>.ogg` as a fallback. Until these files exist the
child-facing experience is **not** complete for a non-reader.

- Total lines: 81 (80 required)
- Format: mono, 44.1 kHz, trimmed with ~0.2 s of silence at each end, normalised to about -16 LUFS.
- Voice: calm, warm and unhurried; smile while speaking. A parent recording is a good final option.
- Name each file exactly as the **key**. Record each line separately.
- Sound lines say the *sound* ("buh"), never the letter name.

## narrator

| Key | Line | Direction | Required |
|---|---|---|---|
| `intro_welcome` | Let's play! Tap anywhere to walk. Tap your friends to say hello. |  | yes |
| `controls_tap` | Tap the ground and the princess will walk there. |  | yes |
| `quest_replay` | Tap the picture at the top to hear what to do next. |  | yes |
| `word_carrot_1` | One! |  | yes |
| `word_carrot_2` | Two! |  | yes |
| `word_carrot_3` | Three! |  | yes |
| `word_ball` | Ball. |  | yes |
| `word_cat` | Cat. |  | yes |
| `word_sun` | Sun. |  | yes |
| `transform_unicorn` | You are a unicorn! Trot over the flowers to make them bloom. |  | yes |
| `transform_mermaid` | You are a mermaid! You can swim anywhere in the water. |  | yes |
| `transform_princess` | You are a princess again. |  | yes |
| `word_tile_red` | Red. |  | yes |
| `word_tile_blue` | Blue. |  | yes |
| `word_starfish_1` | One! |  | yes |
| `word_starfish_2` | Two! |  | yes |
| `word_starfish_3` | Three! |  | yes |
| `star_found` | You found the first wishing star! |  | yes |
| `decor_tutorial` | Let's decorate your room! Tap a spot, then tap a picture. |  | yes |
| `word_hat` | Hat. |  | yes |
| `word_fish` | Fish. |  | yes |
| `word_seed` | Seed. |  | yes |
| `word_water` | Water. |  | yes |
| `word_flower` | Flower. |  | yes |
| `obj_pip` | Say hello to Pip the bunny! |  | yes |
| `obj_tree` | Walk through the woods and find the big talking tree. |  | yes |
| `obj_bridge` | Find the broken rainbow bridge. Become a unicorn to fix it! |  | yes |
| `obj_lake` | Tap the sparkly water to become a mermaid. |  | yes |
| `obj_marina` | Swim down and help Marina the turtle. |  | yes |
| `obj_star` | Take the wishing star from the shiny stand. |  | yes |
| `obj_home` | Tap the little house to go home and decorate your room. |  | yes |
| `sticker_pip` | You helped Pip the bunny count carrots! |  | yes |
| `sticker_rainbow` | You fixed the rainbow bridge! |  | yes |
| `sticker_marina` | You helped Marina the turtle! |  | yes |
| `sticker_star` | You found the first wishing star! |  | yes |
| `sticker_wand` | Your star wand made the stand sparkle! |  | yes |
| `sticker_chest` | You found a hidden treasure! |  | yes |
| `sticker_shell` | You found a treasure by the sparkly lake! |  | yes |
| `sticker_pearl` | You found a treasure under the sea! |  | yes |
| `ui_book` | This is your sticker book. Tap a sticker to hear its story. |  | yes |
| `wand_lit` | Your star wand made it sparkle! |  | yes |
| `chest_found` | A hidden treasure! |  | yes |
| `bloom_cheer` | Flowers bloom wherever you trot! |  | yes |
| `hint_together` | Let's do it together! |  | yes |
| `retry_gentle` | Let's try again! |  | yes |
| `chapter_done` | More adventures are coming soon! |  | no |

## pip

| Key | Line | Direction | Required |
|---|---|---|---|
| `pip_intro` | Hi, Princess! The rainbow is missing! Can you help me find three carrots first? |  | yes |
| `pip_count_carrots` | Tap each carrot. Let's count them. How many can you find? | Warm, unhurried; pause after each sentence. | yes |
| `hint_carrots_1` | I see one sparkling. Tap the sparkly carrot! |  | yes |
| `hint_carrots_2` | Look in the garden by the flowers. Carrots like to hide. |  | yes |
| `success_carrots` | Three carrots! Thank you, Princess! Now let us find the rainbow in the woods. |  | yes |

## tree

| Key | Line | Direction | Required |
|---|---|---|---|
| `tree_sound_b` | Listen carefully. Which picture begins with the buh sound? | Say the sound /b/ as "buh", not the letter name. | yes |
| `hint_tree_1` | Ball. Buh, buh, ball. Do you hear the buh? |  | yes |
| `hint_tree_2` | Try the round bouncy one! |  | yes |
| `success_tree_sound` | Yes! Ball starts with buh. The path is open! |  | yes |

## willa

| Key | Line | Direction | Required |
|---|---|---|---|
| `willa_intro` | Your magic can change you! Tap the unicorn to try. |  | yes |
| `form_wrong_terrain` | Let us go to the glowing spot first. Follow the sparkles! |  | yes |
| `bridge_bloom_prompt` | Now trot over the bridge, and make the flowers bloom! |  | yes |
| `shore_intro` | Look! Sparkly water. Tap it to become a mermaid! |  | yes |
| `need_unicorn` | Only a unicorn can fix this. Tap the magic wand and choose the unicorn! |  | yes |

## bramble

| Key | Line | Direction | Required |
|---|---|---|---|
| `bramble_pattern` | The rainbow bridge is broken! Finish the pattern. Red, blue, red, blue. | Say the colors slowly, like a song. | yes |
| `hint_pattern_1` | Red, blue, red... what comes next? |  | yes |
| `hint_pattern_2` | It goes red, then blue, again and again. |  | yes |
| `success_bridge_pattern` | The rainbow bridge is bright again! Hooray! |  | yes |

## marina

| Key | Line | Direction | Required |
|---|---|---|---|
| `marina_intro` | Hello! Thank you for coming! Can you find my three starfish friends? |  | yes |
| `marina_find_starfish` | Tap each starfish to count it. |  | yes |
| `hint_starfish_1` | Starfish like to rest on the sand. Look down low. |  | yes |
| `hint_starfish_2` | One starfish is sparkling. Tap it! |  | yes |
| `success_starfish` | Three starfish! You found all my friends! Thank you! |  | yes |

## coralie

| Key | Line | Direction | Required |
|---|---|---|---|
| `pearl_prompt` | Use your bubbles to push the pearl to the shiny shell. |  | yes |
| `pearl_pushed` | Pop! Bubbles can push the pearl. One more! |  | yes |

## nana

| Key | Line | Direction | Required |
|---|---|---|---|
| `nana_return` | Look! Our rainbow is brighter. Let us put your new lamp in your room! |  | yes |
| `lamp_placed` | What a beautiful room, Princess! |  | yes |
| `garden_sequence` | Help the garden grow! Put the pictures in order: first the seed. |  | yes |
| `hint_sequence_1` | First comes the seed. Then the water. |  | yes |
| `hint_sequence_2` | Seed, water, flower. Tap them in that order. |  | yes |
| `success_garden_grow` | Look at the flower grow! Beautiful! |  | yes |

## shell

| Key | Line | Direction | Required |
|---|---|---|---|
| `shell_rhyme_cat` | Which one rhymes with cat? | Elongate the "at" sound. | yes |
| `hint_rhyme_1` | Cat, hat. They sound the same at the end! |  | yes |
| `hint_rhyme_2` | Fish does not sound like cat. Try the other one. |  | yes |
| `success_shell_rhyme` | Cat and hat! They rhyme! Thank you! |  | yes |

