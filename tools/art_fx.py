"""v0.4a.1 art: wand magic effects (projectile star, petals, fruit, water drops/jet, glow, flutter). Deterministic, original."""
from pxlib import Px, C, rgb
from art_props import _star_poly

W = C['white']


def fx_bolt():
    p = Px(14, 14)
    p.ell(7, 7, 6.2, 6.2, rgb('#ffe9ff')); p.ell(7, 7, 4.2, 4.2, rgb('#fff6b0'))
    _star_poly(p, 7, 7, 6.5, 2.6, rgb('#ffd23f')); _star_poly(p, 7, 7, 4.2, 1.6, W)
    p.set(1, 7, rgb('#ff9ad5')); p.set(12, 7, rgb('#9ad5ff')); p.set(7, 1, rgb('#ff9ad5')); p.set(7, 12, rgb('#9ad5ff'))
    return p


def fx_trail():
    p = Px(8, 8)
    p.ell(4, 4, 3.2, 3.2, rgb('#ffb3e6')); p.ell(4, 4, 1.8, 1.8, rgb('#fff3a0')); p.set(4, 4, W)
    return p


def fx_petal():
    p = Px(8, 8)
    p.ell(4, 4, 3.4, 2.2, rgb('#ffb7d8')); p.ell(3.4, 3.6, 2, 1.2, rgb('#ffe0ef')); p.set(6, 4, rgb('#ff7fb3'))
    return p


def fx_apple():
    p = Px(9, 9)
    p.ell(4, 5, 3.6, 3.4, rgb('#ff4d5e')); p.ell(3, 4, 1.4, 1.2, rgb('#ff9aa5')); p.rect(4, 0, 1, 2, rgb('#7a4a1e')); p.rect(5, 1, 2, 1, rgb('#4caf50'))
    p.outline(); return p


def fx_drop():
    p = Px(6, 8)
    p.ell(3, 5, 2.6, 2.6, rgb('#7fd0ff')); p.poly([(3, 0), (1, 4), (5, 4)], rgb('#7fd0ff')); p.set(2, 5, W); p.set(2, 4, rgb('#d6f2ff'))
    return p


def fx_jet():
    p = Px(10, 28)
    p.rect(3, 4, 4, 24, rgb('#8fd8ff')); p.rect(4, 4, 2, 24, rgb('#d6f2ff')); p.ell(5, 4, 4.4, 3.6, rgb('#bfe9ff')); p.ell(5, 3, 2.4, 2, W)
    p.set(1, 8, rgb('#bfe9ff')); p.set(8, 12, rgb('#bfe9ff')); p.set(1, 16, rgb('#d6f2ff')); p.set(8, 6, W)
    return p


def fx_glow():
    p = Px(20, 20)
    p.ell(10, 10, 9.5, 9.5, rgb('#fff1a8')); p.ell(10, 10, 6.5, 6.5, rgb('#ffffff'))
    return p


def fx_flutter():
    p = Px(10, 8)
    p.ell(3, 3, 3, 2.6, rgb('#ff9ad5')); p.ell(7, 3, 3, 2.6, rgb('#b48bff')); p.ell(3, 5, 2, 1.8, rgb('#ffd1ea')); p.ell(7, 5, 2, 1.8, rgb('#dcc8ff')); p.rect(5, 1, 1, 6, rgb('#5a3a7a'))
    return p


FX = [('fx_bolt', fx_bolt), ('fx_trail', fx_trail), ('fx_petal', fx_petal), ('fx_apple', fx_apple), ('fx_drop', fx_drop), ('fx_jet', fx_jet), ('fx_glow', fx_glow), ('fx_flutter', fx_flutter)]
