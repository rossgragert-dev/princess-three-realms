"""v0.4b art: the King, the Queen, Dapple the meadow unicorn, wand heads/colours/trails, fireworks icons, festival and workshop props,
and the two new bedroom rewards. Deterministic, original."""
import math
from pxlib import Px, C, rgb, mix
from art_chars import EYE, shadow, sparkle, unicorn, RAINBOW
from art_props import _star_poly

W = C['white']


# ---------------------------------------------------------------- the King and the Queen (32x32 NPCs, 3 frames: idle, idle-bob, react)
def king(f):
    p = Px(32, 32)
    up = -1 if f == 1 else (-3 if f == 2 else 0)
    # royal red cape behind, ermine collar, blue tunic
    p.poly([(7, 17 + up), (25, 17 + up), (27, 30), (5, 30)], C['red_sh']); p.poly([(8, 17 + up), (24, 17 + up), (25, 29), (7, 29)], C['red'])
    p.poly([(11, 19 + up), (21, 19 + up), (22, 29), (10, 29)], C['blue']); p.rect(11, 19 + up, 3, 10, C['blue_hi'])
    p.rect(10, 26, 12, 1, C['gold']); p.rect(15, 26, 2, 1, C['gold_hi'])
    p.ell(16, 19 + up, 8, 2.6, C['white']); [p.set(9 + i * 4, 19 + up, C['ol']) for i in range(5)]       # ermine
    p.rect(12, 29, 3, 2, C['brown']); p.rect(17, 29, 3, 2, C['brown'])
    if f == 2:
        p.rect(5, 19 + up, 3, 3, C['skin']); p.rect(24, 19 + up, 3, 3, C['skin'])                       # arms up, celebrating
    # head, beard, moustache, crown
    p.ell(16, 11 + up, 6.4, 6, C['skin']); p.ell(16, 16 + up, 6, 4.2, C['stone_hi']); p.ell(16, 15 + up, 4.2, 2.4, C['skin'])
    p.rect(11, 15 + up, 10, 1, C['stone_hi'])
    for ex in (13, 18):
        p.rect(ex, 10 + up, 2, 2, EYE); p.set(ex, 10 + up, W)
    p.rect(11, 13 + up, 2, 1, C['blush']); p.rect(20, 13 + up, 2, 1, C['blush'])
    p.rect(13, 13 + up, 6, 2, C['stone_hi']); p.rect(15, 15 + up, 2, 1, C['mouth'])
    p.rect(10, 5 + up, 12, 4, C['gold']); p.rect(10, 5 + up, 12, 1, C['gold_hi'])
    for x in (10, 14, 18, 21):
        p.poly([(x, 5 + up), (x + 2, 5 + up), (x + 1, 2 + up)], C['gold'])
    p.set(11, 3 + up, C['red']); p.set(15, 3 + up, C['blue']); p.set(19, 3 + up, C['green']); p.set(16, 7 + up, C['red'])
    p.outline(C['ol']); shadow(p, 16, 30.8, 9, 1.8)
    if f == 2:
        sparkle(p, 3, 6); sparkle(p, 28, 8, 'pink_hi')
    return p


def queen(f):
    p = Px(32, 32)
    up = -1 if f == 1 else (-3 if f == 2 else 0)
    # long lilac hair, flowing violet gown with gold trim
    p.ell(16, 12 + up, 8.4, 9, C['hair_sh']); p.rect(8, 12 + up, 3, 12, C['hair_sh']); p.rect(21, 12 + up, 3, 12, C['hair_sh'])
    p.poly([(11, 18 + up), (21, 18 + up), (26, 30), (6, 30)], C['purple_sh']); p.poly([(12, 18 + up), (20, 18 + up), (24, 29), (8, 29)], C['purple'])
    p.poly([(12, 18 + up), (16, 18 + up), (16, 29), (8, 29)], C['purple_hi'])
    p.rect(11, 22 + up, 10, 1, C['gold']); p.rect(8, 28, 16, 1, C['gold']); p.rect(15, 18 + up, 2, 4, C['gold_hi'])
    for x in (10, 14, 18, 21):
        p.set(x, 25, C['pink_hi'])
    p.rect(13, 29, 2, 2, C['pink']); p.rect(17, 29, 2, 2, C['pink'])
    p.ell(16, 11 + up, 6.2, 6.2, C['skin'])
    p.ell(16, 7 + up, 7, 3, C['hair_sh']); p.ell(16, 8 + up, 6.4, 2.4, C['hair'])
    for ex in (13, 18):
        p.rect(ex, 10 + up, 2, 3, EYE); p.set(ex, 10 + up, W)
    p.rect(11, 13 + up, 2, 1, C['blush']); p.rect(20, 13 + up, 2, 1, C['blush']); p.rect(15, 14 + up, 2, 1, C['mouth'])
    # tall tiara
    p.rect(11, 5 + up, 10, 2, C['gold']); p.rect(11, 5 + up, 10, 1, C['gold_hi'])
    for x, h in ((11, 2), (15, 4), (20, 2)):
        p.poly([(x, 5 + up), (x + 2, 5 + up), (x + 1, 5 - h + up)], C['gold'])
    p.set(16, 3 + up, C['pink']); p.set(12, 4 + up, C['blue']); p.set(20, 4 + up, C['teal'])
    # wand in hand
    wy = 17 + up - (3 if f == 2 else 0)
    p.line(24, 24 + up, 28, wy, C['wood']); _star_poly(p, 28, wy - 2, 3.4, 1.4, C['gold']); p.set(28, wy - 2, W)
    p.outline(C['ol']); shadow(p, 16, 30.8, 9, 1.8)
    if f == 2:
        sparkle(p, 3, 5, 'pink_hi'); sparkle(p, 29, 4)
    return p


# ---------------------------------------------------------------- Dapple: a golden-peach unicorn with a teal-violet mane
def dapple_recolor(im):
    mp = {rgb('#ffffff'): rgb('#ffe9c4'), mix('#ffffff', '#cdbfff', .6): rgb('#f5c98e'),
          C['pink']: rgb('#41d6c8'), C['purple']: rgb('#9b6bff'), C['blue']: rgb('#ff8fc4'), C['teal']: rgb('#6fe6ff'), C['green']: rgb('#c58bff'), C['yellow']: rgb('#7fe8c0'),
          mix('#ffffff', '#ffc7e6', .5): rgb('#ffd1b0')}
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y] in mp:
                px[x, y] = mp[px[x, y]]
    return im


# ---------------------------------------------------------------- wands
HEADS = ['star', 'moon', 'flower', 'heart', 'crystal', 'seashell']
COLORS = {  # base, highlight, shade
    'pink': ('#ff7ec3', '#ffb8e2', '#cf4f9f'), 'gold': ('#ffd93d', '#fff3a0', '#e59a1a'), 'blue': ('#3ea6ff', '#8fd8ff', '#2169dc'),
    'mint': ('#5be3b0', '#a8f5d8', '#2fae82'), 'lavender': ('#a06bff', '#c9a8ff', '#6f43c9'), 'red': ('#ff5a6e', '#ffa0ab', '#c93a58'),
    'pearl': ('#f1eafc', '#ffffff', '#c7b9e6'), 'rainbow': ('#ff7ec3', '#ffb8e2', '#cf4f9f'),
}
STRIPES = ['#ff5a6e', '#ff9a3c', '#ffe14d', '#5ccf59', '#3ea6ff', '#a06bff']


def _erase_ell(p, cx, cy, rx, ry):
    for y in range(p.h):
        for x in range(p.w):
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                p.p[y][x] = None


def wand_head(shape, color):
    b, h, s = (rgb(x) for x in COLORS[color])
    p = Px(24, 24)
    if shape == 'star':
        _star_poly(p, 12, 12.5, 11.5, 5, s); _star_poly(p, 12, 12, 10.5, 4.4, b); _star_poly(p, 11, 11, 6, 2.4, h)
    elif shape == 'moon':
        p.ell(12, 12, 10, 10, s); p.ell(12, 11.5, 9.4, 9.4, b); _erase_ell(p, 16.5, 10, 8, 8.2); p.ell(8.5, 8, 2.6, 3.4, h)
        _star_poly(p, 18, 16, 3.4, 1.4, h)
    elif shape == 'flower':
        for i in range(5):
            a = math.radians(-90 + i * 72); p.ell(12 + 6.5 * math.cos(a), 12 + 6.5 * math.sin(a), 4.2, 4.2, s)
        for i in range(5):
            a = math.radians(-90 + i * 72); p.ell(12 + 6.5 * math.cos(a), 12 + 6.2 * math.sin(a), 3.6, 3.6, b)
        p.ell(12, 12, 3.6, 3.6, rgb('#ffe14d')); p.ell(11.4, 11.4, 1.6, 1.6, rgb('#fff6b0'))
    elif shape == 'heart':
        r = 6
        for dy, col in ((0.6, s), (0, b)):
            p.ell(7.6, 8.6 + dy, 5.4, 5.2, col); p.ell(16.4, 8.6 + dy, 5.4, 5.2, col)
            p.poly([(2, int(10 + dy)), (22, int(10 + dy)), (12, int(22 + dy))], col)
        p.ell(7, 7, 2, 2.2, h)
    elif shape == 'crystal':
        p.poly([(12, 0), (20, 8), (17, 23), (7, 23), (4, 8)], s); p.poly([(12, 1), (19, 8), (16, 22), (8, 22), (5, 8)], b)
        p.poly([(12, 1), (12, 22), (8, 22), (5, 8)], h); p.line(5, 8, 19, 8, s); p.line(12, 1, 12, 22, s)
    else:  # seashell
        p.ell(12, 14, 10.5, 9, s); p.ell(12, 13.4, 9.8, 8.4, b)
        for i in range(5):
            a = math.radians(-150 + i * 30); p.line(12, 22, int(12 + 12 * math.cos(a)), int(22 + 15 * math.sin(a)), s)
        p.rect(9, 20, 6, 3, s); p.rect(10, 21, 4, 2, h); p.ell(8, 9, 2.4, 1.8, h)
    p.outline(C['ol'])
    if color == 'rainbow':  # paint the body in stripes
        for y in range(p.h):
            for x in range(p.w):
                if p.p[y][x] == rgb(COLORS[color][0]):
                    p.p[y][x] = rgb(STRIPES[((x + y) // 3) % 6])
    return p


def wand_shaft():
    p = Px(8, 40)
    p.rect(2, 0, 4, 40, rgb('#d9a066')); p.rect(2, 0, 1, 40, rgb('#f0c28a')); p.rect(5, 0, 1, 40, rgb('#a8693a'))
    for y in (4, 14, 24, 34):
        p.rect(1, y, 6, 2, C['gold']); p.rect(1, y, 6, 1, C['gold_hi'])
    p.outline(C['ol']); return p


def bolt(color):
    b, h, s = (rgb(x) for x in COLORS[color])
    p = Px(14, 14)
    p.ell(7, 7, 6.4, 6.4, mix(h, rgb('#ffffff'), .5)); p.ell(7, 7, 4.6, 4.6, h)
    _star_poly(p, 7, 7, 6.6, 2.7, b); _star_poly(p, 7, 7, 4.2, 1.6, W)
    p.set(1, 7, s); p.set(12, 7, s); p.set(7, 1, s); p.set(7, 12, s)
    if color == 'rainbow':
        for y in range(14):
            for x in range(14):
                if p.p[y][x] in (rgb(COLORS[color][0]),):
                    p.p[y][x] = rgb(STRIPES[(x + y) % 6])
    return p


def trail_star():
    p = Px(7, 7); p.set(3, 0, W); p.set(3, 6, W); p.set(0, 3, W); p.set(6, 3, W); p.rect(2, 2, 3, 3, W); return p


def trail_butterfly():
    p = Px(9, 7)
    p.ell(2.5, 2.5, 2.6, 2.4, C['pink']); p.ell(6.5, 2.5, 2.6, 2.4, C['purple_hi']); p.ell(2.5, 5, 1.8, 1.6, C['pink_hi']); p.ell(6.5, 5, 1.8, 1.6, C['lav'])
    p.rect(4, 1, 1, 6, C['ol']); return p


def trail_petal():
    p = Px(7, 7); p.ell(3.5, 3.5, 3.2, 2.1, C['pink_hi']); p.ell(3, 3, 1.8, 1.1, W); p.set(5, 3, C['pink']); return p


def trail_bubble():
    p = Px(8, 8); p.ell(4, 4, 3.8, 3.8, rgb('#bfe9ff')); p.ell(4, 4, 2.9, 2.9, rgb('#e8f8ff')); p.set(2, 2, W); p.set(3, 2, W); p.set(2, 3, W)
    p.outline(rgb('#7fd0ff')); return p


# ---------------------------------------------------------------- fireworks
def fw_spark():
    p = Px(5, 5); p.rect(1, 1, 3, 3, W); p.set(2, 0, W); p.set(2, 4, W); p.set(0, 2, W); p.set(4, 2, W); return p


def fw_rocket():
    p = Px(6, 14)
    p.rect(2, 3, 2, 8, C['red']); p.rect(2, 3, 1, 8, C['pink_hi']); p.poly([(2, 3), (4, 3), (3, 0)], C['gold']); p.rect(1, 9, 1, 3, C['blue']); p.rect(4, 9, 1, 3, C['blue'])
    p.set(2, 12, C['orange']); p.set(3, 12, C['yellow']); p.set(2, 13, C['yellow']); return p


def fw_shape(kind):
    p = Px(24, 24)
    if kind == 'star':
        _star_poly(p, 12, 12.5, 11, 4.6, C['gold_sh']); _star_poly(p, 12, 12, 10, 4, C['gold']); _star_poly(p, 11, 11, 5, 2, C['gold_hi'])
    elif kind == 'heart':
        for dy, col in ((0.6, C['pink_sh']), (0, C['pink'])):
            p.ell(7.6, 8.6 + dy, 5.4, 5.2, col); p.ell(16.4, 8.6 + dy, 5.4, 5.2, col); p.poly([(2, int(10 + dy)), (22, int(10 + dy)), (12, int(22 + dy))], col)
        p.ell(7, 7, 2, 2.2, C['pink_hi'])
    elif kind == 'flower':
        for i in range(6):
            a = math.radians(i * 60); p.ell(12 + 6.6 * math.cos(a), 12 + 6.6 * math.sin(a), 4, 4, C['purple_hi'])
        p.ell(12, 12, 3.8, 3.8, C['yellow'])
    elif kind == 'spiral':
        pts = []
        for i in range(60):
            a = i * 0.34; r = 1.2 + i * 0.17; pts.append((12 + r * math.cos(a), 12 + r * math.sin(a)))
        for x, y in pts:
            p.ell(x, y, 1.5, 1.5, C['blue']); p.set(int(x), int(y), C['blue_hi'])
    else:  # rainbow arcs
        for i, c in enumerate(['red', 'orange', 'yellow', 'green', 'blue', 'purple']):
            r = 11 - i * 1.5
            for a in range(180, 361, 3):
                p.set(int(round(12 + r * math.cos(math.radians(a)))), int(round(19 + r * math.sin(math.radians(a)))), C[c])
                p.set(int(round(12 + (r - .5) * math.cos(math.radians(a)))), int(round(19 + (r - .5) * math.sin(math.radians(a)))), C[c])
    p.outline(C['ol']); return p


def fw_mode(n):
    p = Px(36, 24)
    for i in range(n):
        x = 18 - (n - 1) * 7 + i * 14
        p.blit(fw_rocket().shift(0, 0), x - 3, 5 + (i % 2) * 2)
    return p


def fw_dais():
    p = Px(48, 28)
    p.ell(24, 21, 23, 6, C['stone_dk']); p.ell(24, 19, 22, 6, C['stone']); p.ell(24, 18, 20, 4.6, C['stone_hi'])
    p.rect(2, 19, 44, 6, C['stone']); p.rect(2, 19, 44, 1, C['stone_hi']); p.rect(2, 24, 44, 1, C['stone_sh'])
    _star_poly(p, 24, 16, 8, 3.4, C['gold']); _star_poly(p, 24, 16, 5, 2, C['gold_hi'])
    for x in (6, 12, 36, 42):
        p.rect(x, 12, 3, 8, C['stone_hi']); p.ell(x + 1.5, 12, 2.6, 2.6, C['pink_hi'])
    p.outline(C['ol']); return p


def fw_castle():
    p = Px(160, 72)
    d, d2 = rgb('#241a4a'), rgb('#33266a')
    p.rect(8, 40, 144, 32, d); p.rect(8, 40, 144, 2, d2)
    for x in range(8, 152, 8):
        p.rect(x, 36, 5, 5, d)
    for cx, h in ((20, 52), (140, 52), (80, 62), (50, 46), (110, 46)):
        p.rect(cx - 9, 72 - h, 18, h, d); p.rect(cx - 9, 72 - h, 18, 2, d2)
        p.poly([(cx - 11, 72 - h), (cx + 11, 72 - h), (cx, 72 - h - 16)], rgb('#3a2a7c'))
        p.set(cx, 72 - h - 17, C['gold'])
    p.rect(74, 52, 12, 20, rgb('#0f0a26'))
    for x, y in ((18, 30), (138, 30), (78, 14), (48, 38), (108, 38), (30, 50), (130, 50), (60, 50), (100, 50)):
        p.rect(x, y, 3, 5, C['gold_hi'])
    return p


# ---------------------------------------------------------------- workshop and meadow props, and the two bedroom rewards
def wand_bench():
    p = Px(32, 32)
    p.rect(6, 12, 20, 16, rgb('#7b3fa8')); p.rect(6, 12, 20, 2, rgb('#b36ae0')); p.rect(6, 26, 20, 2, rgb('#4f2a78'))
    p.rect(4, 8, 24, 6, C['red']); p.rect(4, 8, 24, 2, C['pink_hi']); p.rect(4, 13, 24, 1, C['red_sh'])             # velvet cushion
    p.line(9, 8, 22, 4, C['wood']); _star_poly(p, 23, 3, 3.6, 1.5, C['gold']); p.set(23, 3, W)
    p.rect(7, 28, 3, 3, C['gold']); p.rect(22, 28, 3, 3, C['gold'])
    for x, y in ((12, 18), (16, 21), (20, 17)):
        p.set(x, y, C['gold_hi'])
    p.outline(C['ol']); return p


def festival_garland():
    p = Px(32, 16)
    pts = [(1, 2), (6, 7), (11, 9), (16, 10), (21, 9), (26, 7), (31, 2)]
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        p.line(x0, y0, x1, y1, C['leaf'])
    for i, (x, y) in enumerate(pts[1:-1] + [(8, 8), (24, 8)]):
        _star_poly(p, x, y + 3, 3.6, 1.6, [C['gold'], C['pink'], C['blue_hi'], C['purple_hi'], C['yellow']][i % 5]); p.set(x, y + 3, W)
    p.outline(C['ol']); return p


def meadow_cushion():
    p = Px(16, 16)
    p.ell(8, 10, 7.4, 4.8, C['purple_sh']); p.ell(8, 9, 7.2, 4.6, C['purple_hi']); p.ell(8, 8, 5.6, 3, C['lav'])
    for i in range(5):
        a = math.radians(-90 + i * 72); p.ell(8 + 2.6 * math.cos(a), 8 + 1.6 * math.sin(a), 1.6, 1.4, C['pink_hi'])
    p.set(8, 8, C['yellow']); p.rect(7, 7, 2, 2, C['yellow'])
    p.outline(C['ol']); return p


def fx_heart():
    p = Px(12, 11)
    p.ell(3.5, 3.5, 3.2, 3, C['pink']); p.ell(8.5, 3.5, 3.2, 3, C['pink']); p.poly([(0, 4), (12, 4), (6, 11)], C['pink']); p.set(3, 2, C['pink_hi']); p.set(2, 3, C['pink_hi'])
    p.outline(C['ol']); return p


NPCS = {'king': (32, 32, king), 'queen': (32, 32, queen)}
IMAGES = [('fw_spark', fw_spark), ('fw_rocket', fw_rocket), ('fw_dais', fw_dais), ('fw_castle', fw_castle), ('wand_bench', wand_bench),
          ('festival_garland', festival_garland), ('meadow_cushion', meadow_cushion), ('fx_heart', fx_heart), ('wand_shaft', wand_shaft),
          ('trail_star', trail_star), ('trail_butterfly', trail_butterfly), ('trail_petal', trail_petal), ('trail_bubble', trail_bubble)] \
    + [(f'fw_shape_{k}', (lambda k=k: fw_shape(k))) for k in ('star', 'heart', 'flower', 'spiral', 'rainbow')] \
    + [(f'fw_mode_{n}', (lambda n=n: fw_mode(n))) for n in (1, 2, 3)] \
    + [(f'wand_{h}_{c}', (lambda h=h, c=c: wand_head(h, c))) for h in HEADS for c in COLORS] \
    + [(f'bolt_{c}', (lambda c=c: bolt(c))) for c in COLORS]
