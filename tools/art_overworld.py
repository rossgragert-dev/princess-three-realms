"""Overworld (24x32) princess with six hairstyles + tiara overlays, drawn in recolourable marker colours.
Frame layout is identical to the original `princess` sheet (rows down/up/left/right; cols idle0 idle1 walk0-3 cast0 cast1)."""
from pxlib import Px, C, rgb
from art_wardrobe import DM, HM, SM, GOLD, GOLD_HI, GOLD_SH, W, PINK, PINK_HI, PINK_SH, BLUE, PURPLE_HI, GREEN, GREEN_DK, YELLOW, PEARL, PEARL_SH, OL

EYE = rgb('#4b2d94')
STYLES = ['long', 'bob', 'ponytail', 'braids', 'bun', 'curls']
CROWNS = ['gold_tiara', 'pearl_crown', 'star_tiara', 'flower_crown', 'bunny_ribbon', 'butterfly_clip']


def princess_ow(d, kind, f, style='long'):
    p = Px(24, 32)
    walk = kind == 'walk'
    lift = -1 if (walk and f in (1, 3)) else 0
    head_dy = -1 if (kind == 'idle' and f == 1) else lift
    cx = 12
    foot = [(0, 0), (0, 0)]
    if walk:
        foot = [(0, 0), (0, 0)] if f in (0, 2) else ([(0, -1), (0, 0)] if f == 1 else [(0, 0), (0, -1)])
    swing = [0, 1, 0, -1][f % 4] if walk else 0
    HAIR, HAIR_HI, HAIR_SH = HM[1], HM[0], HM[2]
    SKIN, SKIN_SH = SM[1], SM[2]
    D, D_HI, D_SH = DM[1], DM[0], DM[2]

    def dress(w0, back=False):
        for y in range(19 + lift, 28 + lift):
            hw = w0 + (y - 19 - lift) * 0.55
            for x in range(int(cx - hw), int(cx + hw) + 1):
                col = D_HI if y < 22 + lift else D
                if x > cx + hw - 2:
                    col = D_SH
                p.set(x, y, col)
        p.rect(cx - 5, 22 + lift, 10, 1, C['purple'])  # sash
        if back:
            p.rect(cx - 2, 21 + lift, 2, 2, C['purple_hi']); p.rect(cx, 21 + lift, 2, 2, C['purple_hi'])
        for x in range(cx - 8, cx + 8, 2):  # scalloped cream hem
            p.set(x, 27 + lift, C['cream']); p.set(x + 1, 27 + lift, C['cream'])
        p.rect(cx - 7, 28 + lift, 14, 1, C['cream_sh'])

    def shoes():
        (a, b), (c, e) = foot
        p.rect(8, 29 + b, 3, 2, C['purple']); p.rect(13, 29 + e, 3, 2, C['purple'])
        p.set(8, 29 + b, C['purple_hi']); p.set(13, 29 + e, C['purple_hi'])

    hy = head_dy
    # ---------------------------------------------------------------- hair silhouettes per style
    def back_mass_down(long_to):
        p.ell(cx, 11 + hy, 8.5, 8.3, HAIR)
        if long_to:
            p.rect(4, 12 + hy, 16, long_to, HAIR)

    if d == 'down':
        if style == 'long':
            back_mass_down(10)
        elif style == 'bob':
            back_mass_down(6)
            p.ell(5, 18 + hy, 2.4, 2.2, HAIR); p.ell(19, 18 + hy, 2.4, 2.2, HAIR)
        elif style == 'ponytail':
            back_mass_down(3)
            p.rect(19, 5 + hy, 3, 3, HAIR); p.rect(20, 8 + hy, 3, 9, HAIR); p.rect(20, 15 + hy, 2, 3, HAIR_SH)
        elif style == 'braids':
            back_mass_down(5)
        elif style == 'bun':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(5, 12 + hy, 14, 4, HAIR)
            p.ell(cx, 2.4 + hy, 3.3, 3, HAIR); p.rect(9, 4 + hy, 6, 1, PINK)
        else:  # curls
            p.ell(cx, 10.5 + hy, 10, 8.8, HAIR); p.rect(3, 12 + hy, 18, 7, HAIR)
            for x in (3, 7, 12, 16, 20): p.ell(x, 19.5 + hy, 2.6, 2.4, HAIR)
        p.ell(cx, 12.6 + hy, 6.3, 5.8, SKIN)
        p.ell(cx, 7.8 + hy, 7.2, 3.3, HAIR)
        for x in (9, 10, 13, 14):
            p.set(x, 10 + hy, HAIR)
        if style in ('long',):
            p.rect(5, 11 + hy, 2, 10, HAIR); p.rect(17, 11 + hy, 2, 10, HAIR)
        elif style == 'bob':
            p.rect(5, 11 + hy, 2, 7, HAIR); p.rect(17, 11 + hy, 2, 7, HAIR)
        elif style == 'ponytail':
            p.rect(5, 11 + hy, 2, 5, HAIR); p.rect(17, 11 + hy, 2, 5, HAIR)
        elif style == 'braids':
            for sx in (4, 18):
                for k, y in enumerate(range(12 + hy, 25 + hy)):
                    p.rect(sx, y, 2, 1, HAIR if k % 3 else HAIR_SH)
                p.rect(sx, 25 + hy, 2, 1, PINK); p.set(sx, 24 + hy, PINK_HI)
        elif style == 'bun':
            p.rect(5, 11 + hy, 2, 5, HAIR); p.rect(17, 11 + hy, 2, 5, HAIR)
        else:
            p.rect(4, 11 + hy, 2, 9, HAIR); p.rect(18, 11 + hy, 2, 9, HAIR)
            for y in (13, 16, 19): p.set(4, y + hy, HAIR_HI); p.set(19, y + hy, HAIR_HI)
        p.set(9, 6 + hy, HAIR_HI); p.set(10, 6 + hy, HAIR_HI); p.set(14, 6 + hy, HAIR_HI); p.set(6, 14 + hy, HAIR_HI)
        for ex in (9, 14):
            p.rect(ex, 12 + hy, 2, 3, EYE); p.set(ex, 12 + hy, C['white'])
        p.rect(8, 15 + hy, 2, 1, C['blush']); p.rect(15, 15 + hy, 2, 1, C['blush']); p.rect(11, 16 + hy, 2, 1, C['mouth'])
        p.rect(11, 18 + hy, 2, 1, SKIN_SH)
        dress(4)
        p.ell(7, 20.5 + lift, 2, 1.6, D_HI); p.ell(17, 20.5 + lift, 2, 1.6, D_HI)
        p.rect(6, 22 + lift + max(swing, 0), 2, 2, SKIN); p.rect(16, 22 + lift + max(-swing, 0), 2, 2, SKIN)
        shoes()
    elif d == 'up':
        if style == 'long':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(4, 12 + hy, 16, 11, HAIR)
        elif style == 'bob':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(4, 12 + hy, 16, 7, HAIR); p.ell(5, 19 + hy, 2.4, 2, HAIR); p.ell(19, 19 + hy, 2.4, 2, HAIR)
        elif style == 'ponytail':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(4, 12 + hy, 16, 3, HAIR)
            p.rect(10, 14 + hy, 4, 11, HAIR); p.rect(11, 22 + hy, 2, 3, HAIR_SH); p.ell(cx, 7 + hy, 2.4, 2, PINK)
        elif style == 'braids':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(4, 12 + hy, 16, 5, HAIR)
            for sx in (8, 14):
                for k, y in enumerate(range(15 + hy, 26 + hy)): p.rect(sx, y, 2, 1, HAIR if k % 3 else HAIR_SH)
                p.rect(sx, 26 + hy, 2, 1, PINK)
        elif style == 'bun':
            p.ell(cx, 11 + hy, 8.5, 8.3, HAIR); p.rect(5, 12 + hy, 14, 5, HAIR)
            p.ell(cx, 2.8 + hy, 3.3, 3, HAIR); p.rect(9, 4 + hy, 6, 1, PINK)
        else:
            p.ell(cx, 10.5 + hy, 10, 8.8, HAIR); p.rect(3, 12 + hy, 18, 9, HAIR)
            for x in (3, 7, 12, 16, 20): p.ell(x, 21.5 + hy, 2.6, 2.4, HAIR)
        for x in (8, 11, 14):
            p.rect(x, 7 + hy, 1, 8 if style != 'long' else 12, HAIR_HI if x == 11 else HAIR_SH)
        if style == 'long':
            p.rect(10, 14 + hy, 4, 2, PINK); p.set(9, 13 + hy, PINK_HI); p.set(14, 13 + hy, PINK_HI)
        dress(4, back=True)
        p.ell(7, 20.5 + lift, 2, 1.6, D_HI); p.ell(17, 20.5 + lift, 2, 1.6, D_HI)
        p.rect(6, 22 + lift + max(-swing, 0), 2, 2, SKIN); p.rect(16, 22 + lift + max(swing, 0), 2, 2, SKIN)
        shoes()
    else:  # left
        sway = [0, 1, 0, -1][f % 4] if (walk or f == 1) else 0
        if style == 'long':
            p.ell(14, 11 + hy, 7.2, 8, HAIR); p.rect(14 + sway, 13 + hy, 5, 9, HAIR)
            p.rect(18 + sway, 19 + hy, 2, 4, HAIR_SH); p.set(19 + sway, 22 + hy, HAIR_HI)
        elif style == 'bob':
            p.ell(14, 11 + hy, 7.2, 8, HAIR); p.rect(14, 13 + hy, 5, 5, HAIR); p.ell(17, 18.4 + hy, 3.4, 2.2, HAIR)
        elif style == 'ponytail':
            p.ell(14, 11 + hy, 7.2, 8, HAIR); p.rect(18, 6 + hy, 3, 3, HAIR); p.rect(19 + sway, 9 + hy, 3, 10, HAIR); p.rect(20 + sway, 17 + hy, 2, 3, HAIR_SH); p.set(19, 6 + hy, PINK)
        elif style == 'braids':
            p.ell(14, 11 + hy, 7.2, 8, HAIR); p.rect(14, 13 + hy, 4, 4, HAIR)
            for k, y in enumerate(range(14 + hy, 26 + hy)): p.rect(16 + sway, y, 2, 1, HAIR if k % 3 else HAIR_SH)
            p.rect(16 + sway, 26 + hy, 2, 1, PINK)
        elif style == 'bun':
            p.ell(14, 11 + hy, 7.2, 8, HAIR); p.rect(14, 13 + hy, 4, 3, HAIR)
            p.ell(15, 2.6 + hy, 3.3, 3, HAIR); p.rect(13, 4 + hy, 5, 1, PINK)
        else:
            p.ell(14, 10.5 + hy, 8.4, 8.6, HAIR); p.rect(13 + sway, 13 + hy, 7, 7, HAIR)
            for k in range(3): p.ell(19 + sway, 14 + hy + k * 3, 2.6, 2.2, HAIR if k != 1 else HAIR_HI)
        p.ell(10, 12.6 + hy, 5.6, 5.8, SKIN)
        p.ell(11, 7.8 + hy, 6.6, 3.3, HAIR); p.rect(14, 8 + hy, 3, 7, HAIR)
        p.set(6, 10 + hy, HAIR); p.set(7, 10 + hy, HAIR)
        p.rect(7, 12 + hy, 2, 3, EYE); p.set(7, 12 + hy, C['white'])
        p.rect(6, 15 + hy, 2, 1, C['blush']); p.set(7, 16 + hy, C['mouth'])
        dress(3.4)
        p.ell(11, 21 + lift, 1.8, 1.8, D_HI); p.rect(10, 22 + lift + max(swing, 0), 2, 2, SKIN)
        (a, b), (c, e) = foot
        p.rect(7, 29 + b, 3, 2, C['purple']); p.rect(12, 29 + e, 3, 2, C['purple'])
    if kind == 'cast':
        side = 6 if d == 'left' else 18
        hi = f == 1
        p.rect(side if d != 'left' else 6, 17 + lift, 2, 3, D_HI)
        tx = side + (-3 if d == 'left' else 3)
        p.line(side + 1, 17, tx, 12 if hi else 15, SKIN)
        p.line(tx, 12 if hi else 15, tx + (-1 if d == 'left' else 1), 6 if hi else 10, C['wood'])
        sx, sy = tx + (-1 if d == 'left' else 1), (5 if hi else 9)
        p.rect(sx - 1, sy - 1, 3, 3, C['gold']); p.set(sx, sy, C['white'])
        if hi:
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                p.set(sx - 3 + dx, sy - 2 + dy, C['gold_hi'] if (dx, dy) != (0, 0) else C['white'])
    p.outline(C['ol'])
    # soft ground shadow
    for y in range(p.h):
        for x in range(p.w):
            if p.p[y][x] is None and ((x + .5 - 12) / 7.5) ** 2 + ((y + .5 - 30.5) / 2) ** 2 <= 1:
                p.p[y][x] = (60, 30, 90, 70)
    return p


def crown_ow(d, kind, f, tid):
    """Tiara overlay with the same per-frame head bob as the body; transparent elsewhere."""
    p = Px(24, 32)
    walk = kind == 'walk'
    lift = -1 if (walk and f in (1, 3)) else 0
    hy = -1 if (kind == 'idle' and f == 1) else lift
    if d == 'left':
        x0, w = 7, 7
    else:
        x0, w = 8, 8
    y0 = 3 + hy
    if tid == 'gold_tiara':
        p.rect(x0, y0 + 1, w, 2, GOLD)
        for i in (0, w // 2 - 1, w // 2, w - 1): p.set(x0 + i, y0, GOLD)
        p.set(x0 + w // 2 - 1, y0 - 1, GOLD_HI); p.set(x0 + w // 2, y0 - 1, GOLD_HI)
        p.set(x0 + 1, y0 + 1, GOLD_HI)
        if d != 'up':
            p.set(x0 + w // 2 - 1, y0 + 1, PINK); p.set(x0 + w // 2, y0 + 1, BLUE)
        p.set(x0 + w - 2, y0 + 1, GOLD_HI)
    elif tid == 'pearl_crown':
        p.rect(x0, y0 + 2, w, 1, GOLD)
        for i in range(0, w, 2): p.set(x0 + i, y0 + 1, PEARL); p.set(x0 + i, y0, W) if i % 4 == 0 else None
        p.set(x0 + w // 2, y0 - 1, W)
    elif tid == 'star_tiara':
        p.rect(x0, y0 + 2, w, 1, GOLD)
        p.set(x0 + w // 2 - 1, y0 + 1, GOLD); p.set(x0 + w // 2, y0 + 1, GOLD)
        p.rect(x0 + w // 2 - 1, y0 - 1, 2, 2, GOLD_HI); p.set(x0 + w // 2 - 1, y0 - 2, GOLD_HI); p.set(x0 + w // 2, y0 - 2, W)
        p.set(x0 + 1, y0 + 1, GOLD_HI); p.set(x0 + w - 2, y0 + 1, GOLD_HI)
    elif tid == 'flower_crown':
        for i in range(0, w):
            p.set(x0 + i, y0 + 2, GREEN)
        for i, c in zip((0, 2, 4, 6), (PINK, W, PURPLE_HI, PINK_HI)):
            if i < w: p.rect(x0 + i, y0 + 1, 2, 2, c); p.set(x0 + i, y0 + 1, YELLOW) if i % 4 == 0 else None
    elif tid == 'bunny_ribbon':
        bx = x0 + 1 if d != 'left' else x0 + 4
        for k in range(3):
            p.set(bx - 1, y0 - k + 1, PINK); p.set(bx, y0 - k + 1, PINK_HI) if k < 2 else None
            p.set(bx + 3, y0 - k + 1, PINK); p.set(bx + 4, y0 - k + 1, PINK_HI) if k < 2 else None
        p.rect(bx + 1, y0 + 1, 2, 2, PINK_SH)
    elif tid == 'butterfly_clip':
        bx = x0 + w - 2 if d != 'left' else x0 + 1
        p.set(bx - 1, y0 + 1, BLUE); p.set(bx - 1, y0 + 2, PURPLE_HI); p.set(bx + 1, y0 + 1, BLUE); p.set(bx + 1, y0 + 2, PURPLE_HI); p.set(bx, y0 + 1, OL)
    p.outline(OL)
    # remove the outline where it touches nothing meaningful? keep: it frames the ornament
    return p
