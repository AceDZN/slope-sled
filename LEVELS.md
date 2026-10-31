# Slope Sled — levels

18 authored levels in four worlds. Data: `src/math/levels.ts`. Proofs: `tests/levels.test.ts` (brute force over every dial value through the real ride physics in `src/math/ride.ts`; `npm test`).

Conventions:

- Coordinates in meters, x grows left → right (also in the Hebrew RTL UI), y = altitude. Every segment is `y = mx + b`.
- m dials move in 0.05 steps, b steppers in 0.5 steps. All given coordinates are integers or halves.
- Gates pass when the track is within ±0.3 of the gate (some gates are tighter, listed below), the finish within ±0.5 unless stated. Joints are the intersection of consecutive lines and must fall inside the joint zone, otherwise there is a gap.
- "Solution" means the ride reaches the finish: clean geometry *and* enough speed (the dog's push is 2.5 m/s; climbing and friction cost speed).
- Ride time is simulated seconds for the listed answer (the ride is the same at any frame rate).
- Hazard names are the `HazardKind` values from `judge.ts`. A `below` constraint (branch, ice bridge, avalanche, cornice) reports as `branch`; an `above` constraint (rocks, ridge) as `rocks`.

## World 1 — Bunny Hill · גבעת הארנבים

### 1. הירידה הראשונה — First drop (tutorial, full line shown)

- Given: start (0, 20) (b = 20 fixed), lodge (40, 0). Buttons −½, 0, +½ (0 selected at first).
- Math: m = (0 − 20) / 40 = −0.5.
- Solution: **m = −0.5** (unique). Ride **6.34 s**, top speed 10.9 m/s.
- Wrong: 0 → coasts and stalls at x ≈ 11.5 high above the lodge. +0.5 → stalls at x ≈ 1.3 and slides back.

### 2. עלייה חלקי ריצה — Rise over run

- Given: start (0, 24), ice gate (16, 12), hut (32, 0). m dial −3…3.
- Math: m = −12 / 16 = −0.75.
- Solution: **m = −0.75** (unique). Ride **5.14 s**.
- Wrong: +0.75 (sign read right to left) → stalls at x ≈ 0.9. −1.35 (run ÷ rise, 16/12) → `gate-low` at x = 16. −0.7 → `gate-high` at x = 16.

### 3. גלישה וטיפוס — Coast and climb

- Given: three y-intercepts (free terms): drop b = 20 on [0, 16], frozen lake b = 4 on [16, 36], launch ramp b = −5 on [36, 56] with a kicker. Each segment picks a slope from −1, 0, +0.25, +0.5. Joint zones [14, 18] and [17, 38]. Landing powder at (56, 9).
- Math: the drop must meet the lake at (16, 4): −x + 20 = 4 → m = −1. The lake is constant: m = 0. The ramp must leave the lake and land at (56, 9): (9 − 4) / (56 − 36) = 0.25.
- Solution: **(−1, 0, +0.25)** (unique of 64). Ride **9.63 s**, 1.1 s of air off the kicker.
- Wrong: ramp +0.5 → the joint moves to x = 18 and the steeper climb **stalls at x ≈ 38.6, about halfway up the ramp** (18 → 56), then slides back. Always −1 → the lake is parallel to the drop → `gap` (parallel) at x = 16. Flat ramp → parallel to the lake → `gap`. Climbing lake (+0.25) → the drop meets it at x = 12.8, outside its zone → `gap` at x = 14. All flat (the initial buttons) → stalls at x ≈ 11.5.

### 4. נתיבים מקבילים — Parallel lanes

- Given: friend's lane y = −0.5x + 30 (race goal: never meet), your start (0, 24), a narrow ice bridge over x ∈ [12, 32]: rocks below the boundary y = −0.5x + 23, the bridge above y = −0.5x + 25. Hut (40, 4). m dial −2…1.
- Math: parallel = equal slope → m = −0.5 → y = −0.5x + 24 (stays 1 m inside the bridge everywhere).
- Solution: **m = −0.5** (unique). Ride **6.34 s**.
- Wrong: −0.45 drifts up into the bridge → `branch` (bridge) at x = 20. −0.55 ("steeper" read as the bigger number) → `rocks` at x = 20. −0.25 → `branch` at x = 12. 0 (initial) → stalls at x ≈ 11.5.

### 5. העברה: הטבלה של המדריך — Transfer: the guide's table

- Given: only a table, x 0, 4, 8 → y 18, 15, 12. Two gates at the table points (4, 15) and (8, 12) with **no coordinate labels**. Hut (24, 0). m dial −2…1, b stepper 0…30.
- Math: constant rate −3 per 4 → m = −0.75; at x = 0, y = 18 → b = 18.
- Solution: **m = −0.75, b = 18** (unique of 3 721). Ride **4.28 s**.
- Wrong: +0.75 (table read right to left) → stalls at x ≈ 0.9. −1.35 (run ÷ rise, 4/3) → `gate-low` at x = 4. b = 15 → `gate-low` at x = 4.

## World 2 — Pine Forest · יער האורנים

### 6. מאיפה מתחילים? — Where do you start?

- Given: m = −0.5 fixed, gate (10, 15), hut (40, 0). b stepper 0…30.
- Math: 15 = −0.5·10 + b → b = 20.
- Solution: **b = 20** (unique). Ride **6.34 s**.
- Wrong: b = 15 (the gate height) → `gate-low` at x = 10. b = 40 (the x-intercept) → `gate-high`. b = 20.5 → `gate-high`.

### 7. שני דגלים — Two flags

- Given: flags (4, 22) and (12, 18), hut (24, 12). m dial −2…1, b stepper 0…30. (Segment ends at 24 so the fog never reaches the first flag.)
- Math: m = (18 − 22) / (12 − 4) = −0.5; 22 = −0.5·4 + b → b = 24.
- Solution: **m = −0.5, b = 24** (unique of 3 721). Ride **4.54 s**.
- Wrong: m = −2 (run ÷ rise) with b = 30 passes flag 1 but → `gate-low` at x = 12. b = 22 (first flag's height) → `gate-low` at x = 4. +0.5 → stalls at x ≈ 1.3.

### 8. נקודה ושיפוע — Point and slope

- Given: the old lift cable passes (6, 9) with slope −1.5 (fixed); the hut is at the x-intercept (12, 0). b stepper 0…30.
- Math: 9 = −1.5·6 + b → b = 18; x-intercept 18 / 1.5 = 12.
- Solution: **b = 18** (unique). Ride **3.00 s** (a short, steep plunge; the handoff fixes both the cable point and the hut, so it can't be longer).
- Wrong: b = 9 (the point's y) → `gate-low` at x = 6. b = 12 (the x-intercept) → `gate-low`. b = 18.5 → `gate-high`.

### 9. המפרק הראשון — First joint

- Given: segment A y = −x + 30 on [0, 20] (drawn, not editable); segment B slope −0.5 (fixed) to the hut (40, 0), finish tolerance ±0.25. Joint zone x ∈ [18, 22]. b stepper 0…40.
- Math: 0 = −0.5·40 + b → b = 20; the joint is the intersection −x + 30 = −0.5x + 20 → (20, 10), inside the zone.
- Solution: **b = 20** (unique). Ride **5.63 s**.
- Wrong: b = 19 → joint (22, 8) still in the zone but `finish-low` at the hut. b = 21 → `finish-high`. b = 18 → joint at x = 24, outside → `gap` at x = 22. b = 10 (joint height) or b = 30 (copied from A) → `gap`.

### 10. העברה: מרוץ הרוח — Transfer: ghost race (night)

- Given: the ghost's frozen track drawn as a graph only (no equation) through readable grid points (5, 20) and (15, 16). Race goal: ride the same line. Hut (40, 6). m dial −2…1, b stepper 0…30.
- Math: m = (16 − 20) / 10 = −0.4; 20 = −0.4·5 + b → b = 22.
- Solution: **m = −0.4, b = 22** (unique of 3 721). Ride **6.76 s**.
- Wrong: b = 20 (read at x = 5 instead of x = 0) → parallel, `not-tandem` at x = 40. +0.4 → `collide` with the ghost at x = 0. −0.45 → `collide` at x = 0. −2, b = 30 → `collide`.

## World 3 — Rock Garden · גן הסלעים

### 11. מעל הסלעים, מתחת לענף — Above the rocks, under the branch

- Given: track y = −0.5x + b on [0, 16] with a kicker; rocks top out at y = 4 over [0, 16] (track y ≥ 4); a branch hangs at y = 14.5 over x ∈ [0, 2] (track y < 14.5, strict). Landing: a wide, unlabeled powder field (center (16, 5) ± 9), so only the two inequalities decide; an earlier ±1 labeled landing let players aim the line at it instead of reasoning. b stepper 0…24.
- Math: at x = 16, −8 + b ≥ 4 → b ≥ 12; at x = 0, b < 14.5 → b ≤ 14 on the 0.5 grid.
- Solution set: **b ∈ {12, 12.5, 13, 13.5, 14}** — all ride. Ride **3.83 s** (b = 13), 0.3 s of air.
- Wrong: b = 11.5 → `rocks` at x = 15. b = 14.5 → touches the branch → `branch` at x = 0. b = 4 (rock height as b) → `rocks` at x = 0.

### 12. מתחת לגשר הקרח — Under the ice bridge

- Given: track y = mx + 10 (b fixed); an ice bridge at y = 8 over x ∈ [4, 10] (track y < 8, strict); rocks over x ∈ [8, 10] (track y > 0, strict); the valley floor y = 0 (drawn) joins in zone [10, 20]; lodge (26, 0). m dial −2…0.5.
- Math: at x = 4, 4m + 10 < 8 → m < −0.5; at x = 10, 10m + 10 > 0 → m > −1.
- Solution set: **m ∈ {−0.95, −0.90, …, −0.55}** (9 values) — all ride. Ride **4.48 s** (m = −0.75), 4.43–4.68 s across the set.
- Wrong: m = −0.5 touches the strict bridge → `branch` (bridge) at x = 4. m = −1 lands exactly on the rocks → `rocks` at x = 10. m = −0.4 → `branch` at x = 4. m = −1.5 → `rocks`.

### 13. קו המפולת — Avalanche line

- Given: your track y = −0.5x + 24 (drawn); the danger zone y > −x + 30 (the track must stay ≤ the avalanche line over [0, 30]); the escape chute has slope −2 (fixed) and enters in the joint zone [10, 16]; the valley y = 0 (drawn) joins in [16, 24]; lodge (32, 0). b stepper 20…50.
- Math: −0.5x + 24 ≤ −x + 30 → x ≤ 12, so the joint (b − 24) / 1.5 must be ≤ 12 → b ≤ 42; the zone gives x ≥ 10 → b ≥ 39.
- Solution set: **b ∈ {39, 39.5, …, 42}** (7 values). Ride **5.72 s** (b = 40).
- Wrong: b = 42.5 → joint past 12, the avalanche catches you → `branch` (avalanche) at x = 12. Reversed inequality (x ≥ 12, e.g. joint at 14 → b = 45) → `branch` at x = 12. b = 38.5 → chute entrance before the zone → `gap` at x = 10.

### 14. העברה: הכרכוב — Transfer: the cornice

- Given: a drawn drop-in ramp y = −x + 18 on [−8, 0] (gives you speed); your line y = mx + 18 on [0, 24] with a kicker; stay above the rock ridge y ≥ 0.25x + 2 and below the cornice y ≤ 20 over [0, 24]. Landing: a wide, unlabeled powder field (center (24, 14) ± 14), so the ridge and cornice decide; the earlier labeled ±6 landing matched the window exactly. m dial −1.5…1 (starts at 0.5).
- Math: at x = 24: 24m + 18 ≥ 8 → m ≥ −5/12; 24m + 18 ≤ 20 → m ≤ 1/12.
- Solution set: **m ∈ {−0.40, −0.35, …, 0.05}** (10 values) — all ride. Ride **5.62 s** (m = −0.2), 5.26–7.38 s across the set.
- Wrong: m = −0.45 → `rocks` (ridge) at x ≈ 22.9. m = 0.1 → `branch` (cornice) at x = 20. m = −0.5 → `rocks`. m = 0.5 (initial) → `branch` at x = 4.
- Note: the handoff puts the window on [0, 24] starting at (0, 18). From the dog's 2.5 m/s push a flat or +0.05 line stalls within ~12 m, so the drop-in ramp left of the y-axis was added; the handoff's numbers are unchanged.

## World 4 — Twin Trails · שבילים תאומים

### 15. פגישה עם הכלב — Meet the dog

- Given: the dog runs y = −0.5x + 20; you start at (0, 32); meet it at the hut at x = 16 (meeting arch, height not labelled); then ride together along the dog's line (drawn) to the lodge (36, 2). Joint zone [15.5, 16.5]. m dial −2.5…0.5.
- Math: dog at x = 16: −8 + 20 = 12; m = (12 − 32) / 16 = −1.25. The joint is the system's solution (16, 12).
- Solution: **m = −1.25** (unique). Ride **5.22 s**.
- Wrong: −1.2 → arrives above the dog → `gate-high` at x = 16. −1.3 → meets the dog at x = 15, too early → `gap` at x = 15.5. −0.5 (copied the dog's slope) → parallel, no joint → `gap` (parallel) at x = 16. −0.75 (12 ÷ 16, forgot the start height) → `gate-high` at x = 16.

### 16. נפגשים, לעולם לא, או תמיד — Meet, never, or always (three races)

Each race shows the rival's equation. Race 1 is a slope dial; races 2 and 3 offer two slopes and two free terms (four lines: one per system type).

| Race | Rival | Choices | Goal | Solution set | Wrong |
|---|---|---|---|---|---|
| 1 | dog y = −0.5x + 16 on [0, 20] | m dial −2…0 (step 0.05), b fixed at the start tower 20; unlabeled powder landing y ∈ [0, 6] at x = 20 | meet exactly once before the end, without digging under the snow | **m ∈ [−1, −0.7]** (7 of 41 dial values): start above the dog, end at or below its height 6 at x = 20 (20 + 20m ≤ 6) and not below y = 0 | −0.5 (the start value) parallel → `never-met`; −0.65 → crosses only at x ≈ 26.7, after the end → `never-met` with the late crossing named; −1.25 → `finish-low` (under the snow) |
| 2 | friend y = −0.75x + 24 on [0, 24] | m ∈ {−0.5, −0.75}, b ∈ {24, 18} | never meet | **(−0.75, 18)** — same slope, other free term | same line → `tangled`; (−0.5, 24) → `collide` at x = 0; (−0.5, 18) → `collide` at x = 24 ("parallel-looking lines meet far away") |
| 3 | ghost y = −0.5x + 18 on [0, 24] | m ∈ {−0.25, −0.5}, b ∈ {14, 18} | always together | **(−0.5, 18)** — the same line | (−0.5, 14) → `not-tandem` at x = 24; (−0.25, 14) → `collide` at x = 16; (−0.25, 18) → `collide` at x = 0 |

Ride times **3.81 s / 4.28 s / 4.54 s**. Races 2 and 3 have a wide finish on purpose (the race goal decides). Race 1 used to be two-by-two buttons with two of the four combinations winning, so a coin flip passed it; the dial makes it a real inequality on the slope. The tests check that every race-1 winner is a one-solution system, the race-2 winner a no-solution system and the race-3 winner infinitely many.

### 17. ציירו את הגלישה — Draw the ride

- Given: the coach's altitude graph (schematic silhouette, no scale): decreasing, constant, increasing to a peak, decreasing. Start (0, 20) (b fixed), flags (6, 14), (16, 8), (22, 9), (26, 11), (34, 6) (±0.15), lodge (40, 0) ± 0.25. Joint zones [11.5, 12.5], [19.5, 20.5], [27.5, 28.5]. Every m dial −2…1; b steppers −10…30 (−10…50 for the last).
- Math: A (decreasing) through (0, 20), (6, 14) → y = −x + 20. B (constant) through (16, 8) → y = 8. C (increasing) through (22, 9), (26, 11) → y = 0.5x − 2. D (decreasing) through (34, 6), (40, 0) → y = −x + 40. Joints (12, 8), (20, 8), peak (28, 12).
- Solution: **(−1 | 0, 8 | 0.5, −2 | −1, 40)** — unique per segment (each segment swept over its full m × b grid with the others fixed) and in the joint ±1-step neighbourhood of all seven dials. Ride **6.88 s**.
- Wrong: lake read as decreasing (−0.5) → `gap`. Climb read right-to-left as decreasing (−0.5) → `gap`. Climb with run ÷ rise (m = 2) → `gate-high` at x = 22.

### 18. הגמר: הירידה מפסגת החרמון — Final: Hermon summit descent (no hints, dusk, fog)

- Given (four segments):
  1. *Two flags* (4, 27) and (12, 21), ±0.2. m dial −2…1, b stepper 0…40.
  2. *Between the rocks and the bridge*, slope −0.25 (fixed), over x ∈ [22, 30]: stay below the ice bridge y < 15 (strict) and above the rocks y ≥ 12. Joint zone with segment 1: [18, 22]. b stepper 0…40.
  3. *The old lift line* y = −x + 44 (drawn); joint zone with segment 2: [31, 34].
  4. *To the dog*: the dog runs y = −0.5x + 28; meet it at x = 44 (meeting arch ±0.15, height not labelled); joint zone with segment 3: [35.5, 36.5]; lodge (48, 5) ± 0.25. m dial −2…1, b stepper 0…40.
- Math: (1) m = −6/8 = −0.75, b = 30. (2) at x = 22: −5.5 + b < 15 → b < 20.5; at x = 30: −7.5 + b ≥ 12 → b ≥ 19.5. (4) dog at 44: 6; segment 3 at the joint post x = 36: 8 → m = (6 − 8) / 8 = −0.25, b = 17.
- Solution set: **(−0.75, 30) · b₂ ∈ {19.5, 20} · (−0.25, 17)**. Joints (20, 15), (32, 12), (36, 8) for b₂ = 20. Ride **6.61 s** (6.58 s with b₂ = 19.5).
- Wrong: run ÷ rise on the flags (m = −1.35, b = 32.5) → `gate-low` at x = 12. b₂ = 20.5 → touches the bridge → `branch` at x = 22. b₂ = 19 → `rocks` at x = 28. Segment 4 parallel to the dog (−0.5, 26) → passes under the arch → `gate-low` at x = 44. Segment 4 on the dog's line (−0.5, 28) → joint off the post → `gap`.

## Anti-bypass results (from the tests)

- Constant strategies (every editable m set to one value, nearest button on button levels, b left at its start value): "always m = −1" wins level 1 only (the nearest button is −½); "always m = −0.5" wins levels 1 and 4; the dials' starting values win nothing.
- Fog (first 15 % of each editable segment drawn) never reaches a gate or the finish at the answer.
- Every stage except the inequality windows (11–14, segment 2 of 18) and race 1 of 16 has a unique answer whose every ±1-step neighbour fails; the windows are closed (the first value outside each end fails) and no window covers more than 10 values or 20 % of its dial.

## Physics fit

Every handoff number rides as written, except where a number was left open (listed above) and two additions:

- Level 14: a drawn drop-in ramp on x ∈ [−8, 0] gives the speed needed to cross 24 m at m ≥ 0 (the view starts at x = −8).
- Level 8 is 3.0 s, below the ~4 s target; both its coordinates are fixed by the handoff.
- `judge.ts`: a given segment that only *touches* the rival's line at one end point (level 15, riding on with the dog from x = 16) no longer counts as "same line / tangled"; parallel lines there now report the gap at the joint.

## Generated runs (practice and expert)

Both come from `src/math/generate.ts`. The tests in `tests/generate.test.ts` check, for each world, that every run can be solved through the real ride, that its solution set is narrow (1–5 values), that "always m = −1" fails, and that expert runs label no answer point (hidden gates, unlabeled powder landing).

| World | Practice (❄ תרגול, hints allowed) | Expert (🏔 מומחה, no hints) |
|---|---|---|
| 1 | Fixed start, one labeled gate on the line: slope from two points | Uneven table with no x = 0 row and hidden gates: find m and b from the table |
| 2 | Two labeled flags: equation of a line | A given line A and your fixed slope; the joint (intersection) must land on a ±0.2 bolt: substitute into A, then solve for your b |
| 3 | Fixed slope, rocks below and a strict branch above: a b window (2–5 values), unlabeled landing | Drop-in ramp, then stay above a rising ridge and below a cornice: an m window, unlabeled landing |
| 4 | Meet the dog at the hut: only the hut's x is shown, so plug it into the dog's equation | Read the ghost's line from its graph only, then ride parallel to it a stated number of meters lower, through two hidden gates |
