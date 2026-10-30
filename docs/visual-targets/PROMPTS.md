# Visual targets — prompts and provenance

These are **design targets generated before any game code**, not evidence of the implemented game. Copy the layout, camera, silhouettes and HUD hierarchy, not the generated text or the exact numbers.

- **Route:** ChatGPT in the user's Chrome (Route A), ChatGPT image generation, one chat for all five images (each prompt asks for "same game and same art style" so the set stays consistent).
- **Chat URL:** https://chatgpt.com/c/6ae506e8-6a0c-83ed-9dd9-dd05c743cc3a
- **Date:** 2026-10-30
- **Output size:** 1672 × 941 PNG (ChatGPT's 16:9 output; 1536 × 1024 was not offered as an option)
- **Downloaded via** the image viewer's download button, then moved from `~/Downloads` (original download filenames listed per image).

| File | Attempts | SHA-256 |
| --- | --- | --- |
| `01-first-30s.png` | 1 | `d41b8e1a959d4f268607b624e3913363fa81fd086d991480892e09da35628ed8` |
| `02-build-midplay.png` | 1 | `f17b79bffa5a708a62c3b6f060b4b120ece9e25c724c838b23f1bdbc95554c53` |
| `03-ride.png` | 1 | `fdfddb12cdab89a38a59c1abf62f0d06a563f2a8b4f7a7bcfd3a1917a2a5832c` |
| `04-wipeout.png` | 1 | `7637fc37f5b536fed6f7d015306e60532da71552e832c202f602f38bd69964df` |
| `05-level-select.png` | 1 | `82057a296f19ec37f34d667b285de12a754eaf7e95f83a0b7b6e96b0db13ed41` |

---

## 01-first-30s.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-30. Attempts: 1. Download name: `Snowy Sledding Puzzle Level.png`.

**Prompt (exact):**

> Generate an image, landscape 16:9 (1536x1024): an in-game screenshot of a polished 3D browser game called "Slope Sled" (Hebrew title מזחלת השיפוע). Stylized, bright, premium indie look like Lonely Mountains: Downhill meets Alto's Adventure, with real 3D depth, soft global lighting, hard winter sun, long blue shadows on powder. NOT a worksheet, NOT flat vector art. Scene: Level 1 build view. A cinematic, slightly elevated side camera (three-quarter perspective, not flat 2D) looks at a cut-away slice of a snowy Mount Hermon slope, deep blue sky, dark pine stands, distant cable-car pylons. Floating over the slope is a glowing cyan-white coordinate grid with axis labels: x-axis 0 to 40 growing left to right with a small 'x →' arrow, y-axis 0 to 20 on the left. At the top-left grid point (0, 20) a cute kid in a puffy orange jacket and knit hat sits on a red wooden sled next to a fluffy cream-colored dog. At the bottom-right point (40, 0) stands a cozy red-roofed wooden ski lodge. A glowing dashed cyan preview line runs from the sled toward the lodge. Hebrew right-to-left game HUD: a top bar with the level name 'שלב 1: הירידה הראשונה' on the right, three empty star outlines, and round pause and mute icons on the left. At the bottom center: three big chunky glossy 3D slope buttons labeled '−½', '0', '+½', and on the bottom right a big round orange GO button labeled 'סע!'. Chunky rounded UI with soft drop shadows, white and navy panels, readable at a glance. Exciting, inviting, something a 13-year-old would want to play.

**What's off:**
- The grid lies on the tilted slope plane (receding in perspective) rather than standing as a vertical plane in front of a cut-away slice; the game should keep the grid a readable, nearly camera-facing plane so the axes stay legible.
- No visible cut-away cross-section edge of the slope (it reads as a hillside, not a sliced diorama).
- Hebrew text is correct here ("שלב 1: הירידה הראשונה", "בחר את השיפוע לקטע הבא:", "סע!"), but the colon placement in "בחר את השיפוע לקטע הבא:" is visually flipped to the left — check bidi in the real UI.

## 02-build-midplay.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-30. Attempts: 1. Download name: `Snowy Slope Equation Challenge.png`.

**Prompt (exact):**

> Great. Now a second, separate image in the same game and same art style, landscape 16:9: an in-game screenshot of the 'Rock Garden' build mode, mid-play. Same cinematic slightly elevated side camera looking at a cut-away slice of a rocky snowy Mount Hermon slope with dark pines, deep blue sky, hard winter sun and long blue shadows; real 3D depth and lighting, not flat vector art. The glowing cyan-white coordinate grid floats over the slope (x 0 to 40 left to right, y 0 to 20). Obstacles: a cluster of snow-capped dark basalt rocks with a translucent coral-red shaded region beneath a dashed boundary line labeled 'y ≥ 4' (danger zone); a hanging snowy pine branch above the track with a translucent ice-blue shaded region and dashed boundary. The kid in an orange puffy jacket on a red wooden sled with a fluffy cream dog waits at the top-left start. Two glowing track segments in different colors (yellow segment 1 and magenta segment 2) with small numbered circular tags; segment 2 is solid and bright only for its first short part, then fades into drifting white mist/fog so the rest of the line is hidden. Hebrew right-to-left HUD: on the right side a tall rounded navy-and-white panel titled 'מקטעים' with stacked segment cards; each card has a colored number tag, a left-to-right equation like 'y = −0.5x + 13' in a monospace math font, a round knob dial labeled 'm' showing −0.5, a 'b' stepper with big − and + buttons showing 13, and the interval 'x ∈ [0, 16]'. Top bar: level name 'גן הסלעים 3-2' on the right, three stars, a round hint button with a lightbulb icon, pause and mute on the left. Bottom left: big round orange GO button 'סע!'. Chunky, polished, premium game UI that a 13-year-old would want to play.

**What's off:**
- Math is not consistent: segment 1 is drawn starting at y = 20 although the card says `y = −0.5x + 13`; the joint sits near x = 20 although the interval says `[0, 16]`. The real game draws lines from authoritative state.
- The rock region is labelled `y ≥ 4` on the coral zone itself (the label should describe the constraint the track must satisfy, placed at the boundary); the branch zone was invented as `y ≤ 18`.
- Level number "3-2" was dropped from the title; Hebrew "גן הסלעים", "מקטעים", "הוסף מקטע +" are correct.
- Segment 2's fog reads well (solid start, dashed then lost in mist) — keep this.

## 03-ride.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-30. Attempts: 1. Download name: `Mountain Sled Race Adventure.png`.

**Prompt (exact):**

> Excellent. Third separate image, same game and same art style, landscape 16:9: an in-game screenshot of RIDE mode. Low chase camera just behind and slightly above the kid in the puffy orange jacket and knit hat, lying forward on the red wooden sled, racing downhill at high speed along a glowing ribbon of packed snow track that bends down the mountain through dark snowy pines. Strong sense of speed: radial motion-blur speed lines at the screen edges, a big plume of powder spray and sparkles kicked up from the sled runners, the fluffy cream dog sprinting alongside with ears flapping. Cable-car pylons and a red gondola overhead, deep blue sky, hard low winter sun with lens flare and long blue shadows; real 3D depth, stylized like Lonely Mountains: Downhill meets Alto's Adventure, not flat vector art. No coordinate grid in this view. Hebrew right-to-left racing HUD: top right a small level name and three stars; top left pause and mute; bottom left a round speedometer gauge with a needle and big number '42' and 'קמ"ש'; top center a compact mini altitude graph card showing a piecewise straight-line track profile (three line segments in yellow, magenta and cyan) with a glowing dot marking the sled position; bottom right three big round touch buttons with icons and Hebrew labels: 'התכופף' (tuck, arrow-down icon), 'הטה' (lean, curved arrows icon), 'טריק' (trick, star icon). Thrilling, juicy, the moment a 13-year-old says 'whoa'.

**What's off:**
- The mini altitude graph is a smooth curve, not straight piecewise segments — the real graph must show the actual straight lines with visible joints.
- Speedometer tick labels are duplicated ("60" twice).
- The track is a curving, banked road with fences and chevron signs; the game track is a straight-segment ribbon in a vertical plane, so expect straighter runs and kinks at joints (the chevrons and fences are a nice touch for speed reads though).
- Hebrew labels ("התכופף", "הטה", "טריק", "קמ\"ש", "גן הסלעים 3-2", "גובה (מ')") are correct.

## 04-wipeout.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-30. Attempts: 1. Download name: `Snowy Sled Crash Replay UI.png`.

**Prompt (exact):**

> Perfect. Fourth separate image, same game and same art style, landscape 16:9: an in-game screenshot of the WIPEOUT replay after a wrong line. Side camera like the build view, frozen slow-motion moment: the kid in the orange puffy jacket is comically flying head-first off the red wooden sled into a big snowbank right next to a snow-capped basalt rock, a huge cartoon explosion of snow powder and flying knit hat, the sled tumbling in the air, the fluffy cream dog nearby with a shocked wide-eyed face. Funny and slapstick, not harsh or painful. The glowing cyan coordinate grid has faded back in, semi-transparent. The offending track segment 3 glows coral-red with a pulsing outline and a vertical dashed marker line at x = 16 with a pin labeled 'x = 16', showing the track at height 3 just below the top of the rock at height 4; the other segments are dim. Subtle film-replay vignette and a small 'REPLAY ◀◀' style badge in Hebrew 'הילוך חוזר'. On the right a rounded Hebrew right-to-left results card (navy and white, chunky) with a funny title 'אופס! נתקעת בסלע', one worked explanation line with left-to-right math 'x = 16: מסלול 3 → y = 3, סלע → y = 4', a small hint line, and two big buttons: an orange 'נסה שוב' retry button with a circular-arrow icon and a smaller 'רמז' hint button with a lightbulb. Top bar with level name, stars, pause and mute. Real 3D depth, hard winter sun, long blue shadows, Lonely Mountains: Downhill meets Alto's Adventure, not flat vector art.

**What's off:**
- The `x = 16` marker sits at grid x ≈ 20, and the `y = 3` / `y = 4` points are not on that vertical line — the real replay must place the marker and both heights exactly.
- The card's first line renders as "ב-16 = x:" — an RTL bidi flip of the math, exactly the bug the game must avoid (wrap math in LTR spans).
- Arrow directions in "y = 3 → מסלול 3" are flipped relative to the prompt; the card is otherwise a good hierarchy (title, two-line worked comparison, short hint, big retry + small hint button).
- The kid flies into the rock rather than a snowbank beside it; tone is still funny, not harsh.

## 05-level-select.png

- Route: ChatGPT in user's Chrome. Chat URL above. Date 2026-10-30. Attempts: 1. Download name: `Snowy Sledding Mountain Map.png`.

**Prompt (exact):**

> Love it. Fifth separate image, same game and same art style, landscape 16:9: an in-game screenshot of the LEVEL SELECT screen. A gorgeous 3D miniature-feeling trail map of snowy Mount Hermon seen from above at a 45-degree angle, with real depth, soft lighting and long blue shadows. A winding glowing snow trail climbs from the bottom to the summit through four themed zones, each with a big Hebrew world title banner on a wooden sign: 'גבעת המתחילים' (gentle bunny hill with a tiny rope tow and snowmen), 'יער האורנים' (dense dark pine forest), 'גן הסלעים' (snow-capped basalt rocks), 'השבילים התאומים' (two parallel trails splitting and rejoining near the summit). Along the trail stand 18 small numbered pennant flags 1 to 18; the first 7 flags have three or fewer gold stars beneath them, flag 8 is the current one with a bouncing pulse and the tiny kid in an orange jacket on a red sled with the fluffy cream dog standing next to it, and flags 9 to 18 have small padlock icons and are slightly greyed. Cable-car line with red gondolas crossing the map, red-roofed ski huts, puffs of chimney smoke. Cozy ski-hut themed Hebrew right-to-left UI: a top-right wooden plank header with the title 'מזחלת השיפוע' and a total star counter '17 ★', a top-left settings gear and mute button, and a bottom-right big orange 'שחק' play button. Polished, inviting, premium mobile-game level map that a 13-year-old would want to explore, not flat vector art.

**What's off:**
- Flag numbering is broken: "5" and "12" appear twice, "9" is a faint ghost, and the order up the mountain is jumbled; the twin-trail split near the summit is not shown.
- World signs are not aligned with their flag ranges (the pine-forest sign sits beside flags 7–8 on the right, the rock-garden sign on the left beside 9). The real map must place each world's sign at the start of its own flag run.
- Hebrew titles ("מזחלת השיפוע", "גבעת המתחילים", "יער האורנים", "גן הסלעים", "השבילים התאומים", "שחק") are correct.
