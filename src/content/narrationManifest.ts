export type Speaker = 'narrator' | 'pip' | 'willa' | 'tree' | 'bramble' | 'marina' | 'nana' | 'shell' | 'coralie' | 'king' | 'queen' | 'dapple';

export interface NarrationClip {
  key: string;
  speaker: Speaker;
  /** The line to record. Also the optional caption (for adults). */
  text: string;
  /** Recording direction for the narrator or parent. */
  note?: string;
  /** Must exist for the child-facing build to be called complete. */
  required: boolean;
}

const clip = (key: string, speaker: Speaker, text: string, note?: string, required = true): NarrationClip => ({
  key,
  speaker,
  text,
  note,
  required
});

/**
 * Single source of truth for every spoken line. File path is derived: assets/audio/narration/<key>.m4a (+ .ogg).
 * No clip file exists yet in v0.1: see docs/IMPLEMENTATION_STATUS.md.
 */
export const NARRATION: NarrationClip[] = [
  // --- Intro and controls
  clip('intro_welcome', 'narrator', "Let's play! Tap anywhere to walk. Tap your friends to say hello."),
  clip('controls_tap', 'narrator', 'Tap the ground and the princess will walk there.'),
  clip('quest_replay', 'narrator', 'Tap the picture at the top to hear what to do next.'),

  // --- Pip and the carrots
  clip('pip_intro', 'pip', 'Hi, Princess! The rainbow is missing! Can you help me find three carrots first?'),
  clip('pip_count_carrots', 'pip', 'Tap each carrot. Let\'s count them. How many can you find?', 'Warm, unhurried; pause after each sentence.'),
  clip('word_carrot_1', 'narrator', 'One!'),
  clip('word_carrot_2', 'narrator', 'Two!'),
  clip('word_carrot_3', 'narrator', 'Three!'),
  clip('hint_carrots_1', 'pip', 'I see one sparkling. Tap the sparkly carrot!'),
  clip('hint_carrots_2', 'pip', 'Look in the garden by the flowers. Carrots like to hide.'),
  clip('success_carrots', 'pip', 'Three carrots! Thank you, Princess! Now let us find the rainbow in the woods.'),

  // --- Whispering Woods tree
  clip('tree_sound_b', 'tree', 'Listen carefully. Which picture begins with the buh sound?', 'Say the sound /b/ as "buh", not the letter name.'),
  clip('word_ball', 'narrator', 'Ball.'),
  clip('word_cat', 'narrator', 'Cat.'),
  clip('word_sun', 'narrator', 'Sun.'),
  clip('hint_tree_1', 'tree', 'Ball. Buh, buh, ball. Do you hear the buh?'),
  clip('hint_tree_2', 'tree', 'Try the round bouncy one!'),
  clip('success_tree_sound', 'tree', 'Yes! Ball starts with buh. The path is open!'),

  // --- Willa and transformation
  clip('willa_intro', 'willa', 'Your magic can change you! Tap the unicorn to try.'),
  clip('transform_unicorn', 'narrator', 'You are a unicorn! Trot over the flowers to make them bloom.'),
  clip('transform_mermaid', 'narrator', 'You are a mermaid! You can swim anywhere in the water.'),
  clip('transform_princess', 'narrator', 'You are a princess again.'),
  clip('form_wrong_terrain', 'willa', 'Let us go to the glowing spot first. Follow the sparkles!'),

  // --- v0.4b family magic and Unicorn Meadow
  clip('king_hello', 'king', 'Hello, Princess! Shall we light up the night sky? Tap the launch pad!', undefined, false),
  clip('king_again', 'king', 'Ooh, so pretty! Let us make more fireworks!', undefined, false),
  clip('queen_hello', 'queen', 'Welcome to my wand workshop! Come and make your very own wand.', undefined, false),
  clip('queen_again', 'queen', 'What a lovely wand! Would you like to change it?', undefined, false),
  clip('dapple_hello', 'dapple', 'Let us play tag! Run, run, run!', undefined, false),
  clip('dapple_again', 'dapple', 'Tag again? Yay!', undefined, false),
  clip('dapple_form', 'dapple', 'Tag is more fun as a unicorn! Tap the magic wand to become one.', undefined, false),
  clip('willa_meadow', 'willa', 'Follow the path north. A friend is waiting in the meadow!', undefined, false),

  // --- Bramble and the rainbow bridge
  clip('bramble_pattern', 'bramble', 'The rainbow bridge is broken! Finish the pattern. Red, blue, red, blue.', 'Say the colors slowly, like a song.'),
  clip('word_tile_red', 'narrator', 'Red.'),
  clip('word_tile_blue', 'narrator', 'Blue.'),
  clip('hint_pattern_1', 'bramble', 'Red, blue, red... what comes next?'),
  clip('hint_pattern_2', 'bramble', 'It goes red, then blue, again and again.'),
  clip('success_bridge_pattern', 'bramble', 'The rainbow bridge is bright again! Hooray!'),
  clip('bridge_bloom_prompt', 'willa', 'Now trot over the bridge, and make the flowers bloom!'),

  // --- Moonpool shore
  clip('shore_intro', 'willa', 'Look! Sparkly water. Tap it to become a mermaid!'),

  // --- Marina and the starfish
  clip('marina_intro', 'marina', 'Hello! Thank you for coming! Can you find my three starfish friends?'),
  clip('marina_find_starfish', 'marina', 'Tap each starfish to count it.'),
  clip('word_starfish_1', 'narrator', 'One!'),
  clip('word_starfish_2', 'narrator', 'Two!'),
  clip('word_starfish_3', 'narrator', 'Three!'),
  clip('hint_starfish_1', 'marina', 'Starfish like to rest on the sand. Look down low.'),
  clip('hint_starfish_2', 'marina', 'One starfish is sparkling. Tap it!'),
  clip('success_starfish', 'marina', 'Three starfish! You found all my friends! Thank you!'),

  // --- Star pedestal
  clip('pearl_prompt', 'coralie', 'Use your bubbles to push the pearl to the shiny shell.'),
  clip('star_found', 'narrator', 'You found the first wishing star!'),

  // --- Bedroom
  clip('nana_return', 'nana', 'Look! Our rainbow is brighter. Let us put your new lamp in your room!'),
  clip('decor_tutorial', 'narrator', "Let's decorate your room! Tap a spot, then tap a picture."),
  clip('lamp_placed', 'nana', 'What a beautiful room, Princess!'),

  // --- Optional puzzles
  clip('shell_rhyme_cat', 'shell', 'Which one rhymes with cat?', 'Elongate the "at" sound.', true),
  clip('word_hat', 'narrator', 'Hat.'),
  clip('word_fish', 'narrator', 'Fish.'),
  clip('hint_rhyme_1', 'shell', 'Cat, hat. They sound the same at the end!'),
  clip('hint_rhyme_2', 'shell', 'Fish does not sound like cat. Try the other one.'),
  clip('success_shell_rhyme', 'shell', 'Cat and hat! They rhyme! Thank you!'),
  clip('garden_sequence', 'nana', 'Help the garden grow! Put the pictures in order: first the seed.'),
  clip('word_seed', 'narrator', 'Seed.'),
  clip('word_water', 'narrator', 'Water.'),
  clip('word_flower', 'narrator', 'Flower.'),
  clip('hint_sequence_1', 'nana', 'First comes the seed. Then the water.'),
  clip('hint_sequence_2', 'nana', 'Seed, water, flower. Tap them in that order.'),
  clip('success_garden_grow', 'nana', 'Look at the flower grow! Beautiful!'),

  // --- Objective reminders (quest icon replay)
  clip('obj_pip', 'narrator', 'Say hello to Pip the bunny!'),
  clip('obj_tree', 'narrator', 'Walk through the woods and find the big talking tree.'),
  clip('obj_bridge', 'narrator', 'Find the broken rainbow bridge. Become a unicorn to fix it!'),
  clip('obj_lake', 'narrator', 'Tap the sparkly water to become a mermaid.'),
  clip('obj_marina', 'narrator', 'Swim down and help Marina the turtle.'),
  clip('obj_star', 'narrator', 'Take the wishing star from the shiny stand.'),
  clip('obj_home', 'narrator', 'Tap the little house to go home and decorate your room.'),

  // --- Sticker book (one line per sticker)
  clip('sticker_pip', 'narrator', 'You helped Pip the bunny count carrots!'),
  clip('sticker_rainbow', 'narrator', 'You fixed the rainbow bridge!'),
  clip('sticker_marina', 'narrator', 'You helped Marina the turtle!'),
  clip('sticker_star', 'narrator', 'You found the first wishing star!'),
  clip('sticker_wand', 'narrator', 'Your star wand made the stand sparkle!'),
  clip('sticker_chest', 'narrator', 'You found a hidden treasure!'),
  clip('sticker_shell', 'narrator', 'You found a treasure by the sparkly lake!'),
  clip('sticker_pearl', 'narrator', 'You found a treasure under the sea!'),
  clip('ui_book', 'narrator', 'This is your sticker book. Tap a sticker to hear its story.'),
  clip('pearl_pushed', 'coralie', 'Pop! Bubbles can push the pearl. One more!'),
  clip('wand_lit', 'narrator', 'Your star wand made it sparkle!'),
  clip('chest_found', 'narrator', 'A hidden treasure!'),
  clip('bloom_cheer', 'narrator', 'Flowers bloom wherever you trot!'),
  clip('need_unicorn', 'willa', 'Only a unicorn can fix this. Tap the magic wand and choose the unicorn!'),

  // --- v0.4c: The Kingdom Beyond (all optional: the child flow is picture-first)
  clip('king_fading', 'king', 'Oh dear! The magic in our kingdom is getting sleepy. Will you help wake it up?', undefined, false),
  clip('queen_fading', 'queen', 'The Enchanted Woods, the Royal Garden and the Shimmering River are waiting for you!', undefined, false),
  clip('obj_kingdom', 'narrator', 'The kingdom\'s magic is sleepy. Visit the woods, the garden and the river!', undefined, false),
  clip('woods_intro', 'willa', 'These woods are magical! The old trees whisper. Let us wake them up.', undefined, false),
  clip('obj_lanterns', 'willa', 'Tap the stone, watch the lanterns glow, then tap them in the same order.', undefined, false),
  clip('lanterns_watch', 'willa', 'Watch the lanterns glow. Then tap them in the same order.', undefined, false),
  clip('lanterns_again', 'willa', 'Tap the glowing one next. You can do it!', undefined, false),
  clip('lanterns_done', 'willa', 'The lanterns are lit! A secret path is open. Go and see what is waiting!', undefined, false),
  clip('woods_done', 'willa', 'The woods are bright again. Thank you, Princess!', undefined, false),
  clip('atree_sound_s', 'tree', 'Listen! Which picture begins with the sss sound?', undefined, false),
  clip('atree_sound_c', 'tree', 'Listen! Which picture begins with the kuh sound?', undefined, false),
  clip('atree_sound_f', 'tree', 'Listen! Which picture begins with the fff sound?', undefined, false),
  clip('hint_atree_s_1', 'tree', 'Sun. Sss, sss, sun. Do you hear the sss?', undefined, false),
  clip('hint_atree_s_2', 'tree', 'Try the bright, shiny one!', undefined, false),
  clip('hint_atree_c_1', 'tree', 'Cat. Kuh, kuh, cat. Do you hear the kuh?', undefined, false),
  clip('hint_atree_c_2', 'tree', 'Try the furry one that purrs!', undefined, false),
  clip('hint_atree_f_1', 'tree', 'Fish. Fff, fff, fish. Do you hear the fff?', undefined, false),
  clip('hint_atree_f_2', 'tree', 'Try the one that swims!', undefined, false),
  clip('success_sound_s', 'tree', 'Yes! Sun starts with sss!', undefined, false),
  clip('success_sound_c', 'tree', 'Yes! Cat starts with kuh!', undefined, false),
  clip('success_sound_f', 'tree', 'Yes! Fish starts with fff!', undefined, false),
  clip('trees_done', 'tree', 'All the trees heard you! The woods are happier now!', undefined, false),
  clip('bridge_rhyme_bee', 'tree', 'Which one rhymes with bee?', undefined, false),
  clip('bridge_rhyme_frog', 'tree', 'Which one rhymes with frog?', undefined, false),
  clip('word_tree', 'narrator', 'Tree.', undefined, false),
  clip('word_log', 'narrator', 'Log.', undefined, false),
  clip('hint_bee_1', 'tree', 'Bee, tree. They sound the same at the end!', undefined, false),
  clip('hint_bee_2', 'tree', 'Sun does not sound like bee. Try the other one.', undefined, false),
  clip('hint_frog_1', 'tree', 'Frog, log. They sound the same at the end!', undefined, false),
  clip('hint_frog_2', 'tree', 'Ball does not sound like frog. Try the other one.', undefined, false),
  clip('success_rhyme_cat', 'tree', 'Cat and hat! They rhyme!', undefined, false),
  clip('success_rhyme_bee', 'tree', 'Bee and tree! They rhyme!', undefined, false),
  clip('success_rhyme_frog', 'tree', 'Frog and log! They rhyme!', undefined, false),
  clip('bridge_done', 'willa', 'The rhyme bridge is ready. Let us cross!', undefined, false),
  clip('story_egg', 'tree', 'Put the pictures in order. What happens first?', undefined, false),
  clip('story_day', 'tree', 'Put the pictures in order: night, morning, flowers!', undefined, false),
  clip('word_egg', 'narrator', 'Egg.', undefined, false),
  clip('word_chick', 'narrator', 'Chick.', undefined, false),
  clip('word_hen', 'narrator', 'Hen.', undefined, false),
  clip('word_star', 'narrator', 'Star.', undefined, false),
  clip('hint_story_1', 'tree', 'First there is an egg. Then a chick.', undefined, false),
  clip('hint_story_2', 'tree', 'Egg, chick, hen. Tap them in that order.', undefined, false),
  clip('hint_day_1', 'tree', 'First the star. Then the sun.', undefined, false),
  clip('hint_day_2', 'tree', 'Star, sun, flower. Tap them in that order.', undefined, false),
  clip('success_story_egg', 'tree', 'Egg, chick, hen! What a story!', undefined, false),
  clip('success_story_day', 'tree', 'Star, sun, flower! A lovely story!', undefined, false),
  clip('garden_intro', 'nana', 'Welcome to the Royal Garden! Pick a seed, plant it, and give it water.', undefined, false),
  clip('garden_plant', 'nana', 'Tap a seed packet. Then tap a flower bed.', undefined, false),
  clip('garden_water', 'nana', 'Now tap the seed to give it water!', undefined, false),
  clip('garden_fountain_hint', 'nana', 'Grow three flowers and the fountain will sing again!', undefined, false),
  clip('garden_done', 'nana', 'Look at all your flowers! The garden is so happy.', undefined, false),
  clip('fountain_ready', 'nana', 'Lots of flowers! Touch the fountain!', undefined, false),
  clip('fountain_back', 'nana', 'The fountain is dancing again! Thank you, Princess!', undefined, false),
  clip('fountain_tired', 'nana', 'The fountain is sleepy. Grow three flowers to wake it.', undefined, false),
  clip('butterfly_ask', 'nana', 'Butterflies love their own colors. Take each one to the matching flower!', undefined, false),
  clip('butterflies_done', 'nana', 'Every butterfly found its flower!', undefined, false),
  clip('ladybug_count', 'nana', 'Tap each ladybug to count it.', undefined, false),
  clip('word_ladybug_1', 'narrator', 'One!', undefined, false),
  clip('word_ladybug_2', 'narrator', 'Two!', undefined, false),
  clip('word_ladybug_3', 'narrator', 'Three!', undefined, false),
  clip('hint_ladybug_1', 'nana', 'Ladybugs hide near the flowers.', undefined, false),
  clip('hint_ladybug_2', 'nana', 'One ladybug is sparkling. Tap it!', undefined, false),
  clip('success_ladybugs', 'nana', 'Three ladybugs! Thank you!', undefined, false),
  clip('word_red', 'narrator', 'Red.', undefined, false),
  clip('word_blue', 'narrator', 'Blue.', undefined, false),
  clip('word_yellow', 'narrator', 'Yellow.', undefined, false),
  clip('word_pink', 'narrator', 'Pink.', undefined, false),
  clip('river_intro', 'coralie', 'Welcome to the river! Swim through the shining rings and listen to its song.', undefined, false),
  clip('pet_keeper_hi', 'pip', 'Would you like a pet friend? Tap the animal you love!', undefined, false),
  clip('pet_chosen', 'pip', 'Your new friend is waiting for you in your bedroom!', undefined, false),
  clip('gh_lesson', 'pip', 'Pick a seed! Take it to the garden, tap the grass to plant it, and the rain will make it grow!', undefined, false),
  clip('gh_carry', 'pip', 'Now take it to the garden and tap the grass!', undefined, false),
  clip('kitchen_hi', 'queen', 'Welcome to the Royal Kitchen! Pick a treat, then tap or drag yummy things on top!', undefined, false),
  clip('gallery_hi', 'king', 'This is your very own art gallery! Tap the easel to paint a picture for the wall.', undefined, false),
  clip('maze_king_hi', 'king', 'You found me in the middle of the garden maze! Well done, Princess!', undefined, false),
  clip('blossom_hi', 'willa', 'The glow blossom sings for you! Tap it again any time you like.', undefined, false),
  clip('throne_king_hi', 'king', 'Welcome home, Princess! Tap a picture to pick an adventure, or go anywhere you like!', undefined, false),
  clip('throne_queen_hi', 'queen', 'Hello, my little star! Where would you like to play today? Tap a picture!', undefined, false),
  clip('throne_woods', 'king', 'The Whispering Woods! Walk out the east path and say hello to the friendly tree.', undefined, false),
  clip('throne_meadow', 'queen', 'The Unicorn Meadow! Follow the forest path to find Dapple.', undefined, false),
  clip('throne_shore', 'queen', 'The Moonpool Shore! Walk through the woods to the sparkling water.', undefined, false),
  clip('throne_garden', 'king', 'The Royal Magic Garden! Go out the front doors and through the flower archway.', undefined, false),
  clip('river_hint', 'coralie', 'Tap the post to start a race. Or swim and play with the shells!', undefined, false),
  clip('river_pearls_hint', 'coralie', 'Tap the singing shells with your bubbles. Can you wake four?', undefined, false),
  clip('river_pearls_done', 'coralie', 'Listen! The river is singing! Thank you!', undefined, false),
  clip('race_pick', 'narrator', 'Choose how to swim: free, friendly, or the star challenge!', undefined, false),
  clip('race_go', 'narrator', 'Swim through the shining rings!', undefined, false),
  clip('race_done', 'narrator', 'You did it! What a swim!', undefined, false),
  clip('race_stars', 'narrator', 'Star Challenge complete!', undefined, false),
  clip('sticker_lanterns', 'narrator', 'You lit the magic lanterns!', undefined, false),
  clip('sticker_trees', 'narrator', 'The old trees heard you!', undefined, false),
  clip('sticker_rhyme_bridge', 'narrator', 'You built the rhyme bridge!', undefined, false),
  clip('sticker_storybook', 'narrator', 'You told a story!', undefined, false),
  clip('sticker_woods_gem', 'narrator', 'You found a secret treasure in the woods!', undefined, false),
  clip('sticker_garden', 'narrator', 'You grew a garden!', undefined, false),
  clip('sticker_butterflies', 'narrator', 'You guided the butterflies!', undefined, false),
  clip('sticker_ladybug', 'narrator', 'You counted the ladybugs!', undefined, false),
  clip('sticker_fountain', 'narrator', 'You woke the garden fountain!', undefined, false),
  clip('sticker_garden_gem', 'narrator', 'You found a secret treasure in the garden!', undefined, false),
  clip('sticker_river', 'narrator', 'You swam the friendly race!', undefined, false),
  clip('sticker_river_star', 'narrator', 'You earned a river star!', undefined, false),
  clip('sticker_river_pearls', 'narrator', 'You woke the singing shells!', undefined, false),
  clip('sticker_river_gem', 'narrator', 'You found a secret treasure in the river!', undefined, false),

  // --- Shared
  clip('hint_together', 'narrator', "Let's do it together!"),
  clip('retry_gentle', 'narrator', "Let's try again!"),
  clip('chapter_done', 'narrator', 'More adventures are coming soon!', undefined, false)
];

import { libraryClips } from './puzzleLibrary';
const have = new Set(NARRATION.map((n) => n.key));
for (const lc of libraryClips()) if (!have.has(lc.key)) { NARRATION.push(clip(lc.key, lc.speaker, lc.text, undefined, false)); have.add(lc.key); }

export const narrationByKey = (key: string) => NARRATION.find((n) => n.key === key);

/** Path convention. Both formats are listed so iOS Safari (m4a) and Chrome/Firefox (ogg) both work. */
export const clipUrls = (key: string) => [`assets/audio/narration/${key}.m4a`, `assets/audio/narration/${key}.ogg`];
