// Level proofs: every authored level is solved by brute force over its real dial grid through the real ride physics,
// the solution set is exactly the documented one, advertised wrong answers fail the advertised way, constant strategies
// and fog-eyeballing don't win, and the data stays on a readable grid.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, levelById } from '../src/math/levels.ts';
import { judge, type HazardKind } from '../src/math/judge.ts';
import { simulateRide } from '../src/math/ride.ts';
import { buildTrack, fogVisibleRange, FOG_FRACTION } from '../src/math/track.ts';
import type { ParamSpec, StageParams, StageSpec } from '../src/math/types.ts';

// ───────────── solver helpers ─────────────

const r6 = (v: number) => Number(v.toFixed(6));

/** Every value the player can actually set for a param. */
function grid(p: ParamSpec): number[] {
  if (p.fixed !== undefined) return [p.fixed];
  if (p.choices) return [...p.choices];
  const out: number[] = [];
  const n = Math.round((p.max! - p.min!) / p.step!);
  for (let i = 0; i <= n; i++) out.push(r6(p.min! + i * p.step!));
  return out;
}

function initialOf(p: ParamSpec): number {
  if (p.fixed !== undefined) return p.fixed;
  if (p.initial !== undefined) return p.initial;
  if (p.choices) return p.choices[0];
  return p.min!;
}

interface Axis {
  seg: number;
  key: 'm' | 'b';
  vals: number[];
}

function axesOf(st: StageSpec): Axis[] {
  const axes: Axis[] = [];
  st.segments.forEach((s, i) => {
    for (const key of ['m', 'b'] as const) {
      const vals = grid(s[key]);
      if (vals.length > 1) axes.push({ seg: i, key, vals });
    }
  });
  return axes;
}

/** Params with every editable value at `base` except the overrides. */
function withValues(st: StageSpec, base: StageParams, axes: Axis[], values: number[]): StageParams {
  const p = base.map((q) => ({ ...q }));
  axes.forEach((ax, a) => {
    p[ax.seg][ax.key] = values[a];
  });
  return p;
}

function fixedParams(st: StageSpec): StageParams {
  return st.segments.map((s) => ({ m: initialOf(s.m), b: initialOf(s.b) }));
}

/** A win = clean geometry and the ride reaches the finish. */
function wins(st: StageSpec, p: StageParams): boolean {
  return judge(st, p).first === null && simulateRide(st, p).ok;
}

/** All winning value tuples (one value per editable axis), full brute force. */
function bruteForce(st: StageSpec): number[][] {
  const axes = axesOf(st);
  const base = fixedParams(st);
  const total = axes.reduce((a, x) => a * x.vals.length, 1);
  assert.ok(total <= 20000, `stage ${st.id}: ${total} combos is too many for full brute force`);
  const sols: number[][] = [];
  const idx = axes.map(() => 0);
  for (let c = 0; c < total; c++) {
    let r = c;
    for (let a = 0; a < axes.length; a++) {
      idx[a] = r % axes[a].vals.length;
      r = Math.floor(r / axes[a].vals.length);
    }
    const values = axes.map((ax, a) => ax.vals[idx[a]]);
    if (wins(st, withValues(st, base, axes, values))) sols.push(values);
  }
  return sols;
}

const fmt = (vals: number[][]) => vals.map((v) => `(${v.join(', ')})`).join(' ');

function range(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(r6(v));
  return out;
}

// ───────────── authored answers (see LEVELS.md) ─────────────

/** Canonical solution per stage (full params, given/fixed values included). */
const CANON: Record<string, StageParams> = {
  '1': [{ m: -0.5, b: 20 }],
  '2': [{ m: -0.75, b: 24 }],
  '3': [{ m: -1, b: 20 }, { m: 0, b: 4 }, { m: 0.25, b: -5 }],
  '4': [{ m: -0.5, b: 24 }],
  '5': [{ m: -0.75, b: 18 }],
  '6': [{ m: -0.5, b: 20 }],
  '7': [{ m: -0.5, b: 24 }],
  '8': [{ m: -1.5, b: 18 }],
  '9': [{ m: -1, b: 30 }, { m: -0.5, b: 20 }],
  '10': [{ m: -0.4, b: 22 }],
  '11': [{ m: -0.5, b: 13 }],
  '12': [{ m: -0.75, b: 10 }, { m: 0, b: 0 }],
  '13': [{ m: -0.5, b: 24 }, { m: -2, b: 40 }, { m: 0, b: 0 }],
  '14': [{ m: -1, b: 18 }, { m: -0.2, b: 18 }],
  '15': [{ m: -1.25, b: 32 }, { m: -0.5, b: 20 }],
  '16a': [{ m: -0.75, b: 20 }],
  '16b': [{ m: -0.75, b: 18 }],
  '16c': [{ m: -0.5, b: 18 }],
  '17': [{ m: -1, b: 20 }, { m: 0, b: 8 }, { m: 0.5, b: -2 }, { m: -1, b: 40 }],
  '18': [{ m: -0.75, b: 30 }, { m: -0.25, b: 20 }, { m: -1, b: 44 }, { m: -0.25, b: 17 }],
};

/** Exact solution sets over the editable axes (in axesOf order) for stages small enough to brute force. */
const SOLUTIONS: Record<string, number[][]> = {
  '1': [[-0.5]],
  '2': [[-0.75]],
  '3': [[-1, 0, 0.25]],
  '4': [[-0.5]],
  '5': [[-0.75, 18]],
  '6': [[20]],
  '7': [[-0.5, 24]],
  '8': [[18]],
  '9': [[20]],
  '10': [[-0.4, 22]],
  '11': range(12, 14, 0.5).map((b) => [b]),
  '12': range(-0.95, -0.55, 0.05).map((m) => [m]),
  '13': range(39, 42, 0.5).map((b) => [b]),
  '14': range(-0.4, 0.05, 0.05).map((m) => [m]),
  '15': [[-1.25]],
  '16a': range(-1, -0.7, 0.05).map((m) => [m]),
  '16b': [[-0.75, 18]],
  '16c': [[-0.5, 18]],
};

/** Per-segment (m, b) solution sets with all other segments at the canonical answer (stages 17, 18). */
const SEGMENT_SOLUTIONS: Record<string, Array<Array<[number, number]>>> = {
  '17': [[[-1, 20]], [[0, 8]], [[0.5, -2]], [[-1, 40]]],
  '18': [[[-0.75, 30]], [[-0.25, 19.5], [-0.25, 20]], [[-1, 44]], [[-0.25, 17]]],
};

function stageById(id: string): StageSpec {
  for (const l of LEVELS) for (const s of l.stages) if (s.id === id) return s;
  throw new Error(`no stage ${id}`);
}

// ───────────── structure and grid readability ─────────────

const WORKBOOK_SLUGS = new Set([
  'grade-8/chapter-1/constant-rate-change',
  'grade-8/chapter-1/linear-function-representations',
  'grade-8/chapter-1/slope-meaning',
  'grade-8/chapter-1/slope-formula',
  'grade-8/chapter-1/slope-sign-parallel',
  'grade-8/chapter-1/intercepts-and-free-term',
  'grade-8/chapter-1/equation-from-graph',
  'grade-8/chapter-1/equation-from-points',
  'grade-8/chapter-1/linear-models',
  'grade-8/chapter-1/linear-inequality-meaning',
  'grade-8/chapter-1/linear-inequality-solving',
  'grade-8/chapter-7/systems-graphical-solution',
  'grade-8/chapter-7/solution-counts-systems',
  'grade-8/chapter-7/substitution-method',
  'grade-7/chapter-10/graph-representation',
  'grade-7/chapter-10/function-change',
  'grade-7/chapter-10/reading-graphs',
]);

const isHalf = (v: number) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;
const isM = (v: number) => Math.abs(v * 20 - Math.round(v * 20)) < 1e-9 && v >= -3 - 1e-9 && v <= 3 + 1e-9;

test('18 levels in 4 worlds with the handoff flags', () => {
  assert.deepEqual(
    LEVELS.map((l) => l.id),
    Array.from({ length: 18 }, (_, i) => i + 1),
  );
  const worldOf = [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4];
  LEVELS.forEach((l, i) => assert.equal(l.world, worldOf[i], `level ${l.id} world`));
  assert.deepEqual(
    LEVELS.filter((l) => l.transfer).map((l) => l.id),
    [5, 10, 14, 18],
  );
  assert.equal(levelById(10).mood, 'night');
  assert.equal(levelById(18).mood, 'dusk');
  assert.equal(levelById(18).noHints, true);
  assert.ok(levelById(5).stages[0].table, 'level 5 has the guide table');
  assert.ok(levelById(5).stages[0].objects.every((o) => o.kind !== 'gate' || o.hideLabel), 'level 5 gates are unlabeled');
  assert.equal(levelById(10).stages[0].rival?.graphOnly, true);
  assert.equal(levelById(16).stages.length, 3);
  assert.ok(levelById(17).stages[0].shapeGraph);
  assert.equal(levelById(17).stages[0].segments.length, 4);
  assert.equal(levelById(18).stages[0].segments.length, 4);
});

test('Hebrew titles, goals and hints; hints never show an equation', () => {
  const heb = /[֐-׿]/;
  for (const l of LEVELS) {
    assert.ok(heb.test(l.title) && heb.test(l.goal), `level ${l.id} Hebrew title/goal`);
    for (const m of l.modules) assert.ok(WORKBOOK_SLUGS.has(m), `level ${l.id}: unknown module ${m}`);
    assert.ok(l.modules.length > 0);
    for (const st of l.stages) {
      if (l.noHints) {
        assert.equal(st.hint, undefined, `level ${l.id} must have no hint`);
        continue;
      }
      assert.ok(st.hint && heb.test(st.hint.text), `level ${l.id} stage ${st.id} needs a Hebrew hint`);
      assert.doesNotMatch(st.hint.text, /y\s*=|m\s*=|b\s*=/, `level ${l.id} hint gives an equation`);
      for (const id of st.hint.boundaries ?? []) assert.ok(st.objects.some((o) => o.id === id), `hint boundary ${id}`);
    }
  }
});

test('all numbers sit on a readable grid (integers or halves; m in 0.05 steps within [−3, 3])', () => {
  for (const l of LEVELS) {
    for (const st of l.stages) {
      const where = `level ${l.id} stage ${st.id}`;
      for (const s of st.segments) {
        assert.ok(isHalf(s.x0) && isHalf(s.x1), `${where} seg ${s.id} interval`);
        for (const v of grid(s.m)) assert.ok(isM(v), `${where} seg ${s.id} m ${v}`);
        for (const v of grid(s.b)) assert.ok(isHalf(v), `${where} seg ${s.id} b ${v}`);
        if (s.m.step !== undefined) assert.equal(s.m.step, 0.05);
        if (s.b.step !== undefined) assert.equal(s.b.step, 0.5);
        for (const p of [s.m, s.b]) if (p.initial !== undefined) assert.ok(grid(p).includes(p.initial), `${where} initial on grid`);
      }
      for (const j of st.joints) assert.ok(isHalf(j.zone[0]) && isHalf(j.zone[1]) && j.zone[0] < j.zone[1], `${where} joint zone`);
      assert.equal(st.joints.length, st.segments.length - 1, `${where} joints`);
      for (const o of st.objects) {
        if (o.kind === 'gate') assert.ok(isHalf(o.x) && isHalf(o.y), `${where} gate ${o.id}`);
        else assert.ok(isM(o.m) && isHalf(o.b) && isHalf(o.x0) && isHalf(o.x1), `${where} constraint ${o.id}`);
      }
      assert.ok(isHalf(st.finish.x) && isHalf(st.finish.y), `${where} finish`);
      if (st.rival) assert.ok(isM(st.rival.m) && isHalf(st.rival.b), `${where} rival`);
      const { x0, x1, y0, y1 } = l.view;
      assert.ok(st.finish.x >= x0 && st.finish.x <= x1 && st.finish.y >= y0 && st.finish.y <= y1, `${where} finish in view`);
      for (const o of st.objects) if (o.kind === 'gate') assert.ok(o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1, `${where} gate in view`);
    }
  }
});

// ───────────── solvability: exact solution sets ─────────────

for (const l of LEVELS) {
  for (const st of l.stages) {
    if (SOLUTIONS[st.id]) {
      test(`level ${l.id} stage ${st.id}: brute force over the dial grid finds exactly the authored solutions`, () => {
        const sols = bruteForce(st);
        assert.equal(fmt(sols), fmt(SOLUTIONS[st.id]));
        assert.ok(wins(st, CANON[st.id]), 'canonical answer rides');
        assert.ok(simulateRide(st, CANON[st.id]).ok);
        // Every member of the set really rides (not only the canonical one).
        for (const v of sols) assert.ok(simulateRide(st, withValues(st, fixedParams(st), axesOf(st), v)).ok);
      });
    } else {
      test(`level ${l.id} stage ${st.id}: per-segment sweeps plus a joint neighbourhood sweep find only the authored answers`, () => {
        const canon = CANON[st.id];
        assert.ok(wins(st, canon), 'canonical answer rides');
        const expected = SEGMENT_SOLUTIONS[st.id];
        st.segments.forEach((s, i) => {
          const found: Array<[number, number]> = [];
          for (const m of grid(s.m))
            for (const b of grid(s.b)) {
              const p = canon.map((q) => ({ ...q }));
              p[i] = { m, b };
              if (wins(st, p)) found.push([m, b]);
            }
          assert.deepEqual(found, expected[i], `segment ${s.id}`);
        });
        // Coarse joint sweep: every editable axis moved by −1, 0 or +1 dial step at once.
        const axes = axesOf(st);
        const center = axes.map((ax) => canon[ax.seg][ax.key]);
        const total = 3 ** axes.length;
        let winners = 0;
        for (let c = 0; c < total; c++) {
          let r = c;
          const values = axes.map((ax, a) => {
            const d = (r % 3) - 1;
            r = Math.floor(r / 3);
            const k = ax.vals.indexOf(center[a]) + d;
            return ax.vals[Math.min(ax.vals.length - 1, Math.max(0, k))];
          });
          if (wins(st, withValues(st, canon, axes, values))) {
            winners++;
            // Any winner in the neighbourhood must be a combination of per-segment answers.
            st.segments.forEach((s, i) => {
              const seg = withValues(st, canon, axes, values)[i];
              assert.ok(expected[i].some(([m, b]) => m === seg.m && b === seg.b), `joint sweep winner off the per-segment sets: ${JSON.stringify(values)}`);
            });
          }
        }
        assert.ok(winners >= 1);
      });
    }
  }
}

// ───────────── advertised wrong answers ─────────────

type Expect = { stall: true; seg?: number; xMin?: number; xMax?: number } | { hazard: HazardKind; x?: number; id?: string; reason?: 'outside' | 'parallel' };

interface Wrong {
  stage: string;
  what: string;
  params: StageParams;
  expect: Expect;
}

const WRONG: Wrong[] = [
  // World 1
  { stage: '1', what: 'flat: coasts to a stop', params: [{ m: 0, b: 20 }], expect: { stall: true } },
  { stage: '1', what: '+½ (sign read right-to-left): slides back', params: [{ m: 0.5, b: 20 }], expect: { stall: true, xMax: 1.5 } },
  { stage: '2', what: '+0.75 (RTL sign): refuses to climb', params: [{ m: 0.75, b: 24 }], expect: { stall: true, xMax: 1.5 } },
  { stage: '2', what: 'run ÷ rise = −16/12 ≈ −1.35: under the gate', params: [{ m: -1.35, b: 24 }], expect: { hazard: 'gate-low', x: 16 } },
  { stage: '2', what: '−0.7: just over the gate', params: [{ m: -0.7, b: 24 }], expect: { hazard: 'gate-high', x: 16 } },
  {
    stage: '3',
    what: '+0.5 ramp: stalls about halfway up',
    params: [{ m: -1, b: 20 }, { m: 0, b: 4 }, { m: 0.5, b: -5 }],
    expect: { stall: true, seg: 2, xMin: 33, xMax: 44 },
  },
  {
    stage: '3',
    what: 'always −1: lake parallel to the drop → gap',
    params: [{ m: -1, b: 20 }, { m: -1, b: 4 }, { m: -1, b: -5 }],
    expect: { hazard: 'gap', x: 16, reason: 'parallel' },
  },
  {
    stage: '3',
    what: 'flat ramp: parallel to the lake → gap',
    params: [{ m: -1, b: 20 }, { m: 0, b: 4 }, { m: 0, b: -5 }],
    expect: { hazard: 'gap', reason: 'parallel' },
  },
  {
    stage: '3',
    what: 'climbing lake (+0.25): joint before the zone → gap',
    params: [{ m: -1, b: 20 }, { m: 0.25, b: 4 }, { m: 0.25, b: -5 }],
    expect: { hazard: 'gap', x: 14, reason: 'outside' },
  },
  { stage: '4', what: '−0.45: drifts up into the bridge', params: [{ m: -0.45, b: 24 }], expect: { hazard: 'branch', id: 'bridge', x: 20 } },
  { stage: '4', what: '−0.55 ("steeper" by the bigger number): into the rocks', params: [{ m: -0.55, b: 24 }], expect: { hazard: 'rocks', id: 'rocks', x: 20 } },
  { stage: '4', what: 'flat: rides into the friend', params: [{ m: 0, b: 24 }], expect: { stall: true } },
  { stage: '4', what: '−0.25: meets the friend’s lane', params: [{ m: -0.25, b: 24 }], expect: { hazard: 'branch', id: 'bridge', x: 12 } },
  { stage: '5', what: '+0.75 (table read right-to-left)', params: [{ m: 0.75, b: 18 }], expect: { stall: true } },
  { stage: '5', what: 'run ÷ rise −4/3 ≈ −1.35', params: [{ m: -1.35, b: 18 }], expect: { hazard: 'gate-low', x: 4 } },
  { stage: '5', what: 'slope right, b = 15 (second table value)', params: [{ m: -0.75, b: 15 }], expect: { hazard: 'gate-low', x: 4 } },
  // World 2
  { stage: '6', what: 'b = 15 (the gate height)', params: [{ m: -0.5, b: 15 }], expect: { hazard: 'gate-low', x: 10 } },
  { stage: '6', what: 'b = 40 (the x-intercept)', params: [{ m: -0.5, b: 40 }], expect: { hazard: 'gate-high', x: 10 } },
  { stage: '6', what: 'b = 20.5 (one notch off)', params: [{ m: -0.5, b: 20.5 }], expect: { hazard: 'gate-high', x: 10 } },
  { stage: '7', what: 'run ÷ rise = −2 (through flag 1 only)', params: [{ m: -2, b: 30 }], expect: { hazard: 'gate-low', x: 12 } },
  { stage: '7', what: 'b = 22 (first flag height)', params: [{ m: -0.5, b: 22 }], expect: { hazard: 'gate-low', x: 4 } },
  { stage: '7', what: '+0.5 (RTL sign)', params: [{ m: 0.5, b: 20 }], expect: { stall: true } },
  { stage: '8', what: 'b = 9 (the cable point’s height)', params: [{ m: -1.5, b: 9 }], expect: { hazard: 'gate-low', x: 6 } },
  { stage: '8', what: 'b = 12 (the x-intercept)', params: [{ m: -1.5, b: 12 }], expect: { hazard: 'gate-low', x: 6 } },
  { stage: '8', what: 'b = 18.5', params: [{ m: -1.5, b: 18.5 }], expect: { hazard: 'gate-high', x: 6 } },
  { stage: '9', what: 'b = 19: misses the hut low', params: [{ m: -1, b: 30 }, { m: -0.5, b: 19 }], expect: { hazard: 'finish-low', x: 40 } },
  { stage: '9', what: 'b = 21: misses the hut high', params: [{ m: -1, b: 30 }, { m: -0.5, b: 21 }], expect: { hazard: 'finish-high', x: 40 } },
  { stage: '9', what: 'b = 18: joint at x = 24, outside → gap', params: [{ m: -1, b: 30 }, { m: -0.5, b: 18 }], expect: { hazard: 'gap', x: 22, reason: 'outside' } },
  { stage: '9', what: 'b = 10 (joint height as b): gap', params: [{ m: -1, b: 30 }, { m: -0.5, b: 10 }], expect: { hazard: 'gap', reason: 'outside' } },
  { stage: '9', what: 'b = 30 (copied from A): gap', params: [{ m: -1, b: 30 }, { m: -0.5, b: 30 }], expect: { hazard: 'gap', x: 18, reason: 'outside' } },
  { stage: '10', what: 'b = 20 (read at x = 5, not x = 0): parallel, never together', params: [{ m: -0.4, b: 20 }], expect: { hazard: 'not-tandem', x: 40 } },
  { stage: '10', what: '+0.4 (RTL sign): crosses the ghost at the start', params: [{ m: 0.4, b: 22 }], expect: { hazard: 'collide', x: 0 } },
  { stage: '10', what: 'run ÷ rise −2.5 → dial min −2: crosses the ghost', params: [{ m: -2, b: 30 }], expect: { hazard: 'collide' } },
  { stage: '10', what: '−0.45: crosses the ghost at the start', params: [{ m: -0.45, b: 22 }], expect: { hazard: 'collide', x: 0 } },
  // World 3
  { stage: '11', what: 'b = 11.5: clips the rocks at the end', params: [{ m: -0.5, b: 11.5 }], expect: { hazard: 'rocks', x: 15 } },
  { stage: '11', what: 'b = 14.5: touches the branch (strict)', params: [{ m: -0.5, b: 14.5 }], expect: { hazard: 'branch', x: 0 } },
  { stage: '11', what: 'b = 4 (rock height as b)', params: [{ m: -0.5, b: 4 }], expect: { hazard: 'rocks', x: 0 } },
  { stage: '12', what: 'm = −0.5 touches the strict ice bridge', params: [{ m: -0.5, b: 10 }, { m: 0, b: 0 }], expect: { hazard: 'branch', id: 'bridge', x: 4 } },
  { stage: '12', what: 'm = −1 lands on the rocks (y = 0, strict)', params: [{ m: -1, b: 10 }, { m: 0, b: 0 }], expect: { hazard: 'rocks', id: 'rocks', x: 10 } },
  { stage: '12', what: 'm = −0.4 ("−0.4 is less steep… so lower") hits the bridge', params: [{ m: -0.4, b: 10 }, { m: 0, b: 0 }], expect: { hazard: 'branch', x: 4 } },
  { stage: '12', what: 'm = −1.5: into the rocks before the valley', params: [{ m: -1.5, b: 10 }, { m: 0, b: 0 }], expect: { hazard: 'rocks', id: 'rocks' } },
  {
    stage: '13',
    what: 'b = 42.5: joint past x = 12, avalanche catches you',
    params: [{ m: -0.5, b: 24 }, { m: -2, b: 42.5 }, { m: 0, b: 0 }],
    expect: { hazard: 'branch', id: 'avalanche', x: 12 },
  },
  {
    stage: '13',
    what: 'reversed inequality (x ≥ 12, joint at 14 → b = 45)',
    params: [{ m: -0.5, b: 24 }, { m: -2, b: 45 }, { m: 0, b: 0 }],
    expect: { hazard: 'branch', id: 'avalanche', x: 12 },
  },
  {
    stage: '13',
    what: 'b = 38.5: chute entrance before the zone → gap',
    params: [{ m: -0.5, b: 24 }, { m: -2, b: 38.5 }, { m: 0, b: 0 }],
    expect: { hazard: 'gap', x: 10, reason: 'outside' },
  },
  { stage: '14', what: 'm = −0.45: scrapes the ridge', params: [{ m: -1, b: 18 }, { m: -0.45, b: 18 }], expect: { hazard: 'rocks', id: 'ridge' } },
  { stage: '14', what: 'm = 0.1: into the cornice at x = 20', params: [{ m: -1, b: 18 }, { m: 0.1, b: 18 }], expect: { hazard: 'branch', id: 'cornice', x: 20 } },
  { stage: '14', what: 'm = −0.5 (always −½)', params: [{ m: -1, b: 18 }, { m: -0.5, b: 18 }], expect: { hazard: 'rocks', id: 'ridge' } },
  // World 4
  { stage: '15', what: 'm = −1.2: arrives above the dog at the hut', params: [{ m: -1.2, b: 32 }, { m: -0.5, b: 20 }], expect: { hazard: 'gate-high', id: 'meet', x: 16 } },
  { stage: '15', what: 'm = −1.3: meets the dog too early → gap', params: [{ m: -1.3, b: 32 }, { m: -0.5, b: 20 }], expect: { hazard: 'gap', x: 15.5, reason: 'outside' } },
  { stage: '15', what: 'm = −0.5 (copied the dog’s slope): parallel, no joint', params: [{ m: -0.5, b: 32 }, { m: -0.5, b: 20 }], expect: { hazard: 'gap', x: 16, reason: 'parallel' } },
  { stage: '15', what: 'm = −0.75 (12 ÷ 16, forgot the start height)', params: [{ m: -0.75, b: 32 }, { m: -0.5, b: 20 }], expect: { hazard: 'gate-high', id: 'meet', x: 16 } },
  { stage: '16a', what: 'parallel line: never meet', params: [{ m: -0.5, b: 20 }], expect: { hazard: 'never-met', x: 20 } },
  { stage: '16a', what: 'too steep: digs under the snow before the end', params: [{ m: -1.25, b: 20 }], expect: { hazard: 'finish-low', x: 20 } },
  { stage: '16b', what: 'same line as the friend: tangled', params: [{ m: -0.75, b: 24 }], expect: { hazard: 'tangled', x: 0 } },
  { stage: '16b', what: 'other slope, same start: collide at the start', params: [{ m: -0.5, b: 24 }], expect: { hazard: 'collide', x: 0 } },
  { stage: '16b', what: 'other slope ("parallel meet far away"): collide at x = 24', params: [{ m: -0.5, b: 18 }], expect: { hazard: 'collide', x: 24 } },
  { stage: '16c', what: 'parallel to the ghost: never together', params: [{ m: -0.5, b: 14 }], expect: { hazard: 'not-tandem', x: 24 } },
  { stage: '16c', what: 'other slope: collide at x = 16', params: [{ m: -0.25, b: 14 }], expect: { hazard: 'collide', x: 16 } },
  { stage: '16c', what: 'other slope, same start: collide at x = 0', params: [{ m: -0.25, b: 18 }], expect: { hazard: 'collide', x: 0 } },
  {
    stage: '17',
    what: 'lake read as decreasing (−0.5)',
    params: [{ m: -1, b: 20 }, { m: -0.5, b: 16 }, { m: 0.5, b: -2 }, { m: -1, b: 40 }],
    expect: { hazard: 'gap', reason: 'outside' },
  },
  {
    stage: '17',
    what: 'climb read right-to-left as decreasing (−0.5 through the flags)',
    params: [{ m: -1, b: 20 }, { m: 0, b: 8 }, { m: -0.5, b: 20 }, { m: -1, b: 40 }],
    expect: { hazard: 'gap', reason: 'outside' },
  },
  {
    stage: '17',
    what: 'climb with run ÷ rise (2)',
    params: [{ m: -1, b: 20 }, { m: 0, b: 8 }, { m: 2, b: -32 }, { m: -1, b: 40 }],
    expect: { hazard: 'gate-high', id: 'f3', x: 22 },
  },
  {
    stage: '18',
    what: 'first segment from two flags with run ÷ rise',
    params: [{ m: -1.35, b: 32.5 }, { m: -0.25, b: 20 }, { m: -1, b: 44 }, { m: -0.25, b: 17 }],
    expect: { hazard: 'gate-low', x: 12 },
  },
  {
    stage: '18',
    what: 'window: b = 20.5 touches the strict ice bridge',
    params: [{ m: -0.75, b: 30 }, { m: -0.25, b: 20.5 }, { m: -1, b: 44 }, { m: -0.25, b: 17 }],
    expect: { hazard: 'branch', id: 'bridge', x: 22 },
  },
  {
    stage: '18',
    what: 'window: b = 19 clips the rocks',
    params: [{ m: -0.75, b: 30 }, { m: -0.25, b: 19 }, { m: -1, b: 44 }, { m: -0.25, b: 17 }],
    expect: { hazard: 'rocks', id: 'rocks', x: 28 },
  },
  {
    stage: '18',
    what: 'last segment parallel to the dog: passes under the meeting arch',
    params: [{ m: -0.75, b: 30 }, { m: -0.25, b: 20 }, { m: -1, b: 44 }, { m: -0.5, b: 26 }],
    expect: { hazard: 'gate-low', id: 'meet', x: 44 },
  },
  {
    stage: '18',
    what: 'last segment through the meeting arch but joint off the post',
    params: [{ m: -0.75, b: 30 }, { m: -0.25, b: 20 }, { m: -1, b: 44 }, { m: -0.5, b: 28 }],
    expect: { hazard: 'gap', reason: 'outside' },
  },
];

for (const w of WRONG) {
  test(`wrong answer, stage ${w.stage}: ${w.what}`, () => {
    const st = stageById(w.stage);
    const o = simulateRide(st, w.params);
    assert.equal(o.ok, false, `expected a failure: ${JSON.stringify(o)}`);
    if ('stall' in w.expect) {
      assert.equal(!o.ok && o.reason, 'stall', JSON.stringify(o));
      if (!o.ok && o.reason === 'stall') {
        if (w.expect.seg !== undefined) assert.equal(o.seg, w.expect.seg);
        if (w.expect.xMin !== undefined) assert.ok(o.x >= w.expect.xMin, `stall at ${o.x}`);
        if (w.expect.xMax !== undefined) assert.ok(o.x <= w.expect.xMax, `stall at ${o.x}`);
      }
    } else {
      assert.equal(!o.ok && o.reason, 'hazard', JSON.stringify(o));
      if (!o.ok && o.reason === 'hazard') {
        const h = o.hazard;
        assert.equal(h.kind, w.expect.hazard, JSON.stringify(h));
        if (w.expect.x !== undefined) assert.ok(Math.abs(h.x - w.expect.x) < 1e-6, `hazard at ${h.x}, expected ${w.expect.x}`);
        if (w.expect.id !== undefined) assert.equal(h.objectId, w.expect.id);
        if (w.expect.reason !== undefined) assert.equal(h.joint?.reason, w.expect.reason);
      }
    }
  });
}

// ───────────── system types and joints ─────────────

test('all three system types appear: one (16a), none (16b), infinite (16c)', () => {
  assert.equal(judge(stageById('16a'), CANON['16a']).race?.kind, 'one');
  assert.equal(judge(stageById('16b'), CANON['16b']).race?.kind, 'none');
  assert.equal(judge(stageById('16c'), CANON['16c']).race?.kind, 'infinite');
  for (const id of ['16a', '16b', '16c']) assert.equal(judge(stageById(id), CANON[id]).race?.ok, true);
  // Each race needs its own system type: a stage's winner fails the other two races' goals.
  const kinds = { '16a': 'one', '16b': 'none', '16c': 'infinite' } as const;
  for (const id of ['16a', '16b', '16c'] as const) {
    const st = stageById(id);
    for (const v of bruteForce(st)) {
      // Race 1 dials only m (b is the fixed start tower); races 2 and 3 pick both.
      const p = st.segments[0].b.fixed !== undefined ? [{ m: v[0], b: st.segments[0].b.fixed }] : [{ m: v[0], b: v[1] }];
      assert.equal(judge(stageById(id), p).race?.kind, kinds[id]);
    }
  }
  // Level 15's meeting point is the joint: the system solution (16, 12).
  const t15 = buildTrack(stageById('15'), CANON['15']);
  assert.deepEqual([t15.joints[0].x, t15.joints[0].yLeft], [16, 12]);
});

test('joint zones: intersection outside the zone and parallel lines both give a gap', () => {
  const out = judge(stageById('9'), [{ m: -1, b: 30 }, { m: -0.5, b: 18 }]).hazards.find((h) => h.kind === 'gap');
  assert.equal(out?.joint?.reason, 'outside');
  assert.equal(out?.joint?.solutionX, 24);
  const par = judge(stageById('3'), [{ m: -1, b: 20 }, { m: -1, b: 4 }, { m: 0.25, b: -5 }]).hazards.find((h) => h.kind === 'gap');
  assert.equal(par?.joint?.reason, 'parallel');
  // Correct joints are the intersections of consecutive lines.
  const t9 = buildTrack(stageById('9'), CANON['9']);
  assert.deepEqual([t9.joints[0].x, t9.joints[0].yLeft, t9.joints[0].ok], [20, 10, true]);
  const t17 = buildTrack(stageById('17'), CANON['17']);
  assert.deepEqual(
    t17.joints.map((j) => [j.x, j.yLeft]),
    [
      [12, 8],
      [20, 8],
      [28, 12],
    ],
  );
  const t18 = buildTrack(stageById('18'), CANON['18']);
  assert.deepEqual(
    t18.joints.map((j) => [j.x, j.yLeft]),
    [
      [20, 15],
      [32, 12],
      [36, 8],
    ],
  );
});

// ───────────── anti-bypass ─────────────

/** Every editable m set to one constant (nearest choice for button levels), everything else at its initial value. */
function constantStrategy(st: StageSpec, m: number | null): StageParams {
  return st.segments.map((s) => {
    let mv = initialOf(s.m);
    if (m !== null && s.m.fixed === undefined) {
      const vals = grid(s.m);
      mv = vals.reduce((best, v) => (Math.abs(v - m) < Math.abs(best - m) - 1e-9 ? v : best), vals[0]);
    }
    return { m: mv, b: initialOf(s.b) };
  });
}

test('constant strategies win only a small minority of levels', () => {
  const report: string[] = [];
  for (const [name, m] of [
    ['always m = −1', -1],
    ['always m = −0.5', -0.5],
    ['dial initial values', null],
  ] as const) {
    const won = LEVELS.filter((l) => l.stages.every((st) => wins(st, constantStrategy(st, m)))).map((l) => l.id);
    report.push(`${name}: wins ${won.length ? won.join(', ') : 'none'}`);
    assert.ok(won.length <= 2, `${name} wins too many levels: ${won.join(', ')}`);
    assert.ok(won.every((id) => id <= 4), `${name} must not win past world 1: ${won.join(', ')}`);
  }
  console.log(report.join('\n'));
});

test('fog anti-eyeballing: neighbouring dial values of the answer fail in most levels; fog never reaches a gate or the finish', () => {
  let strict = 0;
  let total = 0;
  const loose: string[] = [];
  for (const l of LEVELS) {
    if (l.fullPreview) continue; // tutorial shows the full line on purpose
    for (const st of l.stages) {
      const canon = CANON[st.id];
      const axes = axesOf(st);
      let neighbours = 0;
      let failing = 0;
      axes.forEach((ax) => {
        const k = ax.vals.indexOf(canon[ax.seg][ax.key]);
        for (const d of [-1, 1]) {
          const v = ax.vals[k + d];
          if (v === undefined) continue;
          const p = canon.map((q) => ({ ...q }));
          p[ax.seg][ax.key] = v;
          neighbours++;
          if (!wins(st, p)) failing++;
        }
      });
      total++;
      if (failing === neighbours) strict++;
      else loose.push(`${st.id} (${failing}/${neighbours})`);

      // Fog: only the first 15 % of each editable segment is drawn, and that never reaches a gate or the finish.
      const track = buildTrack(st, canon);
      st.segments.forEach((s, i) => {
        if (s.given) return;
        const [fa, fb] = fogVisibleRange(st, track, i);
        assert.ok(fb - fa <= (s.x1 - s.x0) * FOG_FRACTION + 1e-9, `stage ${st.id} seg ${s.id}: fog too long`);
        const targets = [...st.objects.filter((o) => o.kind === 'gate').map((o) => o.x), st.finish.x];
        for (const x of targets) {
          const inPiece = x >= track.pieces[i].xa - 1e-9 && x <= track.pieces[i].xb + 1e-9;
          if (inPiece) assert.ok(x > fb + 1e-9, `stage ${st.id} seg ${s.id}: fog [${fa}, ${fb}] reaches target x = ${x}`);
        }
      });
    }
  }
  // Only the inequality windows (11–14, the window in 18) and race 1 of 16 (any other slope meets the dog) may have
  // passing neighbours; every other stage has a unique answer whose every neighbour fails.
  assert.ok(strict / total >= 0.65, `only ${strict}/${total} stages are strict; loose: ${loose.join(', ')}`);
  for (const s of loose) assert.match(s, /^(11|12|13|14|16a|18) /, `unexpected loose stage ${s}`);
  // Windows are closed: the values just outside each window fail.
  for (const id of ['11', '12', '13', '14']) {
    const st = stageById(id);
    const [ax] = axesOf(st);
    const vals = SOLUTIONS[id].map((v) => v[0]);
    const lo = ax.vals[ax.vals.indexOf(Math.min(...vals)) - 1];
    const hi = ax.vals[ax.vals.indexOf(Math.max(...vals)) + 1];
    for (const v of [lo, hi]) assert.equal(wins(st, withValues(st, CANON[id], [ax], [v])), false, `stage ${id}: ${v} just outside the window wins`);
  }
  // Windows stay narrow: no editable axis admits more than 10 values or 20 % of its dial.
  for (const [id, sols] of Object.entries(SOLUTIONS)) {
    const st = stageById(id);
    axesOf(st).forEach((ax, a) => {
      if (st.segments[ax.seg][ax.key].choices) return; // button picks (16): the race goal itself defines the set
      const distinct = new Set(sols.map((v) => v[a])).size;
      assert.ok(distinct <= 10 && distinct <= Math.max(1, ax.vals.length * 0.2), `stage ${id}: ${distinct} values on axis ${a}`);
    });
  }
});

test('ride times of the authored answers (sim seconds)', () => {
  for (const l of LEVELS)
    for (const st of l.stages) {
      const o = simulateRide(st, CANON[st.id]);
      assert.ok(o.ok);
      assert.ok(o.time >= 2.5 && o.time <= 12, `stage ${st.id} ride ${o.time.toFixed(2)} s`);
    }
  console.log(
    LEVELS.flatMap((l) => l.stages.map((st) => `${st.id}: ${simulateRide(st, CANON[st.id]).time.toFixed(2)} s`)).join(' · '),
  );
});
