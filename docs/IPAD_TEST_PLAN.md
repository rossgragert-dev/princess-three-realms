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


## v0.4a.1 - Free to Play & Sparkle (check on a real iPad, preview URL)
1. Joystick: hold the knob with the left thumb and drag slowly, then fully; she should walk slowly then quickly, in diagonals too, and slide along walls and furniture without sticking or going through. Let go: she stops.
2. Two thumbs: hold the stick with the left thumb and tap the purple wand with the right. She keeps walking and zaps. Do the same with the orange A button next to a friend.
3. Decorate: in the bedroom tap the yellow bed icon (top). Pick a category tab, pick a picture, tap the floor, tap the green check. Put things on a table. Move, flip, put away, undo. A red X means "not there"; try covering the door or the wardrobe.
4. The wardrobe stays in the back-left corner and the mirror table in the back-right corner; both still open.
5. Close and reopen the app: the room is as you left it.
6. Wand (princess form): zap a tree (blossoms and apples), the courtyard fountain (tall spray a few seconds), flowers, mushrooms in the woods, the castle door. Mash the button: it should not spam. Unicorn and mermaid magic still work.
7. Portrait and landscape: every button should be easy for a 5-year-old thumb; nothing hidden behind the controls.

## v0.4b - Family Magic & Unicorn Meadow (check on a real iPad, preview URL; NOT yet verified on iPad Safari)
1. Wand aim: face up, down, left and right and zap. The sparkle must go exactly the way she faces. Stand beside a tree (one tile off its line) and zap past it: nothing should happen to the tree. Zap straight at it: it blossoms.
2. King: from the courtyard walk to the west path to the Festival Garden. Tap the King (or the little stage). Pick colours, shapes and 1/2/3 rockets, tap the sky. No flashing screen. With Reduced effects on in Parent settings, bursts should be smaller and slower. After three launches a garland is earned; check the bedroom Decorate list.
3. Queen: door in the courtyard's top right. Tap the Queen. Try heads, colours and trails; locked ones show a padlock and a picture hint. Press the green check, then go zap: the sparkle and trail match the wand you chose.
4. Dapple: after meeting Willa, take the new north path from the Whispering Woods to the meadow as a unicorn. Tap Dapple, play three rounds (gold star over Dapple means "tag her"). Try standing still: she should come over. Try the back arrow at any time. The cushion appears in Decorate after a full game.
5. Close the app and reopen: wand, garland, cushion and progress are all still there. Turn on airplane mode and reload the preview: it still works.
6. Portrait and landscape: all new buttons easy to hit with a thumb.

## v0.4b.2 additions (full-screen)
- Landscape and portrait: canvas fills the screen, no side bars; rotate mid-game and confirm nothing restarts or jumps.
- Joystick (bottom-left) and A/magic (bottom-right) reachable at screen edges; hold the stick and tap A and magic.
- Home/Book/Decorate (top-left), hint (top-right) visible; nothing under the notch/home bar.
- Open Wardrobe, Vanity, Fireworks, Wand Workshop, Unicorn Tag, bedroom Decorate: taps land where drawn.
- Home Screen install: Share → Add to Home Screen, launch, no Safari chrome.
