// Dumps map data to JSON for tools/render_preview.py (static review renders, NOT the Phaser build).
import { writeFileSync } from 'node:fs';
import { getMaps } from '../src/world/maps';
writeFileSync('/tmp/ptr_maps.json', JSON.stringify(getMaps()));
console.log('dumped');
