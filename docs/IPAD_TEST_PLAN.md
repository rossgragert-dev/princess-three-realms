# iPad acceptance test plan (manual; not yet executed)

Device: iPad (Safari, landscape and portrait), installed to Home Screen. Build: `npm run build`, serve `dist/` over HTTPS.

1. **Install:** Share -> Add to Home Screen. Launch from the icon: fullscreen, no browser chrome, icon is the princess crown.
2. **Audio unlock:** first tap on Play. Music starts after the tap. Silent-mode switch behaviour noted.
3. **Offline:** open once online, enable airplane mode, force-quit, relaunch. Game loads and plays.
4. **Touch:** every HUD button is comfortably tappable by a small hand; two fingers / pinch / double-tap never zoom or scroll the page.
5. **Chapter 1 flow:** follow the table in `IMPLEMENTATION_STATUS.md`. No dead ends; each puzzle can be failed repeatedly without penalty and ends in an assisted "together" solve after 4 misses.
6. **Hints:** stand still 12 s -> sparkle trail; 24 s -> spoken reminder. Hint button replays the goal.
7. **Forms:** wand tray shows only unlocked forms; changing form on a creek/shoreline walks to a valid tile; never stuck.
8. **Save:** quit mid-chapter, relaunch, Play resumes scene, form and flags. Parent gate (hold 3 s) -> Reset works.
9. **Narration (after recording):** every line plays, replay button works, no overlapping voices, music ducks.
10. **Performance:** steady frame rate in the woods (largest map) and underwater.


## v0.2 additions (please test on the iPad)
1. Fresh install, narration off: play the intro and the first carrots. Can the child follow each picture bubble? Is ~4 s per line too fast or slow?
2. Letter puzzle (talking tree): is the big "B" card clear; are the three picture cards easy to hit; does the hand hint appear after a miss?
3. Earn the bunny pillow (3 carrots): does the "new item" card appear, dismiss with the green tick, and does the Home button glow afterwards?
4. In the bedroom: tap every sparkle. Does each picker card respond on the FIRST tap? (one unexplained missed tap was seen once in desktop Chrome automation)
5. Place all 12 items, close the app from the Home Screen, reopen: is the room unchanged?
6. Parent settings -> Spoken narration On: do voices play after the first tap (Safari audio unlock)? Does the speaker button appear in puzzles and dialogue?
7. Silent switch / volume: sound effects only when narration is off.
