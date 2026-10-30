# Slope Sled: independent playtest notes

Date: 2026-10-30/31. Tester: independent agent (no source edits). Build: dev server on http://localhost:5215, driven headlessly with `node scripts/drive.mjs` (about 35 runs, real clicks and keys; `eval:window.__game.loadLevel(N)` used only to jump to a level). All screenshots are in this folder.

**Caveats.** Everything below is what I observed in headless runs. Nothing here measures fun or learning. The source changed while I was testing: line numbers shifted, and the result card went from a plain `1. y = …` list (07) to coloured segment tags (16+). Recheck anything marked "early run".

Repro shorthand: `D() = node scripts/drive.mjs click:'[data-a=play]' adv:500 eval:'window.__game.loadLevel(N)' adv:1000 …`. "↓×k" means k repeated `key:ArrowDown` arguments.

---

## P0: blocks learning

### P0-1. The live joint readout gives away the answer on every joint level (9, 13, 15, 17, 18)
Each segment card shows `x ∈ [xa, xb]`, and the endpoints are the computed joint (the intersection with the next or previous segment). This readout updates live as you turn the dial. The goal or joint zone tells you which x the joint must land on, so you can step the dial until the readout matches. That needs no algebra, and the fog never comes into it.
- **L15:** m=−1.20 shows `x ∈ [0, 16.5]`, −1.25 shows `[0, 16]`, −1.30 shows `[0, 15.5]`. The goal text says "meet the dog at x = 16", so the unique answer can be read straight off the card.
  Repro: `D(15) ↓×14 eval:document.querySelector("[data-el=rng0]").textContent key:ArrowDown eval:…` (screenshot 28-l15-build.png).
- **L13:** b=45 shows segment 2 `x ∈ [14, 22.5]`. The task is "joint x ≤ 12 and inside the zone [10, 16]", so you step b until the first number is between 10 and 12. That skips the inequality solve −0.5x+24 ≤ −x+30 entirely (31-l13-build.png, 34-l13-b45-result.png).
- **L9:** b=10 shows `[22, 40]` and b=20 shows `[20, 40]`. The zone is [18, 22], which narrows b to about 19–21 with no algebra (26-l9-b20-readout.png).
- **L17 and L18:** same mechanism on every joint.

**Fix:** in build mode show the interval as the authored nominal stretch, or only the left endpoint the player already knows. Don't show the computed intersection until after the ride, where the replay and explanation can reveal it. If the readout is meant as a scaffold, gate it behind the hint.

## P1: should fix

### P1-1. The slope slider runs right-to-left: positive m on the left, negative on the right
The `input.slider` inherits `direction: rtl`. Measured: m=+0.75 puts the thumb left of centre (13-l2-plus075-build.png) and m=−0.75 puts it right of centre (18-l2-hint-build-correct.png, 45-l18-solved-build.png). The knob next to it turns the opposite way (positive points right). The x-axis caption says x grows left to right. This is exactly the RTL sign misconception the handoff asks the UI to prevent.
**Fix:** `dir="ltr"` on the range input. Also consider the order of the −/+ steppers.

### P1-2. Restart inside a "ריצה חדשה" (fresh run) throws
After finishing world 1, open a fresh run (it loads as level id 101), then press R or pause → "התחלת השלב מחדש". Result: `pageerror: no level 101`. The level doesn't restart and the error stays in the console.
Repro: finish W1 (see section 8 below), `key:Escape click:[data-a=select] click:.fresh-btn adv:1500 key:r` (59-fresh-run-build.png).
**Fix:** `restartLevel()` should reload the generated level object (or its seed), not `loadLevel(id)`.

### P1-3. Boring failure on the default answer: about 10 s of crawling at 1 km/h
L1 with m=0: the result appears only at sim t=10.08 s. The last ~5 s is the sled creeping at 0–1 km/h (09-l1-zero-result.png, 63-l1-zero-result.png). Several levels start with m=0, so the first impatient GO does the same thing (for example L2: GO is enabled with m=0 at start). A 13-year-old will think the game is frozen.
**Fix:** end the ride when speed drops below about 0.5 m/s on flat ground and go straight to the stall explanation. Or raise the time scale or speed up the replay while v ≈ 0.

### P1-4. The "x → גדל משמאל לימין" axis caption is covered by the finish label
On almost every build screen the caption sits under the `(40, 0) 🏠` style finish pill and is mostly unreadable: 02-l1-build.png, 12-l2-build.png, 25-l9-build.png, 28-l15-build.png, 30-l12-build.png, 31-l13-build.png. It is the main on-grid defence against reading the sign right-to-left.
**Fix:** put the caption under the x-axis at the far right end of the axis line, or place it above the axis and push the finish pill up.

### P1-5. L16's result card calls races "segments", and race 1 can be won by elimination
- On the win card after race 1 it says "מקטע 1 מתוך 3" (segment 1 of 3). It should say "מרוץ 1 מתוך 3" (36-l16-race1-result.png).
- Race 1 offers m ∈ {−0.5, −0.75}. The rival line is printed as −0.5, so picking "not the rival's number" wins with either b. Races 2 and 3 are 4-option picks, so the whole level is brute-forceable in ≤ 9 rides and only costs stars. Consider 3–4 slope options, or making the player say which system type each choice is before riding.

### P1-6. Explanations do not name the misconception they caught
The worked lines are correct, but some are generic:
- **L4, m=−0.55** ("steeper = bigger number"): the card says "at x = 32 your track is at 6.4, the rocks reach 7". It never says the slope must equal the friend's −0.5 (parallel = same slope), and −0.55 is not "less steep". The sled crashes at x = 20 (`ride.x = 20`), but the card cites x = 32, the worst point. The replay marker and the text disagree (62-l4-steeper-result.png).
- **L17, climb read as decreasing** (segment 3 = −0.5): the card says "lines intersect at x = 8, outside 19.5–20.5". It doesn't say the coach graph rises here, so the slope must be positive (65-l17-climb-misread-result.png).
- **L2 run÷rise** (−1.35): the card gives only heights at x = 16 (16-l2-runrise-result.png). One more clause would teach it: "your slope −1.35 ≈ 16/12; the slope is change in y ÷ change in x = −12/16".

**Fix:** add misconception-aware sentences keyed on known wrong values. LEVELS.md already lists them per level.

### P1-7. Mobile (390×844): playable, but the HUD collides
Build and ride both work (53-mobile-contact.png, 48–52). Problems:
- The GO button sits on top of the y-axis labels and the start of the grid (49-m-l1.png, 50-m-l2-build.png).
- The level name is truncated ("…עלייה חל").
- On L1 the start point and labels sit under the faded GO.
- In the ride, the altitude mini-graph covers the pause button and the top bar. The speedometer touches the tuck button (51-m-l2-ride.png).
- The grid fills only about the top third of the screen and the lodge label overlaps the x labels.

**Fix:** a mobile layout that docks GO into the bottom panel and moves the mini-graph below the top bar.

## P2: polish

1. **L17 reveals the shape.** The card subtitles show "יורדת / קבועה / עולה" for each segment (43-l17-build.png), which gives away the slope sign the coach graph is meant to teach (grade-7 reading-graphs). Remove the subtitles or show them only as a hint.
2. **Level select (55, 58).** World 2–4 flags are bunched at the top of the map, the wooden world signs cover flags (the Pine Forest sign sits on 7–9) and the lock icons are tiny. The mockup 05 path is far more legible. The fresh-run entry is a bottom button only (the per-world `.flag.fresh` buttons exist but aren't visible).
3. **Title screen (01).** The camera points into the start-tower poles with a grey wash, and there is no sledder, dog or slope. It's a weak first impression compared with mockup 01.
4. **Fresh run naming.** The header reads "שלב 101 : ריצה חדשה: …". Drop the internal id.
5. **Overlapping constraint pills on L4.** `y ≤ −0.5x + 25` is drawn on top of the `y ≥ −0.5x + 23` pill (62).
6. **L5 table card** overlaps the top of the y-axis labels (24-l5-build.png).
7. **Build view vs mockup 02.** The grid is a translucent glass panel standing in front of trees, not laid over the slope. Axis tick labels are small grey pills, segment lines are thin, and there is no glowing axis or arrowheads, so it reads less "glowing lattice" than the target. In the early run the L1 y-labels were white with no pill and hard to read on snow (02). Later runs have pills.
8. **L1 build.** GO is disabled until a slope button is chosen, but nothing says so. "0" is not pre-highlighted (LEVELS.md says "0 selected at first").
9. **Test hook only.** `render_game_to_text` plain explanations drop `<` (`stripHTML` eats `< 8`). Example on L12 m=−0.5: "…לקיים y  — לעבור מתחת". The on-screen card renders correctly (64). After loading a fresh run, text state still holds the previous level's `ride`/`outcome`. The explanation HTML also inserts a raw `<`; escape it as `&lt;`.
10. **Rise/run text** for −1.35 reads "−27 / 20, every 20 m right, down 27". It's correct but awkward. Simplify to the smallest integer run ≤ 10, or show "per 1 m" as well.
11. **Reduced motion** toggles and persists (`progress.reducedMotion = true`), but I couldn't see a visual difference in a still ride frame (61). Check that speed lines, FOV punch and camera shake are actually removed.

---

## Verified working (observed)

- **First 30 s (L1):** title → שחקו → three big buttons −½ / 0 / +½.
  - −½: swoop, ride, finish at (40, 0) in 6.34 s, 3 stars (03–07).
  - 0: "נעצרתם על המישור … שיפוע 0 הוא קו ישר אופקי … עצרתם ב־x = 11.5".
  - +½: "המזחלת נעצרה בעלייה … שיפוע חיובי פירושו עלייה: ככל ש־x גדל, הגובה עולה … x = 1.3 והמזחלת גלשה אחורה" (11).
  - All three outcomes match LEVELS.md.
- **L2 acceptance:** +0.75 stalls at x = 0.9 and slides back, with a worked stall sentence (15). −1.35 (run÷rise) gives a gate-low wipeout: "ב־x = 16 המסלול שלכם בגובה 2.4, אבל הפתח בשער בגובה 12" (16).
- **Mistake → hint → retry → success (L2):** the hint from the fail card shows "השיפוע הוא השינוי בגובה חלקי השינוי במרחק." and highlights (0, 24) and (16, 12). It doesn't show the equation (18). The retry at −0.75 succeeded with 1 star (hint plus 2 builds; 19).
- **L3:**
  - Ramp +0.5 stalls at x = 38.6 "halfway up" (22).
  - All −1 gives a gap with "לשני הישרים אותו שיפוע — הם מקבילים, ולכן אין להם נקודת חיתוך" (23). That catches the parallel misconception.
  - The correct (−1, 0, +0.25) ride gets air (56).
  - GO stays disabled until all three slopes are picked.
- **L11:** b = 4 (rock height used as b) gives rocks: "ב־x = 16 … −4 … y ≥ 4" (33).
- **L12:** m = −0.5 touches the strict bridge: "(לא לגעת)" (64).
- **L13:** b = 45 (reversed inequality) gives the avalanche at x = 14 (34).
- **L16:**
  - Race 2 (−0.5, 24) collides, with "פתרון יחיד … צריך ישר מקביל (אותו שיפוע, b שונה)" (39).
  - Same line is tangled, with "אינסוף פתרונות".
  - (−0.75, 18) wins.
- **L18:** the full authored answer (−0.75, 30 | 20 | −0.25, 17) rides in 6.61 s, 3 stars, with dusk and no hint button (45–47).
- **L1–L5 played in one run with authored answers:** all succeed. Level select shows saved stars (15/54), unlocks L6, and enables the W1 fresh run (58). The fresh run loads a generated level with gate (30, 13) and lodge (40, 8) (59).
- **Pause mid-ride:** Esc freezes sim time (1.20 → 1.20 after 3 s advance) and resume continues (54). Mute toggles via the button and the M key. Reduced motion persists to localStorage.
- **Bidi:** every math span I measured renders LTR in the DOM (minus sign first in "−27 / 20", `x` left of `16` in goals, hints and results), including goal strings that aren't wrapped in `<bdi>`. The y-labels and minus signs on the grid are fine. Hebrew terms match the curriculum list: שיפוע, האיבר החופשי, ישרים מקבילים, נקודת חיתוך, אזור חיבור, עולה/יורדת/קבועה.
- **Fog:** the stub on L2 is [0, 4.8] of [0, 32] and never reaches a gate in any level I opened. Fog itself is not a bypass; the interval readout is (P0-1).
- **No constant strategy won** in what I tried: all −1 on L3, the default 0 on L1/L2, and the rival's own slope on L16 race 1.
