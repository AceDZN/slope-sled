# Visual review: mockups vs real gameplay

**Targets:** the gpt-image mockups in `docs/visual-targets/` (ChatGPT, 30 Oct 2026). They are design targets, not evidence.

**Actual:** real gameplay captures in `docs/visual-review/`, taken in headless Chromium (Playwright, `scripts/drive.mjs`) at the mockups' exact size of 1672×941. Each state was reached through real clicks and keys plus deterministic `advanceTime`. The level-select shortcut `__game.loadLevel(n)` was used only to jump to a level; no game state was injected. Headless WebGL is software-rendered here, so the lighting matches the desktop GPU but there's no MSAA difference worth noting.

| # | Target | Actual | State |
|---|---|---|---|
| 1 | `01-first-30s.png` | `01-first-30s.png` | Level 1 build, −½ picked |
| 2 | `02-build-midplay.png` | `02-build-midplay.png` | Level 11 (Rock Garden) build, b = 10 |
| 3 | `03-ride.png` | `03-ride.png` | Level 1 ride, about 1.9 s in |
| 4 | `04-wipeout.png` | `04-wipeout-replay.png`, `04-wipeout.png` | Level 11 with b = 7: rocks wipeout, replay, then the result card |
| 5 | `05-level-select.png` | `05-level-select.png` | Map on first launch |

## 1. First 30 seconds (build, level 1)

- **Matches the target:**
  - The three big slope buttons sit bottom-center on a navy card ("בחרו את השיפוע של המסלול").
  - The big round orange סע! button is in a bottom corner.
  - Navy round pause/mute buttons are top-left; the navy pill with mountain icon, level name and three stars is top-right, next to the yellow hint bulb.
  - The glowing grid has thick axes, white numerals and the "x →" arrow. The kid and dog sit top-left at (0, 20), the ski lodge is bottom-right at (40, 0), and a bright dashed preview runs between them.
  - Blue sky, Hermon peaks, snowy pines and the cable-car pylons.
- **Deliberate differences:**
  - The grid is a camera-facing vertical plane instead of being draped on the tilted slope. This keeps the 0–44 and 0–24 ticks readable and the geometry exact; the visual-builder notes recommended it.
  - The kid and dog are drawn at 2× "hero scale" in the build view only (true scale while riding). Otherwise a 1.6 m kid on a 44 m grid is a few pixels tall.
  - The start is a wooden start tower, not a natural ledge.
  - The goal line sits under the top pill.
- **Remaining deviation:** the mockup's foreground has rocky cliffs and a more painterly terrain. Ours is a flat snow field with stylized low-poly peaks.

## 2. Build mid-play (Rock Garden)

- **Matches the target:**
  - Right-side navy panel titled "מקטעים" with white segment cards: a colored number disc, the LTR equation in a pale pill, the parameter controls, and the interval `x ∈ [0, 16]` with the fog note.
  - Translucent coral rock zone under a dashed boundary with a white-on-coral `y ≥ 4` label. Branch label `y < 14.5` on blue.
  - Fog preview: a solid first 15 % of the segment that dissolves into mist.
  - Snow-capped basalt rocks (Tripo) whose tops sit exactly on the boundary.
- **Differences:**
  - The m knob appears only on cards where m is editable. On level 11 only b is editable, so the card shows just the b stepper.
  - No "+ הוסף מקטע" or trash buttons. Segments are authored per level, so adding and removing them isn't part of the design.
  - The branch is a limb from a pine behind the course, not an overhead branch with icicles.
  - The rocks are taller blocks that hide part of the x-axis numbers between 6 and 14. The numbers stay on top as DOM labels with dark pills.

## 3. Ride

- **Matches the target:**
  - Low chase camera behind the sled, looking down the run to the hut. The dog runs alongside on the left (in the target it's on the left in the foreground).
  - Powder spray from the runners and red/white chevron boards along the run.
  - Speedometer bottom-left with a cyan→red arc, big km/h number and "קמ״ש". Translucent altitude card top-center ("גובה (מ׳)") showing the straight piecewise lines and a moving dot, which fixes the mockup's curved graph.
  - Three big round buttons bottom-right: blue התכופף (down arrow), orange הטה (arrows), purple טריק (star).
  - Pylons, snowy pines, blue sky.
- **Differences:**
  - The kid rides seated: Tripo's `sit` clip, held on its last frame. The mockup shows them belly-down.
  - No motion-blur post-processing. Speed is shown by FOV widening, a radial "speed lines" vignette, the spray and wind sound instead.
  - The run is straight in x (the math is a straight side-slice), so it doesn't curve off to the right like the mockup.

## 4. Wipeout and results card

- **Matches the target:**
  - Slow-motion replay with the camera swinging to a side view and the grid fading back in. The offending segment turns coral.
  - A red `x = …` tag on the axis, with red (track) and yellow (needed) height dots joined by a line.
  - The kid is flung off the sled in a snow burst, and the "הילוך חוזר ◀◀" pill appears bottom-left.
  - Results card on the right: big coral "אופס!", subtitle "נתקעתם בסלע", then a pale box with the comparison rows (track in red, rock in blue) and a worked sentence. Below that, a big orange "נסו שוב" and a pale "רמז".
- **Fixed during review:**
  1. The explanation first cited the touching point ("track y = 4, rock y = 4"), which explains nothing. It now cites the worst point, as the handoff asks: "ב־x = 16 המסלול בגובה −1, והסלעים מגיעים עד 4". A test in `tests/core.test.ts` covers this.
  2. The marker was moved to the same point.
  3. A 20 m branch pine in front of the course was moved behind it.
- **Bidi:** `x = 16`, `y = −1` and `y ≥ 4` render LTR inside isolated `<bdi>` spans. The mockup's own flip ("16 = x") does not happen.
- **Differences:** there's no separate "hat flies off" piece; the kid is one rigged mesh.

## 5. Level select

- **First version (fixed):** a 4-column DOM card map over the 3D scene. It was the largest deviation, so it was rebuilt.
- **Now:** a 3D diorama of Hermon, viewed from an elevated angle, with a glowing trail that zig-zags from the hut at the foot (level 1) up to the summit (level 18). Each level is a 3D flag colored by state: green done, blue glowing current, grey locked. Clickable flag labels show the number or a padlock plus gold stars. The four worlds have wooden signs.
- **Kept from the target:** the total stars and snowflakes pill, a big orange "שחקו" button (bottom-left) and a "השלב הבא" info card. ❄ "ריצה חדשה" buttons appear once a world's transfer level is cleared.
- A collapsible "רשימת שלבים" list keeps every level reachable by keyboard and on small screens.
- **Remaining deviation:** no kid standing at the current flag, and the summit flags crowd together a little at this camera angle.

## Typography and RTL

- Rubik (bundled via @fontsource, works offline) at 400/500/700. `<html lang="he" dir="rtl">`.
- Every number, equation, coordinate and inequality is an isolated LTR `<bdi>`: `y = −0.5x + 20` with a real minus sign, `(40, 0)`, `x ∈ [0, 16]`, `Δy / Δx`.
- The grid says "x → גדל משמאל לימין" and the level map repeats it, against the RTL sign-reading misconception.
- Feedback is never color-only. Each state has words, icons and shapes (★ / 🔒 / ❄, red vs blue rows that are also labeled "המסלול" / "הסלע").

## Mobile (390×844)

- The build panel becomes a bottom sheet, the grid frames itself in the space above, and the GO button shrinks to 78 px.
- The top pill truncates the level name with an ellipsis.
- It's playable, but the grid is small. Choice buttons and steppers stay at least 38 px.
