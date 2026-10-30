# Slope Sled — progress

## 2026-10-30

- **Repo:** created at `/Users/acedzn/dev/AceDZN-exp/slope-sled` on `main` with the handoff docs in `docs/handoff/`. **GitHub repo not created yet:** Claude Code's auto-mode permission check blocked `gh repo create AceDZN/slope-sled --public --source . --push` twice ("Create Public Surface"). Everything is committed locally and ready to push once the user approves or runs that command.
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

## Verification environment notes

- The in-app browser pane isn't visible while this session has no window, so `requestAnimationFrame` doesn't run and pane screenshots are stale. All gameplay captures come from headless Chromium via Playwright (`scripts/drive.mjs`, `scripts/play-all.mjs`), using real clicks and keys plus `advanceTime`.
- Headless WebGL here is software-rendered, so FPS was not measured. Bundle: 766 kB JS (203 kB gzip); `dist/` is 6.9 MB including the 5.2 MB of models.

## Open / next

- Push to GitHub once the user approves the public repo.
- The dog has no real run cycle (it uses a sped-up walk).
