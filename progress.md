# Slope Sled — progress

## 2026-10-30

- **Repo:** created at `/Users/acedzn/dev/AceDZN-exp/slope-sled` on `main` with the handoff docs in `docs/handoff/`. Auto mode's permission check blocked `gh repo create` twice, so the user created the public repo [AceDZN/slope-sled](https://github.com/AceDZN/slope-sled) themselves on 2026-10-31. All work is pushed to `main`.
- **Mockups (step 1, before game code):** 5 gameplay targets from ChatGPT in the user's Chrome, one fresh chat, one attempt each. They're in `docs/visual-targets/`, with prompts in `PROMPTS.md`. The pure math modules were written in parallel; no scene or UI code existed before the mockups arrived.
- **Tripo (step 2):**
  - 7 models in `public/models/`: a rigged kid sledder (idle / sit / cheer / fall), a rigged dog (walk only, since Tripo's quadruped rig has no run preset and the AI run failed), sled, hut, rock, pylon, and a gallery pine.
  - Budget: 7 of 8 generations and 3 of 3 rig/animation jobs used. Details in `ASSETS.md`.
- **Core:** pure TS modules `line`, `track`, `judge`, `ride`, `format`, `generate` and `levels`. The ride is a deterministic energy model; player input never changes the outcome.
- **Level 1 proven end-to-end** in a real (headless) browser with real inputs:
  - −½ rides to the lodge in 6.3 s of sim time.
  - 0 coasts to a stop.
  - +½ refuses to climb and slides back, followed by a worked explanation.
- **All 18 levels** were authored and solver-verified by the level-design helper. See `LEVELS.md`, `CURRICULUM.md` and `tests/levels.test.ts`.
- **Replay:** "ריצה חדשה" generates a fresh, solver-verified run per world. It unlocks after the world's transfer level. Generated runs have 1–5 solutions, and "always m = −1" fails them.
- **Visual review** against the mockups: `docs/VISUAL_REVIEW.md`, with captures in `docs/visual-review/`. Fixed during the review:
  - Explanations now cite the worst point.
  - The branch pine moved behind the course.
  - The kid and dog use a hero scale in the build view.
  - Open sky and Hermon peaks.
  - Table and coach-graph cards docked at the bottom.
  - Level select rebuilt as a 3D trail map.
- **Independent playtest:** about 35 headless runs; findings are in `docs/playtest/PLAYTEST_NOTES.md`. The P0 joint leak (live interval readout and fog stubs) and every P1 were fixed. Remaining limits are listed in `PLAYTEST.md`.

## 2026-10-31: AAA polish pass (user: "treat it like a AAA steam game")

- **Look:**
  - Ice-cliff grid board.
  - Noise terrain, Hermon massif and clouds.
  - Bloom and a color grade, with automatic fallback to plain rendering when frames are slow.
  - Groomed track with berms and rails.
  - Static props simplified, so per-frame triangles roughly halved.
- **Fun:**
  - A finish kicker hop with a trick on every successful run.
  - A style score with a personal best per level.
  - Procedural music that gets busier while riding.
- **Learning and progression:**
  - Illustrated lesson cards for each new concept (11 cards). The examples avoid level answers.
  - Difficulty tags on every level and a legend on the map.
  - A world-cleared banner that names the next world's subject.
  - A per-world **expert** tier: generated, solver-checked, no hints, harder setups.
  - **Practice** runs on the world signs.
- **Failure replay:** frames the whole grid beside the card. For joint gaps it draws both lines to their true crossing.
- **QA:** every level ridden with its verified answer *and* a deliberate wrong answer, through key presses on the production build. All right answers succeed. Wrong answers fail with matching explanations; the exceptions are window levels, where a +1-step change can stay inside the window (by design).

## 2026-10-31: playtest round 2 fixes

- **Answer leaks closed:**
  - Wide, unlabeled landings on the window levels.
  - Redesigned expert runs (uneven table, joint on the bolt, ridge and cornice, ghost line read from its graph).
  - Practice world 4 now needs the dog's equation.
  - On no-hint levels the replay stops at the failure point.
  - Tips no longer quote the level's numbers.
- **Map:**
  - One terrace per world; overlaps measured at none by `scripts/map-overlaps.mjs`.
  - A phone list with practice and expert.
  - A summit finale after level 18.
- **Look:**
  - Title attract mode and higher-contrast light.
  - A glacier-ice grid board and sprite fog.
  - Ride-only landing ledges and slabs that fade in the chase camera.
  - Alpenglow dusk and a time of day per world.
- **QA:** re-run on the production build. All 18 levels pass, and every wrong answer fails with a matching explanation (apart from the window levels, by design).

## Verification environment notes

- The in-app browser pane isn't visible while this session has no window, so `requestAnimationFrame` doesn't run and pane screenshots are stale. All gameplay captures come from headless Chromium via Playwright (`scripts/drive.mjs`, `scripts/play-all.mjs`), using real clicks and keys plus `advanceTime`.
- Headless WebGL here is software-rendered, so FPS was not measured. Bundle: 776 kB JS (206 kB gzip); `dist/` is 6.9 MB including 5.6 MB of models.

## Open / next

- The dog has no real run cycle (it uses a sped-up walk).
