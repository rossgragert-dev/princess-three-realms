import { launch, sleep, tapL, ptr } from './lib.mjs';
import { shot } from './flow.mjs';
const URL = process.env.BASE || 'http://localhost:4173/index.html';
const sizes = [[1024,768,'ipad_landscape'],[1180,820,'ipad_air_landscape'],[1366,1024,'ipad_pro_landscape'],[768,1024,'ipad_portrait'],[844,390,'phone_landscape']];
for (const [w,h,name] of sizes) {
  const { browser, page } = await launch({ width: w, height: h });
  await page.goto(URL, { waitUntil: 'load' }); await sleep(2500);
  const b = await (await page.$('canvas')).boundingBox();
  const sc = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ih: innerHeight, sw: document.documentElement.scrollWidth, iw: innerWidth }));
  console.log(name.padEnd(20), `canvas ${Math.round(b.width)}x${Math.round(b.height)} @ ${Math.round(b.x)},${Math.round(b.y)} ratio ${(b.width/b.height).toFixed(3)} fits=${b.width<=w+1&&b.height<=h+1} noscroll=${sc.sh<=sc.ih+1&&sc.sw<=sc.iw+1} hitPx=${(56*b.width/512).toFixed(0)}`);
  await page.screenshot({ path: `/tmp/ptr-vp-${name}.png` });
  await browser.close();
}
// real touch input + save/resume
{
  const { browser, page } = await launch();
  await page.goto(URL, { waitUntil: 'load' }); await sleep(2500);
  const b = await (await page.$('canvas')).boundingBox();
  await page.touchscreen.tap(b.x + b.width/2, b.y + 300/384*b.height);   // Play via a real touch event
  await page.waitForFunction(() => !!window.__ptr, { timeout: 15000 });
  console.log('touch-start ok, audio unlocked =', await page.evaluate(() => window.__game.scene.getScene('World') && true));
  await sleep(1500);
  for (let i=0;i<6;i++){ if(!(await ptr(page,'modal'))) break; await page.touchscreen.tap(b.x+468/512*b.width, b.y+328/384*b.height); await sleep(450);}
  await page.touchscreen.tap(b.x+200/512*b.width, b.y+260/384*b.height); await sleep(2500);   // tap-to-walk by touch
  console.log('walked by touch to', JSON.stringify(await ptr(page,'tile')));
  await page.evaluate(() => { const s = window.__ptr.state(); s.flags.INTRO_DONE = true; s.flags.PIP_CARROTS_DONE = true; });
  const before = JSON.stringify(await ptr(page,'tile'));
  await ptr(page,'tapObject','warp_woods'); await page.waitForFunction(() => window.__ptr.scene()==='woods', {timeout:40000}); await sleep(1500);
  await page.touchscreen.tap(b.x+400/512*b.width, b.y+250/384*b.height); await sleep(2000);
  const st = await page.evaluate(() => JSON.stringify({ scene: window.__ptr.scene(), tile: window.__ptr.tile(), flags: window.__ptr.state().flags }));
  console.log('before reload', st);
  await page.reload({ waitUntil: 'load' }); await sleep(2500);
  const b2 = await (await page.$('canvas')).boundingBox();
  await page.touchscreen.tap(b2.x + b2.width/2, b2.y + 300/384*b2.height);
  await page.waitForFunction(() => !!window.__ptr, { timeout: 15000 }); await sleep(2000);
  console.log('after resume ', JSON.stringify({ scene: await ptr(page,'scene'), tile: await ptr(page,'tile'), flags: await page.evaluate(() => window.__ptr.state().flags) }));
  console.log('page errors:', (await page.evaluate(() => window.__errs)).join('|') || 'none');
  await browser.close();
}
