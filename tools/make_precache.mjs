// Post-build: lists every file in dist/ into dist/precache.json and stamps a content hash into dist/sw.js.
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';

const dist = (process.argv[2] ? new URL(process.argv[2].replace(/\/?$/, '/'), 'file://' + process.cwd() + '/') : new URL('../dist/', import.meta.url)).pathname;
const files = [];
(function walk(d) {
  for (const n of readdirSync(d)) {
    const p = join(d, n);
    if (statSync(p).isDirectory()) walk(p);
    else if (!/(^|\/)(sw\.js|precache\.json|README\.md)$/.test(p)) files.push(p);
  }
})(dist);
const urls = ['./', ...files.map((f) => './' + relative(dist, f))].sort();
const hash = createHash('sha1');
for (const f of files) hash.update(readFileSync(f));
writeFileSync(join(dist, 'precache.json'), JSON.stringify(urls));
const swPath = join(dist, 'sw.js');
writeFileSync(swPath, readFileSync(swPath, 'utf8').replace(/const CACHE = '[^']*';/, `const CACHE = 'ptr-${hash.digest('hex').slice(0, 10)}';`));
console.log(`precache: ${urls.length} files`);
