# Slope Sled — independent playtest, round 2

Date: 2026-10-31. Dev server http://localhost:5215 (HMR build at commit 8de63c6). Headless Chromium via `scripts/drive.mjs`, 1280×800 unless noted, plus 390×844 for mobile. About 40 runs. Screenshots are in `docs/playtest/round2/`.

Automation can't measure fun or learning, so nothing here claims either. Everything below is what I saw on screen, in the DOM, or in `render_game_to_text()`.

**Method notes**
- All dials were set with real keys (↑/↓/←/→, 1–4, Enter) or clicks on `[data-a=…]`. `eval` was used only for `loadLevel(N)`, `freshRun(w)` and `expertRun(w)`, plus read-only DOM and text queries.
- Practice and expert runs are seeded with `Math.random()`, so their numbers can't be known before a run starts. For those runs I used a scratch copy of drive.mjs (outside the repo) with a `solve` step that does three things: reads the displayed coordinates, labels and equations from `render_game_to_text()`, computes the answer the way a student would, and presses the arrow keys.
  - The exception is expert world 4, where the ghost line is "graph only". There I took its slope from the game object, then checked in the screenshot that the two graph dots were readable at grid points.
  - All 8 runs (practice and expert, worlds 1–4) were solved on the first ride.
- Screenshots of bidi text were checked against the DOM by measuring glyph order with Range rects. Every flip suspected from a screenshot turned out to be correct in the DOM, except P1-9 below.
- Several ride/swoop screenshots (`night-l10-build.png`, `47-l13-build.png`, `48-l14-build.png`) happened because I pressed Enter on a level with no lesson card, which starts the ride (see P2-1). They're still useful as swoop frames.
- The floating "סע!" popup that shows through whole rides in screenshots is an automation artifact. `popup()` removes itself after 1.2 s of *real* time, while `advanceTime` runs faster than that. It isn't a bug.

---

## P0: blocks play or learning

None found. All 18 authored levels I touched and all 8 generated runs were winnable by computing. No console errors or warnings appeared in any run (no `CONSOLE:` line).

---

## P1: should fix

### P1-1 Inequality content can be solved by aiming at the labeled landing point (learning bypass)
- **Levels:** 11, 14, practice world 3, expert world 3.
- **What I saw:** The landing powder is labeled with coordinates, and its tolerance equals the inequality window.
  - Level 11: landing (16, 5) ± 1 at m = −0.5 gives b ∈ [12, 14]. That is exactly the solution set {12 … 14}.
  - Level 14: landing (24, 14) ± 6 gives m = (14 − 18)/24 ≈ −0.17, which rounds to −0.15 or −0.2. Both are inside the window.
  - `src/math/generate.ts:106` and `:229` put the practice and expert world 3 finish at the window's centre with tol = half its width. The answer is always "line through the start and the landing label".
  - My solver did exactly that for practice world 3 (`b = fy − m·fx`) and won without looking at the rocks or the branch.
- **Effect:** The world 2 skill (line through two points) solves all of world 3. Students never have to reason about `y ≥` / `y <`.
- **Repro:** `node scripts/drive.mjs 'eval:window.__game.loadLevel(11)' adv:600 key:Enter adv:300 text` shows the `"finish":"(16, 5)"` label. Five → presses (b 8 → 10.5) followed by more give the same result as the inequality reasoning.
- **Screenshots:** `lesson-l11.png` (the label is behind the card), `gen-expertRun-3-build.png` (the "(20, 14)" landing label).
- **Fix:** Don't label the landing point on inequality stages. Or make the landing much wider than the window, so the constraints are what binds. Or put the landing off the solution line, for example a wide powder field, with the window set only by the rocks and the branch.

### P1-2 Expert runs are mostly not "genuinely harder"; one skips its stated skill
All four expert runs are solvable by computing (first try). How each compares with the authored levels:
- **World 1 "two gates, one slope":** level 2 with a second gate. Same skill, slightly less round numbers (for example (0, 26) → (10, 19.5) gives −0.65). A little harder.
- **World 2 "joint at the crossing":** b is fully set by the hut, `b = fy − m·fx`. The joint zone check is passive, because the generated joint always lands in the zone. This is level 9 again, not harder.
- **World 3 "sloped ridge and cornice":** a real window with 2–3 valid values. Harder, but see P1-1: the landing label gives it away.
- **World 4 "parallel to the ghost (read from the graph)":** the gate and the hut are both labeled. In seed A, gate (8, 19) and hut (28, 4) give m = (4 − 19)/20 = −0.75, the ghost's slope, without reading the graph at all. Seed B was the same: (12, 13) and (24, 7) give −0.5.
- **Repro:** `node scripts/drive.mjs 'eval:window.__game.expertRun(4)' adv:600 text`. Then compare `objects[0].at` and `finish`.
- **Screenshot:** `gen-expertRun-4-build.png`.
- **Fix:**
  - World 4: label only the gate, put the hut on the grid without a label (or use powder), so the slope has to come from the ghost graph.
  - World 2: let the student pick m too, or don't label the hut, so the joint zone actually constrains.
  - World 1: give the gates on non-integer x or as a table, so it's more than level 2 again.

### P1-3 Practice world 4 gives the meeting point away and is tiny
- **What I saw:** "Meet the dog right at the hut", and the hut is labeled, for example (10, 13.5). That is the system's solution, so m = (13.5 − 28)/10 and the dog's equation is never needed. Level 15 hides the meeting height on purpose; this run doesn't.
- The run is also only 10 m long. The board is taller than wide, the ride lasts 2.47 s, and a big white landing block covers the right third of the grid, including the meeting arch.
- **Repro:** `node scripts/drive.mjs 'eval:window.__game.freshRun(4)' adv:600 shot:/tmp/x.png text`
- **Screenshot:** `gen-freshRun-4-build.png`.
- **Fix:** Use level 15's structure: an unlabeled meeting arch, then ride on with the dog to a labeled lodge on the dog's line. Use x spans ≥ 24 like the authored levels.

### P1-4 Failure replay un-fogs every segment over the whole grid, including on the no-hint final
- **What I saw:** After any failed ride, the replay draws all of the student's lines at full length. On level 18 I failed at the joint at x = 35.5, and segments 1–4 were still drawn end-to-end against both flags, the bridge, the rocks and the dog arch. Each crossing is also labeled, for example "(32, 12) ✕" with "x = 32".
- **Is that OK?**
  - On teaching levels (2, 9, 15) it is good feedback: it shows the line, says why it failed and names the misconception.
  - On level 18 and the expert runs, which have no hints and are meant to test, it hurts. One deliberate throwaway ride lifts the fog for all four segments at once, and after that it's "nudge until it visually lines up". The fog and the no-hint rule are what make 18 an exam.
  - The crossing coordinate isn't a bypass on its own: it doesn't give the answer, it gives direction. Single-dial levels can be bisected from the hazard type anyway.
- **Repro (level 18, segment 4 on the dog's line):**
  `node scripts/drive.mjs 'eval:window.__game.loadLevel(18)' adv:600 key:Enter adv:200 key:1` + 15×`key:ArrowDown` + 20×`key:ArrowRight` + `key:2` + 20×`key:ArrowRight` + `key:4` + 10×`key:ArrowDown` + 36×`key:ArrowRight` + `key:Enter adv:16000 shot:x.png`
- **Screenshot:** `50-l18-gap-result.png`.
- **Fix:** In the no-hint final and in expert runs, draw the replay track only up to the failure x, and keep later segments fogged. Elsewhere, keep it as it is.

### P1-5 Level 2 hands over Δy and Δx after the first miss
- **What I saw:** Ride m = −0.7 on level 2 and the card says "מההתחלה לשער: Δy = −12, Δx = 16. שיפוע = Δy ÷ Δx". All that's left is one division. This happens on the first failure, for free, while the 💡 hint costs a star and gives less.
- Same path: level 17 segment A (`riseRunTip` in `src/game/explain.ts:23`).
- **Repro:** `node scripts/drive.mjs 'eval:window.__game.loadLevel(2)' adv:400 key:Enter adv:200` + 14×`key:ArrowDown` + `key:Enter adv:9000 'eval:document.querySelector(".result").innerText'`
- **Screenshot:** `20-l2-m070-result.png`.
- **Fix:** On the first miss, name the misconception only ("שיפוע = Δy ÷ Δx, לא להפך"). Show the actual Δy/Δx on the second miss, or as the hint's content.

### P1-6 Map flags hide each other: replay of levels 4, 9 and 14 is blocked at the flag centre
- **What I saw:** At 1280×800 the topmost element at each flag's centre is the wrong flag. `elementFromPoint` at the centre of flag 4 returns flag 5, flag 9 returns 10, and flag 14 returns 16. A click lands on the wrong level. Only a thin strip of flag 4 shows under flag 5. ("Summit flags crowd" was a known limit in round 1. It now also blocks replay of world 1.)
- **Repro:**
  `node scripts/drive.mjs click:'[data-a=select]' adv:1500 "eval:(()=>{const b=document.querySelector('[data-a=level][data-i=\"4\"]');const r=b.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2).closest('[data-a]').dataset.i})()"` prints `"5"`.
- **Screenshot:** `34-map-after-w1.png`. Look under flag 5, the stack around 9/10, and 14/15/16 at the top.
- **Fix:** Space the map flags along the trail in screen space, or offset overlapping labels with a small leader line.

### P1-7 Mobile map: world signs, so expert mode, are off-screen; flags 1, 4, 5 and 6 too
- **What I saw:** At 390×844 the map camera doesn't fit the mountain and there's no pan.
  - All four `.sign` labels have zero size (culled), and flags 1, 4, 5 are culled. Flag 6 sits at x = 382 and flags 9/10 at negative x.
  - Expert (`data-a=expert`) exists only on the signs, so after clearing world 1 on a phone it can't be reached.
  - The bottom-bar "ריצה חדשה" buttons are at x = −45 and −257, so practice can't be reached either. The `<details>` list does have practice.
- **Repro:** clear world 1 with `--size=390x844` (the level 1–5 key sequence below), then `eval:[...document.querySelectorAll("[data-a=expert]")].map(b=>b.getBoundingClientRect().width)` gives `[0]`.
- **Screenshots:** `m-09-map-after-w1.png`, `m-08-map.png`.
- **Fix:** Fit the map camera to the flag bounds per aspect ratio, or allow drag-pan. Also add expert to the "רשימת שלבים" list.

### P1-8 Beating the final says the final is still ahead
- **What I saw:** Level 18 is flagged `transfer: true`, so clearing it shows "🎉 סיימתם את שבילים תאומים! … נשארה רק הירידה הגדולה מהפסגה!" right after the summit descent. There is also no finale: the only button is "למפה".
- **Repro:** the level 18 solve sequence (as in P1-4, but `key:4` + 5×`key:ArrowDown` + 14×`key:ArrowRight`), then `adv:16000 'eval:document.querySelector(".result").innerText'`.
- **Screenshot:** `44-l18-result.png`.
- **Fix:** Special-case the final: show a "you conquered the Hermon" finale (total stars, best styles, what unlocked) and a credit-style beat. Point world 4's "next" text at expert or practice instead.

### P1-9 Map star counter reads "54 / 15" (RTL fraction)
- **What I saw:** `★ <bdi>15</bdi> / <bdi>54</bdi>` has each number LTR-isolated, but the `/` run is RTL, so it displays as "54 / 15". Checked in the DOM. Visible in the top-left pill of the map.
- **Repro:** `node scripts/drive.mjs click:'[data-a=select]' adv:1500 'eval:document.querySelector(".select .pill").innerHTML'`
- **Screenshot:** `34-map-after-w1.png` (top left, "19 ❄ · 54 / 15 ★").
- **Fix:** `ltr(\`${total} / ${max}\`)` as one span (game.ts:1121).

### P1-10 Recurring visual breakages on the build board
1. **Fog "mist" is flat overlapping discs.** It looks like debug circles, and one is tinted with the segment colour. It appears at every fog stub on every level (several clusters on levels 17 and 18) and covers coordinates. Screenshots: `16-l2-build.png`, `16z-fog-zoom.png`; `46-l17-build.png`. Fix: soft noise sprites with additive alpha and depth fade, or a gradient fade on the ribbon itself.
2. **Raised finishes sit on a big untextured white/grey box.** The box covers grid cells, labels and sometimes the target. Seen on levels 3, 7, 16, practice world 4, and all expert runs. Screenshots: `27-l3-build-solved.png`, `49-l7-hint.png`, `45-l16-build.png`, `gen-freshRun-4-build.png`, `gen-expertRun-1-build.png`. Fix: a snow plateau or terrain shelf behind the grid plane, or draw the landing as a ledge outside the grid rectangle.
3. **When the view goes below y = 0, the ice panel stops at 0.** On level 3 the x tick row floats in empty snow below the board, misaligned with the grid columns: "0" is about 25 px right of the grid's x = 0 and "56" about 80 px left of the board's end. A "−4" y-label sits outside the panel. Screenshot: `27-l3-build-solved.png`. Fix: extend the panel and lattice to `view.y0`.
4. **Red failure x-marker sits on the tick labels.** For example "x = 22" covers 20/24, and "x = 1.31" covers 4. Screenshots: `26-l9-b18-result.png`, `14-l1-plus-result.png`. Fix: put it just below the tick row.

### P1-11 Ride view on level 18: the ice bridge becomes a full-screen translucent slab
- **What I saw:** Riding under the bridge, the camera looks through a huge blue semi-transparent box that hides the rider, sled and hut.
- **Repro:** the level 18 solve sequence, then `key:Enter adv:5500 shot:x.png`.
- **Screenshot:** `42-l18-ride2.png`.
- **Fix:** Fade bridge and branch meshes near the camera (distance-based alpha), or render the bridge only as an arch of ice over the track in ride mode.

### P1-12 First impression is far from mockups 01 and 03
- **Title** (`01-title.png`): a grey, fogged, near-empty frame. There's no sky, characters, hut or Hermon, so nothing says "snow day adventure".
- **Build** (`03-l1-build.png` vs `docs/visual-targets/01-first-30s.png`): the grid is an opaque dark-blue wall that hides the mountain. The mockup has a glowing lattice over a sunlit slope with the cliff, pines, gondola, lake and a big hut.
  - The start is a thin wooden tower, and the kid and dog are about 20 px tall.
  - The background is mostly flat white-grey haze.
- **Ride** (`06-l1-ride.png`, `07-l1-ride-late.png` vs `03-ride.png`):
  - The track reads as a toy plank with yellow rails over flat white.
  - The sky is pale, and there's little sense of speed (no motion blur or visible speed lines).
  - The kid sits upright (known limit).
- **Celebration** (`11-l1-celebrate.png`): the kid and dog are about 60 px tall in an empty white field, and the track ends in mid-air at a yellow arch. There's no close-up or cheer moment.
- **Fix:** see the closing judgment. The biggest wins are lighting and atmosphere (a deep blue sky, warm sun, cast shadows), a translucent board over terrain, and character close-ups on GO and at the finish.

### P1-13 Dusk (level 18) reads as a sandy desert, not snow at sunset
- **What I saw:** The whole scene is tinted beige-brown. The snow looks like dunes and the pines look muddy (`night-l18-build.png`, `42-l18-ride2.png`, `44-l18-result.png`). The night level (10) looks good by comparison (`night-l10-build.png`).
- **Fix:** Keep the snow albedo bluish-white and put the warmth in the sky gradient and rim light only: pink/orange sky, blue shadows, white highlights.

### P1-14 Mobile build: level title hidden, x labels collide, level 18 too dense
- **What I saw** at 390×844:
  - The top bar truncates to "שלב 1 : ה…", so the level name is never visible.
  - The x tick labels overlap ("36 40 44", "40 44 48 52"), and the finish label "(40, 0)" sits on top of them.
  - On level 18 the zone labels overlap each other, and gate labels cover the gates. The board is about 350×220 px.
  - GO covers the hut on level 1.
- **Screenshots:** `m-03-l1-build.png`, `m-06-l18-build.png`, `m-07-l9-build.png`.
- **Fix:**
  - Show every 2nd x tick when the board is under ~400 px wide.
  - Two-line top bar on narrow screens.
  - Let the board take the full width with the panel as a collapsible sheet, or allow pinch-zoom on the board.

---

## P2: polish

1. **Enter is both "close lesson" and "GO".**
   - On a level with no lesson card (3, 5, 8, 10, 12, 13, 14), a player who presses Enter out of habit starts riding the default track at once. That counts as a build and can cost a star.
   - **Repro:** `node scripts/drive.mjs 'eval:window.__game.loadLevel(10)' adv:600 key:Enter adv:300 text` gives `"mode":"swoop"`, builds 1.
   - **Fix:** Ignore GO for about 400 ms after a level loads, or require GO to be focused or released.
2. **The −/+ steppers are mirrored.** "−" is on the right and "+" on the left (RTL), directly above an LTR slider whose plus end is on the right. Round 1 fixed the slider for exactly this sign misconception. **Fix:** `dir="ltr"` on the stepper row.
3. **The level 11 lesson example uses `y ≤ 18` for the branch**, but level 11's branch is strict (`y < 14.5`, "לא לגעת"). The very next screen contradicts the example. Use `y < 18` in the example.
4. **Level 4 shows the friend's equation `y = −0.5x + 30`, and the lesson just before says "parallel = same slope"**, so the answer is copied, not computed. That's fine for an intro, but consider showing the friend's lane as a graph only.
5. **Top-bar stars stay empty on practice and expert runs** after a 3-star result (`gen-expertRun-2-result.png`). Either hide them or fill them.
6. **On level 16, no m chip is highlighted at load** although m = −0.5 is active. The b chip "16" is highlighted (`45-l16-build.png`).
7. **The hint duplicates the flag labels** ("(4, 22)" and a yellow "(4, 22) 💡" right under it) instead of highlighting the existing ones (`49-l7-hint.png`).
8. **Result card details:**
   - The ❄ chip has no word (the others say טריקים / נחיתה / מהירות).
   - 🛬 (airplane landing) is an odd icon for a sled landing.
   - The card doesn't show the saved best stars when a replay earns fewer. The top bar does.
9. **Swoop camera:** the mid-swoop frame passes through the board and a pine, and the hut renders with the grid showing through it (`05-l1-swoop.png`).
10. **`render_game_to_text` (test hook only):** a success explanation reads "יש! הגעתם!. . המסלול שלכם עבד.", and `mode` is `"crash"` after a successful finish. That's harmless to players but confusing in logs.
11. **The y-axis caption "y גובה (מ׳)" is clipped by the board's top edge** on most levels, and the "x גדל משמאל לימין →" caption is tiny and low-contrast under the axis.
12. **Level 18's segment 4 can be solved from the hut** ((36, 8) → (48, 5) gives −0.25) without using the dog's equation. It's still math, but the "meet the dog" skill is optional there.
13. **The worlds look the same.** Bunny Hill, Pine Forest and Rock Garden all use the same white slope, trees and board. Only level 10 (night) and level 18 (dusk) change the mood. The subjects differ, but the places don't.

---

## Coverage

- **First 2 minutes:**
  - Title → שחקו → lesson card → pick −½ → GO → swoop → ride (tuck) → finish hop with trick → result.
  - The result showed 169 style points, +40 landing with a clean trick, and "שיא חדש!".
  - Pressing ↑ during the hop scores the trick, but nothing on screen signals when the hop starts. Timing it took one failed attempt in automation.
- **Lesson cards** for 1, 2, 4, 6, 7, 9, 11, 15, 16, 17, 18:
  - Terminology matches Workbook (שיפוע, איבר חופשי, חיתוך עם ציר y, פתרון גרפי של מערכת, מספר הפתרונות, פונקציה עולה/יורדת/קבועה).
  - The cards are short, clear and correct, with no level answers. Only the P2-3 example inconsistency.
  - Level 15's card gives the method ("compute the dog's height there, then your slope") but no numbers. That's OK.
- **World 1 cleared in one run with real keys** (levels 1–5, 3★ each). The map's world 1 sign then shows ❄ תרגול and 🏔 מומחה, and the result card announces the unlock and the next world (`33-l5-result.png`, `34-map-after-w1.png`). Key sequence (bash):
  `click:[data-a=play] key:Enter adv:300 click:[data-a=choice][data-v="-0.5"] key:Enter adv:14000 click:[data-a=next] adv:500 key:Enter adv:300` + 15×ArrowDown + `key:Enter adv:13000 click:[data-a=next] adv:500 click:[data-a=choice][data-i="0"][data-v="-1"] click:[data-a=choice][data-i="1"][data-v="0"] click:[data-a=choice][data-i="2"][data-v="0.25"] key:Enter adv:17000 click:[data-a=next] adv:500 key:Enter adv:300` + 10×ArrowDown + `key:Enter adv:14000 click:[data-a=next] adv:500` + 15×ArrowDown + 16×ArrowRight + `key:Enter adv:12000`
- **Replay:** level 2 opened from the map (no lesson card the second time). A failed ride then a 2-build success gave ★★☆ on the card, while the top bar kept ★★★. Best style is kept and shown as "שיא: 94" (`36-replay-l2-result.png`).
- **Practice and expert, worlds 1–4:** 8 out of 8 won on the first ride by computing from the displayed data.
- **Wrong answers seen:**
  - Level 1, +½: stall at x = 1.31, sign explanation.
  - Level 2, −0.7: gate-high, Δy/Δx card.
  - Level 9, b = 18: gap, crossing (24, 6) marked.
  - Level 18, segment 4 on the dog's line: gap at the 35.5–36.5 zone.
- **RTL:** checked in the DOM. Correct LTR order for:
  - The lesson math (`m = −3 ÷ 12 = −0.25`, `(12 ÷ 3)`).
  - Rise/run `0 / 1`.
  - `x ∈ [20, 40]` on wrapped lines.
  - The explanation sentences (`ב־x = 1.3`).
  - The result chips (+40).
  The only bidi bug found is P1-9.

## What works well

- **The core loop is legible and fast.** Pick numbers, GO, a short ride, and a result card that names the *specific* misconception: run ÷ rise, a parallel line has no crossing, the joint is outside the zone, positive slope means climbing.
- **Math rendering in the RTL UI is consistently correct.** Equations, intervals, inequalities and minus signs all render in the right order.
- **The lesson cards are good:** short, Workbook terms, a small diagram each, never the answer. The 📖 button reopens them.
- **Progression signalling is clear:**
  - Difficulty chips on every level.
  - The world-clear card names the next world's subject.
  - Practice and expert unlock visibly on the sign.
  - Stars and best scores persist across replays.
- **Style score** (flakes, trick, clean landing, speed) gives a replay reason without touching the math. The trick off the hut kicker works.
- **Level 18 as a capstone:** four skills in one track. The night look on level 10 is the most atmospheric frame in the game.
- **No console errors** in any run.

## What most limits this from feeling like a polished commercial game

1. **Art direction and lighting.** The game mostly lives in a flat, grey-white haze. The build view is a dark-blue wall that blocks the mountain the mockups sell. The characters are tiny and the celebration is distant. Many build frames carry placeholder-looking geometry: flat disc "fog", white landing boxes, floating tick rows.

   The mockups promise a sunlit Hermon with depth, colour and hero-sized characters. Closing that gap would change perception the most, more than any feature:
   - a strong sky and sun
   - blue shadows
   - a translucent board over real terrain
   - close-up "GO" and finish shots

2. **The later content leaks its own answers.** Inequality stages are solved by aiming at the labeled landing, expert world 4 by two labeled points, and practice world 4 labels the meeting point. The no-hint final un-fogs after one ride. A strong student will notice that world 3 is "world 2 again", and the expert tier doesn't feel like a step up. Fixing the labels and finishes (P1-1 to P1-4) makes progression real.

3. **Missing finish beats.** There's no ending after level 18 (and it says the final is still ahead), the map doesn't fit on phones and hides flags, and the worlds don't look like different places. Commercial games spend their polish on these transitions.
