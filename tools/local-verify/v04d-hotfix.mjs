// v0.4d.1 hotfix regression: dialogue dismissal, crown, no-Pip prerequisites (real Chrome).
import { boot, shot, talkOut, waitIdle, modal, panel, flags } from './flow.mjs';
import { sleep, tapL, ptr } from './lib.mjs';
let fail = 0; const ok = (n, c, d = '') => { if (!c) fail++; console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? ' — ' + d : '')); };
const { browser, page } = await boot();
const go = async (scene, spawn) => { await page.evaluate((s, sp) => { const w = window.__game.scene.getScene('World'); w.scene.restart({ scene: s, spawn: sp }); }, scene, spawn); await sleep(2500); await talkOut(page, 10); await waitIdle(page); };
console.log('start scene', await ptr(page, 'scene'));
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE']) s.flags[f] = true; });
await go('courtyard', 'default').catch(() => {});
console.log('scene now', await ptr(page, 'scene'));
// Crown opens the stickerbook
await tapL(page, 222, 26); await sleep(900);
const book = await page.evaluate(() => window.__game.scene.isActive('Stickerbook'));
ok('crown tap opens the Stickerbook', book);
await shot(page, 'v04d_crown');
await tapL(page, 62, 56); await sleep(700);
ok('Stickerbook back button returns to the world', await page.evaluate(() => !window.__game.scene.isActive('Stickerbook') && window.__game.scene.isActive('World')));
// dialogue: tap outside advances; speaker replay does not; green arrow still works
await page.evaluate(() => { window.__ptr.state().settings.narration = true; });
await ptr(page, 'tapObject', 'pip');
for (let i = 0; i < 40 && !(await modal(page)); i++) await sleep(300);
ok('Pip dialogue opened', !!(await modal(page)));
await sleep(900);
const t0 = await page.evaluate(() => window.__ptr.dialogueText());
const rp = await page.evaluate(() => { const c = window.__game.scene.getScene('UI').dialogue.replay.container; const m = c.getWorldTransformMatrix(); return { x: m.tx, y: m.ty }; });
const gs = await page.evaluate(() => ({ w: window.__game.scale.gameSize.width, h: window.__game.scale.gameSize.height }));
const cb = await (await page.$('canvas')).boundingBox();
await page.mouse.click(cb.x + rp.x / gs.w * cb.width, cb.y + rp.y / gs.h * cb.height); await sleep(800);
const t1 = await page.evaluate(() => window.__ptr.dialogueText());
ok('speaker replay does not advance', t1 === t0 && !!(await modal(page)), t0 + ' | ' + t1);
await tapL(page, 256, 90); await sleep(900);
const t2 = await page.evaluate(() => window.__ptr.dialogueText()); const m2 = await modal(page);
ok('tap outside the box advances or closes', !m2 || t2 !== t1, JSON.stringify(t2));
await shot(page, 'v04d_dialogue_outside');
let n = 0; while (await modal(page) && n++ < 14) { await tapL(page, 20, 40); await sleep(600); }
ok('dialogue closes by outside taps alone', !(await modal(page)), 'taps ' + n);
await waitIdle(page);
// no Pip prerequisite: fresh flags, tree puzzle opens in the woods
await page.evaluate(() => { const s = window.__ptr.state(); for (const f of ['INTRO_DONE','PIP_CARROTS_DONE','TREE_GATE_OPEN']) delete s.flags[f]; });
await go('woods', 'from_courtyard');
await ptr(page, 'tapObject', 'tree');
let pn = ''; for (let i = 0; i < 20; i++) { await sleep(700); pn = await panel(page); if (pn === 'puzzle') break; if (pn === 'dialogue') await tapL(page, 468, 328); }
ok('tree puzzle opens without talking to Pip first', pn === 'puzzle', String(pn));
await shot(page, 'v04d_tree_no_pip');
await browser.close(); console.log(fail ? fail + ' FAILED' : 'ALL PASS'); process.exit(fail ? 1 : 0);
