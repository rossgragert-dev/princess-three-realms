"""v0.4a.1 art: the free-placement furniture catalog (beds, tables, seats, plants, toys, lamps, wall decor). Deterministic, original."""
from pxlib import Px, C, rgb
from art_props import _star_poly

W = C['white']


def _heart(p, cx, cy, r, c):
    p.ell(cx - r * 0.5, cy - r * 0.2, r * 0.62, r * 0.62, c); p.ell(cx + r * 0.5, cy - r * 0.2, r * 0.62, r * 0.62, c)
    p.poly([(int(cx - r * 1.05), int(cy)), (int(cx + r * 1.05), int(cy)), (int(cx), int(cy + r * 1.1))], c)


def sunny_bed():
    p = Px(48, 32)
    p.rect(1, 2, 46, 6, rgb('#d9a066')); p.rect(1, 2, 46, 2, rgb('#f0c28a')); p.rect(1, 7, 46, 1, rgb('#a8693a'))   # headboard
    p.rect(1, 8, 46, 20, rgb('#e8b27a')); p.rect(1, 8, 46, 2, rgb('#f6cfa1'))
    p.rect(3, 10, 42, 15, rgb('#ffe27a')); p.rect(3, 10, 42, 2, rgb('#fff3a0'))                                      # quilt
    for i in range(5): p.rect(6 + i * 8, 15, 4, 4, rgb('#ffb347'))
    p.rect(5, 10, 14, 6, W); p.rect(5, 10, 14, 1, rgb('#f0e6ff')); p.rect(22, 10, 14, 6, rgb('#ffd1ea'))           # pillows
    p.rect(3, 24, 42, 1, rgb('#e8a838')); p.rect(1, 27, 4, 4, rgb('#a8693a')); p.rect(43, 27, 4, 4, rgb('#a8693a'))
    p.outline(); return p


def round_table():
    p = Px(28, 24)
    p.ell(14, 7, 13, 5, rgb('#f0c28a')); p.ell(14, 6, 12, 4, rgb('#ffe0b0')); p.rect(1, 7, 26, 1, rgb('#a8693a'))
    p.rect(12, 9, 4, 12, rgb('#d9a066')); p.rect(12, 9, 1, 12, rgb('#f0c28a')); p.ell(14, 21, 7, 2.2, rgb('#a8693a')); p.ell(14, 20.5, 6, 1.6, rgb('#d9a066'))
    p.outline(); return p


def square_table():
    p = Px(32, 24)
    p.rect(1, 4, 30, 5, rgb('#c9a8ff')); p.rect(1, 4, 30, 2, rgb('#e0d0ff')); p.rect(1, 8, 30, 1, rgb('#8a50e8'))
    p.rect(3, 9, 3, 13, rgb('#a06bff')); p.rect(26, 9, 3, 13, rgb('#a06bff')); p.rect(6, 10, 20, 2, rgb('#8a50e8'))
    p.rect(14, 5, 4, 1, C['gold_hi']); p.outline(); return p


def tea_table():
    p = Px(20, 20)
    p.ell(10, 5, 9, 3.4, rgb('#ffb8e2')); p.ell(10, 4.4, 8.2, 2.8, rgb('#ffd6ec')); p.rect(1, 5, 18, 1, rgb('#d868a8'))
    p.rect(8, 7, 4, 9, rgb('#ff9ad0')); p.ell(10, 17, 6, 2, rgb('#d868a8')); p.ell(10, 16.6, 5, 1.4, rgb('#ff9ad0'))
    p.outline(); return p


def bean_bag():
    p = Px(22, 20)
    p.ell(11, 11, 10, 8, rgb('#5aa8e8')); p.ell(11, 10, 9.2, 7.2, rgb('#8fd8ff')); p.ell(8, 7, 4, 2.4, rgb('#d4f1ff'))
    p.ell(11, 16, 9, 2, rgb('#3a86c8')); p.rect(10, 4, 3, 2, rgb('#3a86c8')); _star_poly(p, 14, 11, 2.4, 1.1, C['gold_hi'])
    p.outline(); return p


def star_stool():
    p = Px(16, 18)
    p.ell(8, 5, 7, 3.4, rgb('#ffe27a')); p.ell(8, 4.4, 6.2, 2.8, rgb('#fff3a0')); _star_poly(p, 8, 4, 2.6, 1.1, C['gold_sh'])
    p.rect(2, 6, 2, 10, rgb('#e59a1a')); p.rect(12, 6, 2, 10, rgb('#e59a1a')); p.rect(4, 11, 8, 1, rgb('#e59a1a'))
    p.outline(); return p


def heart_rug():
    p = Px(34, 26)
    _heart(p, 17, 11, 11, rgb('#ff5a9e')); _heart(p, 17, 11, 8.4, rgb('#ff8fc5')); _heart(p, 17, 10, 5.2, rgb('#ffd1ea'))
    p.set(11, 7, W); p.set(12, 6, W); p.outline(); return p


def leafy_plant():
    p = Px(20, 34)
    for dx, h in ((-5, 14), (5, 15), (0, 20), (-8, 8), (8, 9)):
        p.ell(10 + dx, 14 - h / 4, 3.2, h / 2 + 2, C['green_sh']); p.ell(10 + dx, 13 - h / 4, 2.4, h / 2 + 1, C['green'])
    p.ell(10, 7, 2.6, 7, C['green_hi'])
    p.rect(4, 20, 12, 11, rgb('#ff9a6a')); p.rect(4, 20, 12, 2, rgb('#ffc09a')); p.rect(5, 29, 10, 2, rgb('#d96a1c')); p.rect(3, 19, 14, 2, rgb('#ffb08a'))
    p.outline(); return p


def sunflower_pot():
    p = Px(20, 34)
    p.rect(9, 12, 2, 12, C['green_sh']); p.ell(6, 18, 3.4, 1.6, C['green']); p.ell(14, 16, 3.4, 1.6, C['green'])
    for i in range(8):
        import math
        a = i * math.pi / 4
        p.ell(10 + math.cos(a) * 5.2, 7 + math.sin(a) * 5.2, 2.6, 2.6, rgb('#ffe14d'))
    p.ell(10, 7, 3.6, 3.6, rgb('#8a5a2b')); p.ell(10, 6.4, 2.6, 2.6, rgb('#a8693a')); p.set(9, 6, rgb('#d28f55'))
    p.rect(4, 23, 12, 9, rgb('#ff7ec3')); p.rect(4, 23, 12, 2, rgb('#ffb8e2')); p.rect(5, 30, 10, 2, rgb('#cf4f9f'))
    p.outline(); return p


def _pot(p, y, col, hi, sh, w=12):
    x = (p.w - w) // 2
    p.rect(x, y, w, 7, rgb(col)); p.rect(x - 1, y - 1, w + 2, 2, rgb(hi)); p.rect(x + 1, y + 5, w - 2, 2, rgb(sh))


def tulip_pot():
    p = Px(16, 22)
    for x, col, hi in ((4, '#ff5a6e', '#ff9aa6'), (8, '#ffb347', '#ffd9a0'), (12, '#ff7ec3', '#ffb8e2')):
        p.rect(x, 8, 1, 7, C['green_sh']); p.ell(x + 0.5, 6, 2.4, 3.2, rgb(col)); p.set(x, 4, rgb(hi)); p.poly([(x - 2, 5), (x, 7), (x - 1, 3)], rgb(col))
    _pot(p, 14, '#c9a8ff', '#e0d0ff', '#8a50e8'); p.outline(); return p


def daisy_pot():
    p = Px(16, 22)
    for x, y in ((4, 6), (11, 5), (8, 9)):
        p.rect(x, y + 2, 1, 14 - y, C['green_sh'])
        for dx, dy in ((-2, 0), (2, 0), (0, -2), (0, 2), (-1, -1), (1, -1), (-1, 1), (1, 1)): p.set(x + dx, y + dy, W)
        p.set(x, y, rgb('#ffd93d'))
    _pot(p, 14, '#8fd8ff', '#c4ecff', '#3ea6ff'); p.outline(); return p


def cactus_pot():
    p = Px(16, 20)
    p.ell(8, 8, 3.4, 7, C['green']); p.ell(8, 7, 2.4, 6, C['green_hi']); p.rect(3, 6, 2, 5, C['green']); p.rect(3, 10, 4, 2, C['green']); p.rect(11, 4, 2, 6, C['green']); p.rect(9, 9, 4, 2, C['green'])
    for x, y in ((8, 3), (7, 7), (9, 9), (3, 7), (12, 5)): p.set(x, y, W)
    p.ell(8, 2, 1.3, 1.3, rgb('#ff7ec3')); _pot(p, 13, '#ffd93d', '#fff3a0', '#e59a1a'); p.outline(); return p


def beach_ball():
    p = Px(16, 16)
    p.ell(8, 8, 7, 7, W)
    for i, col in enumerate(('#ff5a6e', '#ffe14d', '#3ea6ff', '#5ccf59')):
        p.poly([(8, 8), (8 + [-7, 7, 7, -7][i], 1 + 14 * (i // 2) if False else [1, 1, 15, 15][i])], rgb(col)) if False else None
    p.rect(1, 6, 14, 4, rgb('#3ea6ff')); p.rect(6, 1, 4, 14, rgb('#ff5a6e')); p.ell(8, 8, 2.4, 2.4, rgb('#ffe14d'))
    p.ell(8, 8, 7, 7, None) if False else None
    for y in range(16):
        for x in range(16):
            if ((x + .5 - 8) ** 2 + (y + .5 - 8) ** 2) > 49: p.p[y][x] = None
    p.set(5, 4, W); p.set(4, 5, W); p.outline(); return p


def rainbow_ball():
    p = Px(16, 16)
    cols = ['#ff5a6e', '#ff9a3c', '#ffe14d', '#5ccf59', '#3ea6ff', '#a06bff', '#ff7ec3']
    for y in range(16):
        for x in range(16):
            if ((x + .5 - 8) ** 2 + (y + .5 - 8) ** 2) <= 49: p.p[y][x] = rgb(cols[min(6, y * 7 // 16)])
    p.set(5, 4, W); p.set(4, 5, W); p.set(5, 5, W); p.outline(); return p


def teddy_bear():
    p = Px(18, 20)
    p.ell(4, 4, 2.6, 2.6, rgb('#c98b57')); p.ell(14, 4, 2.6, 2.6, rgb('#c98b57')); p.ell(9, 13, 6, 5.4, rgb('#d9a066')); p.ell(9, 7, 5.6, 5, rgb('#e8b27a'))
    p.ell(4, 4, 1.4, 1.4, rgb('#ffc9a8')); p.ell(14, 4, 1.4, 1.4, rgb('#ffc9a8')); p.ell(9, 9, 2.6, 2, rgb('#fff0d9')); p.set(7, 6, C['ol']); p.set(11, 6, C['ol']); p.set(9, 8, C['ol'])
    p.ell(9, 14, 3, 3, rgb('#fff0d9')); p.ell(4, 13, 2, 2.6, rgb('#d9a066')); p.ell(14, 13, 2, 2.6, rgb('#d9a066'))
    p.rect(7, 11, 4, 2, rgb('#ff7ec3')); p.outline(); return p


def kitty_plush():
    p = Px(18, 20)
    p.poly([(3, 7), (3, 1), (8, 4)], rgb('#c9b8ff')); p.poly([(15, 7), (15, 1), (10, 4)], rgb('#c9b8ff'))
    p.ell(9, 13, 6, 5.4, rgb('#e0d4ff')); p.ell(9, 8, 6.4, 5.4, rgb('#e0d4ff')); p.set(4, 3, rgb('#ffb8e2')); p.set(14, 3, rgb('#ffb8e2'))
    p.set(6, 7, C['ol']); p.set(12, 7, C['ol']); p.set(9, 9, rgb('#ff7ec3')); p.line(3, 9, 5, 9, W); p.line(13, 9, 15, 9, W)
    p.rect(5, 15, 8, 1, rgb('#b79cf2')); p.rect(7, 12, 1, 2, rgb('#b79cf2')); p.rect(10, 12, 1, 2, rgb('#b79cf2'))
    p.outline(); return p


def duck_plush():
    p = Px(18, 18)
    p.ell(8, 12, 7, 5, rgb('#ffe14d')); p.ell(11, 6, 4.4, 4.4, rgb('#ffe14d')); p.ell(8, 11, 4, 2.4, rgb('#fff3a0')); p.rect(14, 6, 4, 2, rgb('#ff9a3c')); p.set(11, 4, C['ol'])
    p.ell(3, 10, 2.4, 1.6, rgb('#e8c020')); p.outline(); return p


def rag_doll():
    p = Px(16, 24)
    p.ell(8, 5, 4.6, 4.6, rgb('#ffdcc0')); p.rect(3, 1, 10, 3, rgb('#ff9a3c')); p.rect(2, 3, 2, 6, rgb('#ff9a3c')); p.rect(12, 3, 2, 6, rgb('#ff9a3c'))
    p.set(6, 5, C['ol']); p.set(10, 5, C['ol']); p.set(8, 7, rgb('#d9506c')); p.set(5, 6, rgb('#ff8fa8')); p.set(11, 6, rgb('#ff8fa8'))
    p.poly([(4, 10), (12, 10), (14, 19), (2, 19)], rgb('#ff7ec3')); p.rect(4, 10, 8, 1, rgb('#ffb8e2')); p.rect(2, 18, 12, 1, rgb('#cf4f9f'))
    p.rect(5, 19, 2, 3, rgb('#ffdcc0')); p.rect(9, 19, 2, 3, rgb('#ffdcc0')); p.rect(4, 21, 3, 2, rgb('#a06bff')); p.rect(9, 21, 3, 2, rgb('#a06bff'))
    p.outline(); return p


def ballerina_doll():
    p = Px(18, 24)
    p.ell(9, 5, 4.4, 4.4, rgb('#ffdcc0')); p.ell(9, 1.6, 2.6, 2, rgb('#7a4a2b')); p.rect(5, 2, 8, 2, rgb('#7a4a2b')); p.set(7, 5, C['ol']); p.set(11, 5, C['ol']); p.set(9, 7, rgb('#d9506c'))
    p.rect(6, 10, 6, 5, rgb('#ff9ad0')); p.poly([(1, 17), (17, 17), (13, 13), (5, 13)], rgb('#ffd6ec')); p.rect(1, 17, 16, 1, rgb('#ff9ad0'))
    p.rect(7, 18, 2, 4, rgb('#ffdcc0')); p.rect(10, 18, 2, 4, rgb('#ffdcc0')); p.rect(6, 21, 3, 1, rgb('#ff7ec3')); p.rect(10, 21, 3, 1, rgb('#ff7ec3'))
    p.line(6, 11, 2, 9, rgb('#ffdcc0')); p.line(12, 11, 16, 9, rgb('#ffdcc0')); p.outline(); return p


def toy_blocks():
    p = Px(18, 16)
    p.rect(1, 8, 7, 7, rgb('#ff5a6e')); p.rect(1, 8, 7, 1, rgb('#ff9aa6')); p.rect(8, 8, 7, 7, rgb('#3ea6ff')); p.rect(8, 8, 7, 1, rgb('#8fd8ff'))
    p.rect(4, 1, 7, 7, rgb('#ffe14d')); p.rect(4, 1, 7, 1, rgb('#fff3a0'))
    p.set(4, 11, W); p.set(11, 11, W); p.set(7, 4, C['ol']); p.outline(); return p


def floor_lamp():
    p = Px(16, 42)
    p.ell(8, 38.5, 5.5, 2.4, rgb('#cf4f9f')); p.ell(8, 38, 4.4, 1.6, rgb('#ff7ec3')); p.rect(7, 14, 2, 24, rgb('#e59a1a')); p.rect(7, 14, 1, 24, C['gold_hi'])
    p.poly([(1, 14), (15, 14), (12, 2), (4, 2)], rgb('#fff0a8')); p.rect(1, 13, 14, 2, C['gold']); p.rect(3, 2, 10, 1, C['gold_hi']); p.rect(7, 3, 2, 9, rgb('#fffadc'))
    p.outline(); return p


def night_light():
    p = Px(14, 18)
    p.ell(7, 8, 6, 6.4, rgb('#fff0a8')); p.ell(9, 7, 5, 5.4, rgb('#7a58c8')) if False else None
    p.ell(7, 8, 6, 6.4, rgb('#ffe27a')); p.ell(9.4, 7, 4.8, 5.2, rgb('#fff8d0'))
    for x, y in ((5, 5), (4, 9), (6, 12)): p.set(x, y, W)
    p.set(8, 7, C['ol']); p.rect(3, 15, 8, 3, rgb('#a06bff')); p.rect(3, 15, 8, 1, rgb('#c9a8ff')); p.outline(); return p


def bookshelf():
    p = Px(32, 38)
    p.rect(1, 1, 30, 36, rgb('#a8693a')); p.rect(3, 3, 26, 32, rgb('#6f4326')); p.rect(1, 1, 30, 2, rgb('#d28f55'))
    for y in (3, 15, 27): p.rect(3, y + 8, 26, 3, rgb('#d28f55'))
    cols = ['#ff5a6e', '#3ea6ff', '#ffe14d', '#5ccf59', '#a06bff', '#ff9a3c', '#ff7ec3']
    for row, y in enumerate((5, 17, 29)):
        x = 4
        for i in range(7):
            w = 3 + (i + row) % 2; h = 5 + (i * 3 + row) % 3
            p.rect(x, y + 6 - h + (1 if True else 0), w, h, rgb(cols[(i + row * 2) % 7])); p.set(x, y + 6 - h + 1, W); x += w + 1
            if x > 26: break
    p.ell(24, 9, 1.4, 1.4, rgb('#ffd93d')); p.outline(); return p


def star_banner():
    p = Px(32, 24)
    p.line(1, 3, 30, 3, rgb('#e59a1a')); p.line(1, 2, 30, 2, C['gold'])
    for i, (x, col) in enumerate(((3, '#ff7ec3'), (13, '#8fd8ff'), (23, '#c9a8ff'))):
        p.poly([(x, 4), (x + 8, 4), (x + 4, 18)], rgb(col)); p.rect(x, 4, 8, 1, W); _star_poly(p, x + 4, 8, 2.6, 1.1, C['gold_hi'])
    p.outline(); return p


def flower_wreath():
    import math
    p = Px(20, 20)
    for i in range(16):
        a = i * math.pi / 8
        p.ell(10 + math.cos(a) * 6.6, 10 + math.sin(a) * 6.6, 2.4, 2.4, C['green'] if i % 2 else C['green_hi'])
    for i, col in enumerate(('#ff7ec3', '#ffe14d', '#ffffff', '#8fd8ff', '#ff9a3c', '#c9a8ff')):
        a = i * math.pi / 3 + 0.3
        p.ell(10 + math.cos(a) * 6.6, 10 + math.sin(a) * 6.6, 1.9, 1.9, rgb(col))
    p.rect(8, 15, 4, 3, rgb('#ff7ec3')); p.rect(8, 15, 4, 1, rgb('#ffb8e2')); p.outline(); return p


DECOR2 = [('sunny_bed', sunny_bed), ('round_table', round_table), ('square_table', square_table), ('tea_table', tea_table), ('bean_bag', bean_bag), ('star_stool', star_stool),
          ('heart_rug', heart_rug), ('leafy_plant', leafy_plant), ('sunflower_pot', sunflower_pot), ('tulip_pot', tulip_pot), ('daisy_pot', daisy_pot), ('cactus_pot', cactus_pot),
          ('beach_ball', beach_ball), ('rainbow_ball', rainbow_ball), ('teddy_bear', teddy_bear), ('kitty_plush', kitty_plush), ('duck_plush', duck_plush), ('rag_doll', rag_doll),
          ('ballerina_doll', ballerina_doll), ('toy_blocks', toy_blocks), ('floor_lamp', floor_lamp), ('night_light', night_light), ('bookshelf', bookshelf),
          ('star_banner', star_banner), ('flower_wreath', flower_wreath)]
