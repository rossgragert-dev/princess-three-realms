#!/usr/bin/env python3
"""Static review renders composed from the REAL map data and generated art.
These are not Phaser screenshots: they show layout, collision-free composition and art cohesion only."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from PIL import Image, ImageDraw
ROOT = os.path.dirname(HERE)
PUB = os.path.join(ROOT, 'public')
man = json.load(open(os.path.join(PUB, 'assets', 'manifest.json')))
maps = json.load(open('/tmp/ptr_maps.json'))
sheets = {s['key']: s for s in man['sheets']}
imgs = {i['key']: i for i in man['images']}
anims = {a['key']: a for a in man['anims']}
cache = {}


def sheet_im(key):
    if key not in cache:
        cache[key] = Image.open(os.path.join(PUB, sheets[key]['file'])).convert('RGBA')
    return cache[key]


def frame(key, idx):
    s = sheets[key]; im = sheet_im(key); fw, fh = s['frameWidth'], s['frameHeight']; cols = im.width // fw
    return im.crop(((idx % cols) * fw, (idx // cols) * fh, (idx % cols) * fw + fw, (idx // cols) * fh + fh))


def png(key):
    if ('img', key) not in cache:
        cache[('img', key)] = Image.open(os.path.join(PUB, imgs[key]['file'])).convert('RGBA')
    return cache[('img', key)]


def sprite(ref, flags_frame=None):
    key = ref['key']; fr = ref.get('frame', 0)
    if ref.get('anim'):
        fr = anims[ref['anim']]['frames'][0]
    if key in imgs:
        im = png(key)
    else:
        im = frame(key, flags_frame if flags_frame is not None else fr)
    sc = ref.get('scale', 1)
    return im.resize((im.width * sc, im.height * sc), Image.NEAREST) if sc != 1 else im


TILE = man['index']['tiles']
OPEN = {'TREE_GATE_OPEN', 'WILLA_MET', 'RAINBOW_BRIDGE_OPEN', 'MARINA_HELPED', 'PEARL_PLACED', 'STAR_1_FOUND', 'INTRO_DONE', 'PIP_CARROTS_DONE'}


def render(mid, flags, actors, out, extras=()):
    m = maps[mid]; W, H = m['w'] * 16, m['h'] * 16
    im = Image.new('RGBA', (W, H), m['bg'])
    tiles = sheet_im('tiles')
    gate_open = {}
    for g in m['gates']:
        if g['flag'] in flags and g.get('openTile'):
            for t in g['tiles']:
                gate_open[(t['x'], t['y'])] = g['openTile']
    for y, row in enumerate(m['ground']):
        for x, name in enumerate(row):
            name = gate_open.get((x, y), name)
            i = TILE[name]
            im.alpha_composite(frame('tiles', i), (x * 16, y * 16))
    draw = []
    for p in m['props']:
        if p.get('showWhen') and p['showWhen'] not in flags: continue
        ff = None
        if p.get('flagFrame') and p['flagFrame']['flag'] in flags:
            ff = p['flagFrame']['frame']
        s = sprite(p, ff)
        draw.append(((p['y'] + 1) * 16 + p.get('depthBias', 0) * 1000 * -1, s, p['x'] * 16 + 8 + p.get('ox', 0) - s.width // 2, (p['y'] + 1) * 16 - s.height))
    for o in m['objects']:
        if o.get('showWhen') and o['showWhen'] not in flags: continue
        if o.get('hideWhen') and o['hideWhen'] in flags: continue
        if not o.get('sprite'): continue
        if o['id'] in (x[0] for x in extras): continue
        s = sprite(o['sprite'])
        if o['id'].startswith('chest') and False: pass
        draw.append(((o['y'] + 1) * 16, s, o['x'] * 16 + 8 - s.width // 2, (o['y'] + 1) * 16 - s.height + (2 if s.height == 16 else 0)))
    for key, idx, (tx, ty) in actors:
        s = frame(key, idx)
        draw.append(((ty + 1) * 16, s, tx * 16 + 8 - s.width // 2, (ty + 1) * 16 - s.height + 2))
    for key, idx, (tx, ty), kind in extras:
        s = frame(key, idx) if key in sheets else png(key)
        draw.append(((ty + 1) * 16 + (-500 if kind == 'floor' else 0), s, tx * 16 + 8 - s.width // 2, (ty + 1) * 16 - s.height))
    for _, s, x, y in sorted(draw, key=lambda d: d[0]):
        im.alpha_composite(s, (int(x), int(y)))
    # camera-sized crop would be 512x384; keep full map, scale 2x for review
    im = im.resize((W * 2, H * 2), Image.NEAREST)
    im.convert('RGB').save(os.path.join(ROOT, 'docs', 'screenshots', out))


os.makedirs(os.path.join(ROOT, 'docs', 'screenshots'), exist_ok=True)
# princess: row 0 (down) idle=0 ; unicorn rows are 12 wide ; mermaid 8 wide
render('courtyard', {'INTRO_DONE', 'PIP_CARROTS_DONE', 'TREE_GATE_OPEN', 'STAR_1_FOUND'}, [('princess', 0, (13, 10))], '01_courtyard_after_star.png')
render('courtyard', set(), [('princess', 0, (12, 10))], '01b_courtyard_start.png')
render('woods', OPEN, [('unicorn', 0, (38, 15))], '02_woods_rainbow_bridge_unicorn.png')
render('woods', {'INTRO_DONE', 'PIP_CARROTS_DONE'}, [('princess', 0, (19, 15))], '02b_woods_tree_gate_closed.png')
render('shore', OPEN, [('mermaid', 2 * 0 + 8 * 2 + 0, (24, 13))], '03_shore_lake_mermaid.png')
render('grotto', OPEN, [('mermaid', 8 * 2 + 3, (15, 14))], '04_grotto_mermaid.png')
render('bedroom', OPEN, [('princess', 0, (13, 11))],
       '05_bedroom_lamp_placed.png',
       extras=[('lamp', 1, (17, 8), 'obj'), ('rug', 0, (12, 13), 'floor'), ('mobile', 0, (14, 4), 'obj'), ('vase', 0, (20, 11), 'obj')])
print('rendered')
