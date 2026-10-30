# Slope Sled — curriculum map

Source of truth: Workbook (math.workbook.co.il), Israeli Ministry of Education curriculum. Every link below is a module saved as a snapshot in `idea-plotter/reports/math-games-2026-10-30/curriculum/` (grade 8 chapter 1 "linear function", grade 8 chapter 7 "systems of equations", grade 7 chapter 10 "introduction to functions"). Level details and verified answers: `LEVELS.md`.

Misconceptions checked (from the build handoff), with their short codes:

- **RR**: slope as run ÷ rise instead of rise ÷ run.
- **RTL**: reading the slope's sign right to left. In the Hebrew UI the x-axis still grows left → right.
- **BX**: b confused with the x-intercept (or with another point's height).
- **ST**: "steeper = bigger number" even for negative slopes (−0.55 is steeper than −0.5).
- **PAR**: parallel lines "meet far away".
- **INQ**: reversing an inequality when reading "above/below" (or the direction of the solution set).

| # | Level | Workbook modules | Skill practised | Misconceptions checked (how the ride shows it) |
|---|---|---|---|---|
| 1 | הירידה הראשונה · First drop | [slope-meaning](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning), [slope-sign-parallel](https://math.workbook.co.il/grade-8/chapter-1/slope-sign-parallel) | Slope sign: negative goes down, zero is flat, positive climbs | RTL (+½ stalls and slides back) |
| 2 | עלייה חלקי ריצה · Rise over run | [slope-formula](https://math.workbook.co.il/grade-8/chapter-1/slope-formula), [slope-meaning](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning) | m = Δy / Δx from a start point and a gate | RR (−1.35 under the gate), RTL (+0.75 stalls) |
| 3 | גלישה וטיפוס · Coast and climb | [constant-rate-change](https://math.workbook.co.il/grade-8/chapter-1/constant-rate-change), [slope-meaning](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning), [slope-sign-parallel](https://math.workbook.co.il/grade-8/chapter-1/slope-sign-parallel) | Choosing the slope of each piece: decreasing / constant / increasing; equal slopes are parallel (no joint) | ST (the steeper ramp +0.5 stalls halfway), PAR (always −1 → the lake never meets the drop) |
| 4 | נתיבים מקבילים · Parallel lanes | [slope-sign-parallel](https://math.workbook.co.il/grade-8/chapter-1/slope-sign-parallel), [slope-meaning](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning) | Parallel lines = same slope, different free term | ST (−0.55 hits the rocks), PAR (−0.45 or −0.25 drifts into the bridge) |
| 5 | העברה: הטבלה של המדריך · Transfer: the guide's table | [linear-function-representations](https://math.workbook.co.il/grade-8/chapter-1/linear-function-representations), [constant-rate-change](https://math.workbook.co.il/grade-8/chapter-1/constant-rate-change), [slope-formula](https://math.workbook.co.il/grade-8/chapter-1/slope-formula) | Table → equation: constant rate gives m, the x = 0 row gives b | RR (−4/3), RTL (table read right to left → +0.75 stalls), BX (b = 15) |
| 6 | מאיפה מתחילים? · Where do you start? | [intercepts-and-free-term](https://math.workbook.co.il/grade-8/chapter-1/intercepts-and-free-term) | Free term (האיבר החופשי) as the starting height, from a point and a known slope | BX (b = 40, the x-intercept; b = 15, the gate's height) |
| 7 | שני דגלים · Two flags | [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points), [slope-formula](https://math.workbook.co.il/grade-8/chapter-1/slope-formula) | Equation of a line through two points | RR (−2 clears flag 1, misses flag 2), BX (b = 22), RTL (+0.5) |
| 8 | נקודה ושיפוע · Point and slope | [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points), [intercepts-and-free-term](https://math.workbook.co.il/grade-8/chapter-1/intercepts-and-free-term) | Point + slope → b; the x-intercept is where y = 0 | BX (b = 12, the x-intercept; b = 9, the point's height) |
| 9 | המפרק הראשון · First joint | [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points), [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution), [intercepts-and-free-term](https://math.workbook.co.il/grade-8/chapter-1/intercepts-and-free-term) | b from the x-intercept; the joint is the intersection of two lines | BX (b = 10, the joint's height; b = 30 copied) → gap |
| 10 | העברה: מרוץ הרוח · Transfer: ghost race | [equation-from-graph](https://math.workbook.co.il/grade-8/chapter-1/equation-from-graph), [linear-function-representations](https://math.workbook.co.il/grade-8/chapter-1/linear-function-representations) | Equation from a graph with two readable points, neither on the y-axis | BX (b = 20, read at x = 5), RTL (+0.4) |
| 11 | מעל הסלעים, מתחת לענף · Above the rocks, under the branch | [linear-inequality-meaning](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-meaning), [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving) | Two inequalities in b; strict vs non-strict boundary; a solution set, not one answer | INQ (above ≥ 4 / below < 14.5), BX (b = 4) |
| 12 | מתחת לגשר הקרח · Under the ice bridge | [linear-inequality-meaning](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-meaning), [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving) | Inequalities in m: −1 < m < −0.5; strict boundaries exclude −0.5 and −1 | ST (−0.4 "less steep → lower" hits the bridge), INQ (−0.5 touches the strict bridge) |
| 13 | קו המפולת · Avalanche line | [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving), [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution) | Solve −0.5x + 24 ≤ −x + 30 → x ≤ 12; place the joint (an intersection) inside that range | INQ (x ≥ 12 → the avalanche catches you at x = 12) |
| 14 | העברה: הכרכוב · Transfer: the cornice | [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving), [linear-inequality-meaning](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-meaning), [linear-models](https://math.workbook.co.il/grade-8/chapter-1/linear-models) | Two inequalities at once in a new situation (rising ridge + flat cornice) | INQ, ST (−0.45 vs −0.40 at the window edge) |
| 15 | פגישה עם הכלב · Meet the dog | [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution), [substitution-method](https://math.workbook.co.il/grade-8/chapter-7/substitution-method), [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points) | Substitute x = 16 into the dog's line; the meeting point solves both equations | PAR (copying the dog's slope → never meet), BX (12 ÷ 16 without the start height) |
| 16 | נפגשים, לעולם לא, או תמיד · Meet, never, or always | [solution-counts-systems](https://math.workbook.co.il/grade-8/chapter-7/solution-counts-systems), [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution), [slope-sign-parallel](https://math.workbook.co.il/grade-8/chapter-1/slope-sign-parallel) | Number of solutions of a system: one (different slopes), none (same slope, other free term), infinitely many (same line) | PAR (race 2: the other slope collides at x = 24) |
| 17 | ציירו את הגלישה · Draw the ride | [function-change](https://math.workbook.co.il/grade-7/chapter-10/function-change), [reading-graphs](https://math.workbook.co.il/grade-7/chapter-10/reading-graphs), [graph-representation](https://math.workbook.co.il/grade-7/chapter-10/graph-representation), [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points) | Read a graph's change (decreasing / constant / increasing, the peak) and turn each piece into a line | RTL (the climb read as decreasing), RR (climb m = 2) |
| 18 | הגמר: הירידה מפסגת החרמון · Final descent (no hints) | [equation-from-points](https://math.workbook.co.il/grade-8/chapter-1/equation-from-points), [linear-inequality-solving](https://math.workbook.co.il/grade-8/chapter-1/linear-inequality-solving), [systems-graphical-solution](https://math.workbook.co.il/grade-8/chapter-7/systems-graphical-solution), [substitution-method](https://math.workbook.co.il/grade-8/chapter-7/substitution-method) | Mixed: two points, an inequality window, joints at intersections, a meeting point | RR (flags), INQ (strict bridge), PAR (parallel to the dog misses the meeting) |

## Hebrew terms (handoff vs Workbook snapshots)

| Handoff term | In the snapshots | Note |
|---|---|---|
| שיפוע | yes (all grade 8 ch. 1 modules) | |
| קצב השתנות | yes (constant-rate-change, linear-function-representations) | slope-meaning says "קצב שינוי"; both are fine |
| האיבר החופשי | yes (intercepts-and-free-term and others) | also "ערך התחלתי" (initial value) for b in context |
| נקודת חיתוך עם הצירים | **no** | Workbook says "חיתוך עם ציר x" / "חיתוך עם ציר y" and the heading "האיבר החופשי וחיתוכי הצירים". Use those. |
| ישרים מקבילים | yes (slope-sign-parallel, solution-counts-systems) | Workbook also says "מקבילים שונים" (same slope, other free term) and "אותו ישר" |
| אי-שוויון | yes, with a hyphen (plural "אי-שוויונות") | |
| תחום | yes | |
| פתרון גרפי של מערכת | yes (title of systems-graphical-solution) | |
| נקודת חיתוך | yes ("נקודת החיתוך" in systems-graphical-solution) | |
| עולה / יורדת / קבועה | yes (function-change: "הפונקציה עולה / יורדת / קבועה") | |
| נקודת קיצון | **no snapshot** | function-change only links to a separate module "נקודות קיצון" (grade-7/chapter-10/extreme-points), which isn't saved. reading-graphs uses "נקודת שיא". Level 17 names the peak but cites only function-change and reading-graphs. |
| (systems) | "פתרון יחיד", "אין פתרון", "אינסוף פתרונות" (solution-counts-systems) | Use these exact words in level 16 feedback. |

Hint lines in `levels.ts` use these terms and never state an equation (`tests/levels.test.ts` checks for `y =`, `m =`, `b =`).
