# Picture-first play (v0.2): narration is optional

Spoken narration is no longer a dependency. New saves have **narration OFF** (Parent settings -> "Spoken narration (optional)"). Everything below works in silence.
The audio system, the 81-line manifest, the clip tooling and the recorded/temporary clips are all still there; turning narration on brings voices, the speaker (replay) button and clip-driven timing back.

| Moment | Child sees (no reading, no sound) |
|---|---|
| Any story line | The speaker's portrait plus 1-4 pictures that tell the line (e.g. Pip + carrot + heart), a big green next arrow that pulses, and auto-advance after ~4 s. Table: `src/content/lineGlyphs.ts` (unit-tested: every line has valid pictures). |
| "What do I do next?" (lightbulb in the corner) | The same picture bubble for the next goal; the goal icon is also always shown beside the lightbulb. |
| Letter puzzle (talking tree, /b/) | Tree icon, a **big letter card "B"**, a sound-wave icon, and three large picture cards (ball, cat, sun) in random order. Tap a picture, then the big tick. |
| Rhyme puzzle (shell) | The cat picture as the target card and two picture choices (hat, fish). |
| Sequence puzzle (garden) | Seed picture as the prompt, three picture cards; slots show 1-2-3 dots; cards are tapped in order. |
| Pattern puzzle (rainbow bridge) | Red/blue tile pictures filling the blanks of a visible red-blue-red-blue pattern. |
| Counting (carrots, starfish) | The sparkly objects in the world and a row of dots that fills as they are tapped. |
| A wrong answer | The card wobbles, wrong distractors fade away, after the first miss a **pointing hand** shows the right card. No buzzer, no penalty. After several tries "together mode" demonstrates the answer. |
| Stuck for 10 s | The lightbulb pulses, then the hand shows the answer. The lightbulb in every puzzle shows the hand on demand. |
| Optional | Captions for grown-ups (Parent settings, off by default). |

Narration-on path (unchanged, optional): clips play, lines advance when the clip ends, and the speaker button replays the prompt.
