import { writeFileSync } from 'node:fs';
import { NARRATION, clipUrls } from '../src/content/narrationManifest';
import { sceneOfClip, SCENE_ORDER, VOICE_CAST } from '../src/content/narrationScenes';

const rows = NARRATION.map((c) => ({ ...c, scene: sceneOfClip(c), files: clipUrls(c.key) }));
const speakers = [...new Set(rows.map((r) => r.speaker))];
const esc = (s: string) => s.replace(/\|/g, '/');

let md = `# Princess of Three Realms - Narration Recording Script

**Status: final voice recordings PENDING.** Until audio files exist the game falls back to a pulsing "next" arrow and (for grown-ups) captions.
Clips are looked up by key at \`public/assets/audio/narration/<key>.m4a\` (iOS Safari) with \`<key>.ogg\` as a fallback.
Any file with the right name replaces a temporary one: see "Replacing clips" below.

- Total lines: ${rows.length} (${rows.filter((n) => n.required).length} required)
- Format: mono, 44.1 kHz, ~0.2 s of silence at each end, normalised to about -16 LUFS. Record each line separately.
- Sound lines say the *sound* ("buh"), never the letter name.
- Machine-readable copy of this table: \`docs/narration_manifest.json\` (used by \`tools/make_tts_clips.py\`).

## Replacing clips
1. Record or generate \`<key>.m4a\` (and optionally \`.ogg\`) and drop it in \`public/assets/audio/narration/\`.
2. \`python3 tools/make_tts_clips.py --status\` lists each key as \`custom\` (your file), \`temp-tts\` (generated) or \`missing\`.
3. Generated temporary clips are never overwritten by a re-run unless \`--force\`; your own files are never touched.

## Voice casting
| Speaker | Character | Direction |
|---|---|---|
${speakers.map((s) => `| ${s} | ${VOICE_CAST[s].role} | ${VOICE_CAST[s].voice} |`).join('\n')}

# Part 1 - By character
`;
for (const sp of speakers) {
  md += `\n## ${VOICE_CAST[sp].role} (\`${sp}\`)\n\n| Scene | Key | Line | Direction | Req |\n|---|---|---|---|---|\n`;
  for (const c of rows.filter((r) => r.speaker === sp).sort((a, b) => SCENE_ORDER.indexOf(a.scene) - SCENE_ORDER.indexOf(b.scene)))
    md += `| ${c.scene} | \`${c.key}\` | ${esc(c.text)} | ${esc(c.note ?? '')} | ${c.required ? 'yes' : 'no'} |\n`;
}
md += '\n# Part 2 - By scene (playing order of the chapter)\n';
for (const sc of SCENE_ORDER) {
  const list = rows.filter((r) => r.scene === sc);
  md += `\n## ${sc} (${list.length})\n\n| Speaker | Key | Line |\n|---|---|---|\n`;
  for (const c of list) md += `| ${c.speaker} | \`${c.key}\` | ${esc(c.text)} |\n`;
}
writeFileSync(new URL('../docs/AUDIO_SCRIPT.md', import.meta.url), md);
writeFileSync(new URL('../docs/narration_manifest.json', import.meta.url), JSON.stringify(rows, null, 2) + '\n');
console.log(`wrote docs/AUDIO_SCRIPT.md + docs/narration_manifest.json (${rows.length} lines)`);
