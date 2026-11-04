import { launch, sleep, tapL, ptr } from './lib.mjs';
const URL = process.env.BASE || 'http://localhost:4173/index.html';
const { browser, page } = await launch();
await page.goto(URL, { waitUntil: 'load' });
await page.evaluate(async () => { await navigator.serviceWorker.ready; });
await sleep(6000);   // let install precache everything
const info = await page.evaluate(async () => ({ keys: await caches.keys(), n: (await (await caches.open((await caches.keys())[0])).keys()).length }));
console.log('cache', JSON.stringify(info));
await page.reload({ waitUntil: 'load' }); await sleep(1500);
console.log('controlled by SW:', await page.evaluate(() => !!navigator.serviceWorker.controller));
await page.setOfflineMode(true);
await page.reload({ waitUntil: 'load' }); await sleep(3500);
console.log('offline title scene:', await page.evaluate(() => window.__game && window.__game.scene.getScenes(true).map((s) => s.scene.key)));
await tapL(page, 256, 300); await page.waitForFunction(() => !!window.__ptr, { timeout: 20000 }); await sleep(1500);
for (let i=0;i<6;i++){ if(!(await ptr(page,'modal'))) break; await tapL(page,468,328); await sleep(400);}
await ptr(page,'tapTile',14,14); await sleep(2500);
console.log('offline play: scene', await ptr(page,'scene'), 'tile', JSON.stringify(await ptr(page,'tile')));
await page.screenshot({ path: '/tmp/ptr-offline.png' });
console.log('errors:', (await page.evaluate(() => window.__errs)).join('|') || 'none');
await browser.close();
