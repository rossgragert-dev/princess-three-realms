// v0.4d.6: Royal Kitchen: select a topping, tap exact spots, undo, done, persistent dishes, redecorate/cancel, eat one stand only. Real Chrome.
import { boot, shot, talkOut, waitIdle } from './flow.mjs';
import { sleep, ptr, tapL } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
await page.evaluate(() => { const s = window.__ptr.state(); s.flags.INTRO_DONE = true; });
const L = () => page.evaluate(() => { const l = window.__game.scene.getScene('UI').L; return { ox: l.ox, oy: l.oy }; });
const bake = () => ptr(page, 'bake');
const foods = () => ptr(page, 'foods');
const enter = async () => { await page.evaluate(() => window.__game.scene.getScene('World').scene.restart({ scene: 'kitchen', spawn: 'from_throne' })); await sleep(2500); await talkOut(page, 6); await waitIdle(page); };
const open = async (id) => { await ptr(page, 'tapObject', id); for (let i = 0; i < 40; i++) { await sleep(400); if ((await bake()).cards.length) return true; if ((await ptr(page, 'panel')) === 'dialogue') await tapL(page, 468, 328); } return false; };
const at = async (gx, gy) => { const { ox, oy } = await L(); await tapL(page, gx - ox, gy - oy); await sleep(450); };
const pick = async (id, i, n) => { for (let k = 0; k < 30; k++) { if (await page.evaluate(() => window.__game.scene.getScene('UI').modalDepth > 0 && !window.__ptr.panel())) break; await sleep(300); } await sleep(300); const { ox } = await L(); const gap = Math.min(112, Math.floor(440 / n)); await tapL(page, 256 + (i - (n - 1) / 2) * gap, 192); await sleep(900); };
const wait = async (fn) => { for (let i = 0; i < 40; i++) { if (await fn()) return true; await sleep(300); } return false; };
await enter();
ok('cake editor opens', await open('cook_cake'));
let b = await bake();
ok('first topping is selected by default', b.selected === 'px_t_cherry', b.selected);
await shot(page, 'v04d6_kitchen_select');
// tap the cake's left edge
await at(b.food.cx - b.food.rx * 0.9, b.food.cy);
b = await bake(); ok('cherry placed on tap', b.count === 1);
// choose another card (star = index 4) and tap another exact spot
await at(b.cards[4].x, b.cards[4].y); b = await bake(); ok('tapping a card selects it and places nothing', b.selected === 'px_t_star' && b.count === 1, b.selected + ' ' + b.count);
await at(b.food.cx + b.food.rx * 0.5, b.food.cy - 0.2 * 0.8 * b.food.rx);
b = await bake(); ok('star placed at second spot', b.count === 2);
await shot(page, 'v04d6_kitchen_placed');
const h0 = b.hint; await at(b.food.cx + b.food.rx * 0.97, b.food.cy + b.food.rx * 0.75); b = await bake();
ok('tapping off the food places nothing', b.count === 2 && b.hint === h0 + 1, JSON.stringify({ c: b.count, h: b.hint }));
// undo then place a third at a new spot
const { ox, oy } = await L();
await tapL(page, 40, 330); await sleep(400); b = await bake(); ok('undo removes only the last topping', b.count === 1);
await at(b.food.cx + b.food.rx * 0.3, b.food.cy + 0.5 * 0.8 * b.food.rx); b = await bake(); ok('new spot placed', b.count === 2);
await tapL(page, 472, 330); await wait(async () => (await bake()).cards.length === 0); await sleep(800);
let f = await foods(); const cake = f.dishes.find((d) => d.id === 'cook_cake');
ok('cake stand shows two toppings on the dish', f.layers.length === 2 && cake.visible, JSON.stringify(f.layers.map((l) => [l.key, Math.round(l.x - cake.x), Math.round(l.y - cake.y)])));
const cherry = f.layers.find((l) => l.key === 'px_t_cherry'); ok('the cherry sits at the left of the cake', cherry.x < cake.x - 8, `${Math.round(cherry.x - cake.x)}`);
await shot(page, 'v04d6_kitchen_stand');
// cookies independently, then eat only the cookies
await waitIdle(page); ok('cookie editor opens', await open('cook_cookies')); b = await bake();
await at(b.food.cx, b.food.cy); await tapL(page, 472, 330); await wait(async () => (await bake()).cards.length === 0); await sleep(800);
f = await foods(); ok('cookie stand has its own topping, cake unchanged', f.layers.length === 3);
await waitIdle(page); await ptr(page, 'tapObject', 'cook_cookies'); await pick('x', 1, 2); await shot(page, 'v04d6_kitchen_eat');
await wait(async () => (await foods()).dishes.find((d) => d.id === 'cook_cookies').visible === false); await sleep(600);
f = await foods(); ok('eating hides only the cookie stand; the cake keeps both toppings', !f.dishes.find((d) => d.id === 'cook_cookies').visible && f.layers.length === 2 && f.dishes.find((d) => d.id === 'cook_cake').visible, JSON.stringify(f.dishes.map((d) => [d.id, d.visible])));
// redecorate the cake then cancel with back: nothing lost
await waitIdle(page); await ptr(page, 'tapObject', 'cook_cake'); await pick('x', 0, 2); await wait(async () => (await bake()).cards.length > 0); b = await bake();
ok('redecorate opens with the saved toppings', b.count === 2, String(b.count));
await at(b.food.cx, b.food.cy); b = await bake(); ok('added a third', b.count === 3);
await tapL(page, 40, 36); await wait(async () => (await bake()).cards.length === 0); await sleep(600);
f = await foods(); ok('back discards only the unfinished edit', f.layers.length === 2);
// reload keeps everything
await page.reload({ waitUntil: 'load' }); await sleep(2500); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }).catch(() => {});
await sleep(500); await enter(); f = await foods();
ok('after reload the cake still has both toppings and the cookie stand is empty', f.layers.length === 2 && !f.dishes.find((d) => d.id === 'cook_cookies').visible, JSON.stringify(f.layers.length));
const saved = await page.evaluate(() => window.__ptr.state().kingdom.food);
ok('save has independent designs', saved.cook_cake.toppings.length === 2 && saved.cook_cookies.eaten === true && saved.cook_pizza === null, JSON.stringify(saved).slice(0, 200));
// ice cream stacks
await waitIdle(page); await open('cook_icecream'); b = await bake();
for (let i = 0; i < 3; i++) await at(b.food.cx, b.food.cy - 40);
b = await bake(); ok('ice cream: each tap adds one scoop up the cone', b.count === 3, String(b.count)); await shot(page, 'v04d6_kitchen_icecream');
await tapL(page, 472, 330); await sleep(900);
console.log('errors:', JSON.stringify(await page.evaluate(() => window.__errs)));
ok('no page errors', (await page.evaluate(() => window.__errs.length)) === 0);
await browser.close(); console.log(fail ? `FAILED ${fail}` : 'ALL OK'); process.exit(fail ? 1 : 0);
