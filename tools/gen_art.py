#!/usr/bin/env python3
"""Deterministic pixel-art pipeline for Princess of Three Realms. Requires only Pillow.
Usage: python3 tools/gen_art.py   (run from anywhere). Re-running yields byte-identical output."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from pxlib import Px, C, sheet, upscale, Image, rgb, mix
import art_tiles, art_chars as AC, art_props as AP, art_overworld as AO, art_wardrobe as AW, art_home as AH

ROOT = os.path.dirname(HERE)
PUB = os.path.join(ROOT, 'public', 'assets')
PREV = os.path.join(ROOT, 'docs', 'art_preview')
for d in ('tiles', 'characters', 'items', 'props', 'ui'):
    os.makedirs(os.path.join(PUB, d), exist_ok=True)
os.makedirs(PREV, exist_ok=True)
os.makedirs(os.path.join(ROOT, 'public', 'icons'), exist_ok=True)

manifest = {'sheets': [], 'images': [], 'anims': [], 'index': {}}
previews = {}


def save_sheet(rel, frames, cols, key):
    im, c, r = sheet(frames, cols)
    path = os.path.join(PUB, rel)
    im.save(path, optimize=False)
    manifest['sheets'].append({'key': key, 'file': 'assets/' + rel, 'frameWidth': frames[0].w, 'frameHeight': frames[0].h, 'frames': len(frames)})
    return im


def anim(key, sheetkey, frames, rate, repeat=-1):
    manifest['anims'].append({'key': key, 'sheet': sheetkey, 'frames': frames, 'frameRate': rate, 'repeat': repeat})


def save_image(name, px):
    px.image().save(os.path.join(PUB, 'props', name + '.png'))
    manifest['images'].append({'key': name, 'file': f'assets/props/{name}.png', 'width': px.w, 'height': px.h})


# ---- tiles
tiles = art_tiles.build() + AH.room_tiles()
im = save_sheet('tiles/tiles.png', [t for _, t in tiles], 16, 'tiles')
tile_index = {n: i for i, (n, _) in enumerate(tiles)}
manifest['index']['tiles'] = tile_index
previews['tiles'] = (im, 4, (255, 0, 255, 255))

# ---- characters. Rows: down, up, left, right.  Direction anims are derived from this layout.
DIRS = ['down', 'up', 'left', 'right']


def dir_sheet(key, rel, cols_spec, fn, bg):
    """cols_spec: list of (kind, f). fn(dir, kind, f) -> Px. right = mirrored left."""
    frames = []
    for d in DIRS:
        for kind, f in cols_spec:
            frames.append(fn('left', kind, f).flip() if d == 'right' else fn(d, kind, f))
    n = len(cols_spec)
    im = save_sheet(rel, frames, n, key)
    return im, n


pr_spec = [('idle', 0), ('idle', 1), ('walk', 0), ('walk', 1), ('walk', 2), ('walk', 3), ('cast', 0), ('cast', 1)]


def recolor_default(im):
    """Marker colours -> the default look (pink dress, golden hair, porcelain skin)."""
    mp = {}
    for grp in ('dress', 'hair', 'skin'):
        for i in range(4):
            mp[AW.MARKERS[grp][i]] = AW.DEFAULT_TARGET[grp][i]
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] in mp:
                px[x, y] = mp[px[x, y]]
    return im


def save_png_sheet(rel, im, fw, fh, key, frames):
    im.save(os.path.join(PUB, rel), optimize=False)
    manifest['sheets'].append({'key': key, 'file': 'assets/' + rel, 'frameWidth': fw, 'frameHeight': fh, 'frames': frames})


# Overworld princess: one marker-coloured sheet per hairstyle + one tiara overlay sheet per tiara. The game recolours and stacks them.
ow_imgs = {}
for st in AO.STYLES:
    im, n = dir_sheet(f'ow_hair_{st}', f'characters/ow_hair_{st}.png', pr_spec, lambda d, k, f, st=st: AO.princess_ow(d, k, f, st), None)
    ow_imgs[('hair', st)] = im
for tid in AO.CROWNS:
    im, n = dir_sheet(f'ow_crown_{tid}', f'characters/ow_crown_{tid}.png', pr_spec, lambda d, k, f, tid=tid: AO.crown_ow(d, k, f, tid), None)
    ow_imgs[('crown', tid)] = im
# default princess = long hair + golden tiara in the default colours (title screen + fallback)
from PIL import Image as _I
base_im = _I.new('RGBA', ow_imgs[('hair', 'long')].size, (0, 0, 0, 0))
base_im.alpha_composite(ow_imgs[('hair', 'long')]); base_im.alpha_composite(ow_imgs[('crown', 'gold_tiara')])
im = recolor_default(base_im)
save_png_sheet('characters/princess.png', im, 24, 32, 'princess', 32)
n = 8
previews['princess'] = (im, 4, (190, 235, 190, 255))
ow_styles = _I.new('RGBA', (ow_imgs[('hair', 'long')].width, 32 * 6 * 1), (0, 0, 0, 0))
for i, st in enumerate(AO.STYLES):
    row = ow_imgs[('hair', st)].crop((0, 0, 24 * 8, 32))      # facing down
    cr = ow_imgs[('crown', 'gold_tiara')].crop((0, 0, 24 * 8, 32))
    row = row.copy(); row.alpha_composite(cr)
    ow_styles.paste(recolor_default(row), (0, i * 32))
previews['ow_hairstyles'] = (ow_styles, 3, (190, 235, 190, 255))
for i, d in enumerate(DIRS):
    b = i * n
    anim(f'princess_idle_{d}', 'princess', [b, b + 1], 2); anim(f'princess_walk_{d}', 'princess', [b + 2, b + 3, b + 4, b + 5], 8)
    anim(f'princess_cast_{d}', 'princess', [b + 6, b + 7, b + 7, b + 6], 6, 0)

un_spec = [('idle', 0), ('idle', 1), ('walk', 0), ('walk', 1), ('walk', 2), ('walk', 3), ('gallop', 0), ('gallop', 1), ('gallop', 2), ('gallop', 3), ('cast', 0), ('cast', 1)]
im, n = dir_sheet('unicorn', 'characters/unicorn.png', un_spec, AC.unicorn, None)
previews['unicorn'] = (im, 3, (190, 235, 190, 255))
for i, d in enumerate(DIRS):
    b = i * n
    anim(f'unicorn_idle_{d}', 'unicorn', [b, b + 1], 2); anim(f'unicorn_walk_{d}', 'unicorn', [b + 2, b + 3, b + 4, b + 5], 9)
    anim(f'unicorn_gallop_{d}', 'unicorn', [b + 6, b + 7, b + 8, b + 9], 12); anim(f'unicorn_bloom_{d}', 'unicorn', [b + 10, b + 11, b + 11, b + 10], 6, 0)

me_spec = [('idle', 0), ('idle', 1), ('swim', 0), ('swim', 1), ('swim', 2), ('swim', 3), ('bubble', 0), ('bubble', 1)]
im, n = dir_sheet('mermaid', 'characters/mermaid.png', me_spec, AC.mermaid, None)
previews['mermaid'] = (im, 3, (70, 150, 230, 255))
for i, d in enumerate(DIRS):
    b = i * n
    anim(f'mermaid_idle_{d}', 'mermaid', [b, b + 1], 2); anim(f'mermaid_swim_{d}', 'mermaid', [b + 2, b + 3, b + 4, b + 5], 8)
    anim(f'mermaid_bubble_{d}', 'mermaid', [b + 6, b + 7, b + 7, b + 6], 6, 0)

# mermaid with recolourable hair + skin (the game remaps hair/skin to the chosen look)
_sv = {k: C[k] for k in ('hair', 'hair_hi', 'hair_sh', 'skin', 'skin_sh')}
C['hair'], C['hair_hi'], C['hair_sh'], C['skin'], C['skin_sh'] = AW.HM[1], AW.HM[0], AW.HM[2], AW.SM[1], AW.SM[2]
dir_sheet('mermaid_m', 'characters/mermaid_m.png', me_spec, AC.mermaid, None)
C.update(_sv)

npc_frames = []
for name, (w, h, fn) in AC.NPCS.items():
    fr = [fn(0), fn(1), fn(2)]
    save_sheet(f'characters/npc_{name}.png', fr, 3, f'npc_{name}')
    anim(f'{name}_idle', f'npc_{name}', [0, 1], 2); anim(f'{name}_react', f'npc_{name}', [2, 2, 1, 2], 6, 0)
    if name != 'tree':
        npc_frames += fr
im, _, _ = sheet(npc_frames, 6)
previews['npcs'] = (im, 4, (190, 235, 190, 255))

# ---- items (16x16)
item_px = [(n, fn()) for n, fn in AP.ITEMS]
im = save_sheet('items/items.png', [p for _, p in item_px], 8, 'items')
manifest['index']['items'] = {n: i for i, (n, _) in enumerate(item_px)}
previews['items'] = (im, 6, (200, 230, 255, 255))
anim('sparkle', 'items', [manifest['index']['items'][f'sparkle{i}'] for i in range(4)], 8)

# ---- UI (32x32 round icon buttons)
ui = AP.icons() + AW.ui_icons() + AH.home_icons()
im = save_sheet('ui/ui.png', [p for _, p in ui], 8, 'ui')
manifest['index']['ui'] = {n: i for i, (n, _) in enumerate(ui)}
previews['ui'] = (im, 4, (255, 245, 220, 255))

# ---- props
for nm, px in (('tree_a', AP.tree('a')), ('tree_b', AP.tree('b')), ('bush', AP.bush()), ('castle_gate', AP.castle_gate()),
               ('door_small', AP.door_small()), ('bed', AP.bed()), ('rug', AP.rug()), ('mobile', AP.mobile()), ('vase', AP.vase()),
               ('window_night', AP.window_night()), ('bunny_pillow', AP.bunny_pillow()), ('unicorn_plush', AP.unicorn_plush()),
               ('shell_mirror', AP.shell_mirror()), ('mermaid_art', AP.mermaid_art()), ('butterfly_painting', AP.butterfly_painting()),
               ('canopy_bed', AP.canopy_bed()), ('moon_curtain', AP.moon_curtain()), ('crystal_nightstand', AP.crystal_nightstand()),
               ('decor_chest', AP.decor_chest()), ('shelf', AP.shelf()), ('crown_hud', AP.crown_hud()), ('sign_arch', AP.sign_arch()), ('hand', AP.hand())):
    save_image(nm, px)
for nm, fn in AH.FURNITURE:
    save_image(nm, fn())
save_sheet('props/fountain.png', [AP.fountain(i) for i in range(2)], 2, 'fountain'); anim('fountain_flow', 'fountain', [0, 1], 4)
save_sheet('props/lamp.png', [AP.lamp(False), AP.lamp(True)], 2, 'lamp')
save_sheet('props/pedestal.png', [AP.pedestal(i) for i in range(3)], 3, 'pedestal')
save_sheet('props/shell_socket.png', [AP.shell_socket(False), AP.shell_socket(True)], 2, 'shell_socket')
save_sheet('props/plot.png', [AP.plot(i) for i in range(4)], 4, 'plot')
save_sheet('props/seaweed.png', [AP.seaweed(i) for i in range(4)], 4, 'seaweed'); anim('seaweed_sway', 'seaweed', [0, 1, 2, 3], 3)
save_sheet('props/shimmer.png', [AP.shimmer(i) for i in range(4)], 4, 'shimmer'); anim('shimmer_glow', 'shimmer', [0, 1, 2, 3], 4)
save_sheet('props/whirlpool.png', [AP.whirlpool(i) for i in range(4)], 4, 'whirlpool'); anim('whirlpool_spin', 'whirlpool', [0, 1, 2, 3], 6)
save_sheet('props/ribbon.png', [AP.ribbon(False), AP.ribbon(True)], 1, 'ribbon')
prop_frames = [AP.tree('a'), AP.tree('b')]
for nm, px in (('tree_a', AP.tree('a')), ('tree_b', AP.tree('b')), ('castle_gate', AP.castle_gate()), ('bed', AP.bed()), ('rug', AP.rug())):
    pass
# props preview: simple contact sheet on a canvas
pv = Image.new('RGBA', (560, 200), (190, 235, 190, 255))
x = 4
for px in (AP.tree('a'), AP.tree('b'), AP.fountain(0), AP.castle_gate(), AP.door_small(), AP.bed(), AP.rug(), AP.mobile(), AP.vase(), AP.pedestal(1), AP.lamp(True), AP.crown_hud()):
    pv.alpha_composite(px.image(), (x, 200 - px.h - 8)); x += px.w + 6
previews['props'] = (pv, 3, (190, 235, 190, 255))

# ---- Royal Wardrobe / Enchanted Vanity: bedroom props, layered art atlases
save_sheet('props/wardrobe_prop.png', [AW.wardrobe_prop(0), AW.wardrobe_prop(1)], 2, 'wardrobe_prop'); anim('wardrobe_glow', 'wardrobe_prop', [0, 1], 2)
save_sheet('props/paint_prop.png', [AH.paint_prop(0), AH.paint_prop(1)], 2, 'paint_prop'); anim('paint_glow', 'paint_prop', [0, 1], 2)
save_sheet('props/vanity_prop.png', [AW.vanity_prop(0), AW.vanity_prop(1)], 2, 'vanity_prop'); anim('vanity_glow', 'vanity_prop', [0, 1], 2)
os.makedirs(os.path.join(PUB, 'wardrobe'), exist_ok=True)
atlas_meta = {}
for kind, key, w, h in (('full', 'wd_full', AW.FW, AW.FH), ('portrait', 'wd_port', AW.PW, AW.PH)):
    cells = AW.build_cells(kind)
    ai, cols, rows = AW.atlas_image(cells, w, h)
    save_png_sheet(f'wardrobe/{key}.png', ai, w, h, key, cols * rows)
    atlas_meta[key] = {'w': w, 'h': h, 'cols': cols, 'cells': {nm: i for i, (nm, _) in enumerate(cells)}}
ramps = AW.load_ramps()
base_app = dict(dressId='royal_ball', dressColorId='pink', shoesId='slippers', accessoryId='none', hairstyleId='long', hairColorId='blonde', tiaraId='gold_tiara', earringsId='none', necklaceId='none', faceAccentId='none', skinToneId='porcelain')
sample_looks = [
    {}, dict(dressId='rainbow_gown', dressColorId='lavender', shoesId='jeweled', accessoryId='butterfly_wings', hairstyleId='ponytail', hairColorId='auburn', tiaraId='star_tiara', earringsId='star_drops', necklaceId='star_pendant', faceAccentId='glitter_cheeks', skinToneId='tan'),
    dict(dressId='garden', dressColorId='mint', shoesId='sandals', accessoryId='flower_shawl', hairstyleId='braids', hairColorId='dark_brown', tiaraId='flower_crown', earringsId='flower_dangles', necklaceId='shell_necklace', faceAccentId='star_freckles', skinToneId='brown'),
    dict(dressId='starry_night', dressColorId='blue', shoesId='pearl_shoes', accessoryId='moon_cape', hairstyleId='bun', hairColorId='platinum', tiaraId='pearl_crown', earringsId='pearl_studs', necklaceId='pearl_strand', faceAccentId='butterfly_accent', skinToneId='deep'),
    dict(dressId='festival', dressColorId='teal', shoesId='boots', accessoryId='lace_gloves', hairstyleId='curls', hairColorId='lilac', tiaraId='bunny_ribbon', earringsId='pearl_studs', necklaceId='gem_choker', faceAccentId='rosy_cheeks', skinToneId='honey'),
    dict(dressId='fairy_sparkle', dressColorId='peach', shoesId='mary_janes', accessoryId='royal_cape', hairstyleId='bob', hairColorId='black', tiaraId='butterfly_clip', earringsId='none', necklaceId='heart_pendant', faceAccentId='rosy_cheeks', skinToneId='rose'),
]
for kind in ('full', 'portrait'):
    tiles = [AW.compose_preview({**base_app, **c}, kind, ramps) for c in sample_looks]
    W_, H_ = tiles[0].size
    sh = _I.new('RGBA', (W_ * 3, H_ * 2))
    for i, t in enumerate(tiles): sh.paste(t, ((i % 3) * W_, (i // 3) * H_))
    previews[f'wardrobe_looks_{kind}'] = (sh, 2, (255, 240, 250, 255))
dtiles = [AW.compose_preview({**base_app, 'dressId': d, 'hairstyleId': hs}, 'full', ramps) for d, hs in zip(AW.DRESS_IDS, AW.STYLE_IDS + ['long', 'bob'])]
sh = _I.new('RGBA', (AW.FW * 4, AW.FH * 2))
for i, t in enumerate(dtiles): sh.paste(t, ((i % 4) * AW.FW, (i // 4) * AW.FH))
previews['wardrobe_dresses_and_hair'] = (sh, 2, (255, 240, 250, 255))

# ---- manifest and TS index
with open(os.path.join(PUB, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=1, sort_keys=True)


def ts_obj(name, d):
    body = ',\n'.join(f'  {k}: {v}' for k, v in d.items())
    return f'export const {name} = {{\n{body}\n}} as const;\n'


with open(os.path.join(ROOT, 'src', 'content', 'frameIndex.ts'), 'w') as f:
    f.write('// GENERATED by tools/gen_art.py. Do not edit by hand.\n')
    f.write(ts_obj('TILE', manifest['index']['tiles']))
    f.write(ts_obj('ITEM', manifest['index']['items']))
    f.write(ts_obj('UI', manifest['index']['ui']))
    f.write('export type TileName = keyof typeof TILE;\nexport type ItemName = keyof typeof ITEM;\nexport type UiName = keyof typeof UI;\n')

with open(os.path.join(ROOT, 'src', 'content', 'wardrobeIndex.ts'), 'w') as f:
    f.write('// GENERATED by tools/gen_art.py. Do not edit by hand.\n')
    f.write('/** Marker colours the art is drawn in; the game remaps these exact RGB values to the chosen dress / hair / skin ramp. */\n')
    f.write('export const MARKERS = ' + json.dumps({k: [list(c[:3]) for c in v] for k, v in AW.MARKERS.items()}) + ' as const;\n')
    f.write('export const ATLAS = ' + json.dumps(atlas_meta, indent=1, sort_keys=True) + ' as const;\n')
    f.write('export const OW_STYLES = ' + json.dumps(AO.STYLES) + ' as const;\n')
    f.write('export const OW_CROWNS = ' + json.dumps(AO.CROWNS) + ' as const;\n')

# ---- preview sheets for review
for name, (im, k, bgc) in previews.items():
    bg = Image.new('RGBA', im.size, bgc)
    bg.alpha_composite(im)
    upscale(bg, k).save(os.path.join(PREV, f'preview_{name}.png'))

# ---- app icons (crown + star over a pink to violet gradient)
def app_icon(size, pad):
    base = Px(32, 32)
    for y in range(32):
        for x in range(32):
            base.set(x, y, mix('#ff9ad5', '#8f6bff', (y + x * .3) / 42))
    crown = AP.crown_hud(); base.blit(crown, 0, 7)
    st = dict(AP.ITEMS)['star'](); base.blit(st, 8, 12)
    for x, y in ((5, 5), (26, 8), (24, 24), (6, 22)):
        AC.sparkle(base, x, y)
    big = upscale(base.image(), max(1, (size - pad * 2) // 32))
    out = Image.new('RGBA', (size, size), rgb('#a070ff'))
    out.alpha_composite(big, ((size - big.width) // 2, (size - big.height) // 2))
    return out.resize((size, size), Image.NEAREST)


for s, nm, pad in ((192, 'icon-192.png', 0), (512, 'icon-512.png', 0), (180, 'apple-touch-icon.png', 0), (512, 'icon-maskable-512.png', 64)):
    app_icon(s, pad).save(os.path.join(ROOT, 'public', 'icons', nm))

print('tiles', len(tiles), '| items', len(item_px), '| ui', len(ui), '| sheets', len(manifest['sheets']), '| images', len(manifest['images']), '| anims', len(manifest['anims']))
