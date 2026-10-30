# Slope Sled — מזחלת השיפוע — build handoff

Read `../COMMON.md` first. Repo `/Users/acedzn/dev/AceDZN-exp/slope-sled` → public `AceDZN/slope-sled`, port 5215 (preview 4215).

## Promise

A snow day on **Mount Hermon**. You and your dog build the wildest sled run on the mountain, then ride it. On a glowing coordinate grid laid over a 3D side-slice of the slope, every piece of track is a straight line **y = mx + b** over a stretch of x. Build it, hit GO, and the camera swoops behind your rigged sledder: tuck for speed, lean through the pines, launch off the ramp, pull a trick, crash into a snowbank if your math was off. Negative slope rockets you downhill, zero coasts across the frozen lake, positive slope climbs and stalls if you didn't bring enough speed. Rocks and branches are linear inequalities your track must stay above or below; where two of your lines cross is where the pieces join — miss the joint and you get a glorious wipeout. The fun is building something crazy and then *riding* it.

Map evidence: Lonely Mountains: Downhill × Golf Peaks (related, density 0.677), the emptiest linear-function blend measured; Mini Motorways × Golf Peaks (0.697) and Mini Metro × Railbound (0.742) became the weaker Slope Rail idea. **Keep it clearly different from Splash Arc** (round 3: edit a parabola's vertex, throw balloons): here you build piecewise straight lines and ride them in real time.

## Curriculum (Workbook grade 8, chapters 1 and 7; grade 7, chapter 10)

Grade 8 ch. 1: [constant-rate-change](https://math.workbook.co.il/grade-8/chapter-1/constant-rate-change), [linear-function-representations](https://math.workbook.co.il/grade-8/chapter-1/linear-function-representations), [slope-meaning](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning), [slope-formula](https://math.workbook.co.il/grade-8/chapter-1/slope-formula), [slope-sign-parallel](https://math.workbook.co.il/grade-8/chapter-1/slope-sign-parallel), [intercepts-and-free-term](https://math.workbook.co.il/grade-8/chapter-1/intercepts-and-free-term), [equation-from-graph](https://math.workbook.co.il/grade-8/chapter-1/equation-from-graph), [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points), [linear-models](https://math.workbook.co.il/grade-8/chapter-1/linear-models), [linear-inequality-meaning](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-meaning), [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving).
Grade 8 ch. 7: [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution), [solution-counts-systems](https://math.workbook.co.il/grade-8/chapter-7/solution-counts-systems), [substitution-method](https://math.workbook.co.il/grade-8/chapter-7/substitution-method).
Grade 7 ch. 10: [graph-representation](https://math.workbook.co.il/grade-7/chapter-10/graph-representation), [function-change](https://math.workbook.co.il/grade-7/chapter-10/function-change), [reading-graphs](https://math.workbook.co.il/grade-7/chapter-10/reading-graphs).
Snapshots in `/Users/acedzn/idea-plotter/reports/math-games-2026-10-30/curriculum/`.

Rules:
- Coordinates in meters: x = horizontal distance, y = altitude. Each segment is y = mx + b on a stated x-interval. m is set as a decimal in 0.05 steps (−3 … 3) or as rise/run notches (both views stay in sync); b in 0.5 steps. The live equation shows in an LTR span.
- Slope = rise ÷ run, constant along the segment; slope sign: negative = descending (as x grows), zero = flat, positive = climbing; equal slopes = parallel lines.
- A joint between consecutive segments is the **intersection of their lines** (solve the system). If it falls outside the joint zone, there's a gap (a jump or a wipeout, depending on the level).
- Two lines: one solution (cross), none (parallel, different b), infinitely many (same line).
- **Ride physics (game, not curriculum):** deterministic pure-TS energy model (gravity along the slope, constant snow friction, air drag optional, ballistic flight off ramps). It must be tuned so that every math-correct track rides successfully and the advertised wrong answers fail in the advertised way. Steering/tricks are flavor and can't rescue wrong math.
- Hebrew terms: שיפוע, קצב השתנות, האיבר החופשי, נקודת חיתוך עם הצירים, ישרים מקבילים, אי-שוויון, תחום, פתרון גרפי של מערכת, נקודת חיתוך, עולה / יורדת / קבועה, נקודת קיצון.

Misconceptions to catch: slope as run ÷ rise; sign of slope read right-to-left (an RTL-specific risk: the x-axis still grows left→right, say so on the grid); b confused with the x-intercept; "steeper" = bigger number even when negative; parallel lines "meet far away"; reversing an inequality direction when reading "above/below".

## Loop and controls

- **Build mode:** side view of the slope slice with the grid. Gates, rocks, branches, ice bridges and huts sit at given coordinates (labeled). Select a segment, set m and b with dials/sliders/keys (touch-friendly). **Fog preview:** before riding, only the first 15 % of each new segment is drawn, so you can't drag-and-eyeball to the gate; you compute it from the given coordinates. Levels may show the full line for the tutorial only.
- **Ride mode:** chase camera in full 3D, speed lines, snow spray, dog running alongside. Controls: tuck (speed), lean (style points), trick button in the air. A run's result: reach the hut → stars by hints used and builds needed; fail → slow-motion wipeout replay with the offending line highlighted and a one-line worked explanation (e.g., "at x = 16 your track is at 3, the rock is at 4").
- Hint (logged, costs a star): highlights the two points or the inequality boundary you need; never the equation.

## Levels (author exactly; tests prove each; 18 total)

**World 1 — Bunny Hill · גבעת הארנבים** (constant-rate-change, slope-meaning, slope-sign-parallel)
1. **First drop** — start (0, 20), lodge at (40, 0); choose among −½, 0, +½ → m = −½. Full line shown (tutorial).
2. **Rise over run** — start (0, 24), flag at (16, 12) → m = −12/16 = −0.75; you finish at (32, 0).
3. **Coast and climb** — three given intercepts; pick slopes: m = −1 to gain speed, m = 0 across the frozen lake, m = +0.25 up the launch ramp. A +0.5 ramp stalls you halfway (positive slope costs speed).
4. **Parallel lanes** — your friend's lane is y = −0.5x + 30; your lane starts at (0, 24) and must stay parallel through the narrow bridge → y = −0.5x + 24.
5. **Transfer: the guide's table** — only a table: x 0, 4, 8 → y 18, 15, 12 → m = −0.75, b = 18. No grid labels on the gates.

**World 2 — Pine Forest · יער האורנים** (intercepts-and-free-term, equation-from-graph, equation-from-points)
6. **Where do you start?** — m = −0.5 is fixed; pass the gate (10, 15) → b = 20.
7. **Two flags** — (4, 22) and (12, 18) → m = −0.5, b = 24.
8. **Point and slope** — the old lift cable passes (6, 9) with slope −1.5 → b = 18; the finish hut is at the x-intercept (12, 0).
9. **First joint** — segment A is y = −x + 30 (given); segment B has slope −0.5 and must reach the hut at (40, 0) → b = 20. The joint is the intersection (20, 10), inside the joint zone x ∈ [18, 22]. A wrong B moves the joint outside the zone → gap → wipeout.
10. **Transfer: ghost race** — an old frozen track is drawn as a graph with two readable grid points; match its equation to race its ghost. Different camera (night, lantern light).

**World 3 — Rock Garden · גן הסלעים** (linear-inequality-meaning, linear-inequality-solving)
11. **Above the rocks, under the branch** — track y = −0.5x + b on x ∈ [0, 16]; rocks top out at y = 4 (track must satisfy y ≥ 4) → b ≥ 12; a branch hangs at 14.5 above x = 0 → b ≤ 14. Solution set b ∈ {12, 12.5, 13, 13.5, 14}; all ride.
12. **Under the ice bridge** — track y = mx + 10; the ice bridge spans x ∈ [4, 10] at y = 8 (track must be below) → m < −0.5; the rocks at x = 10 need y > 0 → m > −1. Valid m: −0.95 … −0.55.
13. **Avalanche line** — the danger zone is y > −x + 30. Your track y = −0.5x + 24 is safe only while −0.5x + 24 ≤ −x + 30 → x ≤ 12, so the joint to the escape chute must be at x ≤ 12.
14. **Transfer: the cornice** — two inequalities at once (stay above a rising rock ridge y ≥ 0.25x + 2 and below a cornice y ≤ 20) over x ∈ [0, 24]; find a line y = mx + 18 that satisfies both: at x = 24, 24m + 18 ≥ 8 → m ≥ −5/12 and 24m + 18 ≤ 20 → m ≤ 1/12, so in 0.05 steps m ∈ {−0.40, −0.35, …, 0.05} (verify by solver; any member rides).

**World 4 — Twin Trails · שבילים תאומים** (systems-graphical-solution, solution-counts-systems; grade 7 function-change, reading-graphs)
15. **Meet the dog** — the dog runs y = −0.5x + 20; you start at (0, 32) and must meet it at the hut x = 16 → its height there is 12 → your m = (12 − 32)/16 = −1.25.
16. **Meet, never, or always** — three races: pick a line that crosses the rival's (one meeting point, high-five), one parallel to it (no solution — you pass safely side by side), or the same line (infinitely many — tandem bonus).
17. **Draw the ride** — the coach's altitude graph: decreasing, then constant, then increasing to a peak, then decreasing (grade-7 increasing/decreasing/extreme points). Build a 4-segment track whose graph matches it (sign of each slope plus the given coordinates).
18. **Final: Hermon summit descent (no hints)** — fog, dusk, 4 segments mixing an equation from two points, an inequality window, a joint at an intersection, and a meeting point with the dog.

After the authored levels work: generated runs per world from a solver with integer/half-integer coordinates, verified solvable, verified that "always m = −1" and visual guessing under fog fail.

## 3D and art

Bright winter sun on Hermon, deep blue sky, pine forest, cable-car pylons, a wooden ski hut, powder spray and sparkles. The track is a procedural glowing ribbon extruded along the exact lines (with the grid fading out during the ride and back in at a wipeout replay). Tripo (search the library/assets first, then generate): a **rigged kid sledder** in a puffy jacket (Mixamo idle, cheer, fall/get-up; a sitting/riding pose), a **rigged dog** (quadruped run/jump, or a simple run cycle), the **sled** hero prop, and set pieces (ski hut, pylon, snow-capped rocks, pines).

## Acceptance

In the first 30 seconds: read the lodge at (40, 0), pick m = −½, ride down with a big snow-spray finish. Then in Level 2 pick +0.75 on purpose and watch the sled refuse to go uphill, with the worked explanation. All line, intersection, inequality and ride results come from the pure modules; tests cover all 18 levels, the fog anti-eyeballing check, the joint-zone gaps and all three system types.
