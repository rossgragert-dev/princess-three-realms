#!/usr/bin/env python3
"""Generate TEMPORARY narration clips from docs/narration_manifest.json with whatever local TTS engine exists.

Nothing here impersonates a real person: pick generic synthetic voices. Final recordings (a parent, a voice actor)
replace the temporary clips by simply dropping <key>.m4a into the output folder; files this tool did not create are
treated as "custom" and are never overwritten.

  python3 tools/make_tts_clips.py --status
  python3 tools/make_tts_clips.py --engine espeak-ng            # needs espeak-ng + ffmpeg
  python3 tools/make_tts_clips.py --engine piper                # needs piper + PIPER_MODEL=/path/voice.onnx (per speaker: PIPER_MODEL_PIP, ...)
  python3 tools/make_tts_clips.py --engine say                  # macOS
  python3 tools/make_tts_clips.py --engine command --cmd 'mytts --voice {voice} --text {text} --out {wav}'
  python3 tools/make_tts_clips.py --engine tone --out /tmp/test  # pipeline self-test only (beeps, NOT narration)
"""
import argparse, datetime, json, os, shutil, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, 'docs', 'narration_manifest.json')
DEFAULT_OUT = os.path.join(ROOT, 'public', 'assets', 'audio', 'narration')

# Per-speaker voice shaping so the cast sounds different from one another (pitch/speed are engine hints).
PROFILE = {
    'narrator': dict(espeak='en-us+f3', speed=150, pitch=50, say='Samantha', piper_len=1.05),
    'pip':      dict(espeak='en-us+f5', speed=175, pitch=80, say='Karen', piper_len=0.9),
    'willa':    dict(espeak='en-us+f4', speed=160, pitch=75, say='Moira', piper_len=1.0),
    'tree':     dict(espeak='en-us+m3', speed=120, pitch=25, say='Daniel', piper_len=1.3),
    'bramble':  dict(espeak='en-us+m1', speed=170, pitch=65, say='Fred', piper_len=0.9),
    'marina':   dict(espeak='en-us+f2', speed=130, pitch=40, say='Tessa', piper_len=1.25),
    'nana':     dict(espeak='en-us+f1', speed=140, pitch=55, say='Victoria', piper_len=1.15),
    'shell':    dict(espeak='en-us+f4', speed=145, pitch=85, say='Kathy', piper_len=1.1),
    'coralie':  dict(espeak='en-us+f5', speed=155, pitch=78, say='Allison', piper_len=1.0),
}

def run(cmd, **kw):
    return subprocess.run(cmd, check=True, capture_output=True, **kw)

def synth(engine, row, wav, cmd_tpl):
    sp, text = row['speaker'], row['text']
    p = PROFILE.get(sp, PROFILE['narrator'])
    if engine == 'espeak-ng':
        run(['espeak-ng', '-v', p['espeak'], '-s', str(p['speed']), '-p', str(p['pitch']), '-w', wav, text])
    elif engine == 'piper':
        model = os.environ.get('PIPER_MODEL_' + sp.upper()) or os.environ.get('PIPER_MODEL')
        if not model: raise SystemExit('set PIPER_MODEL (or PIPER_MODEL_<SPEAKER>) to a .onnx voice')
        run(['piper', '--model', model, '--length_scale', str(p['piper_len']), '--output_file', wav], input=text.encode())
    elif engine == 'say':
        aiff = wav + '.aiff'
        run(['say', '-v', p['say'], '-o', aiff, text]); run(['ffmpeg', '-loglevel', 'error', '-y', '-i', aiff, wav]); os.remove(aiff)
    elif engine == 'command':
        if not cmd_tpl: raise SystemExit('--cmd required for --engine command')
        run(cmd_tpl.format(text=json.dumps(text), wav=wav, voice=sp, speaker=sp, key=row['key']), shell=True)
    elif engine == 'tone':   # self-test: a short beep whose pitch depends on the speaker. NOT narration.
        hz = 220 + 40 * list(PROFILE).index(sp)
        run(['ffmpeg', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', f'sine=frequency={hz}:duration=0.5', wav])
    else:
        raise SystemExit('unknown engine ' + engine)

def encode(wav, out_base):
    pad = 'adelay=200|200,apad=pad_dur=0.2,loudnorm=I=-16:TP=-1.5:LRA=11'
    base = ['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-ar', '44100', '-af', pad]
    run(base + ['-c:a', 'aac', '-b:a', '64k', out_base + '.m4a'])
    run(base + ['-c:a', 'libvorbis', '-q:a', '3', out_base + '.ogg'])

def load(out):
    rows = json.load(open(MANIFEST))
    prov_path = os.path.join(out, 'provenance.json')
    prov = json.load(open(prov_path)) if os.path.exists(prov_path) else {}
    return rows, prov, prov_path

def state(row, out, prov):
    has = os.path.exists(os.path.join(out, row['key'] + '.m4a'))
    if not has: return 'missing'
    return 'temp-tts' if prov.get(row['key'], {}).get('source') == 'tts' else 'custom'

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--engine'); ap.add_argument('--cmd'); ap.add_argument('--out', default=DEFAULT_OUT)
    ap.add_argument('--only', nargs='*'); ap.add_argument('--force', action='store_true')
    ap.add_argument('--dry-run', action='store_true'); ap.add_argument('--status', action='store_true')
    a = ap.parse_args()
    rows, prov, prov_path = load(a.out)
    if a.status or not a.engine:
        counts = {}
        for r in rows:
            s = state(r, a.out, prov); counts[s] = counts.get(s, 0) + 1
            if a.status and s == 'missing' and r['required']: print('missing', r['key'])
        print(json.dumps(counts)); return
    if a.engine != 'tone' and not a.dry_run and a.engine not in ('command',) and not shutil.which({'espeak-ng': 'espeak-ng', 'piper': 'piper', 'say': 'say'}[a.engine]):
        sys.exit(f'engine "{a.engine}" is not installed here; nothing generated.')
    if not shutil.which('ffmpeg'): sys.exit('ffmpeg is required')
    os.makedirs(a.out, exist_ok=True)
    made = skipped = 0
    for r in rows:
        if a.only and r['key'] not in a.only: continue
        st = state(r, a.out, prov)
        if st == 'custom' and not a.force: skipped += 1; continue          # never clobber real recordings
        if st == 'temp-tts' and not a.force: skipped += 1; continue
        if a.dry_run: print('would generate', r['key'], r['speaker'], '-', r['text']); continue
        with tempfile.TemporaryDirectory() as d:
            wav = os.path.join(d, 'x.wav'); synth(a.engine, r, wav, a.cmd); encode(wav, os.path.join(a.out, r['key']))
        prov[r['key']] = dict(source='tts', engine=a.engine, speaker=r['speaker'], date=datetime.date.today().isoformat())
        made += 1
    if not a.dry_run:
        json.dump(prov, open(prov_path, 'w'), indent=2, sort_keys=True)
    print(f'generated {made}, kept {skipped} existing')

if __name__ == '__main__':
    main()
