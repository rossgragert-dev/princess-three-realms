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
  { id: 'sticker_pearl', sheet: 'items', frame: 'pearl', narrationKey: 'sticker_pearl' }
];
