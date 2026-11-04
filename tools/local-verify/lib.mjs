import { createRequire } from 'node:module';
const require = createRequire((process.env.PUPPETEER_DIR || '/opt/npm-tools/node_modules') + '/');
const puppeteer = require('puppeteer-core');
export async function launch(vp = { width: 1024, height: 768 }) {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required','--disable-background-networking','--disable-component-update','--disable-sync','--no-first-run'] });
  const page = await browser.newPage();
  await page.setViewport({ ...vp, deviceScaleFactor: 1, hasTouch: true });
  await page.evaluateOnNewDocument(() => { window.__errs = []; window.addEventListener('error', (e) => window.__errs.push(String(e.error && e.error.stack || e.message))); window.addEventListener('unhandledrejection', (e) => window.__errs.push('rej: ' + String(e.reason && e.reason.stack || e.reason))); });
  await page.evaluateOnNewDocument(() => { window.__plays = []; const p = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function () { window.__plays.push(String(this.src).split('/').pop()); return p.apply(this, arguments); }; });
  const logs = [];
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') logs.push(`[${t}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${(e.stack || '').split('\n').slice(0, 4).join('\n')}`));
  page.on('requestfailed', (r) => logs.push(`[reqfail] ${r.url()}`));
  page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url()}`); });
  return { browser, page, logs };
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export async function tapL(page, x, y) {
  const b = await (await page.$('canvas')).boundingBox();
  await page.mouse.click(b.x + (x / 512) * b.width, b.y + (y / 384) * b.height);
}
export const ptr = (page, fn, ...a) => page.evaluate((f, args) => window.__ptr[f](...args), fn, a);
