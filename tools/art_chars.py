"""Characters: princess (24x32), unicorn (32x32), mermaid (32x32), NPCs (32x32), Whispering Tree (48x64).
Direction order in every sheet: down, up, left, right (right is a mirrored left)."""
import math
from pxlib import Px, C, rgb, mix, P

EYE = rgb('#4b2d94')
RAINBOW = ['pink', 'purple', 'blue', 'teal', 'green', 'yellow']


def shadow(px, cx, cy, rx, ry):
    for y in range(px.h):
        for x in range(px.w):
            if px.p[y][x] is None and ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                px.p[y][x] = (60, 30, 90, 70)


def sparkle(px, x, y, c='gold_hi'):
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
        px.set(x + dx, y + dy, C[c] if (dx, dy) != (0, 0) else C['white'])


# ---------------------------------------------------------------- princess
def princess(d, kind, f):
    p = Px(24, 32)
    walk = kind == 'walk'
    lift = -1 if (walk and f in (1, 3)) else 0
    head_dy = -1 if (kind == 'idle' and f == 1) else lift
    cx = 12
    foot = [(0, 0), (0, 0)]
    if walk:
        foot = [(0, 0), (0, 0)] if f in (0, 2) else ([(0, -1), (0, 0)] if f == 1 else [(0, 0), (0, -1)])
    swing = [0, 1, 0, -1][f % 4] if walk else 0

    def dress(w0, back=False):
        for y in range(19 + lift, 28 + lift):
            hw = w0 + (y - 19 - lift) * 0.55
            for x in range(int(cx - hw), int(cx + hw) + 1):
                col = C['pink_hi'] if y < 22 + lift else C['pink']
                if x > cx + hw - 2:
                    col = C['pink_sh']
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

    def crown(x0, y0, w=8):
        p.rect(x0, y0 + 1, w, 2, C['gold'])
        for i in (0, w // 2 - 1, w // 2, w - 1):
            p.set(x0 + i, y0, C['gold'])
        p.set(x0 + w // 2 - 1, y0 - 1, C['gold_hi']); p.set(x0 + w // 2, y0 - 1, C['gold_hi'])
        p.set(x0 + 1, y0 + 1, C['gold_hi']); p.set(x0 + w // 2 - 1, y0 + 1, C['pink']); p.set(x0 + w // 2, y0 + 1, C['blue'])
        p.set(x0 + w - 2, y0 + 1, C['gold_hi'])

    hy = head_dy
    if d == 'down':
        p.ell(cx, 11 + hy, 8.5, 8.3, C['hair']); p.rect(4, 12 + hy, 16, 10, C['hair'])
        p.ell(cx, 12.6 + hy, 6.3, 5.8, C['skin'])
        p.ell(cx, 7.8 + hy, 7.2, 3.3, C['hair'])
        for x in (9, 10, 13, 14):
            p.set(x, 10 + hy, C['hair'])
        p.rect(5, 11 + hy, 2, 10, C['hair']); p.rect(17, 11 + hy, 2, 10, C['hair'])
        p.set(9, 6 + hy, C['hair_hi']); p.set(10, 6 + hy, C['hair_hi']); p.set(14, 6 + hy, C['hair_hi']); p.set(6, 14 + hy, C['hair_hi'])
        for ex in (9, 14):
            p.rect(ex, 12 + hy, 2, 3, EYE); p.set(ex, 12 + hy, C['white'])
        p.rect(8, 15 + hy, 2, 1, C['blush']); p.rect(15, 15 + hy, 2, 1, C['blush']); p.rect(11, 16 + hy, 2, 1, C['mouth'])
        crown(8, 3 + hy)
        p.rect(11, 18 + hy, 2, 1, C['skin_sh'])
        dress(4)
        p.ell(7, 20.5 + lift, 2, 1.6, C['pink_hi']); p.ell(17, 20.5 + lift, 2, 1.6, C['pink_hi'])
        p.rect(6, 22 + lift + max(swing, 0), 2, 2, C['skin']); p.rect(16, 22 + lift + max(-swing, 0), 2, 2, C['skin'])
        shoes()
    elif d == 'up':
        p.ell(cx, 11 + hy, 8.5, 8.3, C['hair']); p.rect(4, 12 + hy, 16, 11, C['hair'])
        for x in (8, 11, 14):
            p.rect(x, 7 + hy, 1, 12, C['hair_hi'] if x == 11 else C['hair_sh'])
        p.rect(10, 14 + hy, 4, 2, C['pink']); p.set(9, 13 + hy, C['pink_hi']); p.set(14, 13 + hy, C['pink_hi'])
        crown(8, 3 + hy)
        dress(4, back=True)
        p.ell(7, 20.5 + lift, 2, 1.6, C['pink_hi']); p.ell(17, 20.5 + lift, 2, 1.6, C['pink_hi'])
        p.rect(6, 22 + lift + max(-swing, 0), 2, 2, C['skin']); p.rect(16, 22 + lift + max(swing, 0), 2, 2, C['skin'])
        shoes()
    else:  # left
        sway = [0, 1, 0, -1][f % 4] if (walk or f == 1) else 0
        p.ell(14, 11 + hy, 7.2, 8, C['hair']); p.rect(14 + sway, 13 + hy, 5, 9, C['hair'])
        p.rect(18 + sway, 19 + hy, 2, 4, C['hair_sh']); p.set(19 + sway, 22 + hy, C['hair_hi'])
        p.ell(10, 12.6 + hy, 5.6, 5.8, C['skin'])
        p.ell(11, 7.8 + hy, 6.6, 3.3, C['hair']); p.rect(14, 8 + hy, 3, 7, C['hair'])
        p.set(6, 10 + hy, C['hair']); p.set(7, 10 + hy, C['hair'])
        p.rect(7, 12 + hy, 2, 3, EYE); p.set(7, 12 + hy, C['white'])
        p.rect(6, 15 + hy, 2, 1, C['blush']); p.set(7, 16 + hy, C['mouth'])
        crown(7, 3 + hy, 7)
        dress(3.4)
        p.ell(11, 21 + lift, 1.8, 1.8, C['pink_hi']); p.rect(10, 22 + lift + max(swing, 0), 2, 2, C['skin'])
        (a, b), (c, e) = foot
        p.rect(7, 29 + b, 3, 2, C['purple']); p.rect(12, 29 + e, 3, 2, C['purple'])
    if kind == 'cast':
        side = 6 if d == 'left' else 18
        hi = f == 1
        p.rect(side if d != 'left' else 6, 17 + lift, 2, 3, C['pink_hi'])
        tx = side + (-3 if d == 'left' else 3)
        p.line(side + 1, 17, tx, 12 if hi else 15, C['skin'])
        p.line(tx, 12 if hi else 15, tx + (-1 if d == 'left' else 1), 6 if hi else 10, C['wood'])
        sx, sy = tx + (-1 if d == 'left' else 1), (5 if hi else 9)
        p.rect(sx - 1, sy - 1, 3, 3, C['gold']); p.set(sx, sy, C['white'])
        if hi:
            sparkle(p, sx - 3, sy - 2); sparkle(p, sx + 3, sy + 1, 'pink_hi')
    p.outline(C['ol'])
    shadow(p, 12, 30.5, 7.5, 2)
    return p


# ---------------------------------------------------------------- unicorn
def mane_strand(p, pts, r=1.8):
    for i, (x, y) in enumerate(pts):
        p.ell(x, y, r, r, C[RAINBOW[i % 6]])


def horn(p, x, y0, y1, w=1):
    for y in range(y0, y1 + 1):
        t = (y - y0) / max(1, (y1 - y0))
        hw = max(0, int(round(w * t)))
        for x2 in range(x - hw, x + hw + 1):
            p.set(x2, y, C['gold_hi'] if (y % 2 == 0) else C['gold'])
    p.set(x, y0, C['white'])


def rainbow_arc(p, cx, cy, f):
    r0 = 7 + f * 2
    for i, c in enumerate(['red', 'orange', 'yellow', 'green', 'blue', 'purple']):
        r = r0 + i
        for a in range(200, 341, 4):
            x = cx + r * math.cos(math.radians(a)); y = cy + r * 0.8 * math.sin(math.radians(a))
            p.set(int(round(x)), int(round(y)), C[c])


def unicorn(d, kind, f):
    p = Px(32, 32)
    g = kind in ('walk', 'gallop')
    ph = f % 4
    bob = -1 if (g and ph in (1, 3)) else 0
    if kind == 'idle' and f == 1:
        bob = -1
    W, WS = C['white'], mix('#ffffff', '#cdbfff', .6)
    if d == 'left':
        legs = {0: (0, 0, 0, 0), 1: (-2, 1, 2, -1), 2: (0, 0, 0, 0), 3: (2, -1, -2, 1)}[ph] if g else (0, 0, 0, 0)
        if kind == 'gallop':
            legs = {0: (-3, -1, 3, 1), 1: (-1, 0, 1, 0), 2: (3, 1, -3, -1), 3: (1, 0, -1, 0)}[ph]
        fl, fr, hl, hr = legs
        for lx, off in ((10, fl), (13, fr), (22, hl), (25, hr)):
            p.rect(lx + off, 22 + bob, 2, 6, W if lx in (13, 25) else WS)
            p.rect(lx + off, 27, 2, 2, C['gold'])
        p.ell(18, 19 + bob, 9.5, 5.5, W); p.rect(10, 22 + bob, 17, 2, WS)
        p.poly([(9, 18 + bob), (12, 12 + bob), (16, 14 + bob), (15, 21 + bob)], W)
        p.ell(7, 12 + bob, 4.4, 3.8, W); p.ell(4.3, 14.2 + bob, 2.6, 2.2, mix('#ffffff', '#ffc7e6', .5))
        p.set(3, 14 + bob, C['pink']); p.poly([(9, 8 + bob), (10, 4 + bob), (12, 9 + bob)], W); p.set(10, 7 + bob, C['pink_hi'])
        mane_strand(p, [(11, 8 + bob), (12, 10 + bob), (13, 12 + bob), (14, 14 + bob), (14, 16 + bob), (15, 18 + bob)], 2.1)
        mane_strand(p, [(9, 6 + bob), (11, 7 + bob)], 1.7)
        horn(p, 6, 3 + bob, 8 + bob)
        p.rect(5, 11 + bob, 2, 3, EYE); p.set(5, 11 + bob, C['white']); p.set(4, 14 + bob, C['blush']); p.set(5, 15 + bob, C['mouth'])
        tw = 1 if (g and ph in (1, 2)) else 0
        mane_strand(p, [(27, 16 + bob), (29, 18 + bob + tw), (30, 21 + bob), (29, 24 + bob - tw), (28, 26 + bob)], 2.2)
        p.set(15, 6 + bob, C['gold']); p.rect(6, 7 + bob, 3, 1, C['gold'])  # little crown band
    elif d == 'down':
        for lx, off in ((11, 0), (18, 0)):
            o = (-1 if (g and ph in (1,)) else (1 if (g and ph == 3) else 0)) * (1 if lx == 11 else -1)
            p.rect(lx, 25 + o, 3, 5, W); p.rect(lx, 28, 3, 2, C['gold'])
        p.ell(16, 21 + bob, 7.2, 6.2, W); p.rect(10, 24 + bob, 12, 2, WS)
        p.rect(13, 16 + bob, 6, 5, W)
        p.poly([(9, 8 + bob), (11, 3 + bob), (13, 7 + bob)], W); p.poly([(19, 7 + bob), (21, 3 + bob), (23, 8 + bob)], W)
        p.set(11, 5 + bob, C['pink_hi']); p.set(21, 5 + bob, C['pink_hi'])
        p.ell(16, 11 + bob, 7.2, 6.4, W); p.ell(16, 15.5 + bob, 3.6, 2.2, mix('#ffffff', '#ffc7e6', .5))
        mane_strand(p, [(8, 9 + bob), (7, 12 + bob), (7, 15 + bob), (8, 18 + bob)], 2)
        mane_strand(p, [(24, 9 + bob), (25, 12 + bob), (25, 15 + bob), (24, 18 + bob)], 2)
        mane_strand(p, [(13, 6 + bob), (15, 5 + bob), (17, 5 + bob), (19, 6 + bob)], 1.9)
        horn(p, 16, 0 + bob, 6 + bob, 1)
        for ex in (11, 19):
            p.rect(ex, 10 + bob, 2, 3, EYE); p.set(ex, 10 + bob, C['white'])
        p.rect(9, 13 + bob, 2, 1, C['blush']); p.rect(21, 13 + bob, 2, 1, C['blush'])
        p.set(15, 15 + bob, C['pink_sh']); p.set(17, 15 + bob, C['pink_sh']); p.rect(15, 17 + bob, 2, 1, C['mouth'])
    else:  # up
        for lx in (11, 18):
            o = (-1 if (g and ph == 1) else (1 if (g and ph == 3) else 0)) * (1 if lx == 11 else -1)
            p.rect(lx, 25 + o, 3, 5, W); p.rect(lx, 28, 3, 2, C['gold'])
        p.ell(16, 19 + bob, 8.2, 7, W)
        p.poly([(9, 8 + bob), (11, 3 + bob), (13, 7 + bob)], W); p.poly([(19, 7 + bob), (21, 3 + bob), (23, 8 + bob)], W)
        p.ell(16, 10 + bob, 6.8, 5.8, C['pink'])
        for i, c in enumerate(RAINBOW):
            p.rect(9 + i * 2, 6 + bob, 2, 9, C[c])
        mane_strand(p, [(16, 15 + bob), (16, 18 + bob), (16, 21 + bob), (16, 24 + bob)], 2.5)
        mane_strand(p, [(13, 17 + bob), (13, 21 + bob), (19, 18 + bob), (19, 22 + bob)], 1.8)
        horn(p, 16, 0 + bob, 5 + bob, 1)
    if kind == 'cast':
        rainbow_arc(p, 16, 12, f)
        sparkle(p, 6 + f * 18, 4); sparkle(p, 26 - f * 12, 9, 'pink_hi')
    p.outline(C['ol'])
    shadow(p, 16, 30, 11, 2)
    return p


# ---------------------------------------------------------------- mermaid
def mermaid(d, kind, f):
    p = Px(32, 32)
    ph = f % 4
    wag = [0, 1, 0, -1][ph] if kind in ('swim',) else ([0, 1, 0, -1][ph] if kind == 'idle' else 0)
    bob = -1 if (kind == 'idle' and f == 1) else 0
    tail_main, tail_hi, tail_dk = C['teal'], C['teal_hi'], C['teal_sh']

    def tail_down(back=False):
        for y in range(18, 29):
            t = (y - 18) / 10
            hw = 5.2 - 2.2 * t
            xc = 16 + wag * t * 3
            for x in range(int(xc - hw), int(xc + hw) + 1):
                col = tail_main
                if int(y + x) % 4 == 0:
                    col = tail_hi
                if x > xc + hw - 1.4:
                    col = tail_dk
                p.set(x, y, col)
        xe = 16 + wag * 3
        p.ell(xe - 4.5, 29.5, 4, 2.3, C['purple']); p.ell(xe + 4.5, 29.5, 4, 2.3, C['purple'])
        p.ell(xe - 4.5, 29, 2.6, 1.2, C['purple_hi']); p.ell(xe + 4.5, 29, 2.6, 1.2, C['purple_hi'])

    if d in ('down', 'up'):
        tail_down()
        p.ell(16, 16 + bob, 4.2, 3.6, C['skin'])
        p.ell(16, 9 + bob, 8.2, 8, C['hair'])
        p.rect(8, 10 + bob, 3, 11 + wag, C['hair']); p.rect(21, 10 + bob, 3, 11 - wag, C['hair'])
        p.set(9, 21 + bob + wag, C['hair_sh']); p.set(22, 21 + bob - wag, C['hair_sh'])
        if d == 'down':
            p.ell(16, 8.5 + bob, 5.6, 5.2, C['skin']); p.ell(16, 5 + bob, 6.4, 2.8, C['hair'])
            for ex in (13, 18):
                p.rect(ex, 8 + bob, 2, 3, EYE); p.set(ex, 8 + bob, C['white'])
            p.rect(12, 11 + bob, 2, 1, C['blush']); p.rect(19, 11 + bob, 2, 1, C['blush']); p.rect(15, 12 + bob, 2, 1, C['mouth'])
            p.ell(14, 15.5 + bob, 2.4, 2, C['pink']); p.ell(18, 15.5 + bob, 2.4, 2, C['pink'])
            p.set(14, 15 + bob, C['pink_hi']); p.set(18, 15 + bob, C['pink_hi'])
        else:
            p.rect(10, 6 + bob, 12, 10, C['hair']); p.rect(14, 8 + bob, 1, 8, C['hair_hi']); p.rect(18, 8 + bob, 1, 8, C['hair_sh'])
        p.rect(12, 1 + bob, 8, 2, C['gold']); p.set(12, 0 + bob, C['gold']); p.set(19, 0 + bob, C['gold'])
        p.set(15, 0 + bob, C['gold_hi']); p.set(16, 0 + bob, C['gold_hi']); p.set(15, 1 + bob, C['pink']); p.set(16, 1 + bob, C['blue'])
        aw = wag
        p.line(12, 17, 8, 19 + aw, C['skin']); p.line(20, 17, 24, 19 - aw, C['skin'])
        p.rect(7, 19 + aw, 2, 2, C['skin']); p.rect(23, 19 - aw, 2, 2, C['skin'])
        if kind == 'bubble':
            p.line(12, 17, 10, 12, C['skin']); p.line(20, 17, 22, 12, C['skin'])
            for bx, by, br in ((9, 8 - f, 2.2), (23, 7 - f * 2, 2.8), (16, 2 - f, 1.6)):
                p.ell(bx, by, br, br, C['blue_hi']); p.set(int(bx - 1), int(by - 1), C['white'])
    else:  # left
        for i in range(12):
            t = i / 11
            x = 17 + i * 1.2
            y = 17 + math.sin(t * 3.0 + wag * .8) * 2.2 + t * 1.5
            hw = 4.2 - 2.6 * t
            p.ell(x, y, 2.6 - 1.4 * t + .8, hw, tail_main if i % 3 else tail_hi)
            p.set(int(x), int(y + hw - 1), tail_dk)
        xe, ye = 31, 18 + wag
        p.poly([(29, int(ye)), (31, int(ye) - 6), (31, int(ye) + 6)], C['purple']); p.line(30, int(ye), 31, int(ye) - 4, C['purple_hi'])
        p.ell(14, 15 + bob, 4.6, 3.8, C['skin']); p.ell(14, 15 + bob, 2.2, 2.4, C['pink'])
        p.ell(15, 9 + bob, 7, 7.2, C['hair'])
        for k in range(3):
            p.ell(20 + k * 3, 11 + k * 3 + wag * (1 if k % 2 else -1) * .6, 3, 2.4, C['hair'] if k != 1 else C['hair_hi'])
        p.ell(11.5, 9.6 + bob, 5.2, 5, C['skin']); p.ell(13, 5.6 + bob, 6, 2.8, C['hair'])
        p.rect(8, 9 + bob, 2, 3, EYE); p.set(8, 9 + bob, C['white']); p.rect(7, 12 + bob, 2, 1, C['blush']); p.set(8, 13 + bob, C['mouth'])
        p.rect(9, 1 + bob, 6, 2, C['gold']); p.set(9, 0 + bob, C['gold']); p.set(14, 0 + bob, C['gold']); p.set(11, 1 + bob, C['pink']); p.set(12, 1 + bob, C['blue'])
        hand_y = 17 + (wag if kind != 'bubble' else -2)
        p.line(11, 16, 6, hand_y, C['skin']); p.rect(4, hand_y - 1, 2, 2, C['skin'])
        if kind == 'bubble':
            for bx, by, br in ((2, 13 - f, 2.2), (4, 8 - f * 2, 1.7)):
                p.ell(bx, by, br, br, C['blue_hi']); p.set(int(bx - 1), int(by - 1), C['white'])
    p.outline(C['ol'])
    return p


# ---------------------------------------------------------------- NPCs (3 frames: idle0, idle1, react)
def _npc_frames(fn):
    return [fn(0), fn(1), fn(2)]


def pip(f):
    p = Px(32, 32)
    up = -3 if f == 2 else 0
    ear_t = 1 if f == 1 else 0
    p.ell(16, 22 + up, 7.2, 6.4, C['white']); p.ell(16, 24 + up, 4, 3.2, C['pink_hi'])
    p.ell(24, 26 + up, 2.6, 2.6, C['pink_hi'])
    p.rect(11, 27 + up, 4, 3, C['white']); p.rect(17, 27 + up, 4, 3, C['white']); p.rect(11, 29 + up, 4, 1, C['pink_hi']); p.rect(17, 29 + up, 4, 1, C['pink_hi'])
    p.ell(11 - ear_t, 5 + up, 2.6, 6.5, C['white']); p.ell(21 + ear_t, 5 + up, 2.6, 6.5, C['white'])
    p.ell(11 - ear_t, 6 + up, 1.3, 4.5, C['pink']); p.ell(21 + ear_t, 6 + up, 1.3, 4.5, C['pink'])
    p.ell(16, 14 + up, 7.2, 6.4, C['white'])
    for ex in (12, 19):
        p.rect(ex, 12 + up, 2, 3, EYE); p.set(ex, 12 + up, C['white'])
    p.set(15, 16 + up, C['pink_sh']); p.set(16, 16 + up, C['pink_sh']); p.rect(14, 18 + up, 4, 1, C['mouth']) if f == 2 else p.set(16, 17 + up, C['mouth'])
    p.rect(10, 16 + up, 2, 1, C['blush']); p.rect(21, 16 + up, 2, 1, C['blush'])
    p.rect(11, 20 + up, 10, 2, C['orange']); p.rect(11, 20 + up, 10, 1, C['yellow']); p.rect(19, 22 + up, 2, 3, C['orange'])
    if f == 2:
        p.rect(8, 20 + up, 2, 4, C['white']); p.rect(22, 20 + up, 2, 4, C['white'])
    p.outline(C['ol']); shadow(p, 16, 30.5, 8, 2)
    return p


def willa(f):
    p = Px(32, 32)
    hv = [0, 1, 0][f] - (2 if f == 2 else 0)
    wing = C['blue_hi'] if f != 1 else mix('#8fd8ff', '#ffffff', .5)
    wy = 12 + hv - (2 if f == 1 else 0)
    p.ell(9, wy, 5, 8, wing); p.ell(23, wy, 5, 8, wing); p.ell(10, wy + 5, 3, 4, C['pink_hi']); p.ell(22, wy + 5, 3, 4, C['pink_hi'])
    p.ell(9, wy - 1, 2, 4, C['white']); p.ell(23, wy - 1, 2, 4, C['white'])
    p.poly([(12, 18 + hv), (20, 18 + hv), (23, 28 + hv), (9, 28 + hv)], C['purple'])
    p.poly([(12, 18 + hv), (16, 18 + hv), (16, 28 + hv), (9, 28 + hv)], C['purple_hi'])
    p.rect(9, 27 + hv, 14, 1, C['pink_hi'])
    p.rect(14, 29 + hv, 2, 2, C['skin']); p.rect(17, 29 + hv, 2, 2, C['skin'])
    p.ell(16, 11 + hv, 7.3, 7, C['purple_hi']); p.ell(16, 12.4 + hv, 5.3, 4.8, C['skin'])
    p.ell(16, 8 + hv, 6.5, 2.8, C['purple_hi']); p.set(16, 5 + hv, C['pink'])
    for ex in (13, 18):
        p.rect(ex, 12 + hv, 2, 2, EYE); p.set(ex, 12 + hv, C['white'])
    p.rect(12, 15 + hv, 2, 1, C['blush']); p.rect(19, 15 + hv, 2, 1, C['blush']); p.rect(15, 16 + hv, 2, 1, C['mouth'])
    p.line(22, 20 + hv, 27, 14 + hv, C['wood']); p.rect(26, 11 + hv, 3, 3, C['gold']); p.set(27, 12 + hv, C['white'])
    p.outline(C['ol'])
    if f == 2:
        sparkle(p, 4, 4); sparkle(p, 28, 6, 'pink_hi'); sparkle(p, 3, 22, 'blue_hi')
    return p


def bramble(f):
    p = Px(32, 32)
    up = -2 if f == 2 else 0
    ts = 1 if f == 1 else 0
    p.ell(24 + ts, 15 + up, 5.5, 9.5, C['brown_hi']); p.ell(25 + ts, 13 + up, 3, 6, C['orange'])
    for y in (10, 14, 18):
        p.rect(22 + ts, y + up, 6, 1, C['brown_sh'])
    p.ell(14, 22 + up, 6.4, 6.4, C['brown']); p.ell(14, 24 + up, 3.8, 3.8, C['cream'])
    p.rect(9, 27 + up, 4, 3, C['brown']); p.rect(15, 27 + up, 4, 3, C['brown'])
    p.ell(14, 12 + up, 6.2, 5.6, C['brown']); p.ell(9, 6 + up, 2.2, 2.6, C['brown']); p.ell(19, 6 + up, 2.2, 2.6, C['brown'])
    p.set(9, 6 + up, C['pink']); p.set(19, 6 + up, C['pink'])
    p.ell(14, 14.5 + up, 3.8, 2.8, C['cream'])
    for ex in (10, 16):
        p.rect(ex, 10 + up, 2, 3, EYE); p.set(ex, 10 + up, C['white'])
    p.set(13, 14 + up, C['red_sh']); p.set(14, 14 + up, C['red_sh'])
    p.rect(13, 16 + up, 2, 1, C['mouth']) if f == 2 else None
    p.ell(8, 21 + up, 2, 2, C['brown']); p.ell(7, 20 + up, 2, 1.8, C['orange_sh'])  # acorn
    p.outline(C['ol']); shadow(p, 15, 30.5, 9, 2)
    return p


def marina(f):
    p = Px(32, 32)
    fl = [0, 1, 0][f]
    p.ell(7 - fl, 12, 3, 4, C['green_hi']); p.ell(25 + fl, 12, 3, 4, C['green_hi'])
    p.ell(8 + fl, 26, 3, 3, C['green_hi']); p.ell(24 - fl, 26, 3, 3, C['green_hi'])
    p.ell(16, 18, 10, 9, C['green_sh']); p.ell(16, 17, 8.4, 7.4, C['green'])
    for cx, cy in ((16, 13), (11, 17), (21, 17), (13, 22), (19, 22), (16, 18)):
        p.ell(cx, cy, 2.6, 2.4, C['green_hi'] if (cx + cy) % 2 else C['leaf'])
    p.ell(16, 18, 1.2, 1.2, C['yellow'])
    p.ell(16, 6, 4.4, 4, C['green_hi'])
    for ex in (13, 18):
        p.rect(ex, 5, 2, 2, EYE); p.set(ex, 5, C['white'])
    p.rect(12, 8, 1, 1, C['blush']); p.rect(19, 8, 1, 1, C['blush']); p.rect(15, 8, 2, 1, C['mouth'])
    p.ell(16, 29, 2, 1.5, C['green_hi'])
    p.outline(C['ol'])
    if f == 2:
        sparkle(p, 3, 4); sparkle(p, 29, 6, 'pink_hi')
    return p


def nana(f):
    p = Px(32, 32)
    up = -1 if f == 1 else (-3 if f == 2 else 0)
    wf = 2 if f == 1 else 0
    p.ell(8, 21 + up - wf, 3.6, 6, C['blue_sh']); p.ell(24, 21 + up - wf, 3.6, 6, C['blue_sh'])
    p.ell(16, 21 + up, 7.8, 7.8, C['blue']); p.ell(16, 23 + up, 5, 5.5, C['cream'])
    p.rect(11, 22 + up, 10, 8, C['white']); p.rect(11, 22 + up, 10, 1, C['pink_hi']); p.rect(14, 24 + up, 4, 1, C['pink'])
    p.ell(16, 11 + up, 6.4, 5.8, C['blue']); p.ell(16, 13 + up, 4, 3.2, C['blue_hi'])
    p.poly([(14, 12 + up), (18, 12 + up), (16, 16 + up)], C['gold']); p.set(16, 13 + up, C['gold_hi'])
    for ex in (12, 19):
        p.rect(ex, 9 + up, 2, 3, EYE); p.set(ex, 9 + up, C['white'])
    p.rect(10, 12 + up, 2, 1, C['blush']); p.rect(21, 12 + up, 2, 1, C['blush'])
    p.ell(16, 5 + up, 7, 3.6, C['pink_hi']); p.rect(9, 5 + up, 14, 2, C['pink']); p.rect(14, 2 + up, 4, 2, C['pink_sh'])  # bonnet
    p.set(10, 3 + up, C['white']); p.set(21, 3 + up, C['white'])
    p.rect(12, 29, 2, 2, C['orange']); p.rect(18, 29, 2, 2, C['orange'])
    p.outline(C['ol']); shadow(p, 16, 30.8, 8, 1.8)
    return p


def coralie(f):
    p = Px(32, 32)
    sw = [0, 1, 0][f]
    pts = [(14, 7), (16, 10), (17, 14), (16, 18), (14, 22), (14 + sw, 25), (17 + sw, 26.5), (19 + sw, 24.5)]
    for i, (x, y) in enumerate(pts):
        r = 4.2 - i * 0.35 if i > 0 else 4
        p.ell(x, y, max(1.6, r), max(1.8, r), C['yellow'] if i % 2 else C['orange'])
    p.ell(11, 7, 3.4, 2.4, C['yellow']); p.rect(6, 7, 5, 2, C['yellow'])  # snout
    p.ell(20, 17, 2.4 + sw * .4, 4, C['pink_hi'])  # fin
    p.set(15, 4, C['pink']); p.set(16, 5, C['pink']); p.set(17, 7, C['pink'])
    p.rect(12, 6, 2, 2, EYE); p.set(12, 6, C['white'])
    p.set(14, 14, C['orange_sh']); p.set(15, 19, C['orange_sh'])
    p.outline(C['ol'])
    if f == 2:
        sparkle(p, 4, 12); sparkle(p, 27, 5, 'blue_hi')
    return p


def tree_face(f):
    p = Px(48, 64)
    p.rect(17, 30, 14, 28, C['brown']); p.rect(17, 30, 4, 28, C['brown_hi']); p.rect(27, 30, 4, 28, C['brown_sh'])
    p.poly([(12, 62), (17, 50), (17, 62)], C['brown']); p.poly([(36, 62), (31, 50), (31, 62)], C['brown_sh'])
    for cx, cy, r in ((24, 14, 14), (11, 22, 10), (37, 22, 10), (24, 28, 10), (14, 12, 9), (34, 12, 9)):
        p.ell(cx, cy, r, r * .9, C['leaf'])
    for cx, cy, r in ((19, 10, 6), (30, 17, 5), (11, 19, 4)):
        p.ell(cx, cy, r, r * .9, C['leaf_hi'])
    for x, y in ((8, 14), (40, 18), (26, 4), (16, 26)):
        p.ell(x, y, 1.6, 1.6, C['pink_hi']); p.set(x, y, C['yellow'])
    # face
    if f == 0:
        p.rect(20, 38, 3, 1, C['ol']); p.rect(26, 38, 3, 1, C['ol'])
    else:
        for ex in (20, 26):
            p.rect(ex, 36, 3, 4, C['white']); p.rect(ex + 1, 37, 2, 3, EYE)
    p.rect(18, 41, 3, 1, C['blush']); p.rect(28, 41, 3, 1, C['blush'])
    if f == 2:
        p.ell(24.5, 45, 3.2, 2.4, C['red_sh']); p.rect(22, 44, 5, 1, C['pink_sh'])
    else:
        p.rect(22, 44, 5, 1, C['brown_sh']); p.set(21, 43, C['brown_sh']); p.set(27, 43, C['brown_sh'])
    p.outline(C['ol']); shadow(p, 24, 62, 14, 2)
    return p


NPCS = {
    'pip': (32, 32, pip), 'willa': (32, 32, willa), 'bramble': (32, 32, bramble), 'marina': (32, 32, marina),
    'nana': (32, 32, nana), 'coralie': (32, 32, coralie), 'tree': (48, 64, tree_face),
}
