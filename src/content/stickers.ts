/** Sticker book entries. Pictures only: `sheet` + `frame` name from the generated frame index. */
export interface StickerDef { id: string; sheet: 'ui' | 'items'; frame: string; narrationKey: string }

export const STICKERS: StickerDef[] = [
  { id: 'sticker_pip', sheet: 'ui', frame: 'icon_pip', narrationKey: 'sticker_pip' },
  { id: 'sticker_rainbow', sheet: 'ui', frame: 'icon_rainbow', narrationKey: 'sticker_rainbow' },
  { id: 'sticker_marina', sheet: 'ui', frame: 'icon_marina', narrationKey: 'sticker_marina' },
  { id: 'sticker_star', sheet: 'items', frame: 'star', narrationKey: 'sticker_star' },
  { id: 'sticker_wand', sheet: 'ui', frame: 'icon_wand', narrationKey: 'sticker_wand' },
  { id: 'sticker_chest', sheet: 'items', frame: 'chest_open', narrationKey: 'sticker_chest' },
  { id: 'sticker_shell', sheet: 'items', frame: 'shell', narrationKey: 'sticker_shell' },
  { id: 'sticker_pearl', sheet: 'items', frame: 'pearl', narrationKey: 'sticker_pearl' },
  // v0.4c: The Kingdom Beyond
  { id: 'sticker_lanterns', sheet: 'ui', frame: 'icon_lamp', narrationKey: 'sticker_lanterns' },
  { id: 'sticker_trees', sheet: 'ui', frame: 'icon_tree', narrationKey: 'sticker_trees' },
  { id: 'sticker_rhyme_bridge', sheet: 'ui', frame: 'icon_bridge', narrationKey: 'sticker_rhyme_bridge' },
  { id: 'sticker_storybook', sheet: 'ui', frame: 'icon_book', narrationKey: 'sticker_storybook' },
  { id: 'sticker_woods_gem', sheet: 'items', frame: 'sparkle0', narrationKey: 'sticker_woods_gem' },
  { id: 'sticker_garden', sheet: 'items', frame: 'flower', narrationKey: 'sticker_garden' },
  { id: 'sticker_butterflies', sheet: 'items', frame: 'bloom1', narrationKey: 'sticker_butterflies' },
  { id: 'sticker_ladybug', sheet: 'items', frame: 'heart', narrationKey: 'sticker_ladybug' },
  { id: 'sticker_fountain', sheet: 'items', frame: 'water', narrationKey: 'sticker_fountain' },
  { id: 'sticker_garden_gem', sheet: 'items', frame: 'sparkle1', narrationKey: 'sticker_garden_gem' },
  { id: 'sticker_river', sheet: 'ui', frame: 'icon_mermaid', narrationKey: 'sticker_river' },
  { id: 'sticker_river_star', sheet: 'items', frame: 'star', narrationKey: 'sticker_river_star' },
  { id: 'sticker_river_pearls', sheet: 'items', frame: 'pearl', narrationKey: 'sticker_river_pearls' },
  { id: 'sticker_river_gem', sheet: 'items', frame: 'sparkle2', narrationKey: 'sticker_river_gem' }
];
