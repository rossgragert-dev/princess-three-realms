"""16x16 environment tiles. Every tile is opaque unless noted so tilemaps never show holes."""
from pxlib import Px, C, P, rgb, mix, rng

T = 16
TILES = []  # (name, Px)


def add(name, px):
    TILES.append((name, px))


def base(col):
    t = Px(T, T)
    t.rect(0, 0, T, T, C[col] if isinstance(col, str) and col in C else rgb(col))
    return t


def speckle(t, r, cols, n):
    for _ in range(n):
        t.set(r.randrange(T), r.randrange(T), cols[r.randrange(len(cols))])


def grass(seed, flowers=0, tall=False):
    r = rng(seed)
    t = base('green')
    speckle(t, r, [C['green_sh']], 9)
    speckle(t, r, [C['green_hi']], 6)
    for _ in range(3):  # little blades
        x, y = r.randrange(1, T - 1), r.randrange(2, T)
        t.set(x, y, C['green_dk']); t.set(x, y - 1, C['green_sh']); t.set(x + 1, y - 2, C['green_sh'])
    pal = [('white', 'yellow'), ('pink_hi', 'gold'), ('blue_hi', 'white'), ('red', 'gold')]
    for i in range(flowers):
        petal, mid = pal[(seed + i) % len(pal)]
        x, y = 2 + r.randrange(T - 5), 2 + r.randrange(T - 5)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            t.set(x + dx, y + dy, C[petal])
        t.set(x, y, C[mid])
    return t


def cobble(seed):
    r = rng(seed)
    t = base('stone_sh')
    rows = [(0, 5), (5, 11), (11, 16)]
    for ri, (y0, y1) in enumerate(rows):
        off = 0 if (ri + seed) % 2 == 0 else 5
        x = -off
        while x < T:
            w = 7 + r.randrange(3)
            for yy in range(y0 + 1, y1):
                for xx in range(max(x + 1, 0), min(x + w, T)):
                    t.set(xx, yy, C['stone'])
            for xx in range(max(x + 1, 0), min(x + w, T)):
                t.set(xx, y0 + 1, C['stone_hi'])
            x += w
    speckle(t, r, [C['stone_hi']], 4)
    return t


def sand(seed, shell=False):
    r = rng(seed)
    t = base('sand')
    speckle(t, r, [C['sand_sh']], 12)
    speckle(t, r, [C['sand_hi']], 8)
    if shell:
        t.rect(6, 7, 4, 3, C['pink_hi']); t.set(7, 6, C['pink_hi']); t.set(8, 6, C['pink_hi']); t.set(6, 9, C['pink'])
        t.line(7, 7, 7, 9, C['pink']); t.line(8, 7, 8, 9, C['pink'])
    return t


def path(seed):
    r = rng(seed)
    t = base('#ecd09a')
    speckle(t, r, [rgb('#d9b274')], 14)
    speckle(t, r, [rgb('#fff1c9')], 6)
    for _ in range(2):
        x, y = r.randrange(1, T - 3), r.randrange(1, T - 3)
        t.rect(x, y, 2, 1, rgb('#bf9760')); t.rect(x, y - 1, 2, 1, rgb('#fff1c9'))
    return t


def water(frame, foam=False, deep=False):
    t = base('water_dk' if deep else 'water')
    hi = C['water_hi']
    for row in range(3):
        y = 2 + row * 5
        for x in range(T):
            wob = ((x + frame * 2 + row * 3) // 3) % 2
            if (x + frame * 2 + row * 4) % 8 < 4:
                t.set(x, y + wob, hi)
    t.set((3 + frame * 4) % T, 5, C['white']); t.set((11 + frame * 3) % T, 12, C['white'])
    if foam:  # shallow water: lighter, with a few foam flecks (no tile-grid border)
        for y in range(T):
            for x in range(T):
                t.p[y][x] = mix(t.p[y][x], '#9be4ff', .38)
        for x, y in ((2, 3), (9, 1), (13, 8), (5, 12), (11, 14)):
            t.set((x + frame * 2) % T, y, rgb('#ffffff'))
    return t


def stream(frame):
    t = base('#2fc3d4')
    for row in range(3):
        y = 1 + row * 5
        for x in range(T):
            if (x + frame * 2 + row * 5) % 9 < 4:
                t.set(x, (y + ((x + frame) // 2) % 2) % T, rgb('#9ff4f0'))
    t.set((4 + frame * 3) % T, 8, C['white'])
    return t


def brick(variant=0):
    t = base('stone_sh')
    for ri, y0 in enumerate((0, 5, 10)):
        off = 0 if ri % 2 == 0 else 4
        for x0 in range(-off, T, 8):
            for yy in range(y0 + 1, min(y0 + 5, T)):
                for xx in range(max(x0 + 1, 0), min(x0 + 8, T)):
                    t.set(xx, yy, C['cream'] if yy > y0 + 1 else C['stone_hi'])
    t.rect(0, 15, T, 1, C['stone_dk'])
    if variant == 1:  # arched window
        t.rect(4, 2, 8, 11, C['stone_dk'])
        t.rect(5, 3, 6, 9, C['blue'])
        t.rect(5, 3, 6, 3, C['blue_hi']); t.rect(7, 3, 2, 9, C['stone_hi']); t.rect(5, 7, 6, 1, C['stone_hi'])
        t.set(4, 2, rgb('#00000000')); t.set(4, 2, C['stone_sh']); t.set(11, 2, C['stone_sh'])
        t.set(6, 4, C['white'])
    return t


def crenel():
    t = Px(T, T)  # transparent notch: sky shows through
    for x0 in (0, 8):
        for y in range(8, T):
            for x in range(x0 + 1, x0 + 7):
                t.set(x, y, C['cream'] if y > 8 else C['stone_hi'])
        t.rect(x0, 8, 1, 8, C['stone_sh']); t.rect(x0 + 7, 8, 1, 8, C['stone_sh'])
    t.rect(0, 14, T, 2, C['stone_sh'])
    return t


def roof(variant):
    t = base('blue')
    for y in range(0, T, 4):
        for x in range(T):
            sx = (x + (4 if (y // 4) % 2 else 0)) % 8
            t.set(x, y + 3, C['blue_sh'])
            if sx < 7:
                t.set(x, y, C['blue_hi'] if variant == 0 else C['purple_hi'])
        for x in range(0, T, 8):
            t.rect(x + (4 if (y // 4) % 2 else 0) - 8 + 8, y, 1, 4, C['blue_sh'])
    if variant == 1:
        t.rect(0, 12, T, 4, C['gold']); t.rect(0, 12, T, 1, C['gold_hi']); t.rect(0, 15, T, 1, C['gold_sh'])
    return t


def tree_wall(seed):
    r = rng(seed)
    t = base('leaf_dk')
    for _ in range(7):
        x, y = r.randrange(T), r.randrange(T)
        t.ell(x, y, 4, 3, C['leaf'])
        t.ell(x - 1, y - 1, 2.5, 1.8, C['leaf_hi'] if r.random() > .5 else C['green'])
    speckle(t, r, [C['leaf_dk']], 12)
    return t


def hedge():
    t = base('green_sh')
    for x in range(0, T, 4):
        t.ell(x + 2, 6, 3.4, 4.5, C['green']); t.ell(x + 2, 4.5, 2, 2, C['green_hi'])
    t.rect(0, 11, T, 5, C['leaf'])
    for x in range(1, T, 5):
        t.set(x, 7, C['pink_hi']); t.set(x + 2, 12, C['white'])
    t.rect(0, 15, T, 1, C['leaf_dk'])
    return t


def fence(horizontal):
    t = grass(77)
    if horizontal:
        t.rect(0, 5, T, 2, C['cream']); t.rect(0, 10, T, 2, C['cream'])
        t.rect(0, 6, T, 1, C['cream_sh']); t.rect(0, 11, T, 1, C['cream_sh'])
        for x in (1, 11):
            t.rect(x, 3, 3, 11, C['wood']); t.rect(x, 3, 3, 1, C['brown_hi']); t.rect(x + 2, 4, 1, 10, C['wood_sh'])
    else:
        t.rect(6, 0, 2, T, C['cream']); t.rect(6, 0, 1, T, C['cream_sh'])
        t.rect(5, 1, 4, 3, C['wood']); t.rect(5, 9, 4, 3, C['wood'])
        t.rect(5, 1, 4, 1, C['brown_hi']); t.rect(5, 9, 4, 1, C['brown_hi'])
    return t


def boulder(on_sand=False):
    t = sand(5) if on_sand else grass(11)
    t.ell(8, 9, 6.5, 5.5, C['rock']); t.ell(6.5, 7, 3.5, 2.5, C['rock_hi']); t.rect(3, 12, 10, 2, C['rock_sh'])
    t.set(5, 6, C['white'])
    return t


def bridge_tile(kind, frame=0):
    t = water(frame)
    if kind == 'plank':
        for y in range(1, T, 5):
            t.rect(0, y, T, 4, C['wood']); t.rect(0, y, T, 1, C['brown_hi']); t.rect(0, y + 3, T, 1, C['wood_sh'])
    elif kind == 'ghost':  # faded rainbow outline: "needs repair"
        cols = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
        for i, c in enumerate(cols):
            y = 2 + i * 2
            for x in range(0, T, 2):
                if (x // 2 + i) % 2 == 0:
                    t.set(x, y, mix(P[c] if c in P else P['blue'], P['water'], .55)); t.set(x + 1, y, mix(P[c], P['water'], .55))
    else:  # restored rainbow bridge
        stripes = ['#ff5a6e', '#ff9a3c', '#ffe14d', '#5ccf59', '#3ea6ff', '#a06bff']
        t.rect(0, 0, T, T, rgb('#e8f9ff'))
        for i, c in enumerate(stripes):
            t.rect(0, 1 + i * 2 + (i // 3), T, 2, rgb(c))
        t.rect(0, 0, T, 1, C['white']); t.rect(0, 15, T, 1, C['white'])
        t.set(3 + frame * 5, 4, C['white']); t.set(12 - frame * 4, 9, C['white'])
    return t


def flower_patch(color):
    t = grass(5)
    pal = {'red': ('red', 'gold'), 'blue': ('blue', 'white'), 'pink': ('pink', 'gold'), 'yellow': ('yellow', 'orange')}[color]
    for x, y in ((3, 4), (10, 3), (6, 9), (12, 11), (2, 12)):
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            t.set(x + dx, y + dy, C[pal[0]])
        t.set(x, y, C[pal[1]]); t.set(x, y + 2, C['green_dk'])
    return t


def wood_floor(v):
    t = base('#eab380')
    for y in range(0, T, 4):
        t.rect(0, y + 3, T, 1, rgb('#c98b57'))
        t.rect(0, y, T, 1, rgb('#f6cfa1'))
        t.rect(((y // 4) * 5 + v * 3) % T, y, 1, 4, rgb('#c98b57'))
    return t


def wall_paper():
    t = base('#ffc9e6')
    for x in range(0, T, 8):
        t.rect(x, 0, 2, T, rgb('#ffe0f2'))
    for x, y in ((4, 4), (12, 10)):
        t.set(x, y, C['pink']); t.set(x - 1, y - 1, C['pink']); t.set(x + 1, y - 1, C['pink']); t.set(x, y + 1, C['pink'])
    t.rect(0, 0, T, 1, rgb('#ffeaf6'))
    return t


def baseboard():
    t = wall_paper()
    t.rect(0, 11, T, 5, C['cream']); t.rect(0, 11, T, 1, C['white']); t.rect(0, 15, T, 1, C['cream_sh'])
    return t


def bed_wall_top():
    t = base('#b996ff')
    t.rect(0, 12, T, 4, rgb('#8f6be0'))
    for x in range(1, T, 5):
        t.set(x, 4, C['gold_hi']); t.set(x + 2, 8, C['white'])
    return t


def uw_sand(v):
    r = rng(300 + v)
    t = base('#f2d5bd')
    for y in (3, 8, 13):
        for x in range(T):
            if (x + y + v * 3) % 7 < 4:
                t.set(x, y + ((x // 3) % 2), rgb('#e3b99d'))
    speckle(t, r, [rgb('#fff0e0')], 7)
    return t


def uw_rock(v):
    r = rng(400 + v)
    t = base('rock_sh')
    for _ in range(4):
        t.ell(r.randrange(T), r.randrange(T), 5, 4, C['rock'])
    for _ in range(3):
        t.ell(r.randrange(T), r.randrange(T), 2.5, 1.5, C['rock_hi'])
    t.rect(0, 14, T, 2, rgb('#463c78'))
    return t


def coral(kind):
    t = uw_sand(0)
    if kind == 'pink':
        main, hi = C['pink'], C['pink_hi']
    elif kind == 'blue':
        main, hi = C['purple'], C['purple_hi']
    else:
        main, hi = C['orange'], C['yellow']
    for x in (3, 7, 11):
        h = 8 + (x % 3) * 2
        t.rect(x, 15 - h, 3, h, main); t.rect(x, 15 - h, 1, h, hi); t.ell(x + 1.5, 15 - h, 2.2, 2.2, hi)
    t.rect(0, 14, T, 2, mix(P['pink_sh'], P['sand'], .3))
    return t


def glow_lane():
    t = uw_sand(1)
    for x, y in ((3, 3), (9, 6), (5, 10), (12, 12), (7, 14)):
        t.set(x, y, C['gold_hi']); t.set(x + 1, y, C['white']); t.set(x, y + 1, C['gold_hi'])
    t.rect(0, 7, T, 2, rgb('#fff3c4'))
    return t


def build():
    for i in range(4):
        add(f'grass{i}', grass(10 + i))
    add('grass_flower0', grass(30, 3)); add('grass_flower1', grass(31, 3))
    add('path0', path(1)); add('path1', path(2))
    add('cobble0', cobble(1)); add('cobble1', cobble(2))
    add('sand0', sand(1)); add('sand1', sand(2)); add('sand_shell', sand(3, True))
    for f in range(4):
        add(f'water{f}', water(f))
    for f in range(4):
        add(f'water_edge{f}', water(f, foam=True))
    for f in range(4):
        add(f'stream{f}', stream(f))
    add('wall_brick', brick(0)); add('wall_window', brick(1)); add('wall_crenel', crenel())
    add('roof_blue', roof(0)); add('roof_gold', roof(1))
    add('tree_wall0', tree_wall(1)); add('tree_wall1', tree_wall(2))
    add('hedge', hedge()); add('fence_h', fence(True)); add('fence_v', fence(False)); add('boulder', boulder()); add('boulder_sand', boulder(True))
    add('bridge_plank', bridge_tile('plank')); add('bridge_ghost', bridge_tile('ghost'))
    add('bridge_rainbow0', bridge_tile('rainbow', 0)); add('bridge_rainbow1', bridge_tile('rainbow', 1))
    for c in ('red', 'blue', 'pink', 'yellow'):
        add(f'flower_{c}', flower_patch(c))
    add('wood_floor0', wood_floor(0)); add('wood_floor1', wood_floor(1))
    add('wall_paper', wall_paper()); add('baseboard', baseboard()); add('wall_top_int', bed_wall_top())
    add('uw_sand0', uw_sand(0)); add('uw_sand1', uw_sand(1)); add('uw_rock0', uw_rock(0)); add('uw_rock1', uw_rock(1))
    add('coral_pink', coral('pink')); add('coral_blue', coral('blue')); add('coral_orange', coral('orange'))
    add('glow_lane', glow_lane())
    # a black-free "void" tile (deep water) to pad maps
    add('deep_water', water(0, deep=True))
    return TILES
