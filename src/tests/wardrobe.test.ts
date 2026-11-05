import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CATALOG, SLOTS_ALL, FIELD, ALL_WEARABLES, defaultAppearance, defaultWardrobe, sanitizeWardrobe, selectOption, isOwned, grantForFlag,
  wearableForFlag, DRESSES, DRESS_COLORS, HAIRSTYLES, HAIR_COLORS, SHOES, TIARAS, EARRINGS, NECKLACES, FACE_ACCENTS, ACCESSORIES, WARDROBE_TABS, VANITY_TABS
} from '../content/appearance';
import { ATLAS, MARKERS, OW_STYLES, OW_CROWNS } from '../content/wardrobeIndex';
import { buildRemap, layerStack, composePrincess, hexToRgb, THUMB_CROP, type AtlasPixels } from '../art/compose';
import { defaultState, sanitize, SaveManager, SAVE_KEY, type KV } from '../systems/saveManager';
import { completeFlag, MAIN_PATH } from '../systems/questEngine';
import { getMap } from '../world/maps';
import { visibleObjects, makeGrid, approachTile, findPath, flood } from '../world/navigation';
import { FIND_FLAG } from '../world/story';
import { UI } from '../content/frameIndex';
import type { QuestFlag } from '../types/game';

const manifest = JSON.parse(readFileSync(new URL('../../public/assets/manifest.json', import.meta.url), 'utf8')) as { sheets: { key: string; file: string }[] };
const memStore = (): KV & { m: Map<string, string> } => { const m = new Map<string, string>(); return { m, getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: (k) => void m.delete(k) }; };

describe('wardrobe catalog (spec minimums)', () => {
  it('has the required amount of choices', () => {
    assert.ok(DRESSES.length >= 8); assert.ok(DRESS_COLORS.length >= 10); assert.ok(SHOES.length >= 5);
    assert.ok(ACCESSORIES.length >= 5 && ACCESSORIES.some((a) => a.id === 'none'));
    assert.ok(DRESSES.filter((d) => !d.flag).length >= 4, 'at least 4 dresses by default');
    assert.ok(HAIRSTYLES.length >= 6); assert.ok(HAIR_COLORS.length >= 10);
    assert.ok(TIARAS.length >= 6 && TIARAS.some((t) => t.id === 'none') && TIARAS.filter((t) => t.id !== 'none' && !t.flag).length >= 2);
    assert.ok(NECKLACES.length >= 6 && NECKLACES.some((n) => n.id === 'none'));
    assert.ok(EARRINGS.length >= 4 && EARRINGS.some((n) => n.id === 'none'));
    assert.ok(FACE_ACCENTS.length >= 5 && FACE_ACCENTS.some((n) => n.id === 'none'));
  });
  it('has stable unique ids and dress colours named in the spec', () => {
    for (const slot of SLOTS_ALL) assert.equal(new Set(CATALOG[slot].map((x) => x.id)).size, CATALOG[slot].length, slot);
    const ids = DRESS_COLORS.map((c) => c.id);
    for (const want of ['pink', 'lavender', 'purple', 'blue', 'teal', 'mint', 'red', 'gold', 'peach', 'silver']) assert.ok(ids.includes(want), want);
  });
  it('earned wearable ids are globally unique and each comes from exactly one flag', () => {
    const ids = ALL_WEARABLES.map((w) => w.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(new Set(ALL_WEARABLES.map((w) => w.flag)).size, ALL_WEARABLES.length);
    assert.ok(ALL_WEARABLES.length >= 6);
  });
  it('spec examples map to the right quests', () => {
    assert.equal(wearableForFlag('PIP_CARROTS_DONE'), 'bunny_ribbon');
    assert.equal(wearableForFlag('RAINBOW_BRIDGE_OPEN'), 'rainbow_gown');
    assert.equal(wearableForFlag('MARINA_HELPED'), 'pearl_strand');
    assert.equal(wearableForFlag('STAR_1_FOUND'), 'star_tiara');
    assert.equal(wearableForFlag('BUTTERFLY_FOUND'), 'butterfly_clip');
    assert.equal(wearableForFlag('GARDEN_SEQUENCED'), 'flower_crown');
  });
  it('every flag used exists as a real quest flag with a reachable source', () => {
    const real = new Set<string>(['PIP_CARROTS_DONE', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'STAR_1_FOUND', 'BUTTERFLY_FOUND', 'GARDEN_SEQUENCED', 'GROTTO_CHEST', 'SHORE_CHEST', 'CREEK_CHEST', 'PEARL_PLACED', 'WAND_LIT', 'FAIRY_DUST_FOUND', 'MOONSTONE_FOUND']);
    for (const w of ALL_WEARABLES) assert.ok(real.has(w.flag!), `${w.id} uses unknown flag ${w.flag}`);
  });
});

describe('appearance logic', () => {
  it('defaults are all owned and match the original sprite (pink dress, golden hair, gold tiara)', () => {
    const d = defaultAppearance();
    for (const slot of SLOTS_ALL) assert.ok(isOwned(slot, d[FIELD[slot]], []), slot);
    assert.equal(d.dressColorId, 'pink'); assert.equal(d.hairColorId, 'blonde'); assert.equal(d.tiaraId, 'gold_tiara');
  });
  it('selecting is free for owned options and refused for locked or unknown ones', () => {
    const a = defaultAppearance(), w = defaultWardrobe();
    assert.ok(selectOption(a, w, 'dress', 'garden')); assert.equal(a.dressId, 'garden');
    assert.ok(!selectOption(a, w, 'dress', 'rainbow_gown')); assert.equal(a.dressId, 'garden');
    assert.ok(!selectOption(a, w, 'dress', 'nonsense')); assert.ok(!selectOption(a, w, 'tiara', 'star_tiara'));
    grantForFlag(w, 'STAR_1_FOUND');
    assert.ok(selectOption(a, w, 'tiara', 'star_tiara')); assert.equal(a.tiaraId, 'star_tiara');
  });
  it('granting a flag is idempotent and does not change what she wears', () => {
    const a = defaultAppearance(), w = defaultWardrobe();
    const before = JSON.stringify(a);
    assert.equal(grantForFlag(w, 'RAINBOW_BRIDGE_OPEN'), 'rainbow_gown');
    assert.equal(grantForFlag(w, 'RAINBOW_BRIDGE_OPEN'), undefined);
    assert.equal(JSON.stringify(a), before);
    assert.deepEqual(w.unlocked, ['rainbow_gown']);
  });
  it('sanitation: junk, wrong types and locked selections fall back to defaults', () => {
    for (const junk of [null, undefined, 7, 'x', [], { dressId: 5 }, { dressId: 'rainbow_gown', tiaraId: 'star_tiara', hairstyleId: 'zzz', skinToneId: null }]) {
      const r = sanitizeWardrobe(junk, junk, {});
      const d = defaultAppearance();
      assert.deepEqual(r.appearance, d);
      assert.deepEqual(r.wardrobe, defaultWardrobe());
    }
  });
  it('sanitation keeps valid owned choices and valid earned unlocks', () => {
    const r = sanitizeWardrobe({ dressId: 'rainbow_gown', hairstyleId: 'bun', hairColorId: 'auburn', dressColorId: 'teal' }, { unlocked: ['rainbow_gown'], pending: [] }, { RAINBOW_BRIDGE_OPEN: true });
    assert.equal(r.appearance.dressId, 'rainbow_gown'); assert.equal(r.appearance.hairstyleId, 'bun');
    assert.equal(r.appearance.hairColorId, 'auburn'); assert.equal(r.appearance.dressColorId, 'teal');
    assert.deepEqual(r.wardrobe.unlocked, ['rainbow_gown']);
  });
  it('an equipped item whose unlock vanished cannot stay equipped', () => {
    const r = sanitizeWardrobe({ tiaraId: 'star_tiara' }, { unlocked: [] }, {});
    assert.equal(r.appearance.tiaraId, 'gold_tiara');
  });
  it('migration: old saves with finished quests receive their wearables once, as pending reveals', () => {
    const flags: Partial<Record<QuestFlag, boolean>> = { PIP_CARROTS_DONE: true, STAR_1_FOUND: true, MARINA_HELPED: true };
    const r = sanitizeWardrobe(undefined, undefined, flags);
    assert.deepEqual(new Set(r.wardrobe.unlocked), new Set(['bunny_ribbon', 'star_tiara', 'pearl_strand']));
    assert.deepEqual(new Set(r.wardrobe.pending), new Set(r.wardrobe.unlocked));
    assert.equal(r.appearance.tiaraId, 'gold_tiara', 'migrating never swaps her outfit');
    // already revealed items are not re-announced
    const again = sanitizeWardrobe(r.appearance, { unlocked: r.wardrobe.unlocked, pending: [] }, flags);
    assert.deepEqual(again.wardrobe.pending, []);
  });
});

describe('save integration', () => {
  it('v0.1/v0.2 saves (no appearance fields) load with defaults and keep every other field', () => {
    const old = { version: 1, scene: 'bedroom', spawn: 'from_courtyard', form: 'princess', flags: { PIP_CARROTS_DONE: true, STAR_1_FOUND: true, LAMP_PLACED: true }, stars: 1, stickers: ['sticker_pip'], unlockedDecor: ['star_lamp', 'bunny_pillow'], bedroom: { slot_lamp: 'star_lamp' }, puzzles: {}, settings: { musicVolume: 0.2 } };
    const s = sanitize(old);
    assert.equal(s.scene, 'bedroom'); assert.equal(s.stars, 1); assert.ok(s.bedroomLayout.some((p) => p.item === 'star_lamp'), 'the lamp keeps a place in the room'); assert.deepEqual(s.bedroom, {});
    assert.ok(s.unlockedDecor.includes('star_lamp')); assert.equal(s.settings.musicVolume, 0.2);
    assert.deepEqual(s.appearance, defaultAppearance());
    assert.ok(s.wardrobe.unlocked.includes('star_tiara') && s.wardrobe.unlocked.includes('bunny_ribbon'));
  });
  it('round-trips an outfit through JSON storage and survives a "reload"', () => {
    const store = memStore();
    const a = new SaveManager(store);
    a.state.flags.RAINBOW_BRIDGE_OPEN = true; a.state.flags.STAR_1_FOUND = true;
    a.state = sanitize(a.state);
    Object.assign(a.state.appearance, { dressId: 'rainbow_gown', dressColorId: 'lavender', hairstyleId: 'braids', hairColorId: 'copper', tiaraId: 'star_tiara', faceAccentId: 'glitter_cheeks', skinToneId: 'tan' });
    a.state.wardrobe.pending = [];
    a.save();
    const b = new SaveManager(store);
    assert.deepEqual(b.state.appearance, a.state.appearance);
    assert.deepEqual(b.state.wardrobe, a.state.wardrobe);
  });
  it('corrupt appearance JSON never throws', () => {
    const store = memStore(); store.setItem(SAVE_KEY, JSON.stringify({ version: 1, appearance: { dressId: { $: 1 } }, wardrobe: { unlocked: [1, 2, null] } }));
    const s = new SaveManager(store).state;
    assert.deepEqual(s.appearance, defaultAppearance());
  });
  it('completing quests unlocks wearables without touching decor or the equipped look', () => {
    const st = defaultState();
    const order: QuestFlag[] = MAIN_PATH.map((m) => m.flag);
    for (const f of order) completeFlag(st, f);
    assert.ok(st.wardrobe.unlocked.includes('star_tiara') && st.wardrobe.unlocked.includes('rainbow_gown') && st.wardrobe.unlocked.includes('pearl_strand'));
    assert.ok(st.unlockedDecor.includes('star_lamp'), 'existing decor reward still works');
    assert.deepEqual(st.appearance, defaultAppearance());
    for (const f of ['BUTTERFLY_FOUND', 'GARDEN_SEQUENCED', 'SHORE_CHEST', 'GROTTO_CHEST', 'FAIRY_DUST_FOUND', 'MOONSTONE_FOUND'] as QuestFlag[]) completeFlag(st, f);
    for (const w of ALL_WEARABLES.filter((x) => x.flag !== 'WAND_LIT' && x.flag !== 'CREEK_CHEST' && x.flag !== 'PEARL_PLACED')) assert.ok(st.wardrobe.unlocked.includes(w.id), w.id);
  });
});

describe('art coverage (generated atlas matches the catalog)', () => {
  const cells = (k: 'wd_full' | 'wd_port') => ATLAS[k].cells as Record<string, number>;
  it('every option has art in the full-length atlas; vanity options also in the portrait atlas', () => {
    const f = cells('wd_full'), p = cells('wd_port');
    assert.ok('body' in f && 'body' in p);
    for (const d of DRESSES) { assert.ok(`dress:${d.id}` in f, d.id); assert.ok(`dress:${d.id}` in p, d.id); }
    for (const s of SHOES) assert.ok(`shoes:${s.id}` in f, s.id);
    for (const h of HAIRSTYLES) for (const part of ['hairback', 'hairfront']) { assert.ok(`${part}:${h.id}` in f); assert.ok(`${part}:${h.id}` in p); }
    for (const [part, list] of [['tiara', TIARAS], ['earrings', EARRINGS], ['necklace', NECKLACES], ['face', FACE_ACCENTS]] as const)
      for (const o of list) if (o.id !== 'none') { assert.ok(`${part}:${o.id}` in f, `${part}:${o.id}`); assert.ok(`${part}:${o.id}` in p, `${part}:${o.id}`); }
    for (const a of ACCESSORIES) if (a.id !== 'none') assert.ok(`accback:${a.id}` in f || `accfront:${a.id}` in f, a.id);
  });
  it('overworld sheets exist for every hairstyle and tiara and are loaded by the manifest', () => {
    const keys = new Set(manifest.sheets.map((s) => s.key));
    for (const h of HAIRSTYLES) { assert.ok(OW_STYLES.includes(h.id as never), h.id); assert.ok(keys.has(`ow_hair_${h.id}`)); }
    for (const t of TIARAS) if (t.id !== 'none') { assert.ok(OW_CROWNS.includes(t.id as never), t.id); assert.ok(keys.has(`ow_crown_${t.id}`)); }
    assert.ok(keys.has('mermaid_m') && keys.has('wd_full') && keys.has('wd_port') && keys.has('wardrobe_prop') && keys.has('vanity_prop'));
  });
  it('tab icons exist in the UI sheet', () => {
    for (const i of ['icon_wardrobe', 'icon_mirror', 'icon_dress', 'icon_palette', 'icon_shoe', 'icon_cape', 'icon_hair', 'icon_haircolor', 'icon_tiara', 'icon_earring', 'icon_necklace', 'icon_face', 'icon_skin', 'icon_none']) assert.ok(i in UI, i);
  });
  it('hint icons used on locked silhouettes are real pictures', () => {
    const items = readFileSync(new URL('../content/frameIndex.ts', import.meta.url), 'utf8');
    for (const w of ALL_WEARABLES) { if (!w.hintIcon) continue; assert.ok(new RegExp(`\\b${w.hintIcon}:`).test(items), `${w.id}: ${w.hintIcon}`); }
  });
  it('every tab lists real slots', () => {
    for (const t of [...WARDROBE_TABS, ...VANITY_TABS]) assert.ok(SLOTS_ALL.includes(t));
    for (const t of Object.keys(THUMB_CROP)) assert.ok(SLOTS_ALL.includes(t as never), t);
  });
});

describe('compositing and colour remap (real atlas pixels, no browser needed)', () => {
  // decode the real PNG atlas with a tiny zlib-based reader
  const pngPixels = async (file: string): Promise<AtlasPixels & { height: number }> => {
    const { inflateSync } = await import('node:zlib');
    const buf = readFileSync(new URL(`../../public/${file}`, import.meta.url));
    let pos = 8; let w = 0, h = 0; const idat: Buffer[] = [];
    while (pos < buf.length) {
      const len = buf.readUInt32BE(pos); const type = buf.toString('ascii', pos + 4, pos + 8);
      if (type === 'IHDR') { w = buf.readUInt32BE(pos + 8); h = buf.readUInt32BE(pos + 12); assert.equal(buf[pos + 16], 8); assert.equal(buf[pos + 17], 6); }
      if (type === 'IDAT') idat.push(buf.subarray(pos + 8, pos + 8 + len));
      pos += 12 + len;
    }
    const raw = inflateSync(Buffer.concat(idat)); const stride = w * 4; const out = new Uint8ClampedArray(w * h * 4);
    let prev = new Uint8Array(stride);
    for (let y = 0; y < h; y++) {
      const ft = raw[y * (stride + 1)]; const line = new Uint8Array(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
      for (let i = 0; i < stride; i++) {
        const a = i >= 4 ? line[i - 4] : 0, b = prev[i], c = i >= 4 ? prev[i - 4] : 0;
        let v = line[i];
        if (ft === 1) v += a; else if (ft === 2) v += b; else if (ft === 3) v += (a + b) >> 1;
        else if (ft === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
        line[i] = v & 255;
      }
      out.set(line, y * stride); prev = line;
    }
    return { key: file.includes('port') ? 'wd_port' : 'wd_full', data: out, width: w, height: h };
  };
  it('composes a full princess; changing dress colour changes only dress pixels, not hair or skin', async () => {
    const atlas = await pngPixels('assets/wardrobe/wd_full.png');
    const a = defaultAppearance();
    const base = composePrincess(atlas, a, 'full');
    const pink = Array.from(base);
    const b = { ...a, dressColorId: 'blue' };
    const blue = composePrincess(atlas, b, 'full');
    let diff = 0, opaque = 0;
    for (let i = 0; i < base.length; i += 4) { if (base[i + 3]) opaque++; if (base[i] !== blue[i] || base[i + 1] !== blue[i + 1] || base[i + 2] !== blue[i + 2]) diff++; }
    assert.ok(opaque > 3000, 'princess has real detail: ' + opaque + ' pixels');
    assert.ok(diff > 500 && diff < opaque * 0.6, `dress recolour changed ${diff} of ${opaque}`);
    assert.deepEqual(Array.from(base), pink, 'composition is deterministic and does not mutate the atlas');
    // no marker colours may leak into the output (they must always be remapped)
    const markers = new Set<number>(); for (const g of ['dress', 'hair', 'skin'] as const) for (const m of MARKERS[g]) markers.add((m[0] << 16) | (m[1] << 8) | m[2]);
    for (let i = 0; i < base.length; i += 4) if (base[i + 3] === 255) { const k = (base[i] << 16) | (base[i + 1] << 8) | base[i + 2]; if (markers.has(k) && !buildRemap(a).has(k)) assert.fail('marker leaked'); }
  });
  it('the default look reproduces the original palette (pink dress, golden hair)', () => {
    const m = buildRemap(defaultAppearance());
    assert.deepEqual(m.get((MARKERS.dress[1][0] << 16) | (MARKERS.dress[1][1] << 8) | MARKERS.dress[1][2]), hexToRgb('#ff7ec3'));
    assert.deepEqual(m.get((MARKERS.hair[1][0] << 16) | (MARKERS.hair[1][1] << 8) | MARKERS.hair[1][2]), hexToRgb('#ffbf3f'));
  });
  it('every dress x hairstyle composes in under a frame budget and differs from each other', async () => {
    const atlas = await pngPixels('assets/wardrobe/wd_full.png');
    const a = defaultAppearance(); const seen = new Set<string>();
    const t0 = Date.now(); let n = 0;
    for (const d of DRESSES) for (const h of HAIRSTYLES) { const img = composePrincess(atlas, { ...a, dressId: d.id, hairstyleId: h.id }, 'full'); seen.add(Buffer.from(img).toString('base64').slice(0, 4000) + img.length + img.reduce((s, v) => (s * 31 + v) | 0, 7)); n++; }
    assert.equal(seen.size, n, 'every combination looks different');
    assert.ok((Date.now() - t0) / n < 40, 'avg ms per compose ' + (Date.now() - t0) / n);
  });
  it('portrait atlas composes with the equipped dress neckline and accessories', async () => {
    const atlas = await pngPixels('assets/wardrobe/wd_port.png');
    const a = { ...defaultAppearance(), tiaraId: 'gold_tiara' };
    const withTiara = composePrincess(atlas, a, 'port');
    const without = composePrincess(atlas, { ...a, tiaraId: 'none' }, 'port');
    let diff = 0; for (let i = 0; i < withTiara.length; i++) if (withTiara[i] !== without[i]) diff++;
    assert.ok(diff > 100);
    assert.deepEqual(layerStack({ ...a, accessoryId: 'lace_gloves' }, 'port').filter((n) => n.startsWith('accfront')), [], 'gloves are not drawn in the portrait');
  });
  it('layer order: hair back below body, hair front and tiara above', () => {
    const names = layerStack({ ...defaultAppearance(), accessoryId: 'royal_cape' }, 'full');
    const ix = (n: string) => names.indexOf(n);
    assert.ok(ix('accback:royal_cape') < ix('hairback:long') && ix('hairback:long') < ix('body') && ix('body') < ix('dress:royal_ball'));
    assert.ok(ix('dress:royal_ball') < ix('accfront:royal_cape') && ix('accfront:royal_cape') < ix('hairfront:long') && ix('hairfront:long') < ix('tiara:gold_tiara'));
  });
});

describe('bedroom stations', () => {
  const room = getMap('bedroom');
  const stations = room.objects.filter((o) => (o.kind as string) === 'station');
  it('has a wardrobe and a vanity station with their own props', () => {
    assert.deepEqual(stations.map((s) => s.id).sort(), ['paint_station', 'vanity_station', 'wardrobe_station']);
    assert.ok(room.props.some((p) => p.key === 'wardrobe_prop') && room.props.some((p) => p.key === 'vanity_prop'));
  });
  it('are always available (no quest gating) and reachable from the entrance', () => {
    const grid = makeGrid(room, {}, 'princess');
    const start = room.spawns.from_courtyard;
    for (const s of stations) {
      assert.ok(!s.showWhen && !s.hideWhen, `${s.id} must not be gated`);
      const to = approachTile(grid, start, s);
      assert.ok(to, `${s.id} has no approach tile`);
      assert.ok(findPath(grid, start, to!), `${s.id} unreachable`);
    }
  });
  it('do not block the exit, the 12 decor hotspots, or each other', () => {
    const grid = makeGrid(room, {}, 'princess');
    const start = room.spawns.from_courtyard;
    const reach = flood(grid, start);
    const reachable = (x: number, y: number) => reach.has(y * 4096 + x);
    for (const o of room.objects) { if (o.kind === 'slot') assert.ok([...reach.keys()].some((k) => Math.hypot((k % 4096) - o.x, Math.floor(k / 4096) - o.y) <= (o.radius ?? 1.6)), `${o.id} cannot be approached`); }
    assert.ok(reachable(11, 16) && reachable(12, 16), 'exit approach free');
    const blocked = new Set<string>();
    for (const p of room.props) for (const [dx, dy] of p.blocks ?? []) { const k = `${p.x + dx},${p.y + dy}`; if (p.key === 'wardrobe_prop' || p.key === 'vanity_prop' || p.key === 'paint_prop') blocked.add(k); }
    for (const o of room.objects) if (o.kind === 'slot' || o.kind === 'warp') for (const t of o.tiles ?? [{ x: o.x, y: o.y }]) assert.ok(!blocked.has(`${t.x},${t.y}`), `${o.id} is under furniture`);
    // furniture footprints do not overlap other props' footprints
    const others = new Set<string>(); for (const p of room.props) if (p.key !== 'wardrobe_prop' && p.key !== 'vanity_prop' && p.key !== 'paint_prop') for (const [dx, dy] of p.blocks ?? []) others.add(`${p.x + dx},${p.y + dy}`);
    for (const k of blocked) assert.ok(!others.has(k), `furniture overlaps a prop at ${k}`);
  });
  it('new hidden finds exist in real, reachable places', () => {
    for (const [id, sc] of [['fairy_dust_spot', 'woods'], ['moonstone_spot', 'shore']] as const) {
      const map = getMap(sc); const o = map.objects.find((x) => x.id === id)!;
      assert.ok(o, id); assert.equal(o.kind, 'find'); assert.ok(FIND_FLAG[id]);
      const grid = makeGrid(map, { TREE_GATE_OPEN: true, RAINBOW_BRIDGE_OPEN: true, WILLA_MET: true }, sc === 'shore' ? 'princess' : 'princess');
      const spawn = Object.values(map.spawns)[0];
      const to = approachTile(grid, spawn, o);
      assert.ok(to && findPath(grid, spawn, to), `${id} unreachable`);
    }
  });
});
void visibleObjects;
