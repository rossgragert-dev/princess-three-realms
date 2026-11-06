import test from 'node:test';
import assert from 'node:assert/strict';
import { expandedSize, stageOffset, STAGE_W, STAGE_H } from '../ui/stageMath';

const VIEWPORTS: [string, number, number][] = [['ipad-land', 1194, 834], ['ipad-1024', 1024, 768], ['ipad-portrait', 834, 1194], ['iphone-land', 852, 393], ['desktop', 1920, 1080]];

test('expanded size never drops below the 512x384 stage', () => {
  for (const [, w, h] of VIEWPORTS) { const s = expandedSize(w, h); assert.ok(s.w >= STAGE_W && s.h >= STAGE_H, `${w}x${h}`); }
});
test('expanded size keeps the viewport aspect (no stretching)', () => {
  for (const [n, w, h] of VIEWPORTS) {
    const s = expandedSize(w, h, 10); // no cap
    assert.ok(Math.abs(s.w / s.h - w / h) < 0.01, n);
  }
});
test('4:3 screens are exactly the authored size', () => assert.deepEqual(expandedSize(1024, 768), { w: 512, h: 384 }));
test('ultra-wide is capped', () => assert.ok(expandedSize(3440, 1000).w / expandedSize(3440, 1000).h <= 2.41));
test('stage offsets centre, and bottom-anchor, the stage', () => {
  assert.deepEqual(stageOffset(512, 384), { x: 0, y: 0 });
  assert.deepEqual(stageOffset(700, 384), { x: 94, y: 0 });
  assert.deepEqual(stageOffset(512, 600, 'bottom'), { x: 0, y: 216 });
  assert.deepEqual(stageOffset(512, 600, 'center'), { x: 0, y: 108 });
});
test('stage always fits inside the game for every viewport', () => {
  for (const [, w, h] of VIEWPORTS) {
    const s = expandedSize(w, h), o = stageOffset(s.w, s.h);
    assert.ok(o.x >= 0 && o.y >= 0 && o.x + STAGE_W <= s.w && o.y + STAGE_H <= s.h);
  }
});
test('right/bottom HUD anchors stay on screen', () => {
  for (const [, w, h] of VIEWPORTS) {
    const s = expandedSize(w, h), bx = s.w - 512, by = s.h - 384;
    for (const [x, y] of [[476 + bx, 30], [458 + bx, 318 + by], [386 + bx, 344 + by], [256 + bx / 2, 352 + by], [64, 316 + by]]) assert.ok(x > 0 && x < s.w && y > 0 && y < s.h);
  }
});
