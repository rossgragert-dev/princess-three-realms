/** Bedroom decorations. Slots are tile objects in the bedroom map. */
export interface DecorDef {
  id: string;
  slots: string[];
  /** How the placed item is drawn. */
  sprite: { key: string; frame?: number };
  /** Draw layer: floor items sit under the player, ceiling items above. */
  layer: 'floor' | 'stand' | 'hang';
}

export const DECOR: Record<string, DecorDef> = {
  lamp: { id: 'lamp', slots: ['slot_table', 'slot_shelf'], sprite: { key: 'lamp', frame: 1 }, layer: 'stand' },
  vase: { id: 'vase', slots: ['slot_table', 'slot_shelf'], sprite: { key: 'vase' }, layer: 'stand' },
  rug: { id: 'rug', slots: ['slot_floor'], sprite: { key: 'rug' }, layer: 'floor' },
  shell_mobile: { id: 'shell_mobile', slots: ['slot_ceiling'], sprite: { key: 'mobile' }, layer: 'hang' }
};

export const decorForSlot = (slot: string, unlocked: string[]) =>
  Object.values(DECOR).filter((d) => d.slots.includes(slot) && unlocked.includes(d.id));
