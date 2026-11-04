import { writeFileSync } from 'node:fs';
import { NARRATION } from '../src/content/narrationManifest';

const bySpeaker = new Map<string, typeof NARRATION>();
for (const n of NARRATION) bySpeaker.set(n.speaker, [...(bySpeaker.get(n.speaker) ?? []), n]);

let md = `# Princess of Three Realms v0.1 - Narration Recording Script

**Status: voice assets PENDING. No clip files exist yet.** The game looks up each clip by key and plays it from
\`public/assets/audio/narration/<key>.m4a\` (iOS Safari) with \`<key>.ogg\` as a fallback. Until these files exist the
child-facing experience is **not** complete for a non-reader.

- Total lines: ${NARRATION.length} (${NARRATION.filter((n) => n.required).length} required)
- Format: mono, 44.1 kHz, trimmed with ~0.2 s of silence at each end, normalised to about -16 LUFS.
- Voice: calm, warm and unhurried; smile while speaking. A parent recording is a good final option.
- Name each file exactly as the **key**. Record each line separately.
- Sound lines say the *sound* ("buh"), never the letter name.

`;
for (const [sp, clips] of bySpeaker) {
  md += `## ${sp}\n\n| Key | Line | Direction | Required |\n|---|---|---|---|\n`;
  for (const c of clips) md += `| \`${c.key}\` | ${c.text.replace(/\|/g, '/')} | ${c.note ?? ''} | ${c.required ? 'yes' : 'no'} |\n`;
  md += '\n';
}
writeFileSync(new URL('../docs/AUDIO_SCRIPT.md', import.meta.url), md);
console.log(`wrote docs/AUDIO_SCRIPT.md (${NARRATION.length} lines)`);
