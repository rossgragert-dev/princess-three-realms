"""Items (16x16), props (various), and picture-only UI icons (32x32)."""
import math
from pxlib import Px, C, rgb, mix, P, rng
from art_chars import sparkle, EYE, shadow

# ------------------------------------------------------------------ 16x16 items
ITEMS = []  # (name, Px)


def item(name):
    def deco(fn):
        ITEMS.append((name, fn))
        return fn
    return deco


def _star_poly(p, cx, cy, ro, ri, col):
    pts = []
    for i in range(10):
        a = math.radians(-90 + i * 36)
        r = ro if i % 2 == 0 else ri
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    p.poly([(int(round(x)), int(round(y))) for x, y in pts], col)


@item('carrot')
def _():
    p = Px(16, 16)
    p.poly([(4, 6), (12, 6), (8, 15)], C['orange']); p.ell(8, 6, 4, 2, C['orange']); p.poly([(4, 6), (8, 6), (7, 11)], C['yellow'])
    p.rect(7, 9, 1, 1, C['orange_sh']); p.rect(9, 8, 2, 1, C['orange_sh']); p.rect(8, 12, 1, 1, C['orange_sh'])
    for dx in (-2, 0, 2):
        p.ell(8 + dx, 3, 1.4, 3, C['green'] if dx else C['green_hi'])
    p.outline(); return p


@item('carrot_top')
def _():
    p = Px(16, 16)
    for dx in (-3, 0, 3):
        p.ell(8 + dx, 7, 1.8, 4.2, C['green'] if dx else C['green_hi'])
    p.ell(8, 12, 5, 2.4, rgb('#8a5a35')); p.rect(3, 12, 10, 2, rgb('#6f4326')); p.set(7, 10, C['orange'])
    p.outline(); return p


@item('starfish')
def _():
    p = Px(16, 16)
    _star_poly(p, 8, 8.5, 7.5, 3.4, C['orange'])
    for x, y in ((8, 5), (8, 8), (5, 9), (11, 9), (7, 11), (9, 11)):
        p.set(x, y, C['yellow'])
    p.set(7, 7, C['white']); p.outline(); return p


@item('pearl')
def _():
    p = Px(16, 16)
    p.ell(8, 8, 5.4, 5.4, mix('#ffffff', '#f5d0ff', .35)); p.ell(7, 6.5, 2.4, 2, C['white']); p.set(10, 10, C['pink_hi'])
    p.rect(6, 6, 2, 1, C['white']); p.outline(); return p


@item('star')
def _():
    p = Px(16, 16)
    _star_poly(p, 8, 8.5, 7.5, 3.6, C['gold']); p.ell(7, 7, 1.6, 1.6, C['gold_hi']); p.set(9, 10, C['gold_sh']); p.set(10, 8, C['gold_sh'])
    p.outline(); return p


@item('chest')
def _():
    p = Px(16, 16)
    p.rect(2, 8, 12, 6, C['brown']); p.rect(2, 8, 12, 1, C['brown_hi']); p.rect(2, 13, 12, 1, C['brown_sh'])
    p.ell(8, 7, 6, 4, C['brown_hi']); p.rect(2, 7, 12, 2, C['brown']); p.rect(2, 7, 12, 1, C['gold'])
    p.rect(7, 8, 2, 4, C['gold']); p.set(7, 10, C['gold_sh']); p.rect(2, 10, 12, 1, C['gold']); p.outline(); return p


@item('chest_open')
def _():
    p = Px(16, 16)
    p.rect(2, 9, 12, 5, C['brown']); p.rect(2, 9, 12, 1, C['gold']); p.rect(3, 4, 10, 4, C['brown_hi']); p.rect(3, 4, 10, 1, C['gold'])
    p.rect(3, 8, 10, 1, C['pink']); sparkle(p, 8, 7); p.set(5, 8, C['gold_hi']); p.set(11, 8, C['gold_hi'])
    p.outline(); return p


@item('shell')
def _():
    p = Px(16, 16)
    p.poly([(2, 12), (8, 2), (14, 12)], C['pink_hi']); p.ell(8, 11, 6, 3, C['pink_hi'])
    for x in (4, 6, 8, 10, 12):
        p.line(8, 12, x, 5 + abs(x - 8) // 2, C['pink'])
    p.rect(6, 12, 4, 2, C['pink_sh']); p.outline(); return p


@item('ball')
def _():
    p = Px(16, 16)
    p.ell(8, 8, 6, 6, C['red']); p.poly([(3, 8), (13, 8), (12, 12), (4, 12)], C['yellow'])
    p.rect(2, 7, 12, 2, C['white']); p.ell(6, 5, 2, 1.5, C['pink_hi']); p.set(5, 4, C['white']); p.outline(); return p


@item('cat')
def _():
    p = Px(16, 16)
    p.poly([(2, 8), (3, 1), (7, 5)], C['orange']); p.poly([(14, 8), (13, 1), (9, 5)], C['orange'])
    p.set(3, 3, C['pink']); p.set(12, 3, C['pink'])
    p.ell(8, 9, 6.4, 5.6, C['orange']); p.ell(8, 11, 3, 2, C['cream'])
    for x in (5, 10):
        p.rect(x, 7, 2, 3, EYE); p.set(x, 7, C['white'])
    p.set(8, 10, C['pink_sh']); p.set(7, 11, C['mouth']); p.set(9, 11, C['mouth'])
    p.line(1, 9, 3, 9, C['white']); p.line(13, 9, 15, 9, C['white']); p.outline(); return p


@item('sun')
def _():
    p = Px(16, 16)
    for a in range(0, 360, 45):
        x, y = 8 + 7 * math.cos(math.radians(a)), 8 + 7 * math.sin(math.radians(a))
        p.ell(x, y, 1.4, 1.4, C['gold'])
    p.ell(8, 8, 4.6, 4.6, C['yellow']); p.ell(7, 7, 2, 2, C['gold_hi']); p.set(7, 9, C['orange']); p.set(10, 9, C['orange']); p.set(8, 10, C['mouth'])
    p.outline(); return p


@item('hat')
def _():
    p = Px(16, 16)
    p.ell(8, 11, 7, 2.4, C['purple']); p.poly([(4, 11), (6, 2), (11, 2), (12, 11)], C['purple'])
    p.rect(4, 8, 8, 2, C['pink']); p.ell(7, 4, 1.5, 1, C['purple_hi']); p.set(9, 9, C['gold']); p.outline(); return p


@item('fish')
def _():
    p = Px(16, 16)
    p.ell(7, 8, 5.4, 4, C['blue']); p.poly([(11, 8), (15, 3), (15, 13)], C['blue_hi'])
    p.ell(6, 9, 3.4, 1.8, C['blue_hi']); p.rect(4, 6, 2, 2, C['white']); p.set(4, 7, EYE); p.set(8, 5, C['blue_sh']); p.set(8, 11, C['blue_sh'])
    p.outline(); return p


@item('seed')
def _():
    p = Px(16, 16)
    p.ell(8, 9, 3.4, 4.6, C['brown_hi']); p.ell(7, 7.5, 1.4, 1.8, C['wood']); p.set(9, 11, C['brown_sh']); p.line(8, 5, 8, 3, C['brown']); p.outline(); return p


@item('water')
def _():
    p = Px(16, 16)
    p.poly([(8, 1), (13, 9), (3, 9)], C['blue']); p.ell(8, 10, 5, 4.4, C['blue']); p.ell(6.5, 9, 1.6, 2.4, C['blue_hi']); p.set(6, 7, C['white'])
    p.outline(); return p


@item('flower')
def _():
    p = Px(16, 16)
    for a in range(0, 360, 72):
        p.ell(8 + 4 * math.cos(math.radians(a - 90)), 6 + 4 * math.sin(math.radians(a - 90)), 2.6, 2.6, C['pink'])
    p.ell(8, 6, 2.3, 2.3, C['gold']); p.rect(8, 10, 1, 5, C['green']); p.ell(11, 13, 2, 1, C['green_hi']); p.outline(); return p


@item('tile_red')
def _():
    p = Px(16, 16)
    p.rect(1, 1, 14, 14, C['red']); p.rect(1, 1, 14, 3, rgb('#ff93a0')); p.rect(1, 12, 14, 3, C['red_sh']); p.ell(8, 8, 3, 3, rgb('#ffc0c8'))
    p.outline(); return p


@item('tile_blue')
def _():
    p = Px(16, 16)
    p.rect(1, 1, 14, 14, C['blue']); p.rect(1, 1, 14, 3, C['blue_hi']); p.rect(1, 12, 14, 3, C['blue_sh']); p.ell(8, 8, 3, 3, rgb('#cdeeff'))
    p.outline(); return p


@item('bubble')
def _():
    p = Px(16, 16)
    p.ell(8, 8, 6, 6, mix('#bfeaff', '#ffffff', .2)); p.ell(8, 8, 4.2, 4.2, rgb('#8fd8ff')); p.rect(5, 5, 2, 2, C['white']); p.set(10, 10, C['white'])
    p.outline(C['blue_sh']); return p


for _i in range(4):
    def _mk(i=_i):
        p = Px(16, 16)
        r = 2 + (i % 2) * 2 + (1 if i == 1 else 0)
        for dx, dy in ((0, 0),) + tuple((d * k, e * k) for d, e in ((1, 0), (-1, 0), (0, 1), (0, -1)) for k in range(1, r + 1)):
            p.set(8 + dx, 8 + dy, C['gold_hi'] if abs(dx) + abs(dy) > 1 else C['white'])
        if i % 2:
            for dx, dy in ((2, 2), (-2, 2), (2, -2), (-2, -2)):
                p.set(8 + dx, 8 + dy, C['pink_hi'])
        return p
    ITEMS.append((f'sparkle{_i}', _mk))


@item('heart')
def _():
    p = Px(16, 16)
    p.ell(5, 6, 3.4, 3.2, C['pink']); p.ell(11, 6, 3.4, 3.2, C['pink']); p.poly([(2, 7), (14, 7), (8, 14)], C['pink']); p.set(4, 5, C['pink_hi'])
    p.outline(); return p


@item('mushroom')
def _():
    p = Px(16, 16)
    p.rect(6, 9, 4, 5, C['cream']); p.ell(8, 8, 6, 4, C['red']); p.set(5, 7, C['white']); p.set(9, 6, C['white']); p.set(11, 8, C['white'])
    p.outline(); return p


@item('bloom0')
def _():
    p = Px(16, 16)
    p.ell(8, 11, 5, 3, C['green_sh']); p.ell(8, 9, 2.2, 3.4, C['green']); p.set(8, 7, C['green_hi']); p.outline(); return p


@item('bloom1')
def _():
    p = Px(16, 16)
    p.ell(8, 11, 5, 3, C['green_sh']); p.line(8, 12, 8, 7, C['green_dk'])
    p.ell(8, 6, 3.2, 3.2, C['pink_hi']); p.ell(8, 6, 1.4, 1.4, C['gold']); p.outline(); return p


@item('bloom2')
def _():
    p = Px(16, 16)
    p.ell(8, 12, 6, 2.5, C['green_sh']); p.line(8, 13, 8, 7, C['green_dk'])
    cols = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
    for i, c in enumerate(cols):
        a = math.radians(-90 + i * 60)
        p.ell(8 + 3.8 * math.cos(a), 6 + 3.8 * math.sin(a), 2.3, 2.3, C[c])
    p.ell(8, 6, 2, 2, C['white']); p.outline(); return p


# ------------------------------------------------------------------ props (own PNGs / small sheets)
def tree(kind):
    p = Px(32, 48)
    p.rect(13, 30, 6, 16, C['brown']); p.rect(13, 30, 2, 16, C['brown_hi']); p.rect(17, 30, 2, 16, C['brown_sh'])
    p.poly([(9, 46), (13, 40), (13, 46)], C['brown']); p.poly([(23, 46), (19, 40), (19, 46)], C['brown_sh'])
    r = rng(3 if kind == 'a' else 4)
    for cx, cy, rr in ((16, 14, 13), (7, 22, 8), (25, 22, 8), (16, 25, 9), (9, 12, 7), (23, 12, 7)):
        p.ell(cx, cy, rr, rr * .92, C['leaf'] if kind == 'a' else mix('#2f9a4a', '#3ba84a', .4))
    for cx, cy, rr in ((12, 9, 5), (21, 15, 4), (8, 19, 3.4), (18, 6, 3)):
        p.ell(cx, cy, rr, rr * .9, C['leaf_hi'])
    if kind == 'b':
        for _ in range(16):
            x, y = r.randrange(4, 28), r.randrange(4, 30)
            p.set(x, y, C['pink_hi']); p.set(x + 1, y, C['pink']); p.set(x, y + 1, C['white'])
    else:
        for x, y in ((9, 18), (22, 11), (15, 22)):
            p.ell(x, y, 1.5, 1.5, C['red']); p.set(x, y - 1, C['pink_hi'])
    p.outline(); shadow(p, 16, 46, 11, 2)
    return p


def bush():
    p = Px(16, 16)
    p.ell(8, 10, 7, 5, C['leaf']); p.ell(6, 8, 4, 3.4, C['green']); p.ell(11, 9, 3.4, 3, C['green_hi']); p.set(5, 7, C['pink_hi']); p.set(10, 12, C['white'])
    p.outline(); return p


def fountain(f):
    p = Px(48, 48)
    p.ell(24, 36, 22, 10, C['stone_dk']); p.ell(24, 35, 21, 9, C['stone_hi']); p.ell(24, 36, 17, 7, C['water'])
    p.ell(24, 36, 17, 7, C['water'])
    for i in range(6):
        x = 12 + (i * 7 + f * 3) % 24
        p.set(x, 34 + (i % 3), C['water_hi'])
    p.rect(22, 16, 4, 20, C['stone']); p.rect(22, 16, 1, 20, C['stone_hi']); p.ell(24, 26, 8, 3, C['stone_hi']); p.ell(24, 27, 6, 2, C['water'])
    p.ell(24, 14, 4.5, 3.5, C['stone_hi'])
    for k, dx in enumerate((-9, -5, 5, 9)):  # arcing droplets
        yy = 22 + ((k + f) % 2) * 2
        p.set(24 + dx, yy, C['water_hi']); p.set(24 + dx // 2, yy - 4 - (f % 2), C['water_hi'])
    p.rect(23, 5 - (f % 2), 2, 9, C['water_hi']); p.set(23, 4 - (f % 2), C['white']); p.set(24, 3, C['white'])
    p.outline(); return p


def castle_gate():
    p = Px(48, 48)
    p.rect(0, 0, 48, 48, C['cream']); p.rect(0, 0, 48, 2, C['stone_hi']); p.rect(0, 46, 48, 2, C['stone_dk'])
    for y in range(4, 46, 6):
        p.rect(0, y, 48, 1, C['stone_sh'])
    p.rect(8, 14, 32, 34, C['gold_sh']); p.ell(24, 18, 16, 12, C['gold_sh']); p.rect(8, 18, 32, 30, C['gold_sh'])
    p.ell(24, 19, 14, 11, C['brown']); p.rect(10, 19, 28, 29, C['brown'])
    p.rect(23, 8, 2, 40, C['brown_sh']); p.rect(10, 30, 28, 1, C['brown_sh']);
    for x in (14, 19, 29, 34):
        p.rect(x, 22, 1, 24, C['brown_hi'])
    p.rect(20, 32, 3, 3, C['gold']); p.rect(25, 32, 3, 3, C['gold'])
    _star_poly(p, 24, 12, 4, 2, C['gold']); p.set(24, 12, C['white'])
    p.outline(); return p


def door_small():
    p = Px(16, 32)
    p.ell(8, 10, 7, 8, C['gold_sh']); p.rect(1, 10, 14, 22, C['gold_sh'])
    p.ell(8, 11, 6, 7, C['purple']); p.rect(2, 11, 12, 21, C['purple']); p.rect(2, 11, 3, 21, C['purple_hi']); p.rect(7, 4, 1, 28, C['purple_sh'])
    _star_poly(p, 8, 14, 3, 1.5, C['gold']); p.set(12, 22, C['gold']); p.set(12, 23, C['gold'])
    p.outline(); return p


def bed():
    p = Px(48, 32)
    p.rect(2, 4, 44, 5, C['pink_sh']); p.rect(2, 4, 44, 2, C['pink'])
    p.rect(3, 9, 42, 18, C['cream']); p.rect(3, 9, 42, 2, C['white'])
    p.rect(3, 15, 42, 12, C['purple_hi']); p.rect(3, 15, 42, 2, C['purple']); p.rect(3, 26, 42, 2, C['purple_sh'])
    for x in range(6, 44, 8):
        _star_poly(p, x, 21, 2.4, 1.2, C['gold_hi'])
    p.ell(11, 12, 7, 3.5, C['white']); p.ell(11, 12, 5, 2, C['pink_hi']); p.ell(35, 12, 7, 3.5, C['white']); p.ell(35, 12, 5, 2, C['pink_hi'])
    p.rect(4, 26, 3, 5, C['brown']); p.rect(41, 26, 3, 5, C['brown'])
    p.outline(); return p


def lamp(lit):
    p = Px(16, 32)
    p.rect(7, 12, 2, 16, C['gold_sh']); p.ell(8, 29, 6, 2.6, C['gold']); p.ell(8, 28.5, 4, 1.4, C['gold_hi'])
    col = C['gold_hi'] if lit else rgb('#c9c3e0')
    if lit:
        p.ell(8, 8, 8, 8, (255, 240, 160, 130))
    _star_poly(p, 8, 8, 6.4, 3, col)
    if lit:
        p.ell(8, 8, 2, 2, C['white'])
    p.outline(); return p


def rug():
    p = Px(48, 24)
    cols = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
    for i, c in enumerate(cols):
        p.ell(24, 12, 23 - i * 3.6, 11.5 - i * 1.8, C[c])
    p.ell(24, 12, 4, 2, C['white']); p.set(10, 6, C['white']); p.set(36, 17, C['white'])
    p.outline(); return p


def mobile():
    p = Px(32, 32)
    p.rect(4, 0, 24, 2, C['gold_sh']); p.rect(4, 0, 24, 1, C['gold'])
    for x, col in ((6, 'pink_hi'), (16, 'blue_hi'), (26, 'purple_hi')):
        p.rect(x, 2, 1, 12, C['cream_sh'])
        p.poly([(x - 5, 22), (x, 14), (x + 5, 22)], C[col]); p.ell(x, 22, 5, 3, C[col])
        p.rect(x - 3, 21, 6, 1, C['white'])
    p.outline(); return p


def vase():
    p = Px(16, 24)
    p.rect(7, 4, 2, 7, C['green']); p.ell(8, 4, 3, 3, C['pink']); p.ell(4, 7, 2, 2, C['gold']); p.ell(12, 7, 2, 2, C['blue_hi']); p.set(8, 4, C['gold_hi'])
    p.ell(8, 17, 5.4, 6, C['blue']); p.rect(5, 10, 6, 3, C['blue']); p.ell(8, 17, 3, 3.6, C['blue_hi']); p.set(6, 15, C['white'])
    p.outline(); return p


# ------------------------------------------------------------------ bedroom decor rewards (v0.2)
def bunny_pillow():
    p = Px(22, 24)
    p.ell(6.5, 6, 2.6, 6, C['white']); p.ell(15.5, 6, 2.6, 6, C['white'])
    p.ell(6.5, 6.5, 1.2, 4, C['pink_hi']); p.ell(15.5, 6.5, 1.2, 4, C['pink_hi'])
    p.rect(2, 11, 18, 11, C['pink']); p.rect(2, 11, 18, 2, C['pink_hi']); p.rect(2, 20, 18, 2, C['pink_sh'])
    p.ell(11, 15, 8, 6.5, C['white']); p.ell(11, 18, 7, 3, C['cream_sh']); p.ell(11, 14.5, 7, 5, C['white'])
    p.rect(7, 13, 2, 2, C['ol']); p.rect(13, 13, 2, 2, C['ol']); p.set(7, 13, C['white']); p.set(13, 13, C['white'])
    p.rect(10, 16, 2, 1, C['blush']); p.set(10, 17, C['mouth']); p.set(11, 17, C['mouth'])
    p.ell(5, 16, 1.6, 1.2, C['blush']); p.ell(17, 16, 1.6, 1.2, C['blush'])
    p.outline(); return p


def unicorn_plush():
    p = Px(24, 26)
    p.rect(3, 15, 18, 9, C['white']); p.ell(12, 19, 9, 6, C['white']); p.ell(12, 21, 8, 3, C['cream_sh'])
    p.ell(12, 12, 8, 7, C['white']); p.ell(7.5, 8, 2.4, 2.2, C['pink_hi']); p.ell(16.5, 8, 2.4, 2.2, C['white'])
    p.poly([(11, 2), (13, 2), (12, -1 + 1)], C['gold']); p.poly([(10, 6), (14, 6), (12, 0)], C['gold']); p.set(12, 1, C['gold_hi'])
    p.ell(6, 10, 3, 5, C['pink']); p.ell(5.5, 12, 2, 4, C['purple_hi']); p.ell(7, 8, 2, 3, C['pink_hi'])
    p.rect(9, 11, 2, 2, C['ol']); p.rect(14, 11, 2, 2, C['ol']); p.set(9, 11, C['white']); p.set(14, 11, C['white'])
    p.ell(12, 15, 2.6, 1.6, C['pink_hi']); p.set(11, 15, C['pink_sh']); p.set(13, 15, C['pink_sh'])
    p.ell(7, 14, 1.6, 1.2, C['blush']); p.ell(17, 14, 1.6, 1.2, C['blush'])
    p.rect(5, 22, 4, 2, C['pink_sh']); p.rect(15, 22, 4, 2, C['pink_sh'])
    p.outline(); return p


def shell_mirror():
    p = Px(22, 26)
    for i, col in enumerate(['pink_sh', 'pink', 'pink_hi']):
        p.ell(11, 13, 10 - i * 1.4, 12 - i * 1.6, C[col])
    for x in (3, 6, 9, 13, 16, 19):
        p.line(11, 24, x, 2, C['pink_sh'])
    p.ell(11, 12.5, 6.5, 8, C['gold'])
    p.ell(11, 12.5, 5, 6.6, rgb('#bfeaff')); p.ell(11, 11, 3.5, 4.5, rgb('#e6f8ff'))
    p.line(7, 8, 9, 6, C['white']); p.line(7, 10, 8, 9, C['white'])
    p.rect(8, 22, 6, 3, C['gold']); p.rect(8, 22, 6, 1, C['gold_hi'])
    p.outline(); return p


def _frame(p, w, h):
    p.rect(0, 0, w, h, C['gold_sh']); p.rect(1, 1, w - 2, h - 2, C['gold']); p.rect(1, 1, w - 2, 1, C['gold_hi'])
    p.rect(3, 3, w - 6, h - 6, C['gold_sh'])


def mermaid_art():
    p = Px(26, 24)
    _frame(p, 26, 24)
    p.rect(4, 4, 18, 16, rgb('#3ea6ff')); p.rect(4, 4, 18, 6, rgb('#8fd8ff')); p.rect(4, 10, 18, 2, rgb('#2169dc'))
    for x, y in ((6, 6), (18, 8)):
        p.set(x, y, C['white'])
    p.ell(12, 11, 2.2, 2.4, C['skin']); p.ell(10.5, 10.5, 2, 2.6, C['hair']); p.ell(14, 10, 1.6, 2.4, C['hair'])
    p.rect(11, 13, 3, 3, C['skin_sh']); p.rect(11, 13, 3, 1, C['teal'])
    p.poly([(11, 15), (14, 15), (13, 19), (12, 19)], C['teal']); p.poly([(12, 18), (8, 20), (10, 17)], C['teal_hi']); p.poly([(13, 18), (17, 20), (15, 17)], C['teal_hi'])
    p.set(5, 18, C['sand']); p.set(6, 19, C['sand']); p.set(19, 19, C['pink_hi']); p.set(20, 18, C['pink'])
    p.outline(); return p


def butterfly_painting():
    p = Px(26, 24)
    _frame(p, 26, 24)
    p.rect(4, 4, 18, 16, C['cream']); p.rect(4, 4, 18, 3, C['pink_hi']); p.rect(4, 17, 18, 3, C['green_hi'])
    p.ell(9.5, 10.5, 4, 3.6, C['purple']); p.ell(16.5, 10.5, 4, 3.6, C['purple']); p.ell(10, 15, 3, 2.6, C['pink']); p.ell(16, 15, 3, 2.6, C['pink'])
    p.ell(9, 10, 1.6, 1.4, C['purple_hi']); p.ell(17, 10, 1.6, 1.4, C['purple_hi']); p.set(8, 13, C['white']); p.set(18, 13, C['white'])
    p.rect(12, 8, 2, 10, C['ol']); p.line(12, 8, 10, 5, C['ol']); p.line(13, 8, 15, 5, C['ol'])
    p.outline(); return p


def canopy_bed():
    p = Px(50, 50)
    o = 18  # the bed sits in the lower 32 rows, same footprint as the plain bed
    p.rect(2, o + 4, 44, 5, C['purple_sh']); p.rect(2, o + 4, 44, 2, C['purple'])
    p.rect(3, o + 9, 42, 18, C['cream']); p.rect(3, o + 9, 42, 2, C['white'])
    p.rect(3, o + 15, 42, 12, C['blue_hi']); p.rect(3, o + 15, 42, 2, C['blue']); p.rect(3, o + 26, 42, 2, C['blue_sh'])
    for x in range(6, 44, 8):
        _star_poly(p, x, o + 21, 2.4, 1.2, C['gold_hi'])
    p.ell(11, o + 12, 7, 3.5, C['white']); p.ell(11, o + 12, 5, 2, C['pink_hi']); p.ell(35, o + 12, 7, 3.5, C['white']); p.ell(35, o + 12, 5, 2, C['pink_hi'])
    p.rect(4, o + 26, 3, 5, C['brown']); p.rect(41, o + 26, 3, 5, C['brown'])
    # posts, top rail and soft pink drapes
    p.rect(1, 2, 3, o + 28, C['gold_sh']); p.rect(1, 2, 1, o + 28, C['gold']); p.rect(45, 2, 3, o + 28, C['gold_sh']); p.rect(45, 2, 1, o + 28, C['gold'])
    p.ell(2.5, 2, 2.4, 2.4, C['gold_hi']); p.ell(46.5, 2, 2.4, 2.4, C['gold_hi'])
    p.rect(1, 3, 47, 3, C['pink']); p.rect(1, 3, 47, 1, C['pink_hi'])
    for x in range(1, 48, 4):
        p.ell(x + 2, 7, 2.4, 2.2, C['pink_hi'])
    p.poly([(4, 6), (13, 6), (10, 24), (4, 28)], C['pink_hi']); p.poly([(4, 6), (8, 6), (6, 26), (4, 28)], C['pink'])
    p.poly([(36, 6), (45, 6), (45, 28), (39, 24)], C['pink_hi']); p.poly([(41, 6), (45, 6), (45, 28), (43, 26)], C['pink'])
    for x, y in ((26, 3), (16, 4), (34, 4)):
        _star_poly(p, x, y + 1, 2.2, 1.1, C['gold_hi'])
    p.outline(); return p


def moon_curtain():
    p = Px(44, 36)
    p.rect(0, 0, 44, 3, C['gold_sh']); p.rect(0, 0, 44, 1, C['gold']); p.ell(2, 1.5, 2.2, 2.2, C['gold_hi']); p.ell(42, 1.5, 2.2, 2.2, C['gold_hi'])
    navy, navy_hi, navy_sh = rgb('#3a3aa0'), rgb('#5a52c8'), rgb('#2a2a7a')
    for x0, flip in ((1, 1), (43, -1)):
        pts = [(x0, 3), (x0 + flip * 12, 3), (x0 + flip * 9, 22), (x0 + flip * 14, 35), (x0, 35)]
        p.poly(pts, navy)
        for k in range(1, 5):
            xx = x0 + flip * (k * 2.4)
            p.line(int(xx), 4, int(xx - flip * 1), 34, navy_hi if k % 2 else navy_sh)
        p.rect(min(x0, x0 + flip * 10), 21, 11, 2, C['gold'])  # tie-back
    for cx, cy in ((6, 12), (38, 12)):
        p.ell(cx, cy, 3.2, 3.2, C['gold_hi']); p.ell(cx + 1.6, cy - 0.8, 2.6, 2.8, navy)
    p.set(12, 28, C['gold_hi']); p.set(32, 28, C['gold_hi']); p.set(9, 7, C['white']); p.set(35, 8, C['white'])
    p.outline(); return p


def crystal_nightstand():
    p = Px(22, 28)
    p.poly([(11, 0), (16, 5), (11, 13), (6, 5)], rgb('#8fd8ff')); p.poly([(11, 0), (16, 5), (11, 5)], rgb('#e6f8ff')); p.poly([(11, 5), (16, 5), (11, 13)], C['blue'])
    p.poly([(6, 5), (11, 5), (11, 13)], C['teal_hi']); p.set(9, 4, C['white']); p.set(10, 3, C['white'])
    p.poly([(3, 9), (6, 9), (4, 14), (2, 14)], C['purple_hi']); p.poly([(17, 10), (20, 10), (19, 14), (16, 14)], C['pink_hi'])
    p.rect(1, 14, 20, 3, C['purple_hi']); p.rect(1, 14, 20, 1, C['white'])
    p.rect(2, 17, 18, 9, C['purple']); p.rect(2, 17, 18, 1, C['purple_sh'])
    p.rect(4, 19, 14, 3, C['purple_hi']); p.rect(9, 20, 4, 1, C['gold'])
    p.rect(4, 23, 14, 2, C['purple_sh'])
    p.rect(2, 26, 3, 2, C['gold_sh']); p.rect(17, 26, 3, 2, C['gold_sh'])
    p.outline(); return p


def decor_chest():
    p = Px(22, 18)
    p.ell(11, 4, 10, 4.2, C['brown']); p.rect(1, 4, 20, 4, C['brown']); p.rect(2, 3, 18, 1, C['brown_hi'])
    p.rect(1, 8, 20, 9, C['brown_hi']); p.rect(1, 14, 20, 3, C['brown'])
    p.rect(1, 7, 20, 2, C['gold']); p.rect(5, 1, 2, 16, C['gold_sh']); p.rect(15, 1, 2, 16, C['gold_sh'])
    p.rect(9, 7, 4, 5, C['gold_hi']); p.rect(10, 9, 2, 2, C['ol']); p.set(8, 10, C['gold'])
    p.set(3, 12, C['gold']); p.set(18, 12, C['gold'])
    p.outline(); return p


def shelf():
    p = Px(34, 12)
    p.rect(0, 0, 34, 4, C['wood']); p.rect(0, 0, 34, 1, C['brown_hi']); p.rect(0, 3, 34, 1, C['wood_sh'])
    p.rect(4, 4, 3, 5, C['wood_sh']); p.rect(27, 4, 3, 5, C['wood_sh']); p.poly([(4, 9), (7, 9), (7, 5)], C['wood_sh']); p.poly([(27, 9), (30, 9), (27, 5)], C['wood_sh'])
    p.outline(); return p


def window_night():
    p = Px(32, 32)
    p.rect(0, 0, 32, 32, C['gold_sh']); p.rect(2, 2, 28, 28, rgb('#2a2a7a')); p.rect(2, 2, 28, 10, rgb('#3a3aa0'))
    p.rect(15, 2, 2, 28, C['gold_sh']); p.rect(2, 15, 28, 2, C['gold_sh'])
    for x, y in ((6, 5), (22, 8), (9, 22), (25, 24), (20, 20)):
        p.set(x, y, C['white']); p.set(x + 1, y, C['gold_hi'])
    p.ell(8, 10, 3.5, 3.5, C['gold_hi']); p.ell(9.5, 9, 3, 3, rgb('#3a3aa0'))
    p.outline(); return p


def ribbon(bright):
    p = Px(128, 16)
    cols = ['#ff5a6e', '#ff9a3c', '#ffe14d', '#5ccf59', '#3ea6ff', '#a06bff']
    for x in range(128):
        t = x / 127
        y0 = int(2 + 8 * math.sin(math.pi * t) * 0.0 + 4 * (1 - math.sin(math.pi * t)))
        for i, c in enumerate(cols):
            y = y0 + i * 1
            col = rgb(c) if bright else mix(rgb(c), rgb('#d9d2ee'), .78)
            p.set(x, y + i, col); p.set(x, y + i + 1, col)
    if bright:
        for x in range(6, 128, 17):
            sparkle(p, x, 6 + (x % 3))
    return p


def pedestal(state):
    p = Px(32, 32)
    p.rect(6, 22, 20, 8, C['stone_dk']); p.rect(6, 22, 20, 2, C['stone']); p.rect(10, 12, 12, 12, C['stone']); p.rect(10, 12, 3, 12, C['stone_hi'])
    p.ell(16, 12, 9, 3.6, C['stone_hi']); p.ell(16, 12, 6.4, 2.4, C['purple'] if state == 0 else C['gold_hi'])
    if state == 0:
        for x, y in ((12, 11), (20, 12)):
            p.set(x, y, C['purple_hi'])
    elif state == 1:
        p.ell(16, 6, 8, 6, (255, 240, 160, 110)); _star_poly(p, 16, 6, 5, 2.4, C['gold']); p.set(16, 6, C['white'])
        sparkle(p, 6, 8); sparkle(p, 26, 5, 'pink_hi')
    else:
        sparkle(p, 8, 7, 'pink_hi'); sparkle(p, 24, 8)
    p.outline(); return p


def shell_socket(filled):
    p = Px(16, 16)
    p.ell(8, 10, 7, 4, C['pink_sh']); p.ell(8, 9, 6, 3.4, C['pink'])
    for x in (3, 6, 9, 12):
        p.line(8, 11, x, 7, C['pink_hi'])
    if filled:
        p.ell(8, 8, 3, 3, C['white']); p.set(7, 7, C['pink_hi']); sparkle(p, 3, 3)
    else:
        p.ell(8, 8, 2.4, 2, C['pink_dk'])
    p.outline(); return p


def plot(stage):
    p = Px(32, 24)
    p.rect(2, 10, 28, 12, rgb('#8a5a35')); p.rect(2, 10, 28, 2, rgb('#a8693a')); p.rect(2, 20, 28, 2, rgb('#6f4326'))
    for x in (6, 12, 18, 24):
        p.rect(x, 14, 3, 1, rgb('#6f4326'))
    if stage == 1:
        p.ell(16, 12, 3, 2, C['brown_hi']); p.set(16, 10, C['brown'])
    if stage == 2:
        p.ell(16, 12, 5, 2.4, rgb('#6f4326')); p.set(10, 11, C['blue_hi']); p.set(22, 11, C['blue_hi']); p.set(14, 9, C['blue_hi']); p.set(19, 8, C['blue_hi'])
    if stage == 3:
        p.line(16, 12, 16, 4, C['green_dk']); p.ell(12, 8, 3, 1.6, C['green']); p.ell(20, 7, 3, 1.6, C['green'])
        for a in range(0, 360, 72):
            p.ell(16 + 4 * math.cos(math.radians(a)), 2 + 4 * math.sin(math.radians(a)), 2.2, 2.2, C['pink'])
        p.ell(16, 2, 2, 2, C['gold'])
    p.outline(); return p


def seaweed(f):
    p = Px(16, 32)
    for k, x0 in enumerate((4, 8, 12)):
        for y in range(30, 6 + k * 3, -1):
            x = x0 + int(round(math.sin((y + f * 3 + k * 4) / 4.0) * 1.6))
            p.set(x, y, C['leaf_hi'] if (y // 3) % 2 else C['green']); p.set(x + 1, y, C['leaf'])
    p.outline(); return p


def shimmer(f):
    p = Px(32, 32)
    for i in range(5):
        r = 3 + i * 3 + (f % 2) * 1.5
        for a in range(0, 360, 6):
            if (a // 6 + i + f) % 3:
                x = 16 + r * math.cos(math.radians(a)); y = 16 + r * .72 * math.sin(math.radians(a))
                p.set(int(round(x)), int(round(y)), C['white'] if i % 2 else C['water_hi'])
    sparkle(p, 6 + f * 4, 5); sparkle(p, 25 - f * 3, 24, 'pink_hi')
    return p


def whirlpool(f):
    p = Px(32, 32)
    for i in range(7):
        r = 3 + i * 2.2
        for a in range(0, 360, 5):
            aa = a + i * 40 + f * 30
            x = 16 + r * math.cos(math.radians(aa)); y = 16 + r * .75 * math.sin(math.radians(aa))
            if (a // 5 + i) % 4:
                p.set(int(round(x)), int(round(y)), C['white'] if i % 3 == 0 else (C['water_hi'] if i % 3 == 1 else C['teal_hi']))
    p.ell(16, 16, 3, 2.2, C['water_dk'])
    return p


def crown_hud():
    p = Px(32, 20)
    p.rect(4, 10, 24, 8, C['gold']); p.rect(4, 10, 24, 2, C['gold_hi']); p.rect(4, 16, 24, 2, C['gold_sh'])
    for x in (4, 12, 20, 26):
        p.poly([(x, 10), (x + 2, 2), (x + 4, 10)], C['gold'])
    for x in (6, 14, 22, 28):
        p.ell(x, 2, 1.6, 1.6, C['pink'])
    for x, col in ((8, 'red'), (15, 'blue'), (22, 'green')):
        p.ell(x, 14, 2, 2, C[col]); p.set(x - 1, 13, C['white'])
    p.outline(); return p


def sign_arch():
    """Glowing woodland gate arch for scene exits (shown as a sparkling arch of vines)."""
    p = Px(32, 32)
    p.rect(2, 8, 5, 24, C['leaf']); p.rect(25, 8, 5, 24, C['leaf']); p.ell(16, 10, 14, 9, C['leaf'])
    for y in range(12, 32):
        for x in range(7, 25):
            p.p[y][x] = None
    for x in range(7, 25):
        for y in range(4, 14):
            if ((x - 16) / 9.2) ** 2 + ((y - 14) / 9.5) ** 2 < 1:
                p.p[y][x] = None
    for x, y in ((3, 12), (4, 20), (27, 16), (28, 24), (10, 4), (22, 4), (16, 2)):
        p.ell(x, y, 1.6, 1.6, C['pink_hi']); p.set(x, y, C['gold'])
    p.outline(); return p


# ------------------------------------------------------------------ UI icons: 32x32 round buttons
def btn(bg, hi, sh):
    p = Px(32, 32)
    p.ell(16, 16.5, 15.5, 15.2, sh); p.ell(16, 15.5, 15.5, 15, bg); p.ell(16, 8.5, 11, 5.5, hi)
    p.ell(16, 16.5, 12, 11.5, bg); p.ell(12, 8, 4, 2, mix(hi, '#ffffff', .6))
    p.outline(); return p


def _ui(name, bg, fn, hi=None, sh=None):
    hi = hi or mix(bg, '#ffffff', .5); sh = sh or mix(bg, '#401a60', .35)
    bg = rgb(bg) if isinstance(bg, str) else bg
    p = btn(bg, hi, sh)
    fn(p)
    return name, p


def icons():
    out = []
    W, G, B = C['white'], C['gold'], C['ol']

    out.append(_ui('icon_play', '#4cd964', lambda p: (p.poly([(12, 8), (12, 24), (25, 16)], W), p.outline_inner(B) if hasattr(p, 'outline_inner') else None)))
    out.append(_ui('icon_wand', '#b06bff', lambda p: (p.line(9, 23, 20, 12, C['white']), p.line(10, 23, 21, 12, C['cream_sh']), _star_poly(p, 21, 10, 6, 2.6, G), p.set(21, 10, W), sparkle(p, 8, 8, 'pink_hi'))))
    out.append(_ui('icon_princess', '#ff7ec3', lambda p: (p.rect(9, 17, 14, 5, G), [p.poly([(9 + i * 5, 17), (11 + i * 5, 8), (13 + i * 5, 17)], G) for i in range(3)], [p.ell(11 + i * 5, 8, 1.6, 1.6, C['white']) for i in range(3)], p.set(16, 19, C['pink']), p.set(12, 19, C['blue']), p.set(20, 19, C['green']))))

    def uni(p):
        p.ell(16, 19, 8, 7, W); p.poly([(10, 14), (11, 6), (14, 13)], W); p.poly([(18, 13), (21, 6), (22, 14)], W)
        p.poly([(15, 12), (16, 2), (17, 12)], G); p.ell(12, 14, 2.4, 6, C['pink_hi']); p.ell(20, 14, 2.4, 6, C['purple_hi'])
        p.rect(12, 17, 2, 3, EYE); p.rect(18, 17, 2, 3, EYE); p.rect(15, 22, 2, 1, C['mouth']); p.ell(16, 21, 3.5, 2, C['pink_hi']) if False else None
    out.append(_ui('icon_unicorn', '#8fd8ff', uni))

    def mer(p):
        p.ell(16, 9, 5, 5, C['skin']); p.ell(16, 7, 6, 3.4, C['hair']); p.rect(11, 8, 2, 8, C['hair']); p.rect(19, 8, 2, 8, C['hair'])
        p.rect(13, 15, 6, 6, C['teal']); p.poly([(13, 20), (19, 20), (16, 26)], C['teal']); p.ell(12, 27, 3.6, 2.2, C['purple']); p.ell(20, 27, 3.6, 2.2, C['purple'])
        p.set(14, 9, EYE); p.set(18, 9, EYE); p.rect(14, 15, 4, 2, C['pink'])
    out.append(_ui('icon_mermaid', '#31d6c8', mer))

    def spk(p):
        p.poly([(8, 13), (13, 13), (19, 8), (19, 24), (13, 19), (8, 19)], W)
        for r in (4, 8):
            for a in range(-50, 51, 6):
                p.set(int(round(20 + r * math.cos(math.radians(a)))) + 1, int(round(16 + r * 1.2 * math.sin(math.radians(a)))), W)
    out.append(_ui('icon_speaker', '#ff9a3c', spk))

    def book(p):
        p.rect(6, 9, 10, 14, W); p.rect(16, 9, 10, 14, W); p.rect(6, 9, 10, 1, C['cream_sh']); p.rect(15, 9, 2, 14, C['pink_sh'])
        for y in (12, 15, 18):
            p.rect(8, y, 6, 1, C['stone_sh']); p.rect(18, y, 6, 1, C['stone_sh'])
        _star_poly(p, 21, 12, 2, 1, G)
    out.append(_ui('icon_book', '#ff7ec3', book))

    def home(p):
        p.poly([(5, 16), (16, 6), (27, 16)], C['red']); p.rect(8, 16, 16, 10, C['cream']); p.rect(14, 19, 5, 7, C['brown']); p.rect(10, 18, 3, 3, C['blue_hi'])
    out.append(_ui('icon_home', '#3ea6ff', home))
    out.append(_ui('icon_check', '#4cd964', lambda p: (p.line(9, 17, 14, 23, W), p.line(9, 16, 14, 22, W), p.line(14, 23, 24, 9, W), p.line(15, 23, 25, 9, W), p.line(14, 22, 24, 8, W))))
    out.append(_ui('icon_next', '#4cd964', lambda p: (p.rect(8, 14, 10, 4, W), p.poly([(16, 8), (16, 24), (25, 16)], W))))
    for nm, pts in (('up', [(8, 20), (16, 9), (24, 20)]), ('down', [(8, 12), (16, 23), (24, 12)]), ('left', [(20, 8), (9, 16), (20, 24)]), ('right', [(12, 8), (23, 16), (12, 24)])):
        out.append(_ui(f'icon_{nm}', '#b06bff', lambda p, pts=pts: p.poly(pts, W)))
    out.append(_ui('icon_parent', '#9aa0c8', lambda p: (p.rect(9, 15, 14, 10, W), p.rect(11, 8, 2, 8, W), p.rect(19, 8, 2, 8, W), p.rect(11, 8, 10, 2, W), p.set(16, 19, B), p.rect(16, 20, 1, 2, B))))
    out.append(_ui('icon_hint', '#ffd93d', lambda p: (_star_poly(p, 16, 16, 10, 4.6, W), p.set(16, 16, G))))
    out.append(_ui('icon_back', '#ff9a3c', lambda p: (p.rect(12, 14, 12, 4, W), p.poly([(16, 8), (16, 24), (7, 16)], W))))
    # Quest-reminder / dialogue icons (picture only)
    def pipface(p):
        p.ell(11, 8, 2, 6, W); p.ell(21, 8, 2, 6, W); p.ell(11, 9, 1, 4, C['pink']); p.ell(21, 9, 1, 4, C['pink']); p.ell(16, 19, 8, 7, W)
        p.rect(12, 18, 2, 3, EYE); p.rect(19, 18, 2, 3, EYE); p.rect(15, 22, 2, 1, C['pink_sh'])
    out.append(_ui('icon_pip', '#ffb8e2', pipface))

    def treeicon(p):
        p.rect(14, 18, 5, 9, C['brown']); p.ell(16, 12, 9, 7, C['leaf']); p.ell(13, 10, 3, 2.4, C['leaf_hi']); p.rect(13, 20, 2, 1, EYE); p.rect(18, 20, 2, 1, EYE)
    out.append(_ui('icon_tree', '#92ec74', treeicon))

    def rainbow(p):
        for i, c in enumerate(['red', 'orange', 'yellow', 'green', 'blue', 'purple']):
            r = 11 - i * 1.5
            for a in range(180, 361, 4):
                p.set(int(round(16 + r * math.cos(math.radians(a)))), int(round(23 + r * math.sin(math.radians(a)))), C[c])
                p.set(int(round(16 + r * math.cos(math.radians(a)))), int(round(24 + r * math.sin(math.radians(a)))), C[c])
        p.ell(6, 25, 3, 2, W); p.ell(26, 25, 3, 2, W)
    out.append(_ui('icon_rainbow', '#8fd8ff', rainbow))

    def marinaicon(p):
        p.ell(16, 19, 9, 7, C['green']); p.ell(16, 8, 4.5, 4, C['green_hi']); p.set(14, 8, EYE); p.set(18, 8, EYE)
        for x, y in ((13, 18), (19, 18), (16, 21)):
            p.ell(x, y, 2.4, 2, C['leaf'])
    out.append(_ui('icon_marina', '#3ea6ff', marinaicon))
    out.append(_ui('icon_star', '#ff9a3c', lambda p: (_star_poly(p, 16, 16.5, 11, 5, G), p.ell(14, 13, 2, 2, C['gold_hi']))))
    out.append(_ui('icon_lamp', '#ffe9a8', lambda p: (p.rect(15, 14, 2, 10, C['gold_sh']), p.ell(16, 25, 6, 2, G), _star_poly(p, 16, 10, 8, 3.6, C['gold_hi']), p.set(16, 10, W))))
    out.append(_ui('icon_bridge', '#a06bff', rainbow, hi=mix('#a06bff', '#ffffff', .5)))

    def lock(p):
        p.rect(9, 15, 14, 10, W); p.rect(11, 8, 2, 8, W); p.rect(19, 8, 2, 8, W); p.rect(11, 8, 10, 2, W)
    out.append(_ui('icon_lock', '#9aa0c8', lock))
    out.append(_ui('icon_sound', '#5ac8fa', spk))
    out.append(_ui('icon_music', '#ff7ec3', lambda p: (p.ell(12, 22, 3.6, 3, W), p.ell(21, 20, 3.6, 3, W), p.rect(14, 8, 2, 14, W), p.rect(23, 6, 2, 14, W), p.rect(14, 8, 11, 3, W))))
    return out


# a little pointing hand for hints
def hand():
    p = Px(32, 32)
    p.rect(12, 14, 9, 14, C['skin']); p.rect(13, 3, 4, 14, C['skin']); p.rect(10, 16, 3, 6, C['skin']); p.rect(21, 17, 3, 7, C['skin'])
    p.rect(13, 3, 1, 14, C['skin_sh']); p.rect(14, 26, 6, 2, C['pink_hi']); p.outline(); return p
