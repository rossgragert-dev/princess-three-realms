"""Tiny deterministic pixel-art toolkit (Pillow only). All art in this project is generated from code."""
from PIL import Image
import random


def rgb(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def mix(c1, c2, t):
    a, b = rgb(c1) if isinstance(c1, str) else c1, rgb(c2) if isinstance(c2, str) else c2
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(4))


# Shared palette: saturated but gentle jewel colours, lilac shadows, golden highlights.
P = dict(
    ol='#40255a', ol_soft='#6a4a8c',
    white='#ffffff', cream='#fff6e4', cream_sh='#f1dfc8',
    skin='#ffdcc0', skin_sh='#f3aa8c', blush='#ff8fa8', mouth='#d9506c',
    gold='#ffd93d', gold_hi='#fff3a0', gold_sh='#e59a1a',
    hair='#ffbf3f', hair_hi='#ffe27a', hair_sh='#d98a1f',
    pink='#ff7ec3', pink_hi='#ffb8e2', pink_sh='#cf4f9f', pink_dk='#9b3a86',
    purple='#a06bff', purple_hi='#c9a8ff', purple_sh='#6f43c9',
    blue='#3ea6ff', blue_hi='#8fd8ff', blue_sh='#2169dc', blue_dk='#1747a6',
    teal='#31d6c8', teal_hi='#8ff3e6', teal_sh='#1a9aa8',
    green='#5ccf59', green_hi='#92ec74', green_sh='#3ba84a', green_dk='#237a3d',
    leaf='#2f9a4a', leaf_dk='#1c6e3a', leaf_hi='#74dd68',
    red='#ff5a6e', red_sh='#c93a58', orange='#ff9a3c', orange_sh='#d96a1c', yellow='#ffe14d',
    brown='#a8693a', brown_hi='#d28f55', brown_sh='#6f4326', wood='#d9a066', wood_sh='#a8693a',
    stone='#d9d2ee', stone_hi='#f3eeff', stone_sh='#a79bcb', stone_dk='#7d70a8',
    sand='#f7e3a9', sand_sh='#e6c887', sand_hi='#fff3cf',
    water='#38a2ff', water_hi='#97dcff', water_sh='#2272e0', water_dk='#1a4fb4',
    sky='#8fd3ff', lav='#c9b8ff', rock='#8b7fb5', rock_hi='#b3a8d9', rock_sh='#5d5290',
)
C = {k: rgb(v) for k, v in P.items()}


class Px:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.p = [[None] * w for _ in range(h)]

    def get(self, x, y):
        return self.p[y][x] if 0 <= x < self.w and 0 <= y < self.h else None

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.p[y][x] = c

    def rect(self, x, y, w, h, c):
        for j in range(h):
            for i in range(w):
                self.set(x + i, y + j, c)

    def ell(self, cx, cy, rx, ry, c):
        for y in range(self.h):
            for x in range(self.w):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                    self.p[y][x] = c

    def line(self, x0, y0, x1, y1, c):
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy; x0 += sx
            if e2 <= dx:
                err += dx; y0 += sy

    def poly(self, pts, c):
        ys = [p[1] for p in pts]
        for y in range(min(ys), max(ys) + 1):
            xs = []
            for i in range(len(pts)):
                (x0, y0), (x1, y1) = pts[i], pts[(i + 1) % len(pts)]
                if (y0 <= y < y1) or (y1 <= y < y0):
                    xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(round(xs[i])), int(round(xs[i + 1]))):
                    self.set(x, y, c)

    def outline(self, c=None, diag=False):
        c = c or C['ol']
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.p[y][x] is None:
                    nb = [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
                    if diag:
                        nb += [(x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)]
                    if any(self.get(a, b) is not None and self.get(a, b)[3] == 255 for a, b in nb):
                        add.append((x, y))
        for x, y in add:
            self.p[y][x] = c
        return self

    def flip(self):
        n = Px(self.w, self.h)
        n.p = [row[::-1] for row in self.p]
        return n

    def blit(self, o, ox, oy):
        for y in range(o.h):
            for x in range(o.w):
                if o.p[y][x] is not None:
                    self.set(ox + x, oy + y, o.p[y][x])
        return self

    def shift(self, dx, dy):
        n = Px(self.w, self.h)
        n.blit(self, dx, dy)
        return n

    def image(self):
        im = Image.new('RGBA', (self.w, self.h), (0, 0, 0, 0))
        px = im.load()
        for y in range(self.h):
            for x in range(self.w):
                if self.p[y][x] is not None:
                    px[x, y] = self.p[y][x]
        return im


def sheet(frames, cols=None):
    """Pack Px frames of equal size into one RGBA image. Returns (image, cols, rows)."""
    fw, fh = frames[0].w, frames[0].h
    cols = cols or len(frames)
    rows = (len(frames) + cols - 1) // cols
    im = Image.new('RGBA', (fw * cols, fh * rows), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        im.paste(f.image(), ((i % cols) * fw, (i // cols) * fh))
    return im, cols, rows


def upscale(im, k):
    return im.resize((im.width * k, im.height * k), Image.NEAREST)


def rng(seed):
    return random.Random(seed)
