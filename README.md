# Slope Sled — מזחלת השיפוע

A real-3D web math game for Hebrew-speaking students in grades 7–9 (Israeli Ministry of Education curriculum as published on [Workbook](https://math.workbook.co.il/grade-8/chapter-1/slope-meaning)).

It's a snow day on Mount Hermon. You build a sled run out of straight lines `y = mx + b`, hit **סע!**, and ride it in 3D with your dog beside you. A negative slope rockets you downhill, a zero slope coasts to a stop, and a positive slope climbs and stalls. Gates are coordinate points, rocks and branches are linear inequalities, and joints between pieces are the intersection of two lines. Wrong math means a slow-motion wipeout with a one-line worked explanation.

- 18 authored levels in 4 worlds: Bunny Hill (slope), Pine Forest (free term and the equation of a line), Rock Garden (inequalities), and Twin Trails (systems and graph reading). Each world ends with a transfer level, and the last level is a no-hint final.
- Tripo models: a rigged kid sledder (idle / sit / cheer / fall), a rigged dog (walk cycle), sled, ski hut, pines, rocks and a cable-car pylon. See [ASSETS.md](ASSETS.md).
- Hebrew RTL UI with LTR equations. The x-axis still grows left → right, and the grid says so.
- A 3D trail-map level select on the mountain, with stars saved in `localStorage`. After a world's transfer level, "❄ ריצה חדשה" generates fresh runs that a solver has checked.

**Implemented:** everything above. **Not implemented / planned:** a real dog run cycle (Tripo offered only walk for the quadruped rig), a belly-down riding pose, and classroom playtests. See [PLAYTEST.md](PLAYTEST.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5215
npm test           # level solvers + math core
npm run build      # static build in dist/ (relative base, works offline)
npm run preview    # http://localhost:4215
```

## Controls

| Mode | Keyboard | Touch / mouse |
|---|---|---|
| Build | ↑/↓ slope m by 0.05 (Shift ×5) · →/← free term b by 0.5 · Tab / 1–4 select segment · Enter = GO · H hint · R restart | m knob (drag), − / + steppers (hold to repeat), slider, segment cards, big slope buttons on tutorial levels |
| Ride | Space/↓ tuck · ←/→ lean (collect ❄) · ↑ or X trick in the air | התכופף (hold) · הטה · טריק buttons |
| Anywhere | Esc/P pause · M mute | pause / mute buttons; pause menu has sound and reduced-motion toggles |

Steering, tuck and tricks only affect style (snowflakes, tricks). They never change whether a track works. That is decided by the pure math modules in `src/math/`.

## How it's built

- TypeScript + Vite + Three.js (one WebGL canvas, shadows, ACES tone mapping). There is no physics engine: the ride is a deterministic pure-TS energy model (`src/math/ride.ts`).
- Pure, rendering-free math: `line.ts` (lines, systems), `track.ts` (segments cut at intersections, joint gaps, fog preview), `judge.ts` (gates, inequalities, races, finish), `ride.ts` (physics), `levels.ts` (authored levels). Tests are in `tests/`.
- The scene only renders state: `src/scene/` (world, course, characters, fx, labels) and `src/game/` (controller, explanations, progress).
- Test hooks: `window.render_game_to_text()` (JSON of level, segments, objects, ride and outcome) and `window.advanceTime(ms)` (deterministic fixed steps, respects pause). `scripts/drive.mjs` drives the game headlessly with real clicks and keys and saves screenshots.
- Progress (stars, snowflakes, settings) and anonymous learning events live in `localStorage` only.
- The canvas fills its container (`#game`), so the game can live inside a site header and footer at any size.

## Deploy (Vercel, when asked)

This is a static site. On Vercel, import the repo with framework preset **Vite**, build command `npm run build` and output directory `dist`. Or run `npx vercel --prod` from the repo root. No environment variables are needed, and nothing is fetched at runtime.

## Docs

[GAME_IDENTITY.md](GAME_IDENTITY.md) · [LEVELS.md](LEVELS.md) · [CURRICULUM.md](CURRICULUM.md) · [ASSETS.md](ASSETS.md) · [docs/VISUAL_REVIEW.md](docs/VISUAL_REVIEW.md) · [PLAYTEST.md](PLAYTEST.md) · [progress.md](progress.md) · design brief in [docs/handoff/](docs/handoff/) · mockups in [docs/visual-targets/](docs/visual-targets/)
