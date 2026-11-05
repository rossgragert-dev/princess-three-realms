# v0.4b verification record

Run in the build sandbox with real Chrome (headless, puppeteer-core, software GL). Not run on an iPad or iPad Safari, and no child has played it.

| Check | Result |
|---|---|
| Unit tests (`tsx --test src/tests/*.test.ts`) | 218 pass, 0 fail |
| Typecheck | clean |
| `v04b.mjs`: King fireworks (6 colours, 5 shapes, 3 modes, 10 repeated interactions, reduced effects, garland once), Queen workshop (6 heads, 8 colours, 4 trails, locked cannot equip, 10 repeated choices, saved across reload, equipped wand in shot), Dapple tag (3 full runs, 10 start/exit cycles, princess gets a prompt) | 36/36 pass on the local bundle and on `site/` under `/princess-three-realms/preview/` |
| `wand.mjs`: straight flight, off-axis tree passed, cooldown, two-finger joystick plus magic, reduced effects | all pass |
| `nearmiss.mjs`: meadow shot up beside a tree is not redirected | shot dir `up`, no hit |
| `chapter.mjs`: Chapter 1 fresh to LAMP_PLACED | complete |
| `v03.mjs`, `v03b.mjs`: wardrobe and vanity | pass |
| `v04a1.mjs`: joystick, free decorating, save migration, mobile | all OK |
| `pwa.mjs` on the subpath: offline reload plays | OK (365 precached files) |

Not verified: iPad Safari, touch comfort for a five-year-old, audio on device, Playwright e2e (cannot run in the sandbox).
