"""Royal Wardrobe & Enchanted Vanity art (v0.3). Pillow only, fully deterministic.

Every customization layer is drawn on an identical transparent canvas so the game can stack them:
  FULL      96x144  full-length front view   (Wardrobe screen)
  PORTRAIT 112x128  large head-and-shoulders (Vanity screen)

Colour-able parts are drawn in *marker* colours (dress, hair, skin ramps). The game remaps those exact RGB values at
runtime, so one drawing serves every colour choice and no cross-product of PNGs is ever shipped.
"""
import math
from pxlib import Px, rgb, mix, rng

# ------------------------------------------------------------------ marker ramps (hi, base, sh, dk) - unique RGB values
DM = [(255, 184, 227, 255), (255, 126, 197, 255), (207, 79, 161, 255), (155, 58, 135, 255)]    # dress / cloth
HM = [(255, 226, 123, 255), (255, 191, 64, 255), (217, 138, 32, 255), (155, 90, 19, 255)]      # hair
SM = [(255, 240, 225, 255), (255, 220, 193, 255), (243, 170, 141, 255), (201, 122, 107, 255)]  # skin
MARKERS = {'dress': DM, 'hair': HM, 'skin': SM}

# default (un-recoloured) targets, to preview art without the game
DEFAULT_TARGET = {
    'dress': [rgb('#ffb8e2'), rgb('#ff7ec3'), rgb('#cf4f9f'), rgb('#9b3a86')],
    'hair': [rgb('#c99a6a'), rgb('#a8743f'), rgb('#7a4e26'), rgb('#4f3017')],
    'skin': [rgb('#fff0e0'), rgb('#ffdcc0'), rgb('#f3aa8c'), rgb('#c97a6a')],
}

OL = rgb('#40255a')       # soft violet outline for fixed-colour parts
OL2 = rgb('#6a4a8c')
W = rgb('#ffffff')
CREAM = rgb('#fff6e4'); CREAM_SH = rgb('#f1dfc8')
GOLD = rgb('#ffd93d'); GOLD_HI = rgb('#fff3a0'); GOLD_SH = rgb('#e59a1a'); GOLD_DK = rgb('#a8650f')
EYE = rgb('#4b2d94'); EYE_HI = rgb('#8f6bff'); EYE_DK = rgb('#2c1a63')
MOUTH = rgb('#d9506c'); MOUTH_DK = rgb('#a8334e'); BLUSH = rgb('#ff8fa8')
PINK = rgb('#ff7ec3'); PINK_HI = rgb('#ffb8e2'); PINK_SH = rgb('#cf4f9f')
BLUE = rgb('#3ea6ff'); BLUE_HI = rgb('#8fd8ff'); BLUE_SH = rgb('#2169dc')
PURPLE = rgb('#a06bff'); PURPLE_HI = rgb('#c9a8ff'); PURPLE_SH = rgb('#6f43c9')
TEAL = rgb('#31d6c8'); TEAL_HI = rgb('#8ff3e6'); TEAL_SH = rgb('#1a9aa8')
GREEN = rgb('#5ccf59'); GREEN_HI = rgb('#92ec74'); GREEN_SH = rgb('#3ba84a'); GREEN_DK = rgb('#237a3d')
RED = rgb('#ff5a6e'); RED_SH = rgb('#c93a58'); ORANGE = rgb('#ff9a3c'); YELLOW = rgb('#ffe14d')
BROWN = rgb('#a8693a'); BROWN_HI = rgb('#d28f55'); BROWN_SH = rgb('#6f4326')
PEARL = rgb('#fdf8ff'); PEARL_SH = rgb('#cfc4e6')

FW, FH = 96, 144
PW, PH = 112, 140


class Geo:
    """Landmarks for one canvas. All sizes are authored for FULL and multiplied by `s` for PORTRAIT."""

    def __init__(self, kind):
        self.kind = kind
        if kind == 'full':
            self.w, self.h, self.s = FW, FH, 1.0
            self.hx, self.hy = 48, 38
            self.sh_y = 62
        else:
            self.w, self.h, self.s = PW, PH, 1.63
            self.hx, self.hy = 56, 64
            self.sh_y = 106
        s = self.s
        self.hrx, self.hry = 19 * s, 18 * s
        self.sh_hw = 13 * s
        self.waist_y = self.sh_y + 24 * s
        self.neck_hw = 4.2 * s

    def S(self, v):
        return int(round(v * self.s))

    def px(self):
        return Px(self.w, self.h)


# ------------------------------------------------------------------ shading helpers
def shade_pick(ramp, lum, thr=(0.5, -0.15, -0.6)):
    if lum > thr[0]: return ramp[0]
    if lum > thr[1]: return ramp[1]
    if lum > thr[2]: return ramp[2]
    return ramp[3]


def ell_shaded(p, cx, cy, rx, ry, ramp, thr=(0.5, -0.15, -0.62), light=(-0.5, -0.7), dither=True):
    """Filled ellipse lit from the top-left (hi / base / shadow / deep shadow bands with a little dithering)."""
    for y in range(p.h):
        for x in range(p.w):
            nx = (x + .5 - cx) / rx; ny = (y + .5 - cy) / ry
            if nx * nx + ny * ny <= 1:
                lum = nx * light[0] + ny * light[1]
                c = shade_pick(ramp, lum, thr)
                if dither:
                    for t in thr:
                        if abs(lum - t) < 0.07 and (x + y) % 2 == 0:
                            c = shade_pick(ramp, lum + 0.14, thr)
                p.p[y][x] = c


def mask_fill(p, pts_fn, color):
    """Run a drawing callback on a scratch Px and return a set of (x,y) it touched."""
    m = Px(p.w, p.h)
    pts_fn(m)
    return {(x, y) for y in range(p.h) for x in range(p.w) if m.p[y][x] is not None}


def shade_mask(p, cells, ramp, cx=None, cy=None, rx=None, ry=None, thr=(0.45, -0.1, -0.55), light=(-0.55, -0.75)):
    """Shade an arbitrary region as if it were a rounded form centred on (cx, cy)."""
    if not cells:
        return
    xs = [c[0] for c in cells]; ys = [c[1] for c in cells]
    cx = (min(xs) + max(xs)) / 2 if cx is None else cx
    cy = (min(ys) + max(ys)) / 2 if cy is None else cy
    rx = max(1, (max(xs) - min(xs)) / 2 + 1) if rx is None else rx
    ry = max(1, (max(ys) - min(ys)) / 2 + 1) if ry is None else ry
    for (x, y) in cells:
        nx = (x + .5 - cx) / rx; ny = (y + .5 - cy) / ry
        lum = nx * light[0] + ny * light[1]
        c = shade_pick(ramp, lum, thr)
        for t in thr:
            if abs(lum - t) < 0.06 and (x + y) % 2 == 0:
                c = shade_pick(ramp, lum + 0.12, thr)
        p.set(x, y, c)


def edge_darken(p, ramp_dark, ramp_mid=None, below=True):
    """Darken the pixels that sit on the lower/right silhouette edge: gives form without an outline."""
    add = []
    for y in range(p.h):
        for x in range(p.w):
            if p.p[y][x] is None: continue
            if (below and p.get(x, y + 1) is None) or p.get(x + 1, y) is None:
                add.append((x, y))
    for x, y in add:
        p.p[y][x] = ramp_dark


def outline_color(p, color):
    p.outline(color)
    return p


def remove_specks(p):
    for y in range(p.h):
        for x in range(p.w):
            if p.p[y][x] is not None and not any(p.get(x + dx, y + dy) is not None for dx in (-1, 0, 1) for dy in (-1, 0, 1) if dx or dy):
                p.p[y][x] = None


def line_w(p, x0, y0, x1, y1, w, c):
    """Thick line (capsule)."""
    n = int(max(abs(x1 - x0), abs(y1 - y0))) * 2 + 1
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t; y = y0 + (y1 - y0) * t
        p.ell(x, y, w / 2, w / 2, c)


def star(p, cx, cy, r, col, hi=None):
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r if i % 2 == 0 else r * 0.45
        pts.append((cx + rr * math.cos(a), cy + rr * math.sin(a)))
    p.poly([(int(round(x)), int(round(y))) for x, y in pts], col)
    if hi is not None:
        p.set(int(cx), int(cy), hi)


def spark(p, x, y, c=GOLD_HI):
    for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
        p.set(x + dx, y + dy, c if (dx or dy) else W)


def heart(p, cx, cy, r, col, hi=None):
    p.ell(cx - r * .5, cy - r * .35, r * .55, r * .55, col); p.ell(cx + r * .5, cy - r * .35, r * .55, r * .55, col)
    p.poly([(int(cx - r * 1.02), int(cy - r * .1)), (int(cx + r * 1.02), int(cy - r * .1)), (int(cx), int(cy + r * 1.05))], col)
    if hi is not None:
        p.set(int(cx - r * .55), int(cy - r * .55), hi)


def bow(p, cx, cy, r, col, hi, dk, knot=None):
    for sgn in (-1, 1):
        pts = [(cx, cy), (cx + sgn * r * 1.5, cy - r * .9), (cx + sgn * r * 1.7, cy + r * .9)]
        p.poly([(int(a), int(b)) for a, b in pts], col)
        p.line(int(cx + sgn * r * .4), int(cy), int(cx + sgn * r * 1.5), int(cy - r * .6), hi)
        p.set(int(cx + sgn * r * 1.6), int(cy + r * .8), dk)
    p.ell(cx, cy, r * .5, r * .55, knot or col)
    p.set(int(cx - 1), int(cy - 1), hi)


def flower(p, cx, cy, r, petal, center, petal_hi=None):
    for i in range(5):
        a = i * 2 * math.pi / 5 - math.pi / 2
        p.ell(cx + math.cos(a) * r * .7, cy + math.sin(a) * r * .7, r * .55, r * .55, petal)
    p.ell(cx, cy, r * .45, r * .45, center)
    if petal_hi is not None:
        p.set(int(cx - r * .5), int(cy - r * .9), petal_hi)


def pearl(p, cx, cy, r=1.6):
    p.ell(cx, cy, r, r, PEARL)
    p.set(int(cx - r * .4), int(cy - r * .4), W)
    p.set(int(cx + r * .5), int(cy + r * .5), PEARL_SH)


def gem(p, cx, cy, r, col, hi, dk):
    p.poly([(int(cx), int(cy - r)), (int(cx + r), int(cy)), (int(cx), int(cy + r)), (int(cx - r), int(cy))], col)
    p.set(int(cx - 1), int(cy - 1), hi); p.set(int(cx + 1), int(cy + 1), dk)


def butterfly(p, cx, cy, r, c1, c2, body=OL):
    for sgn in (-1, 1):
        p.ell(cx + sgn * r * .8, cy - r * .4, r * .75, r * .9, c1)
        p.ell(cx + sgn * r * .6, cy + r * .6, r * .5, r * .55, c2)
        p.set(int(cx + sgn * r * .9), int(cy - r * .7), W)
    p.line(int(cx), int(cy - r * .6), int(cx), int(cy + r * .8), body)


def sym(p, x, y, fn):
    """Call fn(x_offsetted_pixel, sign) mirrored around the canvas centre line."""
    pass


# ------------------------------------------------------------------ BODY (skin, face)
def body(kind):
    g = Geo(kind); p = g.px(); s = g.s; S = g.S
    hx, hy = g.hx, g.hy
    # --- neck and shoulders / arms (skin, dress covers most)
    ell_shaded(p, hx, hy + g.hry + 2 * s, g.neck_hw, 6 * s, SM)
    p.rect(int(hx - g.neck_hw), int(hy + g.hry - 2 * s), int(g.neck_hw * 2), S(7), SM[1])
    p.rect(int(hx - g.neck_hw), int(hy + g.hry + 3 * s), int(g.neck_hw * 2), max(2, S(3)), SM[2])   # chin shadow on neck
    # shoulders / chest block (visible at neckline)
    for y in range(int(g.sh_y - 2 * s), int(g.sh_y + 22 * s)):
        t = (y - (g.sh_y - 2 * s)) / (24 * s)
        hw = g.sh_hw * (0.82 + 0.18 * min(1, t * 3)) * (1 - 0.16 * max(0, t - .5) * 2)
        for x in range(int(hx - hw), int(hx + hw) + 1):
            p.set(x, y, SM[1] if x > hx - hw + 2 * s else SM[0])
    # collarbone hint
    if kind == 'portrait':
        for dx in (-1, 1):
            p.line(int(hx + dx * 6 * s), int(g.sh_y + 2 * s), int(hx + dx * 15 * s), int(g.sh_y - 0 * s), SM[2])
    # --- arms (full only visible) : gently out from the sides, hands resting by the skirt
    if kind == 'full':
        for sgn in (-1, 1):
            sx, sy = hx + sgn * 13, 66
            ex, ey = hx + sgn * 20, 78
            hx2, hy2 = hx + sgn * 25, 92
            line_w(p, sx, sy, ex, ey, 6, SM[1]); line_w(p, ex, ey, hx2, hy2, 5, SM[1])
            # shade the outer edge of the arm
            line_w(p, sx + sgn * 2, sy + 1, ex + sgn * 2, ey, 2, SM[2]); line_w(p, ex + sgn * 2, ey, hx2 + sgn * 1, hy2, 2, SM[2])
            p.ell(hx2, hy2 + 1, 3.2, 3.6, SM[1]); p.ell(hx2 - sgn, hy2 + 1, 1.6, 2, SM[0])
            p.set(hx2 + sgn * 2, hy2 + 3, SM[2])
        # legs
        for sgn in (-1, 1):
            line_w(p, hx + sgn * 5, 112, hx + sgn * 6, 134, 6, SM[1])
            line_w(p, hx + sgn * 7, 112, hx + sgn * 8, 134, 2, SM[2])
    # --- head
    ell_shaded(p, hx, hy, g.hrx, g.hry, SM, thr=(0.72, -0.85, -1.4), dither=True)
    # soft jaw: slightly narrower chin
    # ears
    for sgn in (-1, 1):
        ex = hx + sgn * (g.hrx - 0.6 * s)
        p.ell(ex, hy + 4 * s, 2.4 * s, 3.6 * s, SM[1])
        p.ell(ex - sgn * 0.3, hy + 4.3 * s, 1.1 * s, 2 * s, SM[2])
    # --- face
    face(p, g)
    p.outline(SM[3])
    return p


def face(p, g):
    s = g.s; S = g.S; hx, hy = g.hx, g.hy
    for sgn in (-1, 1):
        ex = hx + sgn * 7.6 * s; ey = hy + 3.2 * s
        rx, ry = 3.1 * s, 4.3 * s
        # eye white (tiny), iris, pupil, highlights
        p.ell(ex, ey, rx, ry, W)
        p.ell(ex, ey + 0.4 * s, rx * 0.86, ry * 0.9, EYE)
        p.ell(ex, ey + 1.6 * s, rx * 0.7, ry * 0.55, EYE_HI)              # lower glow
        p.ell(ex, ey - 0.3 * s, rx * 0.55, ry * 0.55, EYE_DK)               # pupil
        p.rect(int(ex - rx * 0.55), int(ey - ry * 0.65), max(1, S(1.6)), max(1, S(1.8)), W)   # big shine
        p.set(int(ex + rx * 0.35), int(ey + ry * 0.35), W)                                  # small shine
        # upper lid / lash line
        for dx in range(int(-rx - 0.5), int(rx + 1.5)):
            yy = ey - ry * math.sqrt(max(0, 1 - (dx / (rx + 0.6)) ** 2))
            p.set(int(ex + dx), int(round(yy - 0.6)), OL)
        p.set(int(ex + sgn * (rx + 0.6 * s)), int(ey - ry * 0.55), OL)               # outer lash flick
        p.set(int(ex + sgn * (rx + 1.4 * s)), int(ey - ry * 0.75), OL)
        # brow
        by = int(hy - 3.8 * s)
        for dx in range(-int(2.6 * s), int(2.6 * s) + 1):
            p.set(int(ex + dx), by + (1 if abs(dx) > 1.8 * s else 0) - (1 if abs(dx) < 1.0 * s and s > 1.2 else 0), SM[3])
        # soft blush base (very light; accents add more)
        p.ell(hx + sgn * 11.5 * s, hy + 9.2 * s, 2.6 * s, 1.6 * s, mix(SM[1], BLUSH, 0.5))
    # nose and mouth
    p.set(hx, int(hy + 8.6 * s), SM[3]); p.set(hx - 1 if s < 1.2 else hx - 1, int(hy + 8.6 * s) + 0, SM[2])
    my = int(hy + 12.4 * s)
    mw = int(2.6 * s)
    for dx in range(-mw, mw + 1):
        yy = my + (0 if abs(dx) < mw * 0.6 else -1)
        p.set(hx + dx, yy, MOUTH_DK if abs(dx) == mw else MOUTH)
    if s > 1.2:
        for dx in range(-mw + 2, mw - 1):
            p.set(hx + dx, my + 1, MOUTH)
        p.set(hx - 1, my + 1, rgb('#ff9aae')); p.set(hx, my + 1, rgb('#ff9aae'))


# ------------------------------------------------------------------ HAIR
def taper(p, pts, w0, w1, c):
    """A tapering ribbon of hair following a list of (x, y) control points."""
    segs = []
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        n = max(2, int(max(abs(x1 - x0), abs(y1 - y0))))
        for i in range(n):
            t = i / n
            segs.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
    segs.append(pts[-1])
    N = len(segs)
    for i, (x, y) in enumerate(segs):
        w = w0 + (w1 - w0) * (i / max(1, N - 1))
        p.ell(x, y, w / 2, w / 2, c)


def hair_texture(p, g, depth=0, flow=1.0, period=None):
    """Turn a flat HM[1] silhouette into strands, a crown shine and edge shadow."""
    s = g.s
    P = period or max(4, int(round(5 * s)))
    cells = [(x, y) for y in range(p.h) for x in range(p.w) if p.p[y][x] == HM[1]]
    cs = set(cells)
    for (x, y) in cells:
        idx = 1
        dx = x - g.hx
        sign = 1 if dx >= 0 else -1
        if (int(dx + sign * y * 0.11 * flow) % P) == 0:
            idx = 2
        # crown shine: a curved band over the top of the head (left-biased)
        d = math.hypot((x - g.hx + 3 * s) / (g.hrx + 4 * s), (y - g.hy + 2 * s) / (g.hry + 3 * s))
        if y < g.hy - 3 * s and 0.80 < d < 0.98 and (x + y) % 3 != 0:
            idx = 0
        if y < g.hy - 3 * s and 0.72 < d <= 0.80 and (x + y) % 2 == 0:
            idx = 0
        # edge shadow along the bottom / outer edge
        if (x, y + 1) not in cs and idx != 0:
            idx = 2
        if (x, y + 2) not in cs and (x, y + 1) in cs and idx == 1 and (x + y) % 2 == 0:
            idx = 2
        idx = min(3, idx + depth) if idx > 0 or depth else idx
        p.p[y][x] = HM[idx]


def hair_finish(p, g, depth=0, flow=1.0, period=None):
    hair_texture(p, g, depth, flow, period)
    p.outline(HM[3])
    return p


def dome(p, g, extra=4, up=0):
    s = g.s
    p.ell(g.hx, g.hy - 1 * s - up, g.hrx + extra * s, g.hry + extra * s, HM[1])


def erase(p, cx, cy, rx, ry):
    for y in range(p.h):
        for x in range(p.w):
            if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                p.p[y][x] = None


def bangs_swoop(p, g, side=1, depth=0):
    """Side-swept fringe: hair over the forehead with the face opening cut out."""
    s = g.s; hx, hy = g.hx, g.hy
    p.ell(hx, hy - 4 * s, g.hrx + 1.5 * s, g.hry - 0.2 * s, HM[1])
    erase(p, hx + side * 4.2 * s, hy + 6.5 * s, g.hrx - 2.2 * s, g.hry - 1.0 * s)
    # strand tips sweeping across
    taper(p, [(hx - side * 15 * s, hy - 7 * s), (hx - side * 9 * s, hy - 5.5 * s), (hx + side * 0 * s, hy - 7 * s)], 5 * s, 2.5 * s, HM[1])


def bangs_straight(p, g):
    s = g.s; hx, hy = g.hx, g.hy
    p.ell(hx, hy - 4 * s, g.hrx + 1.5 * s, g.hry - 0.5 * s, HM[1])
    erase(p, hx, hy + 9 * s, g.hrx - 1.2 * s, g.hry - 4 * s)
    for i, x in enumerate(range(int(hx - g.hrx), int(hx + g.hrx) + 1)):   # scalloped fringe bottom
        yy = int(hy - 1 * s + (1.6 * s if i % 5 in (1, 2, 3) else 0))
        for y in range(int(hy - 7 * s), yy):
            if abs(x - hx) < g.hrx - 1:
                p.set(x, y, HM[1])


def hair_layers(style, kind):
    """Return (back, front) layers for a hairstyle."""
    g = Geo(kind); s = g.s; S = g.S
    hx, hy = g.hx, g.hy
    back, front = g.px(), g.px()
    if style == 'long':
        dome(back, g, 5)
        for sgn in (-1, 1):
            taper(back, [(hx + sgn * (g.hrx + 1) , hy + 0), (hx + sgn * (g.hrx + 5 * s), hy + 20 * s), (hx + sgn * (g.hrx + 3 * s), hy + 44 * s), (hx + sgn * (g.hrx - 1 * s), hy + 52 * s)], 13 * s, 10 * s, HM[1])
        back.rect(int(hx - g.hrx - 1 * s), int(hy), int(2 * g.hrx + 2 * s), int(40 * s), HM[1])
        for i in range(0, int(2 * g.hrx + 2 * s), 1):      # wavy tail
            x = int(hx - g.hrx - 1 * s) + i
            yy = int(hy + 40 * s + 6 * s * (0.5 + 0.5 * math.sin(i * 0.55)))
            for y in range(int(hy + 38 * s), yy):
                back.set(x, y, HM[1])
        hair_finish(back, g, depth=1, flow=0.0)
        bangs_swoop(front, g, side=1)
        for sgn in (-1, 1):
            taper(front, [(hx + sgn * (g.hrx - 1 * s), hy - 6 * s), (hx + sgn * (g.hrx + 1 * s), hy + 12 * s), (hx + sgn * (g.hrx + 4 * s), hy + 30 * s), (hx + sgn * (g.hrx + 3 * s), hy + 42 * s)], 7 * s, 5 * s, HM[1])
        hair_finish(front, g)
    elif style == 'bob':
        dome(back, g, 5)
        back.ell(hx, hy + 6 * s, g.hrx + 8 * s, 19 * s, HM[1])
        erase(back, hx, hy + 18 * s, g.hrx - 2 * s, 12 * s)
        for sgn in (-1, 1):   # flipped-out ends
            back.ell(hx + sgn * (g.hrx + 6 * s), hy + 20 * s, 5 * s, 4 * s, HM[1])
        hair_finish(back, g, depth=1, flow=0.0)
        bangs_straight(front, g)
        for sgn in (-1, 1):
            taper(front, [(hx + sgn * (g.hrx - 0.5 * s), hy - 4 * s), (hx + sgn * (g.hrx + 2 * s), hy + 10 * s), (hx + sgn * (g.hrx + 4 * s), hy + 19 * s)], 8 * s, 6 * s, HM[1])
            front.ell(hx + sgn * (g.hrx + 4 * s), hy + 20 * s, 4.5 * s, 3 * s, HM[1])
        hair_finish(front, g)
    elif style == 'ponytail':
        dome(back, g, 4)
        taper(back, [(hx + g.hrx - 4 * s, hy - g.hry + 3 * s), (hx + g.hrx + 8 * s, hy - g.hry + 2 * s), (hx + g.hrx + 14 * s, hy + 8 * s), (hx + g.hrx + 12 * s, hy + 26 * s), (hx + g.hrx + 5 * s, hy + 38 * s)], 11 * s, 5 * s, HM[1])
        back.ell(hx + g.hrx + 3 * s, hy + 38 * s, 4 * s, 3.5 * s, HM[1])
        hair_finish(back, g, depth=1, flow=0.4)
        bangs_swoop(front, g, side=-1)
        for sgn in (-1, 1):
            taper(front, [(hx + sgn * (g.hrx - 1 * s), hy - 5 * s), (hx + sgn * (g.hrx + 0.5 * s), hy + 6 * s), (hx + sgn * (g.hrx + 1 * s), hy + 14 * s)], 6 * s, 3 * s, HM[1])
        hair_finish(front, g)
        # scrunchie (fixed colour) where the tail leaves the head
        tx, ty = hx + g.hrx + 2 * s, hy - g.hry + 1 * s
        front.ell(tx + 2 * s, ty + 1 * s, 4 * s, 3.2 * s, rgb('#ff7ec3')); front.ell(tx + 1.4 * s, ty + 0 * s, 2 * s, 1.4 * s, rgb('#ffb8e2'))
        front.outline(OL)
    elif style == 'braids':
        dome(back, g, 4)
        back.ell(hx, hy + 6 * s, g.hrx + 3 * s, 16 * s, HM[1])
        hair_finish(back, g, depth=1, flow=0.0)
        bangs_straight(front, g)
        front.rect(int(hx - 0.5), int(hy - g.hry - 4 * s), max(1, int(1.2 * s)), int(10 * s), HM[2])    # centre part line
        for sgn in (-1, 1):
            bx = hx + sgn * (g.hrx + 1 * s)
            taper(front, [(bx - sgn * 3 * s, hy - 4 * s), (bx, hy + 8 * s)], 8 * s, 8 * s, HM[1])
            # the plait: overlapping ovals alternating tone
            for i in range(9):
                cy = hy + (10 + i * 5.4) * s
                cx = bx + sgn * (0.8 * s) + sgn * (1.2 * s) * (1 if i % 2 else -1) * 0.5
                front.ell(cx, cy, 4.6 * s, 3.6 * s, HM[1])
            for i in range(9):
                cy = hy + (10 + i * 5.4) * s
                cx = bx + sgn * (0.8 * s)
                col_hi = HM[0]
                front.ell(cx - (1.6 * s if i % 2 else -1.6 * s) * 0.5, cy - 0.8 * s, 1.6 * s, 1.2 * s, col_hi)
        hair_finish(front, g)
        for sgn in (-1, 1):       # ribbons on the braid ends (fixed colour)
            bx = hx + sgn * (g.hrx + 1 * s); by = hy + 56 * s
            bow(front, bx, by, 3.2 * s, PINK, PINK_HI, PINK_SH, PINK)
            front.outline(OL)
    elif style == 'bun':
        dome(back, g, 3)
        bx, by, br = hx, hy - g.hry - 5 * s, 10 * s
        back.ell(bx, by, br, br * 0.9, HM[1])
        hair_finish(back, g, depth=0, flow=0.0, period=max(3, int(3.5 * s)))
        # scrunchie (fixed colour)
        sy = by + br * 0.75
        back.ell(bx, sy, br * 0.78, 2.3 * s, rgb('#ffb8e2')); back.ell(bx - 3 * s, sy - 0.5 * s, 3.5 * s, 1.1 * s, rgb('#ffffff'))
        back.outline(OL)
        # smooth cap with a side part
        front.ell(hx, hy - 4 * s, g.hrx + 1.5 * s, g.hry - 0.5 * s, HM[1])
        erase(front, hx + 3 * s, hy + 7 * s, g.hrx - 2.5 * s, g.hry - 2 * s)
        for sgn in (-1, 1):
            taper(front, [(hx + sgn * (g.hrx - 1.5 * s), hy - 3 * s), (hx + sgn * (g.hrx + 0.5 * s), hy + 8 * s), (hx + sgn * (g.hrx - 0.5 * s), hy + 18 * s)], 5 * s, 2 * s, HM[1])
        hair_finish(front, g, flow=0.0)
    elif style == 'curls':
        dome(back, g, 7)
        for sgn in (-1, 1):
            for i in range(7):
                cx = hx + sgn * (g.hrx + (3 + (i % 2) * 3) * s); cy = hy + (i * 7 - 2) * s
                back.ell(cx, cy, 8 * s, 7 * s, HM[1])
        back.rect(int(hx - g.hrx - 2 * s), int(hy), int(2 * g.hrx + 4 * s), int(24 * s), HM[1])
        for i in range(5):
            back.ell(hx + (i - 2) * 9 * s, hy + 27 * s, 6 * s, 5.5 * s, HM[1])
        hair_finish(back, g, depth=1, flow=0.0, period=max(5, int(6 * s)))
        # bubbly curl highlights
        for sgn in (-1, 1):
            for i in range(7):
                cx = hx + sgn * (g.hrx + (3 + (i % 2) * 3) * s); cy = hy + (i * 7 - 2) * s
                back.ell(cx - 2 * s, cy - 2 * s, 2 * s, 1.5 * s, HM[1])
        # front: ruffled curl fringe and two ringlets
        front.ell(hx, hy - 4 * s, g.hrx + 2 * s, g.hry - 0.5 * s, HM[1])
        erase(front, hx, hy + 8.5 * s, g.hrx - 2 * s, g.hry - 3.5 * s)
        for i in range(7):
            cx = hx + (i - 3) * 5.4 * s
            front.ell(cx, hy - 3.5 * s + (1.6 * s if i % 2 else 0) + abs(i - 3) * 0.6 * s, 3.4 * s, 3.2 * s, HM[1])
        for sgn in (-1, 1):
            for i in range(6):
                cx = hx + sgn * (g.hrx + 2 * s + (1.4 * s if i % 2 else -1.0 * s)); cy = hy + (5 + i * 6.2) * s
                front.ell(cx, cy, 4.6 * s, 4.2 * s, HM[1])
        hair_finish(front, g, flow=0.0, period=max(4, int(4.5 * s)))
        # curl hint: darker spiral dot inside each ringlet
        for sgn in (-1, 1):
            for i in range(6):
                cx = hx + sgn * (g.hrx + 2 * s + (1.4 * s if i % 2 else -1.0 * s)); cy = hy + (5 + i * 6.2) * s
                front.set(int(cx + 0.5 * s), int(cy), HM[2]); front.set(int(cx), int(cy + 1), HM[2])
    return back, front


# ------------------------------------------------------------------ DRESSES
def interp(table, v):
    v = abs(v)
    if v <= table[0][0]: return table[0][1]
    for (x0, y0), (x1, y1) in zip(table, table[1:]):
        if v <= x1:
            return y0 + (y1 - y0) * (v - x0) / (x1 - x0)
    return table[-1][1]


NECK = {
    'round': [(0, 5.2), (4, 4.6), (7, 2.6), (9.5, 0.4), (30, 0.4)],
    'v': [(0, 12), (3, 8.4), (6, 4.8), (9.5, 0.4), (30, 0.4)],
    'square': [(0, 6), (7.5, 6), (8.5, 0.4), (30, 0.4)],
    'sweetheart': [(0, 7), (2.4, 4.6), (5.5, 3.0), (9, 3.6), (12.5, 4.6), (30, 4.6)],
    'offshoulder': [(0, 5.5), (12, 4.4), (30, 4.4)],
    'strapless': [(0, 6.6), (2.4, 4.4), (5.5, 3.2), (9, 3.8), (11.8, 5), (30, 99)],
}


def bodice(p, g, neck, ramp, thr=(0.42, -0.1, -0.55)):
    s = g.s; hx = g.hx
    cells = set()
    y0 = int(g.sh_y - 2 * s); y1 = int(g.waist_y)
    for y in range(y0, y1 + 1):
        t = (y - (g.sh_y - 2 * s)) / (g.waist_y - (g.sh_y - 2 * s))
        hw = (g.sh_hw + 1.4 * s) * (1 - t) ** 0.9 + 8.4 * s * (1 - (1 - t) ** 0.9)
        hw = max(hw, 8.2 * s) if t < 0.2 else hw
        for x in range(int(hx - hw), int(hx + hw) + 1):
            dxu = (x + .5 - hx) / s
            if neck == 'halter':
                strap = 3.2 < abs(dxu) < 7.6 and y >= g.sh_y - 3 * s and y < g.sh_y + 12 * s
                ok = (y >= g.sh_y + 11 * s and abs(dxu) < (g.sh_hw / s) * (0.85 - 0.0)) or strap
            else:
                ok = (y - g.sh_y) / s >= interp(NECK[neck], dxu)
            if ok:
                cells.add((x, y))
    shade_mask(p, cells, ramp, cx=hx - 3 * s, cy=g.sh_y + 9 * s, rx=g.sh_hw * 1.2, ry=18 * s, thr=thr)
    return cells


def sleeves(p, g, kind, ramp):
    s = g.s; hx = g.hx
    if kind == 'none': return
    for sgn in (-1, 1):
        cx = hx + sgn * (g.sh_hw + 2.4 * s); cy = g.sh_y + 4.6 * s
        if kind == 'puff':
            ell_shaded(p, cx, cy, 7 * s, 6 * s, ramp, thr=(0.5, -0.15, -0.6))
            p.ell(cx, cy + 4.6 * s, 5.4 * s, 1.5 * s, ramp[2])
            p.set(int(cx - 2 * s), int(cy - 2 * s), ramp[0])
        elif kind == 'flutter':
            for k in range(3):
                p.ell(cx + sgn * (k - 1) * 1.6 * s, cy + (k * 1.6 + 0.5) * s, 4.8 * s - k * 0.6 * s, 3.4 * s, ramp[0] if k == 0 else (ramp[1] if k == 1 else ramp[2]))
        elif kind == 'cap':
            ell_shaded(p, cx, cy - 0.5 * s, 5.2 * s, 4.2 * s, ramp)
        elif kind == 'bell':
            ell_shaded(p, cx + sgn * 1.4 * s, cy + 3 * s, 7 * s, 5 * s, ramp)
            p.poly([(int(cx - 5 * s), int(cy + 4 * s)), (int(cx + 5 * s), int(cy + 4 * s)), (int(cx + sgn * 9 * s), int(cy + 14 * s)), (int(cx - sgn * 1 * s), int(cy + 14 * s))], ramp[1]) if False else None


def skirt(p, g, top_hw, hem_hw, hem_y, bulge, ramp, folds=5, scallop=(0, 8), shift=0, waist_y=None):
    """Bell / A-line skirt with fold shading. Returns the cell set."""
    hx = g.hx; wy = int(waist_y or g.waist_y) - 2
    cells = set()
    amp, period = scallop
    for y in range(wy, int(hem_y + amp + 3)):
        t = max(0.0, min(1.0, (y - wy) / (hem_y - wy)))
        hw = top_hw + (hem_hw - top_hw) * (t ** bulge)
        for x in range(int(hx - hw), int(hx + hw) + 1):
            u = (x + .5 - hx) / max(1, hw)
            edge = hem_y + amp * (0.5 + 0.5 * math.cos((x - hx) * 2 * math.pi / period)) if amp else hem_y
            if y > edge: continue
            cells.add((x, y))
            f = math.cos(u * math.pi * folds + 0.6)
            idx = 1
            if f < -0.5: idx = 2
            elif f > 0.78 and u < 0.45: idx = 0
            if u > 0.62: idx = max(idx, 2)
            if u > 0.9: idx = 3
            if u < -0.78 and idx > 0: idx = 0 if (x + y) % 2 == 0 else 1
            if t < 0.07: idx = max(idx, 2)
            if t > 0.93: idx = max(idx, 2)
            idx = min(3, idx + shift) if idx > 0 or shift else idx
            p.set(x, y, ramp[idx])
    return cells


# fixed accent palettes
RAINBOW = [RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE]


def lace_trim(p, g, y, hw, c=CREAM, c2=CREAM_SH):
    for x in range(int(g.hx - hw), int(g.hx + hw) + 1):
        p.set(x, y, c)
        if (x - g.hx) % 3 == 0: p.set(x, y + 1, c2)


def dress_layer(did, kind):
    g = Geo(kind); p = g.px(); s = g.s; S = g.S; hx = g.hx; full = kind == 'full'
    sy, wy = g.sh_y, g.waist_y
    R = DM
    DEEP = [DM[1], DM[2], DM[3], DM[3]]
    if did == 'royal_ball':
        if full:
            # petticoat peeking below
            skirt(p, g, 9, 41, 128, 0.72, [CREAM, CREAM, CREAM_SH, rgb('#cdbcdf')], folds=7, scallop=(4, 6))
            skirt(p, g, 8.6, 38, 124, 0.72, R, folds=6, scallop=(3.4, 12))
            for i in range(-3, 4):          # gold hem trim
                x = hx + i * 10 + 0
                p.rect(int(x - 3), 118, 6, 1, GOLD); p.set(int(x), 119, GOLD_SH)
            # rows of sparkles/pearls on the skirt
            r = rng(5)
            for _ in range(16):
                x = r.randint(int(hx - 30), int(hx + 30)); y = r.randint(96, 116)
                if p.get(x, y) is not None: p.set(x, y, W)
        cells = bodice(p, g, 'sweetheart', R)
        sleeves(p, g, 'puff', R)
        # gold stomacher panel + heart gem
        for y in range(int(wy - 12 * s), int(wy) + 1):
            for x in range(int(hx - 3 * s), int(hx + 3 * s) + 1):
                if (x, y) in cells and (x + y) % 2 == 0: p.set(x, y, GOLD_HI)
        gem(p, hx, int(sy + 11 * s), 2.2 * s, PINK_HI if False else rgb('#ff5a6e'), W, RED_SH)
        # gold waist sash with a bow
        for y in range(int(wy - 2), int(wy + 2)):
            for x in range(int(hx - 9.5 * s), int(hx + 9.5 * s)):
                if (x, y) in cells or full: p.set(x, y, GOLD if y < wy else GOLD_SH)
        if full: bow(p, hx, int(wy), 4.2, GOLD, GOLD_HI, GOLD_SH, GOLD)
        # lace edge on neckline
        for x in range(int(hx - 12 * s), int(hx + 12 * s)):
            dxu = (x - hx) / s
            y = int(sy + interp(NECK['sweetheart'], dxu) * s)
            if (x, y + 1) in cells: p.set(x, y + 1, CREAM)
        outline = DM[3]
    elif did == 'garden':
        if full:
            skirt(p, g, 8.5, 31, 123, 1.0, R, folds=5, scallop=(0, 8))
            # cream pinafore apron
            for y in range(int(wy), 120):
                t = (y - wy) / (120 - wy); hw = 7 + 9 * t
                for x in range(int(hx - hw), int(hx + hw) + 1):
                    u = (x - hx) / hw
                    p.set(x, y, CREAM if u < 0.55 else CREAM_SH)
            for i in range(-2, 3):
                x = int(hx + i * 3.4)
                p.line(x, 116, x, 120, CREAM_SH)
            # embroidered daisies + leaves
            for (fx, fy, col) in ((hx - 8, 104, PINK), (hx + 6, 110, YELLOW), (hx - 2, 114, PINK_HI), (hx + 10, 100, PINK)):
                flower(p, fx, fy, 2.6, W if col == YELLOW else col, YELLOW if col != YELLOW else ORANGE)
            for lx, ly in ((hx - 4, 107), (hx + 3, 105), (hx - 10, 109)):
                p.rect(lx, ly, 2, 1, GREEN); p.set(lx, ly + 1, GREEN_DK)
            # leafy hem
            for i in range(-6, 7):
                x = int(hx + i * 5); p.rect(x, 122, 3, 1, GREEN); p.set(x + 1, 123, GREEN_DK)
        cells = bodice(p, g, 'square', R)
        # thin shoulder straps, scooped back
        for sgn in (-1, 1):
            for y in range(int(sy - 3 * s), int(sy + 6 * s)):
                for x in range(int(hx + sgn * 7.6 * s - 1.6 * s), int(hx + sgn * 7.6 * s + 1.6 * s) + 1):
                    p.set(x, y, R[1]) if p.get(x, y) is None else None
        sleeves(p, g, 'flutter', R)
        # white collar-trim and a little bow
        for x in range(int(hx - 8 * s), int(hx + 8 * s)):
            if (x, int(sy + 6 * s)) in cells: p.set(x, int(sy + 6 * s), CREAM)
        bow(p, hx, int(sy + 8 * s), 2.4 * s, GREEN, GREEN_HI, GREEN_DK, GREEN)
        if full:
            for y in range(int(wy - 2), int(wy + 2)):
                for x in range(int(hx - 8.4), int(hx + 8.4)): p.set(x, y, GREEN)
            bow(p, hx + 5, int(wy), 3.6, GREEN, GREEN_HI, GREEN_DK, GREEN)
        outline = DM[3]
    elif did == 'rose_petal':
        if full:
            tiers = [(92, 20, 9, 1.0), (106, 29, 14, 0.9), (121, 38, 18, 0.9)]
            for i, (hy_, hw, top, bl) in enumerate(reversed(tiers)):
                skirt(p, g, 9 + (2 - i) * 1, hw, hy_, 0.8, R, folds=4, scallop=(4.2, 10), shift=(2 - i) * 0)
                p.p  # noqa
            # petal highlights: curved crescents on each tier
            for (hy_, hw, top, bl) in tiers:
                for k in range(-int(hw // 5), int(hw // 5) + 1):
                    cx = hx + k * 10
                    for dx in range(-3, 4):
                        yy = int(hy_ - 3 + (dx * dx) * 0.28)
                        if p.get(int(cx + dx), yy) is not None: p.set(int(cx + dx), yy, R[0])
        cells = bodice(p, g, 'strapless', R)
        # layered petal bodice
        for i in range(3):
            for k in range(-2, 3):
                cx = hx + k * 4.6 * s; cy = wy - (3 + i * 7) * s
                p.ell(cx, cy, 3.4 * s, 3.0 * s, R[0] if (i + k) % 2 == 0 else R[1])
                p.ell(cx, cy + 1.6 * s, 3.0 * s, 1.2 * s, R[2])
        # petal "sleeves" as little shoulder petals
        for sgn in (-1, 1):
            for k in range(3):
                p.ell(hx + sgn * (g.sh_hw + (1 + k * 1.6) * s), sy + (2 + k * 2.4) * s, 3.6 * s, 3 * s, R[k % 2])
                p.set(int(hx + sgn * (g.sh_hw + (0.4 + k * 1.6) * s)), int(sy + (1 + k * 2.4) * s), R[0])
        # small rose at the waist (fixed reds)
        rx, ry_ = hx - 6 * s, wy + 0 * s
        flower(p, rx, ry_, 3.4 * s, rgb('#ff5a6e'), rgb('#c93a58'), rgb('#ff9aa6'))
        for sgn in (-1, 1): p.ell(rx + sgn * 4.4 * s, ry_ + 2.4 * s, 2.4 * s, 1.2 * s, GREEN)
        outline = DM[3]
    elif did == 'festival':
        if full:
            skirt(p, g, 9, 30, 112, 0.7, R, folds=6, scallop=(0, 8))
            # petticoat frill
            for i in range(-5, 6):
                x = int(hx + i * 5.6); p.ell(x, 113, 3.6, 3, CREAM); p.ell(x, 113.8, 3.6, 1.2, CREAM_SH)
            # bunting stripes of colour on the skirt
            cols = [RED, YELLOW, TEAL, PURPLE, ORANGE, BLUE]
            for i, cx in enumerate(range(int(hx - 25), int(hx + 26), 9)):
                col = cols[i % 6]
                for y in range(100, 108):
                    w = 4 - (y - 100) // 2
                    for x in range(int(cx - w), int(cx + w) + 1):
                        if p.get(x, y) is not None: p.set(x, y, col if x > cx - w else W)
            # pom-poms
            for i in range(-3, 4):
                p.ell(hx + i * 8, 98 + abs(i) % 2 * 3, 1.6, 1.6, W)
        cells = bodice(p, g, 'v', R)
        sleeves(p, g, 'cap', R)
        for x in range(int(hx - 9 * s), int(hx + 9 * s)):        # braid trim along the V neck
            dxu = (x - hx) / s
            y = int(sy + interp(NECK['v'], dxu) * s)
            if (x, y + 1) in cells: p.set(x, y + 1, GOLD); p.set(x, y + 2, rgb('#ff5a6e')) if (x % 2) else None
        # coloured ribbon belt
        if full:
            for i, y in enumerate(range(int(wy - 3), int(wy + 3))):
                for x in range(int(hx - 9), int(hx + 9)): p.set(x, y, RAINBOW[i % 6])
        outline = DM[3]
    elif did == 'starry_night':
        if full:
            skirt(p, g, 9, 38, 128, 0.78, DEEP, folds=7, scallop=(5, 7), shift=0)
            skirt(p, g, 8.6, 35, 122, 0.78, DEEP, folds=6, scallop=(3.6, 12), shift=0)
            r = rng(11)
            for _ in range(34):
                x = r.randint(int(hx - 34), int(hx + 34)); y = r.randint(92, 122)
                if p.get(x, y) is not None:
                    spark(p, x, y, GOLD_HI) if r.random() < 0.35 else p.set(x, y, GOLD_HI if r.random() < 0.5 else W)
            for (x, y) in ((hx - 16, 104), (hx + 14, 112), (hx + 2, 98)):
                star(p, x, y, 3.2, GOLD, W)
        cells = bodice(p, g, 'offshoulder', DEEP)
        sleeves(p, g, 'puff', DEEP)
        # crescent moon on the bodice (fixed pale gold)
        mx, my = hx, sy + 13 * s
        p.ell(mx, my, 4 * s, 4 * s, GOLD_HI); p.ell(mx + 1.8 * s, my - 0.6 * s, 3.4 * s, 3.4 * s, DEEP[1]); p.set(int(mx - 2 * s), int(my - 2 * s), W)
        for dx, dy in ((8, 9), (-9, 12), (10, 17)):
            spark(p, int(hx + dx * s), int(sy + dy * s), GOLD_HI)
        for x in range(int(hx - 14 * s), int(hx + 14 * s)):       # silver-dust neckline
            y = int(sy + interp(NECK['offshoulder'], (x - hx) / s) * s)
            if (x, y + 1) in cells and x % 2 == 0: p.set(x, y + 1, GOLD_HI)
        outline = DM[3]
    elif did == 'rainbow_gown':
        if full:
            skirt(p, g, 9, 39, 126, 0.74, R, folds=6, scallop=(3.4, 13))
            # rainbow ribbon bands wrapped round the hem
            for i, c in enumerate(RAINBOW):
                for x in range(int(hx - 42), int(hx + 42)):
                    yy = int(104 + i * 3 + 1.6 * math.sin((x - hx) * 0.18))
                    for dy in (0, 1, 2):
                        if p.get(x, yy + dy) is not None: p.set(x, yy + dy, c)
        cells = bodice(p, g, 'round', R)
        sleeves(p, g, 'puff', R)
        for sgn in (-1, 1):       # rainbow cuffs on the sleeves
            for i, c in enumerate(RAINBOW[:4]):
                cx = hx + sgn * (g.sh_hw + 2.4 * s)
                p.rect(int(cx - 4.4 * s), int(sy + 7.6 * s + i * 0.9 * s), max(2, int(8.8 * s)), max(1, int(0.9 * s)), c)
        star(p, hx, sy + 12 * s, 3.4 * s, GOLD, W)
        for i, c in enumerate(RAINBOW):    # rainbow sash
            if full: p.rect(int(hx - 9), int(wy - 3 + i * 0.7), 18, 1, c)
        outline = DM[3]
    elif did == 'sea_glass':
        TEALR = [rgb('#c8fff5'), DM[1], DM[2], DM[3]]
        if full:
            # mermaid-line gown: narrow at the knees, flaring fin at the hem
            hem = 130
            for y in range(int(wy) - 2, hem + 6):
                t = (y - (wy - 2)) / (hem - wy + 2)
                hw = 8.6 + 4 * min(1, t * 1.4) + (26 * max(0, t - 0.55) ** 1.6 * 3.3 if t > 0.55 else 0)
                for x in range(int(hx - hw), int(hx + hw) + 1):
                    u = (x - hx) / hw
                    edge = hem + 5 * (0.5 + 0.5 * math.cos((x - hx) * 0.55)) if t > 0.9 else 999
                    if y > edge: continue
                    idx = 1
                    if u > 0.55: idx = 2
                    if u > 0.88: idx = 3
                    if u < -0.55 and (x + y) % 2 == 0: idx = 0
                    p.set(x, y, R[idx])
            # scales
            for yy in range(int(wy) + 4, 128, 5):
                for xx in range(int(hx - 30), int(hx + 30), 6):
                    ox = 3 if ((yy - wy) // 5) % 2 else 0
                    cx = xx + ox
                    for dx in range(-2, 3):
                        y2 = yy + (2 if abs(dx) < 2 else 1) if abs(dx) < 3 else yy
                        if p.get(cx + dx, yy + 2 - abs(dx) // 2) is not None and p.get(cx + dx, yy + 2 - abs(dx) // 2) != R[3]:
                            p.set(cx + dx, yy + 2 - abs(dx) // 2, R[0])
        cells = bodice(p, g, 'sweetheart', R)
        # shell cups
        for sgn in (-1, 1):
            cx = hx + sgn * 5.4 * s; cy = sy + 8.2 * s
            p.ell(cx, cy, 5.4 * s, 4.6 * s, rgb('#fdeee8')); 
            for k in range(-2, 3):
                p.line(int(cx + k * 1.7 * s), int(cy + 3.6 * s), int(cx + k * 0.6 * s), int(cy - 3.2 * s), rgb('#e8b9c4'))
            p.ell(cx, cy - 3.6 * s, 4.4 * s, 1.2 * s, rgb('#fffaf5'))
        sleeves(p, g, 'flutter', R)
        # pearl strand along the neckline
        for x in range(int(hx - 11 * s), int(hx + 11 * s), max(2, int(3 * s))):
            y = int(sy + interp(NECK['sweetheart'], (x - hx) / s) * s)
            pearl(p, x, y + 1, 1.5 * s if s > 1.2 else 1.2)
        outline = DM[3]
    elif did == 'fairy_sparkle':
        if full:
            # leaf-point tulle layers
            for (hem, hw, shift) in ((128, 36, 0), (121, 31, 0)):
                for y in range(int(wy) - 2, hem + 6):
                    t = (y - (wy - 2)) / (hem - wy + 2); hw_ = 9 + (hw - 9) * min(1, t) ** 0.8
                    for x in range(int(hx - hw_), int(hx + hw_) + 1):
                        k = ((x - hx) / 6.0)
                        tip = hem + 6 * (1 - abs((k - math.floor(k)) - 0.5) * 2)
                        if y > tip: continue
                        u = (x - hx) / hw_
                        idx = 1
                        if u > 0.5: idx = 2
                        if u > 0.88: idx = 3
                        if u < -0.6 and (x + y) % 2: idx = 0
                        if y > hem - 4 and idx == 1: idx = 0 if (x + y) % 3 == 0 else 1
                        p.set(x, y, R[idx])
            r = rng(23)
            for _ in range(30):
                x = r.randint(int(hx - 34), int(hx + 34)); y = r.randint(94, 126)
                if p.get(x, y) is not None:
                    (spark(p, x, y, W) if r.random() < 0.3 else p.set(x, y, W if r.random() < 0.6 else GOLD_HI))
            # vine round the waist/hem with tiny flowers
            for x in range(int(hx - 30), int(hx + 30)):
                y = int(122 + 1.6 * math.sin(x * 0.4))
                if p.get(x, y) is not None: p.set(x, y, GREEN)
            for i in range(-4, 5):
                flower(p, int(hx + i * 7), int(122 + 1.6 * math.sin((hx + i * 7) * 0.4)) - 1, 1.8, W if i % 2 else PINK_HI, YELLOW)
        cells = bodice(p, g, 'round', R)
        sleeves(p, g, 'flutter', R)
        # vine bodice trim and glitter
        for x in range(int(hx - 9 * s), int(hx + 9 * s)):
            y = int(sy + interp(NECK['round'], (x - hx) / s) * s)
            if (x, y + 1) in cells: p.set(x, y + 1, GREEN); p.set(x, y + 2, GREEN_DK) if x % 2 == 0 else None
        r = rng(31)
        for _ in range(int(14 * s)):
            x = r.randint(int(hx - 10 * s), int(hx + 10 * s)); y = r.randint(int(sy + 6 * s), int(wy))
            if (x, y) in cells: p.set(x, y, W if r.random() < .6 else GOLD_HI)
        flower(p, hx, sy + 11 * s, 2.6 * s, PINK_HI, YELLOW)
        outline = DM[3]
    elif did.startswith('pj_'):
        pajama_layer(p, g, did, full)
        outline = DM[3]
    else:
        raise ValueError(did)
    remove_specks(p)
    p.outline(outline)
    return p

# ------------------------------------------------------------------ PAJAMAS (v0.4d.6): free bedtime sets drawn in the same marker colours

def pstar(p, x, y, big=False):
    """A chunky fixed-colour pixel star for the pyjamas (the generic star helper turns to slivers at this size)."""
    x, y = int(x), int(y)
    rows = ['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'] if big else ['.X.', 'XXX', '.X.']
    oy, ox = len(rows) // 2, len(rows[0]) // 2
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == 'X': p.set(x - ox + i, y - oy + j, GOLD)
    p.set(x, y, W)
    if big: p.set(x - 1, y - 1, GOLD_HI)

PJ_IDS = ['pj_hearts', 'pj_stars', 'pj_moon', 'pj_rainbow']


def pj_sprinkle(p, cells, kind, seed, r_scale=1.0, n=14):
    """Little fixed-colour motifs scattered over a set of cells (hearts / stars / moons)."""
    r = rng(seed); cl = sorted(cells)
    if not cl: return
    for _ in range(n):
        x, y = cl[r.randrange(len(cl))]
        if kind == 'heart': heart(p, x, y, 2.9 * r_scale, RED, rgb('#ff9aa6'))
        elif kind == 'star': pstar(p, x, y, r_scale >= 1.0)


def pajama_layer(p, g, did, full):
    s = g.s; hx = g.hx; sy, wy = g.sh_y, g.waist_y
    R = DM
    if did == 'pj_moon':
        # a long, soft nightgown: bodice + straight A-line to the ankles, cloud-scalloped hem
        if full:
            cells = skirt(p, g, 9, 24, 126, 1.0, R, folds=4, scallop=(0, 8))
            for x in range(int(hx - 24), int(hx + 25)):          # fluffy cloud hem
                yy = 126 + int(1.6 * math.cos((x - hx) * 0.9))
                p.set(x, yy, W); p.set(x, yy - 1, CREAM)
            r = rng(41)
            for _ in range(7):
                x = r.randint(int(hx - 17), int(hx + 17)); y = r.randint(100, 118)
                if p.get(x, y) is not None: pstar(p, x, y, False)
            # a little cloud and crescent on the skirt
            for (cx, cy) in ((hx - 9, 108), (hx + 8, 116)):
                p.ell(cx, cy, 4, 2.4, W); p.ell(cx + 2.5, cy - 1.2, 2.6, 2, W); p.ell(cx - 2.4, cy - 0.8, 2.2, 1.6, CREAM)
        cells = bodice(p, g, 'round', R)
        sleeves(p, g, 'cap', R)
        mx, my = hx, sy + 11 * s
        p.ell(mx, my, 4 * s, 4 * s, GOLD_HI); p.ell(mx + 1.8 * s, my - 0.6 * s, 3.4 * s, 3.4 * s, R[1]); p.set(int(mx - 2 * s), int(my - 2 * s), W)
        for x in range(int(hx - 9 * s), int(hx + 9 * s)):
            y = int(sy + interp(NECK['round'], (x - hx) / s) * s)
            if (x, y + 1) in cells: p.set(x, y + 1, W)
        return
    # ---- two-piece sets: long-sleeved top + full-length pants
    if full:
        # pants legs over the (skin) legs, cuffs at the ankle
        for sgn in (-1, 1):
            for y in range(int(wy) - 2, 130):
                t = (y - wy) / (130 - wy)
                cxl = hx + sgn * (6 + 1.5 * t)
                for x in range(int(cxl - 6), int(cxl + 6)):
                    u = (x - cxl) / 6
                    idx = 1 if u < 0.3 else 2
                    if u < -0.7: idx = 0
                    if abs(x - cxl) < 0.6 and y > wy + 6 and sgn * (x - hx) < 3: idx = 3
                    if sgn * (x - hx) >= -0.5:
                        p.set(x, y, R[idx])
            cxl = hx + sgn * 7.5
            cuff = {'pj_hearts': CREAM, 'pj_stars': CREAM, 'pj_rainbow': None}[did]
            for x in range(int(cxl - 6), int(cxl + 6)):
                if p.get(x, 129) is not None:
                    p.set(x, 128, cuff or R[0]); p.set(x, 129, CREAM_SH if cuff else R[2]); p.set(x, 130, R[3])
        pants = {(x, y) for y in range(int(wy), 128) for x in range(int(hx - 14), int(hx + 15)) if p.get(x, y) is not None}
        if did == 'pj_rainbow':
            for sgn in (-1, 1):
                for i, c in enumerate(RAINBOW[:5]):
                    cxl = hx + sgn * 7.5
                    for x in range(int(cxl - 5.5), int(cxl + 5.5)):
                        if p.get(x, 122 + i) is not None: p.set(x, 122 + i, c)
        elif did == 'pj_hearts': pj_sprinkle(p, {c for c in pants if c[1] > 98 and c[1] < 118}, 'heart', 7, 1.0, 5)
        else: pj_sprinkle(p, {c for c in pants if c[1] > 98 and c[1] < 118}, 'star', 9, 1.0, 5)
        # waistband
        for x in range(int(hx - 12), int(hx + 12)):
            if p.get(x, int(wy)) is not None: p.set(x, int(wy), R[0]); p.set(x, int(wy) - 1, R[2]) if p.get(x, int(wy) - 1) is not None else None
    cells = bodice(p, g, 'round', R)
    # long sleeves down over the arms (full) / soft cap sleeves in the portrait
    if full:
        for sgn in (-1, 1):
            sx, sy_ = hx + sgn * 13, 66
            ex, ey = hx + sgn * 20, 78
            wx, wy2 = hx + sgn * 24, 89
            line_w(p, sx, sy_, ex, ey, 7, R[1]); line_w(p, ex, ey, wx, wy2, 6, R[1])
            line_w(p, sx + sgn * 3, sy_ + 1, ex + sgn * 3, ey, 2, R[2]); line_w(p, ex + sgn * 3, ey, wx + sgn * 3, wy2, 2, R[2])
            line_w(p, sx - sgn * 2, sy_ - 1, ex - sgn * 2, ey - 1, 2, R[0])
            for i in range(3):   # cuff
                p.rect(int(wx - 3), int(wy2 + i - 1), 6, 1, (CREAM if i < 2 else CREAM_SH) if did != 'pj_rainbow' else RAINBOW[i])
    else:
        sleeves(p, g, 'cap', R)
    # top decoration
    if did == 'pj_hearts':
        pj_sprinkle(p, {c for c in cells if c[1] > sy + 6 * s}, 'heart', 3, max(1.0, s * 0.8), 4)
        heart(p, hx, sy + 10 * s, 3 * s, RED, rgb('#ff9aa6'))
    elif did == 'pj_stars':
        pj_sprinkle(p, {c for c in cells if c[1] > sy + 6 * s}, 'star', 5, max(1.0, s * 0.8), 4)
        pstar(p, hx, sy + 10 * s, True)
    else:
        for i, c in enumerate(RAINBOW):                       # rainbow arc on the chest
            r_ = (12 - i * 1.5) * s
            for x in range(int(hx - r_), int(hx + r_ + 1)):
                dy = math.sqrt(max(0, r_ * r_ - (x - hx) ** 2)) * 0.7
                y = int(sy + 20 * s - dy)
                if (x, y) in cells: p.set(x, y, c)
    # collar piping and buttons
    for x in range(int(hx - 9 * s), int(hx + 9 * s)):
        y = int(sy + interp(NECK['round'], (x - hx) / s) * s)
        if (x, y + 1) in cells: p.set(x, y + 1, CREAM)
    for k in range(3):
        p.set(int(hx), int(sy + (15 + k * 3.5) * s) if did == 'pj_rainbow' else int(sy + (17 + k * 3.2) * s), W) if False else None
    for y in range(int(sy + 16 * s), int(wy) - 1, max(3, int(3.4 * s))):
        if (int(hx), y) in cells and did != 'pj_rainbow': p.set(int(hx), y, CREAM_SH)



# ------------------------------------------------------------------ SHOES (full only)
GOLDR = [GOLD_HI, GOLD, GOLD_SH, GOLD_DK]
PURPR = [PURPLE_HI, PURPLE, PURPLE_SH, rgb('#47298f')]
BROWNR = [BROWN_HI, BROWN, BROWN_SH, rgb('#4a2a16')]
PEARLR = [W, PEARL, PEARL_SH, rgb('#9a90b8')]


def shoes_layer(sid):
    g = Geo('full'); p = g.px(); hx = g.hx
    for sgn in (-1, 1):
        fx = hx + sgn * 7; fy = 139
        if sid == 'slippers':
            ell_shaded(p, fx + sgn * 1, fy, 5.6, 3.3, DM)
            p.ell(fx + sgn * 5, fy + 0.4, 2.2, 1.8, DM[1])
            p.rect(int(fx - 2), int(fy - 2), 5, 1, DM[0])
            bow(p, fx, fy - 2, 1.8, DM[0], W, DM[2], DM[1])
            p.set(int(fx + sgn * 5), int(fy), W)
            p.outline(DM[3])
        elif sid == 'mary_janes':
            ell_shaded(p, fx + sgn * 0.6, fy, 5.4, 3.2, PURPR)
            p.rect(int(fx - 3), int(fy - 1), 6, 1, GOLD)               # strap
            p.set(int(fx - sgn * 3), int(fy - 1), GOLD_HI); p.ell(fx + sgn * 2, fy - 1.4, 1, 1, GOLD_HI)    # button
            p.rect(int(fx - 3), int(fy + 3), 7, 1, rgb('#47298f'))
            p.outline(rgb('#2c1a63'))
        elif sid == 'boots':
            p.rect(int(fx - 3), 131, 7, 9, BROWN[1])
            for y in range(131, 140):
                p.set(int(fx - 3), y, BROWN_HI); p.set(int(fx + 3), y, BROWN_SH)
            ell_shaded(p, fx + sgn * 1, fy + 0.2, 5.6, 3.4, BROWNR)
            p.rect(int(fx - 4), 129, 9, 3, CREAM); p.rect(int(fx - 4), 131, 9, 1, CREAM_SH)     # fluffy cuff
            for i in range(4):
                p.set(int(fx - 4 + i * 2 + 1), 129, W)
            for y in (134, 136): p.set(int(fx - 1), y, GOLD); p.set(int(fx + 1), y, GOLD)
            p.outline(rgb('#4a2a16'))
        elif sid == 'jeweled':
            ell_shaded(p, fx + sgn * 1, fy, 5.6, 3.3, GOLDR)
            p.poly([(int(fx + sgn * 4), int(fy - 2)), (int(fx + sgn * 8), int(fy + 1)), (int(fx + sgn * 4), int(fy + 3))], GOLD)
            gem(p, fx, int(fy - 1), 1.6, rgb('#ff5a6e'), W, RED_SH)
            gem(p, fx + sgn * 4, int(fy), 1.2, BLUE, W, BLUE_SH)
            p.rect(int(fx - 4), int(fy + 3), 8, 1, GOLD_DK)
            p.outline(GOLD_DK)
        elif sid == 'sandals':
            ell_shaded(p, fx + sgn * 1, fy + 0.5, 5.0, 2.8, SM)
            p.rect(int(fx - 4), int(fy + 2), 9, 2, BROWN_HI)                  # sole
            for i in range(-1, 2):
                p.line(int(fx - 3 + i), int(fy - 1), int(fx + 3 + i), int(fy + 1), CREAM)
            flower(p, int(fx + sgn * 3), int(fy - 2), 1.8, PINK, YELLOW, PINK_HI)
            p.outline(SM[3])
        elif sid == 'pearl_shoes':
            ell_shaded(p, fx + sgn * 1, fy, 5.6, 3.3, PEARLR)
            for i in range(5):
                pearl(p, int(fx - 3 + i * 1.6), int(fy - 2 + (1 if i in (0, 4) else 0)), 1.3)
            p.outline(rgb('#9a90b8'))
    return p


# ------------------------------------------------------------------ ACCESSORIES (cape / gloves / wings / shawl)
def cape_back(kind, ramp, trim=None, stars=False):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    top = g.sh_y - 3 * s
    bottom = g.h - 4 if kind == 'portrait' else 131
    for y in range(int(top), int(bottom)):
        t = max(0.0, (y - top) / (bottom - top))
        hw = (g.sh_hw + 1 * s) + (24 * s if kind == 'full' else 20 * s) * (t ** 0.8)
        for x in range(int(hx - hw), int(hx + hw) + 1):
            u = (x - hx) / hw
            idx = 1
            if abs(u) > 0.55: idx = 2
            if abs(u) > 0.9: idx = 3
            if -0.5 < u < -0.2 and (x + y) % 3: idx = 0 if (x + y) % 2 == 0 else 1
            if t > 0.94: idx = max(idx, 2)
            p.set(x, y, ramp[idx])
    if stars:
        r = rng(3)
        for _ in range(int(14 * (s if s > 1 else 1))):
            x = r.randint(int(hx - 36 * s), int(hx + 36 * s)); y = r.randint(int(top + 8), int(bottom - 3))
            if p.get(x, y) is not None: spark(p, x, y, W) if r.random() < .4 else p.set(x, y, W)
    if trim is not None:
        for x in range(int(hx - 60), int(hx + 60)):
            if p.get(x, int(bottom) - 2) is not None:
                p.set(x, int(bottom) - 2, trim); p.set(x, int(bottom) - 1, trim)
    remove_specks(p)
    p.outline(ramp[3])
    return p


def collar_front(kind, fur=True, jewel=RED, jewel_hi=W):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    y0 = g.sh_y + 0.5 * s
    for i in range(-9, 10):
        x = hx + i * 2.1 * s; y = y0 + 1.6 * s * (i / 9) ** 2 * 4 - 1.2 * s
        p.ell(x, y + 1.4 * s, 3.2 * s, 2.8 * s, W)
        p.ell(x - 0.6 * s, y + 0.8 * s, 1.6 * s, 1.0 * s, CREAM)
        p.ell(x, y + 3.2 * s, 2.6 * s, 1.0 * s, CREAM_SH)
        if i % 3 == 0: p.set(int(x), int(y + 2.6 * s), rgb('#40255a'))           # ermine spot
    gem(p, hx, int(y0 + 4.8 * s), 2.3 * s, jewel, jewel_hi, RED_SH)
    p.outline(rgb('#b8b2d6'))
    return p


def wings_back(kind):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    ramp = [rgb('#f1e6ff'), PURPLE_HI, rgb('#a784f0'), PURPLE_SH]
    for sgn in (-1, 1):
        up = set(); lo = set()
        for y in range(p.h):
            for x in range(p.w):
                dx = (x + .5 - (hx + sgn * 24 * s)) * sgn; dy = y + .5 - (g.sh_y - 10 * s)
                # upper wing: tilted ellipse
                a = 0.5
                xr = dx * math.cos(a) - dy * math.sin(a) * sgn * -1 if False else dx
                if (dx / (19 * s)) ** 2 + ((dy + 0.35 * dx * 0.0) / (26 * s)) ** 2 <= 1 and dy < 14 * s: up.add((x, y))
                dy2 = y + .5 - (g.sh_y + 18 * s); dx2 = (x + .5 - (hx + sgn * 17 * s)) * sgn
                if (dx2 / (12 * s)) ** 2 + (dy2 / (14 * s)) ** 2 <= 1: lo.add((x, y))
        cells = up | lo
        shade_mask(p, cells, ramp, cx=hx + sgn * 20 * s, cy=g.sh_y, rx=24 * s, ry=34 * s)
        # inner colour + vein lines + spots
        for (x, y) in list(cells):
            dxn = abs(x - hx) / s
            if 14 < dxn < 40 and ((x + y) % 7 == 0) and p.get(x, y) in (ramp[1], ramp[0]): p.set(x, y, rgb('#ffb8e2'))
        cx, cy = hx + sgn * 25 * s, g.sh_y - 12 * s
        p.ell(cx, cy, 5 * s, 6 * s, BLUE_HI); p.ell(cx, cy, 2.6 * s, 3.2 * s, W)
        p.ell(hx + sgn * 17 * s, g.sh_y + 18 * s, 3.4 * s, 4 * s, PINK_HI)
        for k in range(1, 4):
            p.line(int(hx + sgn * 14 * s), int(g.sh_y + 2 * s), int(hx + sgn * (14 + k * 8) * s), int(g.sh_y - (4 + k * 6) * s), PURPLE_SH)
    remove_specks(p)
    p.outline(rgb('#6f43c9'))
    return p


def gloves_front():
    g = Geo('full'); p = g.px(); hx = g.hx
    for sgn in (-1, 1):
        ex, ey = hx + sgn * 20, 78; hx2, hy2 = hx + sgn * 25, 92
        line_w(p, ex, ey, hx2, hy2, 6.4, CREAM)
        line_w(p, ex + sgn * 2, ey + 1, hx2 + sgn * 2, hy2, 2, CREAM_SH)
        p.ell(hx2, hy2 + 1, 3.6, 3.9, CREAM)
        for i in range(-3, 4):      # lace frill at the top edge
            p.set(int(ex + i), int(ey - 2 + (1 if i % 2 else 0)), W)
        p.rect(int(ex - 3), int(ey - 1), 7, 1, W)
        p.set(int(hx2 - sgn * 1), int(hy2 + 1), W)
        bow(p, ex, ey, 1.8, PINK_HI, W, PINK_SH, PINK)
    p.outline(rgb('#b8b2d6'))
    return p


def shawl_front(kind):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    cols = [(PINK, YELLOW), (W, YELLOW), (PURPLE_HI, W), (PINK_HI, YELLOW)]
    for i in range(-8, 9):
        x = hx + i * 2.2 * s; y = g.sh_y + 0.8 * s + (abs(i) ** 1.7) * 0.18 * s + 0.4 * s
        p.ell(x + (1 if i % 2 else -1) * s, y + 1.4 * s, 2.6 * s, 1.6 * s, GREEN)
    for i in range(-5, 6):
        x = hx + i * 3.2 * s; y = g.sh_y + 0.8 * s + (abs(i) ** 1.7) * 0.28 * s * 1.5 - 0.5 * s
        c, ctr = cols[(i + 5) % 4]
        flower(p, x, y, 2.5 * s, c, ctr, W)
    p.outline(GREEN_DK)
    return p


def accessory_layers(aid, kind):
    """Returns (back, front) or None for 'none'."""
    g = Geo(kind)
    if aid == 'none': return None
    if aid == 'royal_cape':
        return cape_back(kind, [DM[0], DM[1], DM[2], DM[3]] if False else [rgb('#ff6f7f'), rgb('#e03a5a'), rgb('#a8254a'), rgb('#6f1736')], trim=GOLD), collar_front(kind)
    if aid == 'moon_cape':
        navy = [rgb('#5b6ccf'), rgb('#3a4aa8'), rgb('#27337f'), rgb('#171f55')]
        return cape_back(kind, navy, trim=rgb('#dfe6ff'), stars=True), collar_front(kind, jewel=rgb('#dfe6ff'), jewel_hi=W)
    if aid == 'butterfly_wings':
        return wings_back(kind), g.px()
    if aid == 'lace_gloves':
        return (g.px(), gloves_front()) if kind == 'full' else None
    if aid == 'flower_shawl':
        return g.px(), shawl_front(kind)
    raise ValueError(aid)


# ------------------------------------------------------------------ HEADWEAR
def arc_y(g, x, lift=0.0):
    """y of the top of the head at column x (the tiara line)."""
    s = g.s
    dx = (x - g.hx) / (g.hrx * 0.98)
    dx = max(-0.999, min(0.999, dx))
    return g.hy - g.hry * math.sqrt(1 - dx * dx) * 0.96 + 3.2 * s + lift * s


def tiara_layer(tid, kind):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    if tid == 'none': return None
    span = int(g.hrx * 0.84)
    if tid == 'gold_tiara':
        for x in range(hx - span, hx + span + 1):
            y = arc_y(g, x)
            for k in range(max(2, int(2.2 * s))):
                p.set(x, int(y) + k, GOLD if k == 0 else GOLD_SH)
        for (dx, h, gm) in ((0, 9, 'c'), (-8, 6, 's'), (8, 6, 's'), (-15, 4, 'e'), (15, 4, 'e')):
            x = hx + int(dx * s); yb = arc_y(g, x)
            hh = int(h * s)
            for k in range(hh):
                w = int((hh - k) / hh * 2.6 * s) + (1 if k < hh * .4 else 0)
                for xx in range(x - w, x + w + 1):
                    p.set(xx, int(yb) - k, GOLD if xx >= x else GOLD_HI)
            p.ell(x, yb - hh - 0.8 * s, 1.5 * s, 1.5 * s, W)
            if gm == 'c': gem(p, x, int(yb) - 2 * s, 2.2 * s, PINK, W, PINK_SH)
            elif gm == 's': gem(p, x, int(yb) - 1.5 * s, 1.6 * s, BLUE, W, BLUE_SH)
        p.outline(GOLD_DK)
    elif tid == 'pearl_crown':
        for x in range(hx - span, hx + span + 1):
            y = arc_y(g, x)
            p.set(x, int(y), GOLD); p.set(x, int(y) + 1, GOLD_SH)
        n = 9
        for i in range(n):
            x = hx - span + int(i * (2 * span) / (n - 1)); y = arc_y(g, x)
            pearl(p, x, y - 1.2 * s, 1.8 * s if i % 2 == 0 else 1.3 * s)
            if i % 2 == 1:
                for k in range(int(4 * s)): p.set(x, int(y - 2 * s - k), GOLD)
                p.set(x, int(y - 2 * s - 4 * s), GOLD_HI)
        pearl(p, hx, arc_y(g, hx) - 6.5 * s, 2.6 * s)
        p.outline(rgb('#9a90b8'))
    elif tid == 'star_tiara':
        for x in range(hx - span, hx + span + 1):
            y = arc_y(g, x)
            for k in range(max(2, int(1.8 * s))): p.set(x, int(y) + k, GOLD if k == 0 else GOLD_SH)
        star(p, hx, int(arc_y(g, hx) - 6.5 * s), 7.5 * s, GOLD, W)
        for sgn in (-1, 1):
            for dx, r in ((11, 3.8), (18, 2.6)):
                x = hx + sgn * int(dx * s); star(p, x, int(arc_y(g, x) - 3.4 * s), r * s, GOLD_HI, W)
        spark(p, hx - int(10 * s), int(arc_y(g, hx) - 12 * s), W); spark(p, hx + int(11 * s), int(arc_y(g, hx) - 13 * s), GOLD_HI)
        p.outline(GOLD_DK)
    elif tid == 'flower_crown':
        r = rng(41)
        n = 11
        for i in range(n):
            x = hx - int(g.hrx * 0.95) + int(i * (2 * g.hrx * 0.95) / (n - 1)); y = arc_y(g, x, 1.5)
            p.ell(x + (2 if i % 2 else -2) * s, y + 1.6 * s, 3.4 * s, 1.8 * s, GREEN)
        cols = [(PINK, YELLOW), (W, YELLOW), (PURPLE_HI, W), (PINK_HI, YELLOW), (rgb('#ff9aae'), YELLOW)]
        for i in range(7):
            x = hx - int(g.hrx * 0.92) + int(i * (2 * g.hrx * 0.92) / 6); y = arc_y(g, x, 0.6)
            c, ctr = cols[i % 5]
            flower(p, x, y - 1.2 * s, 3.4 * s if i % 2 == 0 else 2.7 * s, c, ctr, W)
        p.outline(GREEN_DK)
    elif tid == 'bunny_ribbon':
        cx = hx - int(g.hrx * 0.55); cy = int(arc_y(g, cx) - 1 * s)
        for sgn, tilt in ((-1, -5), (1, 4)):
            taper(p, [(cx, cy), (cx + sgn * 3 * s, cy - 9 * s), (cx + sgn * (3 + tilt * 0.4) * s, cy - 15 * s)], 6.4 * s, 4.4 * s, PINK)
            taper(p, [(cx + sgn * 0.6 * s, cy - 2 * s), (cx + sgn * 3 * s, cy - 9 * s), (cx + sgn * (3 + tilt * 0.4) * s, cy - 13 * s)], 3 * s, 2 * s, PINK_HI)
        p.ell(cx, cy + 0.5 * s, 3.2 * s, 2.8 * s, PINK_SH); p.ell(cx - 0.6 * s, cy - 0.2 * s, 1.4 * s, 1.2 * s, PINK_HI)
        for sgn in (-1, 1):     # ribbon tails
            taper(p, [(cx, cy + 2 * s), (cx + sgn * 3 * s, cy + 8 * s)], 3.4 * s, 2.4 * s, PINK)
        p.outline(PINK_SH if False else rgb('#9b3a86'))
    elif tid == 'butterfly_clip':
        cx = hx + int(g.hrx * 0.62); cy = int(arc_y(g, cx) + 4 * s)
        butterfly(p, cx, cy, 6.2 * s, BLUE, PURPLE_HI)
        for sgn in (-1, 1): p.set(int(cx + sgn * 1), int(cy - 6 * s), OL)
        p.outline(rgb('#2169dc'))
    return p


# ------------------------------------------------------------------ JEWELRY
def earrings_layer(eid, kind):
    g = Geo(kind); p = g.px(); s = g.s; hx, hy = g.hx, g.hy
    if eid == 'none': return None
    for sgn in (-1, 1):
        ex = hx + sgn * (g.hrx - 0.8 * s); ey = hy + 7.2 * s
        if eid == 'pearl_studs':
            pearl(p, ex, ey, 1.9 * s)
            p.outline(rgb('#9a90b8'))
        elif eid == 'star_drops':
            p.line(int(ex), int(ey - 1), int(ex), int(ey + 3 * s), GOLD)
            star(p, ex, ey + 6 * s, 3.2 * s, GOLD, W)
            p.outline(GOLD_DK)
        elif eid == 'flower_dangles':
            p.line(int(ex), int(ey - 1), int(ex), int(ey + 3 * s), GREEN)
            flower(p, ex, ey + 6 * s, 2.6 * s, PINK, YELLOW, W)
            p.outline(GREEN_DK)
    return p


def chain_arc(p, g, half, sag, y0, col, pts=None):
    xs = []
    for x in range(int(g.hx - half), int(g.hx + half) + 1):
        u = (x - g.hx) / half
        y = y0 + sag * (1 - u * u)
        p.set(x, int(round(y)), col)
        xs.append((x, y))
    return xs


def necklace_layer(nid, kind):
    g = Geo(kind); p = g.px(); s = g.s; hx = g.hx
    if nid == 'none': return None
    ny = g.sh_y - 1.5 * s          # where the neck meets the shoulders
    if nid == 'heart_pendant':
        chain_arc(p, g, 7.5 * s, 9 * s, ny, GOLD); chain_arc(p, g, 7.5 * s, 9 * s, ny + 1, GOLD_SH)
        heart(p, hx, ny + 11.5 * s, 3.2 * s, PINK, W)
        p.outline(rgb('#9b3a86') if False else GOLD_DK)
    elif nid == 'star_pendant':
        chain_arc(p, g, 7.5 * s, 9 * s, ny, GOLD); chain_arc(p, g, 7.5 * s, 9 * s, ny + 1, GOLD_SH)
        star(p, hx, ny + 12.5 * s, 4.2 * s, GOLD, W)
        p.outline(GOLD_DK)
    elif nid == 'gem_choker':
        cy = g.hy + g.hry + 2.6 * s
        for x in range(int(hx - 5 * s), int(hx + 5 * s) + 1):
            u = (x - hx) / (5 * s)
            y = cy + 1.6 * s * u * u
            for k in range(max(2, int(2 * s))): p.set(x, int(y) + k, GOLD if k == 0 else GOLD_SH)
        gem(p, hx, int(cy + 2 * s), 2.2 * s, BLUE, W, BLUE_SH)
        for dx in (-3.6, 3.6): gem(p, hx + dx * s, int(cy + 1.6 * s), 1.3 * s, PINK, W, PINK_SH)
        p.outline(GOLD_DK)
    elif nid == 'pearl_strand':
        n = 11
        for i in range(n):
            u = -1 + 2 * i / (n - 1)
            x = hx + u * 8.5 * s; y = ny + 1 * s + 12 * s * (1 - u * u)
            pearl(p, x, y, 1.7 * s)
        p.outline(rgb('#9a90b8'))
    elif nid == 'shell_necklace':
        chain_arc(p, g, 8 * s, 10 * s, ny, BROWN_HI)
        for dx, dy, r in ((-5.2, 7, 2.4), (5.2, 7, 2.4), (0, 11, 3.6)):
            x = hx + dx * s; y = ny + dy * s
            p.ell(x, y, r * s, r * 0.82 * s, rgb('#ffd0e0')); p.rect(int(x - r * s * .5), int(y + r * .5 * s), max(2, int(r * s)), 1, rgb('#e8b9c4'))
            for k in (-1, 0, 1): p.line(int(x + k * r * .5 * s), int(y + r * .6 * s), int(x + k * r * .2 * s), int(y - r * .6 * s), rgb('#e8b9c4'))
        p.outline(rgb('#c96f8f'))
    return p


# ------------------------------------------------------------------ FACE ACCENTS
def face_layer(fid, kind):
    g = Geo(kind); p = g.px(); s = g.s; hx, hy = g.hx, g.hy
    if fid == 'none': return None
    for sgn in (-1, 1):
        cx = hx + sgn * 11.8 * s; cy = hy + 9.6 * s
        if fid == 'rosy_cheeks':
            p.ell(cx, cy, 3.6 * s, 2.3 * s, rgb('#ff8fa8')); p.ell(cx - 0.6 * s, cy - 0.4 * s, 2.0 * s, 1.1 * s, rgb('#ffb3c3'))
            p.set(int(cx - 1.4 * s), int(cy - 1.4 * s), W)
        elif fid == 'star_freckles':
            for dx, dy, c in ((-2, 0, GOLD), (1.4, -1.2, PINK), (2.6, 1.6, GOLD)):
                x = int(cx + dx * s * sgn); y = int(cy + dy * s)
                p.set(x, y, c); p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c)
        elif fid == 'glitter_cheeks':
            r = rng(7 + (sgn + 1))
            for _ in range(int(9 * s)):
                x = int(cx + r.uniform(-3.4 * s, 3.4 * s)); y = int(cy + r.uniform(-2.2 * s, 2.2 * s))
                p.set(x, y, r.choice([W, GOLD_HI, PINK_HI, BLUE_HI]))
            spark(p, int(cx), int(cy), GOLD_HI) if s > 1.2 else p.set(int(cx), int(cy), GOLD_HI)
        elif fid == 'butterfly_accent':
            if sgn == 1:
                butterfly(p, cx, cy - 0.4 * s, 3.4 * s, PURPLE_HI, BLUE_HI)
                p.outline(rgb('#6f43c9'))
            else:
                spark(p, int(cx), int(cy), GOLD_HI) if s > 1.2 else p.set(int(cx), int(cy), GOLD_HI)
    return p


# ------------------------------------------------------------------ composition (previews + docs; the game does the same in TypeScript)
def load_ramps():
    """Colour ramps live in src/content/appearance.ts (single source of truth); parse them for previews."""
    import re, os
    src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'content', 'appearance.ts')).read()
    out = {}
    for group, name in (('dress', 'DRESS_COLORS'), ('hair', 'HAIR_COLORS'), ('skin', 'SKIN_TONES')):
        block = src[src.index('export const ' + name):]
        block = block[:block.index('];')]
        out[group] = {m.group(1): [rgb(h) for h in re.findall(r"'(#[0-9a-fA-F]{6})'", m.group(2))] for m in re.finditer(r"c\('(\w+)', '[^']*', \[([^\]]*)\]\)", block)}
    return out


def recolor_image(im, group, ramp):
    mp = {MARKERS[group][i]: ramp[i] for i in range(4)}
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            c = px[x, y]
            if c in mp: px[x, y] = mp[c]
    return im


def layer_stack(app, kind):
    """Ordered [(Px, colour-group or None)] bottom to top for an appearance dict."""
    full = kind == 'full'
    out = []
    acc = accessory_layers(app['accessoryId'], kind)
    if acc: out.append((acc[0], 'dress'))
    hb, hf = hair_layers(app['hairstyleId'], kind)
    out.append((hb, 'hair'))
    out.append((body(kind), 'skin'))
    if full: out.append((shoes_layer(app['shoesId']), 'dress'))
    out.append((dress_layer(app['dressId'], kind), 'dress'))
    n = necklace_layer(app['necklaceId'], kind)
    if n: out.append((n, None))
    if acc: out.append((acc[1], 'dress'))
    f = face_layer(app['faceAccentId'], kind)
    if f: out.append((f, None))
    out.append((hf, 'hair'))
    e = earrings_layer(app['earringsId'], kind)
    if e: out.append((e, None))
    t = tiara_layer(app['tiaraId'], kind)
    if t: out.append((t, None))
    return out


def compose_preview(app, kind, ramps=None, bg=(255, 240, 250, 255)):
    from PIL import Image
    ramps = ramps or load_ramps()
    g = Geo(kind)
    im = Image.new('RGBA', (g.w, g.h), bg)
    for px, grp in layer_stack(app, kind):
        li = px.image()
        if grp == 'dress': recolor_image(li, 'dress', ramps['dress'][app['dressColorId']])
        elif grp == 'hair': recolor_image(li, 'hair', ramps['hair'][app['hairColorId']])
        elif grp == 'skin': recolor_image(li, 'skin', ramps['skin'][app['skinToneId']])
        # skin-coloured sandals share the skin marker
        recolor_image(li, 'skin', ramps['skin'][app['skinToneId']]) if grp == 'dress' else None
        im.alpha_composite(li)
    return im


# ------------------------------------------------------------------ BEDROOM PROPS (32px wide, two frames: sparkle on / off)
def wardrobe_prop(f):
    p = Px(32, 48)
    PK, PKH, PKS = rgb('#ff9ad0'), rgb('#ffc8e6'), rgb('#cf4f9f')
    # crest + body
    p.ell(16, 7, 11, 6, GOLD); p.ell(16, 8, 10, 5, PK)
    p.rect(2, 8, 28, 36, PK); p.rect(2, 8, 28, 2, GOLD)
    p.rect(2, 8, 2, 36, PKH); p.rect(28, 8, 2, 36, PKS)
    p.rect(1, 40, 30, 4, GOLD_SH); p.rect(1, 40, 30, 1, GOLD)
    p.rect(3, 44, 4, 3, BROWN); p.rect(25, 44, 4, 3, BROWN)
    # doors: arched panels
    for dx in (4, 17):
        p.rect(dx, 13, 11, 25, PKS)
        p.rect(dx + 1, 14, 9, 23, rgb('#ffd6ec'))
        p.ell(dx + 5.5, 17, 4.5, 3.4, rgb('#ffd6ec'))
        p.rect(dx + 1, 14, 9, 1, W)
        p.rect(dx, 13, 1, 25, GOLD); p.rect(dx + 10, 13, 1, 25, GOLD)
        p.rect(dx, 37, 11, 1, GOLD)
        star(p, dx + 5, 24, 3.4, GOLD, GOLD_HI)
        p.rect(dx + 3, 30, 5, 1, PK); p.set(dx + 5, 32, PKS)
    p.rect(15, 12, 2, 27, GOLD)
    # crown + star finial
    p.rect(11, 2, 10, 3, GOLD); p.set(11, 1, GOLD); p.set(15, 0, GOLD_HI); p.set(16, 0, GOLD_HI); p.set(20, 1, GOLD); p.set(15, 2, PINK); p.set(16, 2, BLUE)
    # handles
    for hx_ in (13, 18):
        p.rect(hx_, 26, 1, 4, GOLD_HI); p.set(hx_, 25, GOLD)
    if f == 1:
        spark(p, 12, 24, GOLD_HI); spark(p, 19, 31, W)
        spark(p, 6, 12, GOLD_HI)
    else:
        p.set(12, 27, W); p.set(19, 28, W)
        spark(p, 25, 18, GOLD_HI)
    p.outline(rgb('#7a2f69'))
    return p


def vanity_prop(f):
    p = Px(32, 44)
    # tall mirror
    p.ell(16, 13, 12, 13, GOLD); p.ell(16, 13, 10.4, 11.6, rgb('#b8e6ff'))
    p.ell(16, 13, 10.4, 11.6, rgb('#bfe9ff'))
    for y in range(3, 24):
        for x in range(6, 27):
            if ((x - 16) / 10.4) ** 2 + ((y - 13) / 11.6) ** 2 <= 1:
                t = (y - 3) / 21
                p.set(x, y, mix('#dff4ff', '#8fd0f5', t))
    for k in range(6):     # glass shine
        p.set(9 + k, 9 - k // 2 + 3, W); p.set(10 + k, 10 + 3 - k // 2, W) if k < 3 else None
    for a in range(0, 360, 30):   # round bulbs around the frame
        x = 16 + 12.3 * math.cos(math.radians(a)); y = 13 + 13.4 * math.sin(math.radians(a))
        on = (a // 30 + f) % 2 == 0
        p.ell(x, y, 1.2, 1.2, YELLOW if on else GOLD_SH)
        if on: p.set(int(x), int(y), W)
    star(p, 16, 0, 2.6, GOLD, W)
    # table top + skirt
    p.rect(1, 27, 30, 3, rgb('#ffc8e6')); p.rect(1, 27, 30, 1, W); p.rect(1, 29, 30, 1, rgb('#cf4f9f'))
    for y in range(30, 42):
        for x in range(3, 29):
            ed = 41 + (1 if (x // 3) % 2 else 0)
            if y <= ed: p.set(x, y, rgb('#ff9ad0') if (x // 4) % 2 else rgb('#ff7ec3'))
    p.rect(3, 30, 26, 1, GOLD); p.rect(4, 42, 3, 2, BROWN); p.rect(25, 42, 3, 2, BROWN)
    # things on the table
    p.rect(3, 22, 8, 5, GOLD); p.rect(3, 22, 8, 1, GOLD_HI); p.rect(3, 24, 8, 1, GOLD_SH); p.set(7, 25, PINK); pearl(p, 5, 21, 1.4); pearl(p, 9, 21, 1.4)   # jewellery box
    p.rect(22, 23, 4, 4, rgb('#8fd8ff')); p.rect(23, 21, 2, 2, GOLD); p.set(22, 24, W)                                                      # perfume
    p.rect(14, 24, 4, 3, rgb('#c9a8ff')); flower(p, 14, 22, 2, PINK, YELLOW); flower(p, 18, 21, 2, W, YELLOW); p.line(16, 24, 16, 22, GREEN)  # flowers
    if f == 1:
        spark(p, 5, 18, GOLD_HI)
        spark(p, 26, 12, W)
    p.outline(rgb('#7a2f69'))
    return p


# ------------------------------------------------------------------ UI ICONS
def ui_icons():
    from art_props import _ui
    out = []

    def add(name, bg, fn): out.append(_ui(name, bg, fn))
    add('icon_wardrobe', '#ff9ad0', lambda p: (p.rect(7, 6, 18, 21, rgb('#ffd6ec')), p.rect(7, 6, 18, 2, GOLD), p.rect(15, 8, 2, 19, GOLD), p.rect(9, 9, 5, 15, rgb('#ff9ad0')), p.rect(18, 9, 5, 15, rgb('#ff9ad0')), p.set(13, 17, GOLD_SH), p.set(18, 17, GOLD_SH), spark(p, 24, 7, W), p.rect(8, 27, 3, 2, GOLD_SH), p.rect(21, 27, 3, 2, GOLD_SH)))

    def mirror(p):
        p.ell(16, 14, 8, 10, GOLD); p.ell(16, 14, 6, 8.2, rgb('#bfe9ff')); p.set(13, 10, W); p.set(14, 9, W); p.set(13, 11, W)
        p.rect(14, 24, 4, 4, GOLD); p.rect(11, 28, 10, 2, GOLD_SH); spark(p, 24, 8, W)
    add('icon_mirror', '#c9a8ff', mirror)

    def dress_i(p):
        p.rect(13, 5, 6, 8, rgb('#ffd6ec')); p.poly([(11, 13), (21, 13), (27, 27), (5, 27)], rgb('#ff7ec3'))
        p.rect(12, 12, 8, 2, GOLD); p.line(13, 14, 10, 27, rgb('#ffb8e2')); p.rect(5, 26, 22, 2, W)
        p.rect(10, 6, 2, 3, rgb('#ffd6ec')); p.rect(20, 6, 2, 3, rgb('#ffd6ec'))
    add('icon_dress', '#ff7ec3', dress_i)

    def palette(p):
        p.ell(16, 16, 11, 9, rgb('#e8c48a')); p.ell(21, 21, 3, 2.4, rgb('#c98e5a'))
        for (x, y, c) in ((10, 13, RED), (15, 9, YELLOW), (21, 11, BLUE), (9, 19, GREEN)):
            p.ell(x, y, 2.4, 2.4, c); p.set(x - 1, y - 1, W)
    add('icon_palette', '#ffd93d', palette)

    def shoe(p):
        p.poly([(7, 9), (14, 9), (15, 17), (25, 20), (26, 25), (7, 25)], rgb('#ff7ec3')); p.rect(7, 25, 19, 2, rgb('#9b3a86'))
        p.rect(7, 9, 7, 2, rgb('#ffb8e2')); bow(p, 19, 18, 2.2, W, W, rgb('#cfc4e6'), W)
    add('icon_shoe', '#a06bff', shoe)

    def cape(p):
        p.poly([(10, 8), (22, 8), (28, 27), (4, 27)], rgb('#e03a5a')); p.line(11, 9, 6, 26, rgb('#ff6f7f')); p.rect(4, 26, 24, 2, GOLD)
        for i in range(8): p.ell(9 + i * 2, 9, 2.2, 2, W)
        gem(p, 16, 11, 2, rgb('#3ea6ff'), W, BLUE_SH)
    add('icon_cape', '#ff5a6e', cape)

    def hair_i(p):
        p.ell(16, 12, 8.5, 9, HM[1]); p.rect(7, 12, 18, 14, HM[1]); p.ell(16, 15, 6, 6.5, SM[1])
        p.ell(16, 9, 7, 3, HM[1]); p.rect(7, 22, 3, 6, HM[2]); p.rect(22, 22, 3, 6, HM[2])
        p.rect(13, 14, 2, 3, EYE); p.rect(18, 14, 2, 3, EYE); p.rect(15, 19, 3, 1, MOUTH)
    add('icon_hair', '#ffbf3f', hair_i)

    def haircolor(p):
        p.poly([(16, 4), (24, 17), (16, 27), (8, 17)], PINK)
        for i, c in enumerate([PINK, PURPLE, BLUE, TEAL]):
            p.rect(10 + i * 3, 14, 3, 11 - i, c)
        p.ell(16, 18, 8, 8, PINK)
        for i, c in enumerate([RED, ORANGE, YELLOW, GREEN, BLUE, PURPLE]):
            p.rect(9 + i * 2, 15, 2, 9, c)
        p.ell(13, 11, 2, 2, W)
    add('icon_haircolor', '#8fd8ff', haircolor)

    def tiara_i(p):
        p.rect(6, 19, 20, 4, GOLD); p.rect(6, 19, 20, 1, GOLD_HI)
        for x, h in ((8, 6), (13, 9), (19, 9), (24, 6)):
            for k in range(h): p.set(x, 19 - k, GOLD); p.set(x + 1, 19 - k, GOLD)
        p.ell(14, 8, 1.8, 1.8, W); p.ell(20, 8, 1.8, 1.8, W); gem(p, 16, 20, 2, PINK, W, PINK_SH); gem(p, 10, 21, 1.4, BLUE, W, BLUE_SH); gem(p, 22, 21, 1.4, BLUE, W, BLUE_SH)
    add('icon_tiara', '#ffd93d', tiara_i)

    def earring(p):
        for x in (10, 22):
            p.ell(x, 9, 2.4, 2.4, GOLD); p.line(x, 11, x, 17, GOLD_SH); pearl(p, x, 21, 3.4); p.set(x, 9, GOLD_HI)
    add('icon_earring', '#ff9ad0', earring)

    def neck(p):
        for x in range(7, 26):
            u = (x - 16) / 9.5
            p.set(x, int(8 + 12 * (1 - u * u) * 0.9), GOLD); p.set(x, int(9 + 12 * (1 - u * u) * 0.9), GOLD_SH)
        heart(p, 16, 22, 3.6, PINK, W)
    add('icon_necklace', '#c9a8ff', neck)

    def face_i(p):
        p.ell(16, 16, 10, 10, SM[1]); p.rect(11, 13, 2, 4, EYE); p.rect(19, 13, 2, 4, EYE); p.set(11, 13, W); p.set(19, 13, W)
        p.rect(14, 21, 4, 1, MOUTH); p.ell(9, 19, 2.6, 1.8, BLUSH); p.ell(23, 19, 2.6, 1.8, BLUSH)
        star(p, 24, 7, 3.6, GOLD, W); star(p, 8, 9, 2.4, PINK_HI, W)
    add('icon_face', '#ff7ec3', face_i)

    def skin_i(p):
        for i, c in enumerate((rgb('#ffdcc0'), rgb('#d9a070'), rgb('#935f3c'), rgb('#6a4028'))):
            p.ell(10 + (i % 2) * 11, 12 + (i // 2) * 10, 5, 5, c)
            p.set(8 + (i % 2) * 11, 10 + (i // 2) * 10, W)
    add('icon_skin', '#ffb894', skin_i)

    def none_i(p):
        p.ell(16, 16, 10, 10, W)
        p.ell(16, 16, 7, 7, rgb('#e0d6f5'))
        p.line(9, 23, 23, 9, rgb('#ff5a6e')); p.line(10, 23, 24, 9, rgb('#ff5a6e')); p.line(9, 22, 23, 8, rgb('#ff5a6e'))
    add('icon_none', '#b8b2d6', none_i)
    return out


# ------------------------------------------------------------------ ATLASES
DRESS_IDS = ['royal_ball', 'garden', 'rose_petal', 'festival', 'starry_night', 'rainbow_gown', 'sea_glass', 'fairy_sparkle', 'pj_hearts', 'pj_stars', 'pj_moon', 'pj_rainbow']
SHOE_IDS = ['slippers', 'mary_janes', 'boots', 'jeweled', 'sandals', 'pearl_shoes']
ACC_IDS = ['royal_cape', 'lace_gloves', 'flower_shawl', 'butterfly_wings', 'moon_cape']
STYLE_IDS = ['long', 'bob', 'ponytail', 'braids', 'bun', 'curls']
TIARA_IDS = ['gold_tiara', 'pearl_crown', 'star_tiara', 'flower_crown', 'bunny_ribbon', 'butterfly_clip']
EAR_IDS = ['pearl_studs', 'star_drops', 'flower_dangles']
NECK_IDS = ['heart_pendant', 'star_pendant', 'gem_choker', 'pearl_strand', 'shell_necklace']
FACE_IDS = ['rosy_cheeks', 'star_freckles', 'glitter_cheeks', 'butterfly_accent']


def empty(px):
    return all(c is None for row in px.p for c in row)


def build_cells(kind):
    """Ordered (name, Px) cells for one atlas. Names are '<part>:<id>'."""
    cells = [('body', body(kind))]
    if kind == 'full':
        for s in SHOE_IDS: cells.append((f'shoes:{s}', shoes_layer(s)))
    for d in DRESS_IDS: cells.append((f'dress:{d}', dress_layer(d, kind)))
    for a in ACC_IDS:
        r = accessory_layers(a, kind)
        if not r: continue
        if not empty(r[0]): cells.append((f'accback:{a}', r[0]))
        if not empty(r[1]): cells.append((f'accfront:{a}', r[1]))
    for st in STYLE_IDS:
        b, f = hair_layers(st, kind)
        cells.append((f'hairback:{st}', b)); cells.append((f'hairfront:{st}', f))
    for t in TIARA_IDS: cells.append((f'tiara:{t}', tiara_layer(t, kind)))
    for e in EAR_IDS: cells.append((f'earrings:{e}', earrings_layer(e, kind)))
    for n in NECK_IDS: cells.append((f'necklace:{n}', necklace_layer(n, kind)))
    for fc in FACE_IDS: cells.append((f'face:{fc}', face_layer(fc, kind)))
    return cells


def atlas_image(cells, w, h, cols=8):
    from PIL import Image
    rows = (len(cells) + cols - 1) // cols
    im = Image.new('RGBA', (w * cols, h * rows), (0, 0, 0, 0))
    for i, (_, px) in enumerate(cells):
        im.paste(px.image(), ((i % cols) * w, (i // cols) * h))
    return im, cols, rows
