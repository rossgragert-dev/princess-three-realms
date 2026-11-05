"""v0.4a art: starter furniture, wallpaper + floor tile sets for the room designer, HUD / designer icons. Deterministic."""
import math
from pxlib import Px, C, rgb, mix, rng
from art_props import _ui, _star_poly
from art_chars import sparkle

T = 16
W = C['white']


def base(col):
    t = Px(T, T)
    t.rect(0, 0, T, T, rgb(col) if isinstance(col, str) else col)
    return t


# ------------------------------------------------------------------ wallpapers (pink = existing wall_paper)
WALL_IDS = ['lavender', 'mint', 'sky', 'cream', 'floral', 'starry', 'rainbow']
SKIRT = {'lavender': ('#f1e6ff', '#c9b8ff'), 'mint': ('#f0fff6', '#bfe8d0'), 'sky': ('#ffffff', '#cfe6f7'), 'cream': ('#fffaf0', '#eadbbf'),
         'floral': ('#fff6e4', '#f1dfc8'), 'starry': ('#7a58c8', '#4b2f8a'), 'rainbow': ('#ffffff', '#e6dcf3')}


def wall(wid):
    r = rng(hash(wid) & 0xffff)
    if wid == 'lavender':
        t = base('#dccbff')
        for x in range(0, T, 8): t.rect(x, 0, 2, T, rgb('#efe5ff'))
        for x, y in ((4, 5), (12, 11)):
            t.set(x, y, W); t.set(x - 1, y, rgb('#b79cf2')); t.set(x + 1, y, rgb('#b79cf2')); t.set(x, y - 1, rgb('#b79cf2')); t.set(x, y + 1, rgb('#b79cf2'))
    elif wid == 'mint':
        t = base('#bff0d6')
        for x in range(0, T, 8): t.rect(x, 0, 2, T, rgb('#dcf8e8'))
        for x, y in ((5, 4), (13, 10)):
            t.rect(x, y, 2, 1, rgb('#5ccf8a')); t.set(x + 1, y - 1, rgb('#5ccf8a')); t.set(x - 1, y + 1, rgb('#8fe0b0'))
    elif wid == 'sky':
        t = base('#bfe4ff'); t.rect(0, 0, T, 1, rgb('#d9f0ff'))
        for cx, cy in ((4, 5), (12, 11)):
            t.rect(cx - 3, cy, 7, 2, W); t.rect(cx - 2, cy - 1, 4, 1, W); t.rect(cx, cy - 2, 3, 1, W); t.rect(cx - 3, cy + 2, 7, 1, rgb('#e6f4ff'))
    elif wid == 'cream':
        t = base('#fff1d6')
        for y in range(0, T, 4): t.rect(0, y, T, 1, rgb('#f6e3bd'))
        t.rect(0, 0, T, 1, W)
    elif wid == 'floral':
        t = base('#ffe6ee')
        for x, y, c in ((4, 4, '#ff7ec3'), (12, 11, '#c9a8ff')):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): t.set(x + dx, y + dy, rgb(c))
            t.set(x, y, rgb('#ffe14d'))
        for x, y in ((8, 8), (1, 12), (15, 3)): t.set(x, y, rgb('#7bd68a')); t.set(x + 1, y + 1, rgb('#4fb86a'))
    elif wid == 'starry':
        t = base('#5a3d9a')
        for y in range(T): t.rect(0, y, T, 1, mix('#4b2f8a', '#6a4cb0', y / T))
        for x, y in ((3, 3), (11, 9)): _star_poly(t, x, y, 2.6, 1.2, C['gold_hi'])
        for x, y in ((8, 2), (14, 13), (1, 11)): t.set(x, y, W)
    else:  # rainbow
        t = base('#fffaf0')
        cols = ['#ff8a9a', '#ffb870', '#ffe27a', '#9be28a', '#8fd8ff', '#b79cf2']
        for i, c in enumerate(cols): t.rect(1 + i * 2 + (i // 3) * 0, 0, 2, T, rgb(c))
        for i, c in enumerate(cols): t.rect(9 + i // 2 * 0 + i, 0, 1, 0, rgb(c))
        t.rect(14, 0, 2, T, rgb('#f6f0ff'))
    return t


def baseboard(wid):
    t = wall(wid)
    hi, lo = SKIRT[wid]
    t.rect(0, 11, T, 5, rgb(hi)); t.rect(0, 11, T, 1, W if wid != 'starry' else rgb('#ffd93d')); t.rect(0, 15, T, 1, rgb(lo))
    return t


# ------------------------------------------------------------------ floors (light_wood = existing wood_floor0/1)
FLOOR_IDS = ['dark_wood', 'cream_tile', 'pastel_tile', 'patterned_carpet', 'royal_rug']


def floor(fid, v):
    if fid == 'dark_wood':
        t = base('#9a6238')
        for y in range(0, T, 4):
            t.rect(0, y + 3, T, 1, rgb('#6f4326')); t.rect(0, y, T, 1, rgb('#b27a4a'))
            t.rect(((y // 4) * 5 + v * 3) % T, y, 1, 4, rgb('#6f4326'))
        return t
    if fid == 'cream_tile':
        t = base('#fff1d9')
        t.rect(0, 7, T, 1, rgb('#e7d3b0')); t.rect(7, 0, 1, T, rgb('#e7d3b0')); t.rect(15, 0, 1, T, rgb('#e7d3b0')); t.rect(0, 15, T, 1, rgb('#e7d3b0'))
        for x0, y0 in ((0, 0), (8, 8)): t.rect(x0 + 1, y0 + 1, 3, 1, W); t.set(x0 + 1, y0 + 2, W)
        if v: t.set(11, 3, rgb('#f6e3bd')); t.set(3, 11, rgb('#f6e3bd'))
        return t
    if fid == 'pastel_tile':
        a, b = ('#ffc9e6', '#c9f0e0') if not v else ('#c9f0e0', '#ffc9e6')
        c, d = ('#e0d2ff', '#fff0b8') if not v else ('#fff0b8', '#e0d2ff')
        t = base(a)
        t.rect(8, 0, 8, 8, rgb(b)); t.rect(0, 8, 8, 8, rgb(c)); t.rect(8, 8, 8, 8, rgb(d))
        for x in (0, 8):
            for y in (0, 8): t.rect(x + 1, y + 1, 2, 1, W)
        t.rect(7, 0, 1, T, rgb('#ffffff')); t.rect(0, 7, T, 1, rgb('#ffffff'))
        return t
    if fid == 'patterned_carpet':
        t = base('#d8c4ff')
        for y in range(T):
            for x in range(T):
                if (x + y + v * 2) % 8 == 0 or (x - y + v * 2) % 8 == 0: t.set(x, y, rgb('#b79cf2'))
        for x, y in ((8, 8), (0, 0), (0, 16), (16, 0)): t.set(x % T, y % T, rgb('#ff7ec3'))
        t.set(4, 4, rgb('#ffe27a')); t.set(12, 12, rgb('#ffe27a'))
        return t
    # royal_rug
    t = base('#7a3fc0')
    for y in range(T):
        for x in range(T):
            if (x // 2 + y // 2 + v) % 2 == 0: t.set(x, y, rgb('#8a50d2'))
    t.rect(0, 0, T, 1, rgb('#ffd93d')); t.rect(0, 15, T, 1, rgb('#ffd93d')) if v == 0 else t.rect(0, 7, T, 2, rgb('#ffd93d'))
    _star_poly(t, 8, 8, 4, 1.8, C['gold_hi']) if v == 0 else None
    return t


def room_tiles():
    out = []
    for w in WALL_IDS:
        out.append((f'wall_{w}', wall(w))); out.append((f'base_{w}', baseboard(w)))
    for f in FLOOR_IDS:
        out.append((f'floor_{f}0', floor(f, 0))); out.append((f'floor_{f}1', floor(f, 1)))
    return out


# ------------------------------------------------------------------ starter furniture
def _rug(w, h, bands, rim):
    p = Px(w, h)
    p.ell(w / 2, h / 2, w / 2 - 1, h / 2 - 1, rgb(rim))
    for i, c in enumerate(bands): p.ell(w / 2, h / 2, w / 2 - 3 - i * 4, h / 2 - 2 - i * 2, rgb(c))
    p.outline(); return p


def plain_rug(): return _rug(44, 22, ['#fff1d9', '#ffd6ec'], '#ff7ec3')


def striped_rug():
    p = Px(44, 22)
    cols = ['#8fd8ff', '#ffffff', '#ffb8e2', '#ffffff', '#c9a8ff', '#ffffff', '#ffe27a', '#ffffff']
    for i in range(11): p.rect(2 + i * 4, 2, 4, 18, rgb(cols[i % len(cols)]))
    p.rect(2, 2, 40, 1, W); p.rect(2, 19, 40, 1, rgb('#e0d0f0'))
    for i in range(22): p.set(1, 2 + i, None) if i > 18 else None
    p.rect(0, 4, 2, 14, rgb('#fff6e4')); p.rect(42, 4, 2, 14, rgb('#fff6e4'))
    for y in range(4, 18, 2): p.set(0, y, rgb('#e0c9a8')); p.set(43, y, rgb('#e0c9a8'))
    p.outline(); return p


def small_lamp():
    p = Px(14, 26)
    p.ell(7, 22.5, 5, 2.4, C['pink_sh']); p.ell(7, 22, 4, 1.6, C['pink']); p.rect(6, 12, 2, 10, C['gold_sh'])
    p.poly([(2, 12), (12, 12), (10, 3), (4, 3)], rgb('#fff0a8')); p.rect(2, 11, 10, 2, C['gold']); p.rect(5, 4, 2, 7, rgb('#fffadc'))
    p.rect(3, 3, 8, 1, C['gold_hi'])
    p.outline(); return p


def wall_hanging():
    p = Px(20, 26)
    p.rect(1, 0, 18, 2, C['gold_sh']); p.rect(1, 0, 18, 1, C['gold'])
    p.rect(2, 2, 16, 22, rgb('#7a58c8')); p.rect(2, 2, 16, 3, rgb('#9a78e0')); p.poly([(2, 24), (18, 24), (10, 20)], rgb('#7a58c8'))
    p.poly([(2, 24), (10, 24), (2, 19)], rgb('#6a48b8'))
    p.ell(10, 11, 4.4, 4.4, C['gold_hi']); p.ell(11.6, 10, 3.8, 3.8, rgb('#7a58c8'))
    for x, y in ((5, 6), (15, 7), (14, 16), (5, 17), (9, 21)): p.set(x, y, W)
    p.rect(4, 4, 1, 1, C['gold_hi']); p.rect(16, 4, 1, 1, C['gold_hi'])
    p.outline(); return p


def round_mirror():
    p = Px(20, 20)
    p.ell(10, 10, 9, 9, C['gold_sh']); p.ell(10, 10, 8.2, 8.2, C['gold']); p.ell(10, 10, 6.4, 6.4, rgb('#bfe9ff')); p.ell(10, 9, 4.6, 4.6, rgb('#e6f8ff'))
    p.line(6, 7, 8, 5, W); p.line(6, 9, 7, 8, W); p.set(10, 1, C['gold_hi']); p.set(10, 18, C['gold_hi'])
    p.outline(); return p


def pink_curtain():
    p = Px(44, 36)
    p.rect(0, 0, 44, 3, C['gold_sh']); p.rect(0, 0, 44, 1, C['gold']); p.ell(2, 1.5, 2.2, 2.2, C['gold_hi']); p.ell(42, 1.5, 2.2, 2.2, C['gold_hi'])
    a, hi, sh = rgb('#ff9ad0'), rgb('#ffc4e4'), rgb('#e468b0')
    for x0, flip in ((1, 1), (43, -1)):
        pts = [(x0, 3), (x0 + flip * 12, 3), (x0 + flip * 9, 22), (x0 + flip * 14, 35), (x0, 35)]
        p.poly(pts, a)
        for k in range(1, 5):
            xx = x0 + flip * (k * 2.4); p.line(int(xx), 4, int(xx - flip), 34, hi if k % 2 else sh)
        p.rect(min(x0, x0 + flip * 10), 21, 11, 2, C['gold'])
        for k in range(3): p.ell(x0 + flip * (3 + k * 3), 30 - k * 2, 1.1, 1.1, W)
    p.outline(); return p


def _cushion(w, h, col, hi, sh, motif):
    p = Px(w, h)
    p.ell(w / 2, h / 2 + 0.5, w / 2 - 1, h / 2 - 1, rgb(sh)); p.ell(w / 2, h / 2 - 0.5, w / 2 - 1, h / 2 - 1.8, rgb(col)); p.ell(w / 2 - 2, h / 2 - 2, w / 4, h / 5, rgb(hi))
    if motif == 'star': _star_poly(p, w // 2 + 1, h // 2, 3.4, 1.6, C['gold_hi'])
    else: p.rect(w // 2 - 1, h // 2 - 2, 3, 3, W); p.set(w // 2, h // 2 - 3, C['pink_hi'])
    p.outline(); return p


def floor_pillow(): return _cushion(20, 12, '#ff9ad0', '#ffc4e4', '#d868a8', 'star')
def reading_cushion(): return _cushion(22, 12, '#8fd8ff', '#c4ecff', '#5aa8e8', 'dot')


def _chair(col, hi, sh, wood=False):
    p = Px(18, 24)
    p.rect(3, 2, 12, 11, rgb(sh)); p.rect(4, 3, 10, 9, rgb(col)); p.rect(4, 3, 10, 2, rgb(hi))
    if not wood:
        p.rect(3, 13, 12, 4, rgb(col)); p.rect(3, 13, 12, 1, rgb(hi)); p.rect(3, 16, 12, 1, rgb(sh)); _star_poly(p, 9, 8, 2.6, 1.2, C['gold_hi'])
    else:
        for x in (5, 8, 11): p.rect(x, 4, 1, 8, rgb(hi))
        p.rect(3, 13, 12, 3, rgb(col)); p.rect(3, 13, 12, 1, rgb(hi))
    p.rect(4, 17, 2, 5, rgb(sh if not wood else '#6f4326')); p.rect(12, 17, 2, 5, rgb(sh if not wood else '#6f4326'))
    p.outline(); return p


def pink_chair(): return _chair('#ff9ad0', '#ffc4e4', '#d868a8')
def wooden_chair(): return _chair('#d9a066', '#f0c28a', '#a8693a', True)


def little_couch():
    p = Px(36, 24)
    p.rect(2, 3, 32, 11, rgb('#a06bff')); p.rect(2, 3, 32, 2, rgb('#c9a8ff'))
    p.rect(0, 9, 6, 11, rgb('#8a50e8')); p.rect(30, 9, 6, 11, rgb('#8a50e8')); p.rect(0, 9, 6, 2, rgb('#c9a8ff')); p.rect(30, 9, 6, 2, rgb('#c9a8ff'))
    p.rect(6, 11, 24, 8, rgb('#b88cff')); p.rect(6, 11, 12, 1, rgb('#d9c0ff')); p.rect(18, 12, 1, 7, rgb('#8a50e8')); p.rect(6, 18, 24, 1, rgb('#7a40d8'))
    p.rect(4, 20, 3, 3, rgb('#6f4326')); p.rect(29, 20, 3, 3, rgb('#6f4326'))
    p.ell(10, 8, 3, 2.4, rgb('#ffb8e2')); p.set(10, 8, C['gold_hi'])
    p.outline(); return p


def dresser():
    p = Px(26, 26)
    p.rect(1, 3, 24, 21, rgb('#d9a066')); p.rect(1, 3, 24, 3, rgb('#f0c28a')); p.rect(1, 22, 24, 2, rgb('#a8693a'))
    for y in (7, 14): p.rect(3, y, 20, 6, rgb('#e8b27a')); p.rect(3, y + 5, 20, 1, rgb('#a8693a')); p.rect(11, y + 2, 4, 2, C['gold'])
    p.rect(3, 24, 3, 2, rgb('#6f4326')); p.rect(20, 24, 3, 2, rgb('#6f4326'))
    p.ell(7, 2, 2.2, 2.2, C['pink_hi']); p.rect(6, 3, 3, 1, C['green'])  # little flower on top
    p.outline(); return p


def toy_basket():
    p = Px(22, 22)
    p.ell(6, 6, 3.4, 3.4, rgb('#ffb8e2')); p.rect(9, 3, 5, 5, rgb('#8fd8ff')); _star_poly(p, 16, 6, 3.6, 1.6, C['gold'])
    p.rect(2, 8, 18, 12, rgb('#e8b27a'))
    for y in range(9, 20, 3): p.rect(2, y, 18, 1, rgb('#c98b57'))
    for x in range(4, 19, 4): p.rect(x, 8, 1, 12, rgb('#c98b57'))
    p.rect(2, 8, 18, 2, rgb('#f6cfa1')); p.rect(2, 19, 18, 1, rgb('#a8693a'))
    p.outline(); return p


def desk():
    p = Px(36, 28)
    p.rect(1, 6, 34, 4, rgb('#f0c28a')); p.rect(1, 9, 34, 1, rgb('#a8693a'))
    p.rect(3, 10, 4, 16, rgb('#d9a066')); p.rect(29, 10, 4, 16, rgb('#d9a066')); p.rect(7, 10, 22, 3, rgb('#c98b57'))
    p.rect(8, 1, 6, 5, rgb('#ff7ec3')); p.rect(8, 1, 6, 1, rgb('#ffb8e2')); p.rect(9, 3, 4, 1, W)
    p.rect(15, 3, 5, 3, rgb('#8fd8ff')); p.rect(15, 3, 5, 1, rgb('#c4ecff'))
    p.rect(26, 2, 2, 4, rgb('#ffd93d')); p.rect(26, 1, 2, 1, C['pink']); p.rect(29, 3, 3, 3, rgb('#a06bff'))
    p.outline(); return p


def plant_stand():
    p = Px(16, 28)
    for dx, dy, ang in ((-4, -1, 0), (4, -1, 0), (0, -5, 0)):
        p.ell(8 + dx, 8 + dy, 2.6, 5, C['green']); p.set(8 + dx, 5 + dy, C['green_hi'])
    p.ell(8, 8, 3, 5, C['green_hi']); p.ell(8, 4, 1.8, 1.8, C['pink']); p.set(8, 4, C['gold_hi'])
    p.ell(8, 14, 5.4, 3, rgb('#ff9a6a')); p.rect(3, 13, 10, 3, rgb('#ff9a6a')); p.rect(3, 13, 10, 1, rgb('#ffc09a'))
    p.rect(7, 16, 2, 9, rgb('#a8693a')); p.ell(8, 25.4, 5, 1.8, rgb('#a8693a')); p.ell(8, 25, 4, 1.2, rgb('#d9a066'))
    p.outline(); return p


FURNITURE = [('plain_rug', plain_rug), ('striped_rug', striped_rug), ('small_lamp', small_lamp), ('wall_hanging', wall_hanging), ('round_mirror', round_mirror),
             ('pink_curtain', pink_curtain), ('floor_pillow', floor_pillow), ('reading_cushion', reading_cushion), ('pink_chair', pink_chair), ('wooden_chair', wooden_chair),
             ('little_couch', little_couch), ('dresser', dresser), ('toy_basket', toy_basket), ('desk', desk), ('plant_stand', plant_stand)]


# ------------------------------------------------------------------ room-designer station prop (easel with paint pots) 24x32
def paint_prop(f):
    p = Px(26, 34)
    p.rect(3, 31, 3, 3, rgb('#6f4326')); p.rect(20, 31, 3, 3, rgb('#6f4326')); p.rect(12, 27, 2, 7, rgb('#6f4326'))
    p.rect(3, 4, 20, 22, rgb('#d9a066')); p.rect(3, 4, 20, 2, rgb('#f0c28a'))
    p.rect(5, 7, 16, 17, rgb('#fffaf0'))
    p.rect(5, 7, 5, 17, rgb('#ffc9e6')); p.rect(10, 7, 5, 17, rgb('#c9f0e0')); p.rect(15, 7, 6, 17, rgb('#c9d8ff'))
    p.ell(8, 12, 1.4, 1.4, rgb('#ff7ec3')); _star_poly(p, 18, 15, 2.6, 1.2, C['gold']) if f == 0 else _star_poly(p, 18, 15, 3.4, 1.6, C['gold_hi'])
    p.rect(2, 26, 22, 3, rgb('#e8b27a')); p.rect(2, 26, 22, 1, rgb('#f6cfa1'))
    p.rect(4, 24, 3, 3, rgb('#ff7ec3')); p.rect(9, 24, 3, 3, rgb('#3ea6ff')); p.rect(19, 24, 3, 3, rgb('#ffe14d'))
    p.line(14, 28, 17, 22, rgb('#a8693a')); p.rect(17, 20, 2, 3, rgb('#ff5a6e'))
    p.outline(); return p


# ------------------------------------------------------------------ UI icons
def home_icons():
    out = []
    out.append(_ui('icon_brush', '#ff9ad0', lambda p: (p.line(9, 24, 21, 10, rgb('#a8693a')), p.line(10, 24, 22, 10, rgb('#d9a066')), p.ell(23, 8, 4.4, 4.4, rgb('#ff5a6e')), p.ell(22, 7, 2, 2, rgb('#ff9aa6')),
                                         p.rect(8, 23, 4, 4, rgb('#3ea6ff')), p.set(25, 23, W), sparkle(p, 8, 8, 'pink_hi'))))
    out.append(_ui('icon_wall', '#c9a8ff', lambda p: (p.rect(6, 7, 20, 18, rgb('#ffe6ee')), [p.rect(6 + i * 5, 7, 2, 18, rgb('#ffc9e6')) for i in range(4)], p.rect(6, 22, 20, 3, W),
                                         p.ell(12, 13, 1.6, 1.6, rgb('#ff7ec3')), p.ell(20, 17, 1.6, 1.6, rgb('#a06bff')), p.rect(6, 7, 20, 1, C['gold']))))
    out.append(_ui('icon_floor', '#ffd93d', lambda p: (p.poly([(5, 14), (27, 14), (30, 26), (2, 26)], rgb('#eab380')), [p.line(5 + i * 5, 14, 2 + i * 6, 26, rgb('#c98b57')) for i in range(1, 5)],
                                         p.rect(2, 20, 28, 1, rgb('#c98b57')), p.rect(4, 14, 24, 1, rgb('#f6cfa1')))))
    # big action buttons: A = a pointing hand, magic = a star wand with sparkles
    def hand_icon(p):
        p.rect(14, 8, 5, 14, C['skin']); p.rect(12, 15, 3, 7, C['skin']); p.rect(19, 16, 3, 6, C['skin']); p.rect(10, 17, 2, 5, C['skin']); p.rect(12, 22, 10, 5, C['skin'])
        p.rect(14, 8, 1, 14, C['skin_sh']); p.rect(13, 25, 8, 2, C['pink_hi']); p.outline_inner(C['ol']) if hasattr(p, 'outline_inner') else None
        p.rect(13, 7, 7, 1, C['ol']); p.rect(13, 8, 1, 7, C['ol']); p.rect(19, 8, 1, 7, C['ol'])
    out.append(_ui('icon_a', '#ffb347', hand_icon))
    out.append(_ui('icon_magic', '#b06bff', lambda p: (p.line(8, 25, 20, 12, W), p.line(9, 25, 21, 12, C['cream_sh']), _star_poly(p, 21, 10, 7.5, 3.2, C['gold']), _star_poly(p, 21, 10, 5, 2, C['gold_hi']),
                                             sparkle(p, 7, 8, 'pink_hi'), sparkle(p, 26, 22, 'blue_hi'), sparkle(p, 11, 18, 'gold_hi'))))
    # v0.4a.1: joystick thumb knob (glossy lavender gem) and a decorate-mode armchair icon
    def knob(p):
        p.ell(16, 16, 12.5, 12.5, rgb('#6f48c9')); p.ell(16, 15, 11.5, 11.5, rgb('#9a74ee')); p.ell(15, 13, 8.5, 8.5, rgb('#b79cf7'))
        p.ell(12, 10, 3.6, 2.4, rgb('#efe5ff')); p.set(10, 12, W); p.set(21, 21, rgb('#7d57d8'))
    out.append(_ui('icon_knob', '#9a74ee', knob))
    def sofa_icon(p):
        p.rect(7, 12, 18, 9, rgb('#ff8fc5')); p.rect(5, 15, 4, 10, rgb('#e8629f')); p.rect(23, 15, 4, 10, rgb('#e8629f')); p.rect(9, 17, 14, 8, rgb('#ffb3d9'))
        p.rect(7, 12, 18, 2, rgb('#ffd1ea')); p.rect(8, 25, 2, 3, rgb('#7a4a2b')); p.rect(22, 25, 2, 3, rgb('#7a4a2b')); sparkle(p, 25, 8, 'gold_hi')
    out.append(_ui('icon_decorate', '#ffd93d', sofa_icon))
    def cross_icon(p):
        p.line(9, 9, 22, 22, W); p.line(10, 9, 23, 22, W); p.line(9, 10, 22, 23, W); p.line(22, 9, 9, 22, W); p.line(23, 9, 10, 22, W); p.line(22, 10, 9, 23, W)
    out.append(_ui('icon_cross', '#ff6b7e', cross_icon))
    def undo_icon(p):
        p.ell(16, 17, 8.5, 7.5, W); p.ell(16, 18, 5.6, 4.8, rgb('#7f9cff')); p.rect(8, 17, 17, 9, rgb('#7f9cff'))
        p.poly([(5, 14), (14, 5), (14, 15)], W); p.rect(15, 10, 8, 1, None) if False else None
    out.append(_ui('icon_undo', '#7f9cff', undo_icon))
    def flip_icon(p):
        p.rect(15, 6, 2, 20, W); p.poly([(13, 9), (13, 23), (4, 16)], W); p.poly([(19, 9), (19, 23), (28, 16)], rgb('#e0f6ff'))
    out.append(_ui('icon_flip', '#3ec6d8', flip_icon))
    def trash_icon(p):
        p.rect(9, 11, 14, 14, W); p.rect(8, 8, 16, 3, W); p.rect(13, 5, 6, 3, W)
        for x in (12, 15, 18): p.rect(x, 13, 2, 10, rgb('#9a74ee'))
    out.append(_ui('icon_trash', '#b79cf7', trash_icon))
    return out
