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

  // --- Shared
  clip('hint_together', 'narrator', "Let's do it together!"),
  clip('retry_gentle', 'narrator', "Let's try again!"),
  clip('chapter_done', 'narrator', 'More adventures are coming soon!', undefined, false)
];

export const narrationByKey = (key: string) => NARRATION.find((n) => n.key === key);

/** Path convention. Both formats are listed so iOS Safari (m4a) and Chrome/Firefox (ogg) both work. */
export const clipUrls = (key: string) => [`assets/audio/narration/${key}.m4a`, `assets/audio/narration/${key}.ogg`];
