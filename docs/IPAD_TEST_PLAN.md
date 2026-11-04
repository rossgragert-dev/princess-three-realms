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
