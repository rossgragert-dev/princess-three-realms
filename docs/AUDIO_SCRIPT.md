# Princess of Three Realms - Narration Recording Script

**Status: final voice recordings PENDING.** Until audio files exist the game falls back to a pulsing "next" arrow and (for grown-ups) captions.
Clips are looked up by key at `public/assets/audio/narration/<key>.m4a` (iOS Safari) with `<key>.ogg` as a fallback.
Any file with the right name replaces a temporary one: see "Replacing clips" below.

- Total lines: 376 (80 required)
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
| shore | `form_go_moat` | Mermaids swim in water. Follow the sparkles to the castle moat! |  | no |
| shore | `seahorse_hi` | Wheee! Seahorses love to dance! |  | no |
| shore | `word_shell` | Shell. |  | no |
| shore | `sticker_moat_crab` | You helped Pebble the crab! |  | no |
| shore | `sticker_moat_gem` | You found the castle's hidden treasure! |  | no |
| shore | `sticker_coral_octo` | You played with Inky the octopus! |  | no |
| shore | `sticker_coral_song` | You woke the singing coral! |  | no |
| shore | `sticker_coral_gem` | You found the pearl vault treasure! |  | no |
| grotto | `word_starfish_1` | One! |  | yes |
| grotto | `word_starfish_2` | Two! |  | yes |
| grotto | `word_starfish_3` | Three! |  | yes |
| grotto | `star_found` | You found the first wishing star! |  | yes |
| grotto | `word_hat` | Hat. |  | yes |
| grotto | `word_fish` | Fish. |  | yes |
| grotto | `obj_marina` | Swim down and help Marina the turtle. |  | yes |
| grotto | `obj_star` | Take the wishing star from the shiny stand. |  | yes |
| grotto | `crab_intro` | Click clack! I am Pebble the crab. Can you help me? |  | no |
| grotto | `crab_sound_c` | Listen carefully. Which picture begins with the kuh sound? |  | no |
| grotto | `success_crab_sound_c` | Yes! Cat starts with kuh. Click clack! |  | no |
| grotto | `crab_rhyme_hat` | Hat! Which picture sounds like hat? |  | no |
| grotto | `success_crab_rhyme_hat` | Hat, cat! They sound the same. Click clack! |  | no |
| grotto | `hint_crab_rhyme_1` | Hat, cat. They sound the same at the end! |  | no |
| grotto | `hint_crab_rhyme_2` | Sun does not sound like hat. Try the other one. |  | no |
| grotto | `crab_done` | Thank you, friend! The castle's secrets are shining for you. |  | no |
| grotto | `inky_intro` | Bloop bloop! I am Inky the octopus. Can you copy my patterns? |  | no |
| grotto | `inky_pattern` | Blue, red, blue, red... what comes next? |  | no |
| grotto | `success_inky_pattern` | Yes! Blue, red, blue, red. Bloop! |  | no |
| grotto | `hint_inky_p1` | Blue, red, blue, red... what comes next? |  | no |
| grotto | `hint_inky_p2` | It goes blue, then red, again and again. |  | no |
| grotto | `inky_sequence` | Watch! First the star, then the fish, then the shell. Can you copy me? |  | no |
| grotto | `success_inky_sequence` | Star, fish, shell! You copied me. Bloop bloop! |  | no |
| grotto | `hint_inky_s1` | First the star. Then the fish. |  | no |
| grotto | `hint_inky_s2` | The shell comes last. |  | no |
| grotto | `inky_done` | You are so clever! Splash and play in the coral garden. |  | no |
| grotto | `secret_open` | A secret way! Swim inside! |  | no |
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
| anywhere | `word_n1` | One! |  | no |
| anywhere | `word_n2` | Two! |  | no |
| anywhere | `word_n3` | Three! |  | no |
| anywhere | `word_n4` | Four! |  | no |
| anywhere | `word_n5` | Five! |  | no |
| anywhere | `word_n6` | Six! |  | no |
| anywhere | `word_shape_circle` | Circle. |  | no |
| anywhere | `word_shape_square` | Square. |  | no |
| anywhere | `word_shape_triangle` | Triangle. |  | no |
| anywhere | `word_shape_star` | Star. |  | no |
| anywhere | `word_shape_heart` | Heart. |  | no |
| anywhere | `word_shape_diamond` | Diamond. |  | no |
| anywhere | `word_deer` | Deer. |  | no |
| anywhere | `word_mushroom` | Mushroom. |  | no |
| anywhere | `word_pizza` | Pizza. |  | no |
| anywhere | `word_owl` | Owl. |  | no |
| anywhere | `word_bee` | Bee. |  | no |
| anywhere | `word_frog` | Frog. |  | no |
| anywhere | `word_carrot` | Carrot. |  | no |
| anywhere | `word_dog` | Dog. |  | no |
| anywhere | `word_fox` | Fox. |  | no |
| anywhere | `word_squirrel` | Squirrel. |  | no |
| anywhere | `word_ladybug` | Ladybug. |  | no |
| anywhere | `word_heart` | Heart. |  | no |
| anywhere | `word_cake` | Cake. |  | no |
| anywhere | `word_sprout` | Sprout. |  | no |
| anywhere | `word_mound` | Soil. |  | no |
| anywhere | `word_packet` | Seed packet. |  | no |

## Pip the bunny (`pip`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| courtyard | `pip_intro` | Hi, Princess! The rainbow is missing! Can you help me find three carrots first? |  | yes |
| courtyard | `pip_count_carrots` | Tap each carrot. Let's count them. How many can you find? | Warm, unhurried; pause after each sentence. | yes |
| courtyard | `hint_carrots_1` | I see one sparkling. Tap the sparkly carrot! |  | yes |
| courtyard | `hint_carrots_2` | Look in the garden by the flowers. Carrots like to hide. |  | yes |
| courtyard | `success_carrots` | Three carrots! Thank you, Princess! Now let us find the rainbow in the woods. |  | yes |
| anywhere | `pet_keeper_hi` | Would you like a pet friend? Tap the animal you love! |  | no |
| anywhere | `pet_chosen` | Your new friend is waiting for you in your bedroom! |  | no |
| anywhere | `gh_lesson` | Pick a seed! Take it to the garden, tap the grass to plant it, and the rain will make it grow! |  | no |
| anywhere | `gh_carry` | Now take it to the garden and tap the grass! |  | no |
| anywhere | `lib_snd_B` | Which one starts with the sound buh? Like the letter B! |  | no |
| anywhere | `lib_snd_B_h1` | Listen! buh, buh, buh! |  | no |
| anywhere | `lib_snd_B_h2` | Ball starts with buh! |  | no |
| anywhere | `lib_snd_C` | Which one starts with the sound kuh? Like the letter C! |  | no |
| anywhere | `lib_snd_C_h1` | Listen! kuh, kuh, kuh! |  | no |
| anywhere | `lib_snd_C_h2` | Cat starts with kuh! |  | no |
| anywhere | `lib_snd_S` | Which one starts with the sound sss? Like the letter S! |  | no |
| anywhere | `lib_snd_S_h1` | Listen! sss, sss, sss! |  | no |
| anywhere | `lib_snd_S_h2` | Sun starts with sss! |  | no |
| anywhere | `lib_snd_F` | Which one starts with the sound fff? Like the letter F! |  | no |
| anywhere | `lib_snd_F_h1` | Listen! fff, fff, fff! |  | no |
| anywhere | `lib_snd_F_h2` | Fish starts with fff! |  | no |
| anywhere | `lib_snd_H` | Which one starts with the sound huh? Like the letter H! |  | no |
| anywhere | `lib_snd_H_h1` | Listen! huh, huh, huh! |  | no |
| anywhere | `lib_snd_H_h2` | Hat starts with huh! |  | no |
| anywhere | `lib_snd_T` | Which one starts with the sound tuh? Like the letter T! |  | no |
| anywhere | `lib_snd_T_h1` | Listen! tuh, tuh, tuh! |  | no |
| anywhere | `lib_snd_T_h2` | Tree starts with tuh! |  | no |
| anywhere | `lib_snd_L` | Which one starts with the sound lll? Like the letter L! |  | no |
| anywhere | `lib_snd_L_h1` | Listen! lll, lll, lll! |  | no |
| anywhere | `lib_snd_L_h2` | Log starts with lll! |  | no |
| anywhere | `lib_snd_E` | Which one starts with the sound eh? Like the letter E! |  | no |
| anywhere | `lib_snd_E_h1` | Listen! eh, eh, eh! |  | no |
| anywhere | `lib_snd_E_h2` | Egg starts with eh! |  | no |
| anywhere | `lib_snd_D` | Which one starts with the sound duh? Like the letter D! |  | no |
| anywhere | `lib_snd_D_h1` | Listen! duh, duh, duh! |  | no |
| anywhere | `lib_snd_D_h2` | Deer starts with duh! |  | no |
| anywhere | `lib_snd_M` | Which one starts with the sound mmm? Like the letter M! |  | no |
| anywhere | `lib_snd_M_h1` | Listen! mmm, mmm, mmm! |  | no |
| anywhere | `lib_snd_M_h2` | Mushroom starts with mmm! |  | no |
| anywhere | `lib_snd_P` | Which one starts with the sound puh? Like the letter P! |  | no |
| anywhere | `lib_snd_P_h1` | Listen! puh, puh, puh! |  | no |
| anywhere | `lib_snd_P_h2` | Pizza starts with puh! |  | no |
| anywhere | `lib_snd_O` | Which one starts with the sound oh? Like the letter O! |  | no |
| anywhere | `lib_snd_O_h1` | Listen! oh, oh, oh! |  | no |
| anywhere | `lib_snd_O_h2` | Owl starts with oh! |  | no |
| anywhere | `lib_rhy_cat` | Which one sounds like Cat? |  | no |
| anywhere | `lib_rhy_cat_h1` | Say it out loud: Cat! |  | no |
| anywhere | `lib_rhy_cat_hat_h2` | Cat and Hat sound the same at the end! |  | no |
| anywhere | `lib_rhy_hat` | Which one sounds like Hat? |  | no |
| anywhere | `lib_rhy_hat_h1` | Say it out loud: Hat! |  | no |
| anywhere | `lib_rhy_hat_cat_h2` | Hat and Cat sound the same at the end! |  | no |
| anywhere | `lib_rhy_bee` | Which one sounds like Bee? |  | no |
| anywhere | `lib_rhy_bee_h1` | Say it out loud: Bee! |  | no |
| anywhere | `lib_rhy_bee_tree_h2` | Bee and Tree sound the same at the end! |  | no |
| anywhere | `lib_rhy_tree` | Which one sounds like Tree? |  | no |
| anywhere | `lib_rhy_tree_h1` | Say it out loud: Tree! |  | no |
| anywhere | `lib_rhy_tree_bee_h2` | Tree and Bee sound the same at the end! |  | no |
| anywhere | `lib_rhy_frog` | Which one sounds like Frog? |  | no |
| anywhere | `lib_rhy_frog_h1` | Say it out loud: Frog! |  | no |
| anywhere | `lib_rhy_frog_log_h2` | Frog and Log sound the same at the end! |  | no |
| anywhere | `lib_rhy_log` | Which one sounds like Log? |  | no |
| anywhere | `lib_rhy_log_h1` | Say it out loud: Log! |  | no |
| anywhere | `lib_rhy_log_frog_h2` | Log and Frog sound the same at the end! |  | no |
| anywhere | `lib_rhy_dog` | Which one sounds like Dog? |  | no |
| anywhere | `lib_rhy_dog_h1` | Say it out loud: Dog! |  | no |
| anywhere | `lib_rhy_dog_log_h2` | Dog and Log sound the same at the end! |  | no |
| anywhere | `lib_rhy_log_dog_h2` | Log and Dog sound the same at the end! |  | no |
| anywhere | `lib_rhy_frog_dog_h2` | Frog and Dog sound the same at the end! |  | no |
| anywhere | `lib_rhy_dog_frog_h2` | Dog and Frog sound the same at the end! |  | no |
| anywhere | `lib_cnt_ask` | Count them! Find the group with the same number. |  | no |
| anywhere | `lib_cnt_h1` | Touch and count them one by one! |  | no |
| anywhere | `lib_cnt_h2` | Count the first group. Now count each one that you can pick! |  | no |
| anywhere | `lib_shp_ask1` | Which one is the same shape? |  | no |
| anywhere | `lib_shp_ask` | Which one looks exactly the same? |  | no |
| anywhere | `lib_shp_h1` | Look at the shape. How many corners does it have? |  | no |
| anywhere | `lib_shp_h2` | Look at the colour too! |  | no |
| anywhere | `lib_pat_ask` | What comes next? Finish the pattern! |  | no |
| anywhere | `lib_pat_h1` | Say the pattern out loud. It goes round and round! |  | no |
| anywhere | `lib_pat_h2` | Look at what came before. It repeats! |  | no |
| anywhere | `lib_sty_grow` | How does a flower grow? Put the pictures in order! |  | no |
| anywhere | `lib_sty_grow_h2` | First comes Seed! |  | no |
| anywhere | `lib_sty_chick` | Put the pictures in order. What happens first? |  | no |
| anywhere | `lib_sty_chick_h2` | First comes Egg! |  | no |
| anywhere | `lib_sty_sprout` | A tiny seed grows up. Put the pictures in order! |  | no |
| anywhere | `lib_sty_sprout_h2` | First comes Seed! |  | no |
| anywhere | `lib_sty_dig` | Planting day! Put the pictures in order. |  | no |
| anywhere | `lib_sty_dig_h2` | First comes Seed packet! |  | no |
| anywhere | `lib_sty_rain` | What helps the soil grow a sprout? Put them in order! |  | no |
| anywhere | `lib_sty_rain_h2` | First comes Soil! |  | no |
| anywhere | `lib_sty_cycleh` | The hen starts the story. What comes next? |  | no |
| anywhere | `lib_sty_cycleh_h2` | First comes Hen! |  | no |
| anywhere | `lib_sty_cyclec` | The chick starts the story. What comes next? |  | no |
| anywhere | `lib_sty_cyclec_h2` | First comes Chick! |  | no |
| anywhere | `lib_sty_cyclef` | The flower starts the story. What comes next? |  | no |
| anywhere | `lib_sty_cyclef_h2` | First comes Flower! |  | no |
| anywhere | `lib_sty_plant4` | From seed packet to flower! Put all four in order. |  | no |
| anywhere | `lib_sty_plant4_h2` | First comes Seed packet! |  | no |
| anywhere | `lib_sty_plant4b` | A seed goes into the soil. Put all four in order! |  | no |
| anywhere | `lib_sty_plant4b_h2` | First comes Seed! |  | no |
| anywhere | `lib_sty_h1` | What happens first? Then what happens next? |  | no |
| anywhere | `lib_nat_need` | What does a flower need to grow? |  | no |
| anywhere | `lib_nat_need_h1` | Flowers get thirsty. They need a drink! |  | no |
| anywhere | `lib_nat_need_h2` | Think about it. The answer is the Water! |  | no |
| anywhere | `lib_nat_light` | What gives a flower warm light? |  | no |
| anywhere | `lib_nat_light_h1` | Look up in the sky. It is bright and warm! |  | no |
| anywhere | `lib_nat_light_h2` | Think about it. The answer is the Sun! |  | no |
| anywhere | `lib_nat_treehome` | Who lives up in the tree? |  | no |
| anywhere | `lib_nat_treehome_h1` | Whoo whoo! This one says hoot. |  | no |
| anywhere | `lib_nat_treehome_h2` | Think about it. The answer is the Owl! |  | no |
| anywhere | `lib_nat_swim` | Who swims in the water? |  | no |
| anywhere | `lib_nat_swim_h1` | It has fins and a tail. |  | no |
| anywhere | `lib_nat_swim_h2` | Think about it. The answer is the Fish! |  | no |
| anywhere | `lib_nat_visit` | Who buzzes from flower to flower? |  | no |
| anywhere | `lib_nat_visit_h1` | Bzzz bzzz! It makes honey. |  | no |
| anywhere | `lib_nat_visit_h2` | Think about it. The answer is the Bee! |  | no |
| anywhere | `lib_nat_seed` | What grows from a little seed? |  | no |
| anywhere | `lib_nat_seed_h1` | Plant it, water it, and it blooms! |  | no |
| anywhere | `lib_nat_seed_h2` | Think about it. The answer is the Flower! |  | no |
| anywhere | `lib_nat_hatch` | What hatches out of an egg? |  | no |
| anywhere | `lib_nat_hatch_h1` | Peep peep! It is small and fluffy. |  | no |
| anywhere | `lib_nat_hatch_h2` | Think about it. The answer is the Chick! |  | no |
| anywhere | `lib_nat_pond` | Who hops on the lily pad? |  | no |
| anywhere | `lib_nat_pond_h1` | Ribbit! It is green and it jumps. |  | no |
| anywhere | `lib_nat_pond_h2` | Think about it. The answer is the Frog! |  | no |
| anywhere | `lib_nat_nuts` | Who collects nuts in the forest? |  | no |
| anywhere | `lib_nat_nuts_h1` | It has a big bushy tail. |  | no |
| anywhere | `lib_nat_nuts_h2` | Think about it. The answer is the Squirrel! |  | no |
| anywhere | `lib_nat_spots` | Who has red wings with little black spots? |  | no |
| anywhere | `lib_nat_spots_h1` | It is a tiny bug with spots. |  | no |
| anywhere | `lib_nat_spots_h2` | Think about it. The answer is the Ladybug! |  | no |
| anywhere | `lib_win_1` | You did it! |  | no |
| anywhere | `lib_win_2` | Hooray, great job! |  | no |
| anywhere | `lib_win_3` | Wow, you are so clever! |  | no |

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
| anywhere | `gallery_hi` | This is your very own art gallery! Tap the easel to paint a picture for the wall. |  | no |
| anywhere | `maze_king_hi` | You found me in the middle of the garden maze! Well done, Princess! |  | no |
| anywhere | `throne_king_hi` | Welcome home, Princess! Tap a picture to pick an adventure, or go anywhere you like! |  | no |
| anywhere | `throne_woods` | The Whispering Woods! Walk out the east path and say hello to the friendly tree. |  | no |
| anywhere | `throne_garden` | The Royal Magic Garden! Go out the front doors and through the flower archway. |  | no |
| anywhere | `throne_race` | The Shimmering River race! Whoosh, off you go to the start line! |  | no |

## The Queen (`queen`)

| Scene | Key | Line | Direction | Req |
|---|---|---|---|---|
| shore | `throne_moat` | The castle moat! Go out the courtyard, down the path to the water. |  | no |
| anywhere | `queen_hello` | Welcome to my wand workshop! Come and make your very own wand. |  | no |
| anywhere | `queen_again` | What a lovely wand! Would you like to change it? |  | no |
| anywhere | `queen_fading` | The Enchanted Woods, the Royal Garden and the Shimmering River are waiting for you! |  | no |
| anywhere | `kitchen_hi` | Welcome to the Royal Kitchen! Pick a treat, then tap or drag yummy things on top! |  | no |
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
| shore | `moat_intro` | Welcome to the castle moat! Swim as a mermaid and find the whirlpool! |  | no |
| shore | `moat_hint` | A secret world sleeps under the castle. Dive into the whirlpool! |  | no |
| grotto | `pearl_prompt` | Use your bubbles to push the pearl to the shiny shell. |  | yes |
| grotto | `pearl_pushed` | Pop! Bubbles can push the pearl. One more! |  | yes |
| grotto | `coral_song_done` | Listen! The coral garden is singing! |  | no |
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

## shore (15)

| Speaker | Key | Line |
|---|---|---|
| narrator | `transform_mermaid` | You are a mermaid! You can swim anywhere in the water. |
| willa | `form_wrong_terrain` | Let us go to the glowing spot first. Follow the sparkles! |
| willa | `shore_intro` | Look! Sparkly water. Tap it to become a mermaid! |
| narrator | `obj_lake` | Tap the sparkly water to become a mermaid. |
| queen | `throne_moat` | The castle moat! Go out the courtyard, down the path to the water. |
| narrator | `form_go_moat` | Mermaids swim in water. Follow the sparkles to the castle moat! |
| coralie | `moat_intro` | Welcome to the castle moat! Swim as a mermaid and find the whirlpool! |
| coralie | `moat_hint` | A secret world sleeps under the castle. Dive into the whirlpool! |
| narrator | `seahorse_hi` | Wheee! Seahorses love to dance! |
| narrator | `word_shell` | Shell. |
| narrator | `sticker_moat_crab` | You helped Pebble the crab! |
| narrator | `sticker_moat_gem` | You found the castle's hidden treasure! |
| narrator | `sticker_coral_octo` | You played with Inky the octopus! |
| narrator | `sticker_coral_song` | You woke the singing coral! |
| narrator | `sticker_coral_gem` | You found the pearl vault treasure! |

## grotto (39)

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
| narrator | `crab_intro` | Click clack! I am Pebble the crab. Can you help me? |
| narrator | `crab_sound_c` | Listen carefully. Which picture begins with the kuh sound? |
| narrator | `success_crab_sound_c` | Yes! Cat starts with kuh. Click clack! |
| narrator | `crab_rhyme_hat` | Hat! Which picture sounds like hat? |
| narrator | `success_crab_rhyme_hat` | Hat, cat! They sound the same. Click clack! |
| narrator | `hint_crab_rhyme_1` | Hat, cat. They sound the same at the end! |
| narrator | `hint_crab_rhyme_2` | Sun does not sound like hat. Try the other one. |
| narrator | `crab_done` | Thank you, friend! The castle's secrets are shining for you. |
| narrator | `inky_intro` | Bloop bloop! I am Inky the octopus. Can you copy my patterns? |
| narrator | `inky_pattern` | Blue, red, blue, red... what comes next? |
| narrator | `success_inky_pattern` | Yes! Blue, red, blue, red. Bloop! |
| narrator | `hint_inky_p1` | Blue, red, blue, red... what comes next? |
| narrator | `hint_inky_p2` | It goes blue, then red, again and again. |
| narrator | `inky_sequence` | Watch! First the star, then the fish, then the shell. Can you copy me? |
| narrator | `success_inky_sequence` | Star, fish, shell! You copied me. Bloop bloop! |
| narrator | `hint_inky_s1` | First the star. Then the fish. |
| narrator | `hint_inky_s2` | The shell comes last. |
| narrator | `inky_done` | You are so clever! Splash and play in the coral garden. |
| coralie | `coral_song_done` | Listen! The coral garden is singing! |
| narrator | `secret_open` | A secret way! Swim inside! |

## bedroom (5)

| Speaker | Key | Line |
|---|---|---|
| nana | `nana_return` | Look! Our rainbow is brighter. Let us put your new lamp in your room! |
| narrator | `decor_tutorial` | Let's decorate your room! Tap a spot, then tap a picture. |
| nana | `lamp_placed` | What a beautiful room, Princess! |
| narrator | `obj_home` | Tap the little house to go home and decorate your room. |
| narrator | `chapter_done` | More adventures are coming soon! |

## anywhere (279)

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
| pip | `pet_keeper_hi` | Would you like a pet friend? Tap the animal you love! |
| pip | `pet_chosen` | Your new friend is waiting for you in your bedroom! |
| pip | `gh_lesson` | Pick a seed! Take it to the garden, tap the grass to plant it, and the rain will make it grow! |
| pip | `gh_carry` | Now take it to the garden and tap the grass! |
| queen | `kitchen_hi` | Welcome to the Royal Kitchen! Pick a treat, then tap or drag yummy things on top! |
| king | `gallery_hi` | This is your very own art gallery! Tap the easel to paint a picture for the wall. |
| king | `maze_king_hi` | You found me in the middle of the garden maze! Well done, Princess! |
| willa | `blossom_hi` | The glow blossom sings for you! Tap it again any time you like. |
| king | `throne_king_hi` | Welcome home, Princess! Tap a picture to pick an adventure, or go anywhere you like! |
| queen | `throne_queen_hi` | Hello, my little star! Where would you like to play today? Tap a picture! |
| king | `throne_woods` | The Whispering Woods! Walk out the east path and say hello to the friendly tree. |
| queen | `throne_meadow` | The Unicorn Meadow! Follow the forest path to find Dapple. |
| queen | `throne_shore` | The Moonpool Shore! Walk through the woods to the sparkling water. |
| king | `throne_garden` | The Royal Magic Garden! Go out the front doors and through the flower archway. |
| king | `throne_race` | The Shimmering River race! Whoosh, off you go to the start line! |
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
| pip | `lib_snd_B` | Which one starts with the sound buh? Like the letter B! |
| pip | `lib_snd_B_h1` | Listen! buh, buh, buh! |
| pip | `lib_snd_B_h2` | Ball starts with buh! |
| pip | `lib_snd_C` | Which one starts with the sound kuh? Like the letter C! |
| pip | `lib_snd_C_h1` | Listen! kuh, kuh, kuh! |
| pip | `lib_snd_C_h2` | Cat starts with kuh! |
| pip | `lib_snd_S` | Which one starts with the sound sss? Like the letter S! |
| pip | `lib_snd_S_h1` | Listen! sss, sss, sss! |
| pip | `lib_snd_S_h2` | Sun starts with sss! |
| pip | `lib_snd_F` | Which one starts with the sound fff? Like the letter F! |
| pip | `lib_snd_F_h1` | Listen! fff, fff, fff! |
| pip | `lib_snd_F_h2` | Fish starts with fff! |
| pip | `lib_snd_H` | Which one starts with the sound huh? Like the letter H! |
| pip | `lib_snd_H_h1` | Listen! huh, huh, huh! |
| pip | `lib_snd_H_h2` | Hat starts with huh! |
| pip | `lib_snd_T` | Which one starts with the sound tuh? Like the letter T! |
| pip | `lib_snd_T_h1` | Listen! tuh, tuh, tuh! |
| pip | `lib_snd_T_h2` | Tree starts with tuh! |
| pip | `lib_snd_L` | Which one starts with the sound lll? Like the letter L! |
| pip | `lib_snd_L_h1` | Listen! lll, lll, lll! |
| pip | `lib_snd_L_h2` | Log starts with lll! |
| pip | `lib_snd_E` | Which one starts with the sound eh? Like the letter E! |
| pip | `lib_snd_E_h1` | Listen! eh, eh, eh! |
| pip | `lib_snd_E_h2` | Egg starts with eh! |
| pip | `lib_snd_D` | Which one starts with the sound duh? Like the letter D! |
| pip | `lib_snd_D_h1` | Listen! duh, duh, duh! |
| pip | `lib_snd_D_h2` | Deer starts with duh! |
| pip | `lib_snd_M` | Which one starts with the sound mmm? Like the letter M! |
| pip | `lib_snd_M_h1` | Listen! mmm, mmm, mmm! |
| pip | `lib_snd_M_h2` | Mushroom starts with mmm! |
| pip | `lib_snd_P` | Which one starts with the sound puh? Like the letter P! |
| pip | `lib_snd_P_h1` | Listen! puh, puh, puh! |
| pip | `lib_snd_P_h2` | Pizza starts with puh! |
| pip | `lib_snd_O` | Which one starts with the sound oh? Like the letter O! |
| pip | `lib_snd_O_h1` | Listen! oh, oh, oh! |
| pip | `lib_snd_O_h2` | Owl starts with oh! |
| pip | `lib_rhy_cat` | Which one sounds like Cat? |
| pip | `lib_rhy_cat_h1` | Say it out loud: Cat! |
| pip | `lib_rhy_cat_hat_h2` | Cat and Hat sound the same at the end! |
| pip | `lib_rhy_hat` | Which one sounds like Hat? |
| pip | `lib_rhy_hat_h1` | Say it out loud: Hat! |
| pip | `lib_rhy_hat_cat_h2` | Hat and Cat sound the same at the end! |
| pip | `lib_rhy_bee` | Which one sounds like Bee? |
| pip | `lib_rhy_bee_h1` | Say it out loud: Bee! |
| pip | `lib_rhy_bee_tree_h2` | Bee and Tree sound the same at the end! |
| pip | `lib_rhy_tree` | Which one sounds like Tree? |
| pip | `lib_rhy_tree_h1` | Say it out loud: Tree! |
| pip | `lib_rhy_tree_bee_h2` | Tree and Bee sound the same at the end! |
| pip | `lib_rhy_frog` | Which one sounds like Frog? |
| pip | `lib_rhy_frog_h1` | Say it out loud: Frog! |
| pip | `lib_rhy_frog_log_h2` | Frog and Log sound the same at the end! |
| pip | `lib_rhy_log` | Which one sounds like Log? |
| pip | `lib_rhy_log_h1` | Say it out loud: Log! |
| pip | `lib_rhy_log_frog_h2` | Log and Frog sound the same at the end! |
| pip | `lib_rhy_dog` | Which one sounds like Dog? |
| pip | `lib_rhy_dog_h1` | Say it out loud: Dog! |
| pip | `lib_rhy_dog_log_h2` | Dog and Log sound the same at the end! |
| pip | `lib_rhy_log_dog_h2` | Log and Dog sound the same at the end! |
| pip | `lib_rhy_frog_dog_h2` | Frog and Dog sound the same at the end! |
| pip | `lib_rhy_dog_frog_h2` | Dog and Frog sound the same at the end! |
| pip | `lib_cnt_ask` | Count them! Find the group with the same number. |
| pip | `lib_cnt_h1` | Touch and count them one by one! |
| pip | `lib_cnt_h2` | Count the first group. Now count each one that you can pick! |
| pip | `lib_shp_ask1` | Which one is the same shape? |
| pip | `lib_shp_ask` | Which one looks exactly the same? |
| pip | `lib_shp_h1` | Look at the shape. How many corners does it have? |
| pip | `lib_shp_h2` | Look at the colour too! |
| pip | `lib_pat_ask` | What comes next? Finish the pattern! |
| pip | `lib_pat_h1` | Say the pattern out loud. It goes round and round! |
| pip | `lib_pat_h2` | Look at what came before. It repeats! |
| pip | `lib_sty_grow` | How does a flower grow? Put the pictures in order! |
| pip | `lib_sty_grow_h2` | First comes Seed! |
| pip | `lib_sty_chick` | Put the pictures in order. What happens first? |
| pip | `lib_sty_chick_h2` | First comes Egg! |
| pip | `lib_sty_sprout` | A tiny seed grows up. Put the pictures in order! |
| pip | `lib_sty_sprout_h2` | First comes Seed! |
| pip | `lib_sty_dig` | Planting day! Put the pictures in order. |
| pip | `lib_sty_dig_h2` | First comes Seed packet! |
| pip | `lib_sty_rain` | What helps the soil grow a sprout? Put them in order! |
| pip | `lib_sty_rain_h2` | First comes Soil! |
| pip | `lib_sty_cycleh` | The hen starts the story. What comes next? |
| pip | `lib_sty_cycleh_h2` | First comes Hen! |
| pip | `lib_sty_cyclec` | The chick starts the story. What comes next? |
| pip | `lib_sty_cyclec_h2` | First comes Chick! |
| pip | `lib_sty_cyclef` | The flower starts the story. What comes next? |
| pip | `lib_sty_cyclef_h2` | First comes Flower! |
| pip | `lib_sty_plant4` | From seed packet to flower! Put all four in order. |
| pip | `lib_sty_plant4_h2` | First comes Seed packet! |
| pip | `lib_sty_plant4b` | A seed goes into the soil. Put all four in order! |
| pip | `lib_sty_plant4b_h2` | First comes Seed! |
| pip | `lib_sty_h1` | What happens first? Then what happens next? |
| pip | `lib_nat_need` | What does a flower need to grow? |
| pip | `lib_nat_need_h1` | Flowers get thirsty. They need a drink! |
| pip | `lib_nat_need_h2` | Think about it. The answer is the Water! |
| pip | `lib_nat_light` | What gives a flower warm light? |
| pip | `lib_nat_light_h1` | Look up in the sky. It is bright and warm! |
| pip | `lib_nat_light_h2` | Think about it. The answer is the Sun! |
| pip | `lib_nat_treehome` | Who lives up in the tree? |
| pip | `lib_nat_treehome_h1` | Whoo whoo! This one says hoot. |
| pip | `lib_nat_treehome_h2` | Think about it. The answer is the Owl! |
| pip | `lib_nat_swim` | Who swims in the water? |
| pip | `lib_nat_swim_h1` | It has fins and a tail. |
| pip | `lib_nat_swim_h2` | Think about it. The answer is the Fish! |
| pip | `lib_nat_visit` | Who buzzes from flower to flower? |
| pip | `lib_nat_visit_h1` | Bzzz bzzz! It makes honey. |
| pip | `lib_nat_visit_h2` | Think about it. The answer is the Bee! |
| pip | `lib_nat_seed` | What grows from a little seed? |
| pip | `lib_nat_seed_h1` | Plant it, water it, and it blooms! |
| pip | `lib_nat_seed_h2` | Think about it. The answer is the Flower! |
| pip | `lib_nat_hatch` | What hatches out of an egg? |
| pip | `lib_nat_hatch_h1` | Peep peep! It is small and fluffy. |
| pip | `lib_nat_hatch_h2` | Think about it. The answer is the Chick! |
| pip | `lib_nat_pond` | Who hops on the lily pad? |
| pip | `lib_nat_pond_h1` | Ribbit! It is green and it jumps. |
| pip | `lib_nat_pond_h2` | Think about it. The answer is the Frog! |
| pip | `lib_nat_nuts` | Who collects nuts in the forest? |
| pip | `lib_nat_nuts_h1` | It has a big bushy tail. |
| pip | `lib_nat_nuts_h2` | Think about it. The answer is the Squirrel! |
| pip | `lib_nat_spots` | Who has red wings with little black spots? |
| pip | `lib_nat_spots_h1` | It is a tiny bug with spots. |
| pip | `lib_nat_spots_h2` | Think about it. The answer is the Ladybug! |
| narrator | `word_n1` | One! |
| narrator | `word_n2` | Two! |
| narrator | `word_n3` | Three! |
| narrator | `word_n4` | Four! |
| narrator | `word_n5` | Five! |
| narrator | `word_n6` | Six! |
| narrator | `word_shape_circle` | Circle. |
| narrator | `word_shape_square` | Square. |
| narrator | `word_shape_triangle` | Triangle. |
| narrator | `word_shape_star` | Star. |
| narrator | `word_shape_heart` | Heart. |
| narrator | `word_shape_diamond` | Diamond. |
| pip | `lib_win_1` | You did it! |
| pip | `lib_win_2` | Hooray, great job! |
| pip | `lib_win_3` | Wow, you are so clever! |
| narrator | `word_deer` | Deer. |
| narrator | `word_mushroom` | Mushroom. |
| narrator | `word_pizza` | Pizza. |
| narrator | `word_owl` | Owl. |
| narrator | `word_bee` | Bee. |
| narrator | `word_frog` | Frog. |
| narrator | `word_carrot` | Carrot. |
| narrator | `word_dog` | Dog. |
| narrator | `word_fox` | Fox. |
| narrator | `word_squirrel` | Squirrel. |
| narrator | `word_ladybug` | Ladybug. |
| narrator | `word_heart` | Heart. |
| narrator | `word_cake` | Cake. |
| narrator | `word_sprout` | Sprout. |
| narrator | `word_mound` | Soil. |
| narrator | `word_packet` | Seed packet. |
