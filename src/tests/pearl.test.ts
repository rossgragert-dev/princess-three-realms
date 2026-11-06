import test from 'node:test';
import assert from 'node:assert/strict';
import { PEARL_LANE_X, PEARL_START_X, PEARL_Y, bubbleShot, isSocketX, nextLaneX } from '../world/pearl';

const open = () => false;
const pearl = { x: PEARL_START_X, y: PEARL_Y };
const at = (x: number, y = PEARL_Y + 0.5) => ({ x, y });

test('lane steps advance one resting spot at a time and end in the socket', () => {
  let x = PEARL_START_X; const seen: number[] = [];
  for (let n = nextLaneX(x); n !== undefined; n = nextLaneX(x)) { x = n; seen.push(x); }
  assert.deepEqual(seen, PEARL_LANE_X); assert.ok(isSocketX(x)); assert.equal(nextLaneX(x), undefined);
});
test('facing right on the lane touches and pushes the pearl', () => {
  const r = bubbleShot(at(17.5), 'right', pearl, open);
  assert.ok(r.hitPearl && r.push);
});
test('four straight hits complete the lane', () => {
  let x = PEARL_START_X, hits = 0;
  while (nextLaneX(x) !== undefined) { const r = bubbleShot(at(x - 3 + 0.5), 'right', { x, y: PEARL_Y }, open); assert.ok(r.push); x = nextLaneX(x)!; hits++; }
  assert.equal(hits, 4);
});
test('wrong direction never pushes', () => {
  for (const d of ['up', 'down', 'left'] as const) assert.equal(bubbleShot(at(17.5), d, pearl, open).push, false, d);
});
test('from the right side the bubble touches but does not push (pearl only moves along its lane)', () => {
  const r = bubbleShot(at(23.5), 'left', pearl, open);
  assert.ok(r.hitPearl); assert.equal(r.push, false);
});
test('off-axis bubbles miss: no homing', () => {
  for (const dy of [-2, -1.2, 1.2, 2]) { const r = bubbleShot(at(17.5, PEARL_Y + 0.5 + dy), 'right', pearl, open); assert.equal(r.hitPearl, false, `dy ${dy}`); assert.equal(r.push, false); }
});
test('slightly off-centre still counts (child-friendly) but a full row away does not', () => {
  assert.ok(bubbleShot(at(17.5, PEARL_Y + 0.5 + 0.4), 'right', pearl, open).push);
  assert.equal(bubbleShot(at(17.5, PEARL_Y + 0.5 + 1), 'right', pearl, open).push, false);
});
test('out of range does not reach the pearl', () => assert.equal(bubbleShot(at(10.5), 'right', pearl, open).hitPearl, false));
test('a wall between her and the pearl stops the bubble', () => {
  const r = bubbleShot(at(17.5), 'right', pearl, (x) => x === 18); assert.ok(r.blocked); assert.equal(r.hitPearl, false);
});
test('no pearl in play: bubble just flies', () => { const r = bubbleShot(at(17.5), 'right', null, open); assert.equal(r.hitPearl, false); assert.ok(r.dist > 6); });
