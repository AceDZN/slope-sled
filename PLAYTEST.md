# Playtest: what was verified, what wasn't

Automation can't tell whether the game is fun or whether kids learn from it. Nothing below claims either. Those questions need real students.

## How it was tested

- **Unit tests** (`npm test`, 110 tests, about 1 s):
  - The math core: lines, systems, track joints, inequalities, the ride, and the generator.
  - Every authored level is brute-forced over its dial grid, so the solution sets in `LEVELS.md` are exact.
  - 66 advertised wrong answers each fail with the expected hazard or stall.
  - Constant strategies fail ("always m = −1" wins only level 1's button choice; "always −0.5" wins levels 1 and 4; the dials' starting values win nothing).
  - The fog never reaches a gate.
  - Build-view stubs don't move when the lines change, so there's no joint leak.
  - Explanations, minus signs and star rules.
  - Fresh generated runs are solvable and narrow, and "always m = −1" fails them.
- **Browser** (headless Chromium via Playwright; the in-app pane couldn't repaint without a visible window):
  - `scripts/drive.mjs` drives the game with real clicks and keys plus deterministic `advanceTime`.
  - `scripts/play-all.mjs` plays every level against the production build using key presses only, rides the verified solution, and saves a build and result screenshot per level.
- **Independent playtester helper:** about 35 headless runs. Notes and 65 screenshots are in `docs/playtest/` (`PLAYTEST_NOTES.md`).

## Every level ridden in the browser (production build, key presses only)

`scripts/play-all.mjs` on `npm run build` + `npm run preview` set each editable dial with ↑/↓/←/→ (or digit / option keys), pressed Enter and waited for the result card. All 18 levels reach the hut with the verified solution. Ride times are in sim seconds:

| L | Track ridden | Ride (s) |
|---|---|---|
| 1 | y = −0.5x + 20 | 6.34 |
| 2 | y = −0.75x + 24 | 5.14 |
| 3 | y = −x + 20 · y = 4 · y = 0.25x − 5 | 9.63 |
| 4 | y = −0.5x + 24 | 6.34 |
| 5 | y = −0.75x + 18 | 4.28 |
| 6 | y = −0.5x + 20 | 6.34 |
| 7 | y = −0.5x + 24 | 4.54 |
| 8 | y = −1.5x + 18 | 3.00 |
| 9 | y = −x + 30 (given) · y = −0.5x + 20 | 5.63 |
| 10 | y = −0.4x + 22 | 6.76 |
| 11 | y = −0.5x + 13 | 3.83 |
| 12 | y = −0.75x + 10 · y = 0 (given) | 4.48 |
| 13 | y = −0.5x + 24 (given) · y = −2x + 40 · y = 0 | 5.72 |
| 14 | y = −x + 18 (given) · y = −0.2x + 18 | 5.62 |
| 15 | y = −1.25x + 32 · y = −0.5x + 20 (given) | 5.22 |
| 16 | races: y = −0.75x + 16 · y = −0.75x + 18 · y = −0.5x + 18 | 3.8 / 4.3 / 4.54 |
| 17 | y = −x + 20 · y = 8 · y = 0.5x − 2 · y = −x + 40 | 6.88 |
| 18 | y = −0.75x + 30 · y = −0.25x + 20 · y = −x + 44 (given) · y = −0.25x + 17 | 6.61 |

This run also caught a real UI bug. Level 16's b options were shown as a −/+ stepper over an unsorted list, so "+" could lower b. b options are now chips, and stepping always goes in value order.

## Verified working (observed in real gameplay)

- **First 30 seconds, level 1:**
  - −½ rides to the lodge (40, 0) in about 6.3 s of sim time for 3 stars, with snow spray and the dog.
  - 0 coasts to a stop at x ≈ 11.5 with the flat-slope sentence.
  - +½ stops at x ≈ 1.3 and slides back with the "positive slope = climbing as x grows" sentence.
- **Level 2 acceptance:** +0.75 refuses to climb (stops at x ≈ 0.9, slides back) with a worked explanation. −1.35 (the run ÷ rise mistake) hits the ice wall at x = 16, and the card now shows Δy and Δx from the start.
- **Hint loop:** the hint costs a star, highlights the two points or the boundary and shows one sentence. It never gives the equation. Retrying after a hint succeeds with fewer stars.
- **Misconception consequences:**
  - Level 3: a +0.5 ramp stalls about halfway up; all −1 leaves a parallel-lines gap.
  - Level 11: rocks failure, explained at the worst point.
  - Level 12: m = −0.5 touches the strict ice bridge ("לא לגעת").
  - Level 13: reversing the inequality triggers the avalanche.
  - Level 16: one-solution, no-solution and infinitely-many outcomes, worded as in Workbook.
- **Level 18:** the authored answer rides in 6.6 s for 3 stars, at dusk, with no hint button.
- **Progression:** stars save; L1–5 in one session unlocks L6 and the World 1 fresh run. The 3D trail map shows the saved stars, and the kid waits at the current flag.
- **Controls:** pause freezes ride time and resume continues. Mute works (button and M key). Reduced motion persists and turns off slow motion and camera shake.
- **Hebrew and RTL:** every number, equation and inequality renders LTR, with the minus sign first and `x = 16` unflipped. Terms match the Workbook snapshots.
- **Mobile (390×844):** the panel becomes a bottom sheet, and you can build and ride.

## Found by the playtester, then fixed

| Priority | Finding | Fix |
|---|---|---|
| P0 | The live `x ∈ [a, b]` readout (and the fog stubs that start at the joint) showed where the lines cross, so levels 9/13/15/17/18 could be solved by stepping the dial. | Readouts and stubs show the nominal stretch only; given segments draw their nominal stretch in build view. A regression test checks this. |
| P1 | The slope slider ran right-to-left (RTL inheritance), feeding the sign misconception. | `dir="ltr"` on the slider. |
| P1 | Restart on a fresh run crashed (`no level 101`). | Restart reloads the generated level itself. |
| P1 | The default wrong answer (flat) was a 10-second crawl. | While the sled crawls (< 1.6 m/s, not downhill), the visuals fast-forward ×5. The outcome is unchanged. |
| P1 | The "x → גדל משמאל לימין" caption was covered by the finish label. | Moved under the axis end. |
| P1 | The level 16 result said "מקטע" instead of "מרוץ". | Fixed. |
| P1 | Explanations didn't name the misconception. | Added: Δy/Δx from the start on gate misses (run ÷ rise), a parallel-means-same-slope tip on sloped boundaries, a slope-sign tip on level 17 gaps, and "the crossing point is the system's solution" on joint gaps. |
| P1 | Mobile HUD collisions. | Smaller GO button moved right; altitude card, speedometer and ride buttons resized. |
| P2 | Level 17 card names (יורדת / קבועה / עולה) gave away the signs. | Renamed to קטע א׳–ד׳. |
| P2 | Fresh-run header said "שלב 101"; `render_game_to_text` kept the previous ride and dropped `<`. | Fixed (❄ header, state cleared on load, math HTML escaped). |

## Known limits (not fixed)

- **Level 16 race 1** can be brute-forced in a few rides: two slope options, and either b wins. It's acceptable for a "spot the parallel line" race, but not much of a computation.
- **Inequality windows** (levels 11–14, segment 2 of 18) accept several values by design, so ±1-step neighbours can also win there.
- **Level 8** rides only about 3 s (the handoff fixes both its points).
- **Mobile:** the grid uses about a third of a phone screen; playable but small.
- **Look:** the title screen is plain (camera on the start tower). Summit flags crowd together on the trail map. The kid rides seated, not prone. The dog uses a sped-up walk cycle.
- **Not measured:**
  - FPS: headless WebGL here is software-rendered, so no frame rate was measured on a real GPU.
  - Real touch hardware.
  - Screen readers beyond aria-labels on the controls.
- **Fun and learning:** not measured. They need classroom playtests.
