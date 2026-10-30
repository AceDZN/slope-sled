// Fresh runs per world (replay value): random but solver-verified levels with integer / half coordinates.
// Each generated level is accepted only if it has a solution, its solution set is narrow (no eyeballing),
// and the constant strategy "always m = −1" fails.

import { judge } from './judge.ts';
import { simulateRide } from './ride.ts';
import { snap } from './line.ts';
import type { LevelSpec, ParamSpec, StageParams, StageSpec } from './types.ts';

export function rng(seed: number): () => number {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

const pick = <T>(r: () => number, a: T[]): T => a[Math.floor(r() * a.length)];
const isHalf = (v: number) => Math.abs(v * 2 - Math.round(v * 2)) < 1e-9;

function grid(p: ParamSpec, key: 'm' | 'b'): number[] {
  if (p.fixed !== undefined) return [p.fixed];
  if (p.choices) return p.choices;
  const step = p.step ?? (key === 'm' ? 0.05 : 0.5);
  const out: number[] = [];
  for (let v = p.min!; v <= p.max! + 1e-9; v += step) out.push(snap(v, step));
  return out;
}

/** All dial settings of a one-segment stage that ride successfully. Geometry filters first (fast), then the ride. */
export function solveSingle(stage: StageSpec): StageParams[] {
  const s = stage.segments[0];
  const sols: StageParams[] = [];
  for (const m of grid(s.m, 'm')) {
    for (const b of grid(s.b, 'b')) {
      const p = [{ m, b }];
      if (judge(stage, p).first) continue;
      if (simulateRide(stage, p).ok) sols.push(p);
    }
  }
  return sols;
}

const WORLD_TITLES: Record<number, string> = {
  1: 'ריצה חדשה: שיפוע משתי נקודות',
  2: 'ריצה חדשה: משוואת ישר',
  3: 'ריצה חדשה: חלון אי-שוויונות',
  4: 'ריצה חדשה: פגישה עם הכלב',
};

function build(world: 1 | 2 | 3 | 4, r: () => number): LevelSpec | null {
  const mDial: ParamSpec = { min: -2.5, max: 1, step: 0.05, initial: 0 };
  if (world === 1) {
    const y0 = pick(r, [16, 18, 20, 22, 24, 28]);
    const m = pick(r, [-0.25, -0.5, -0.75, -1.25, -1.5]);
    const L = pick(r, [16, 20, 24, 28, 32, 36, 40]);
    const yEnd = y0 + m * L;
    const xg = pick(r, [L / 4, L / 2, (3 * L) / 4]);
    const yg = y0 + m * xg;
    if (yEnd < 0 || !isHalf(yEnd) || !isHalf(yg) || !Number.isInteger(xg)) return null;
    return level(world, { x1: L + 4, y1: y0 + 4 }, {
      segments: [{ id: 'a', x0: 0, x1: L, m: mDial, b: { fixed: y0 } }],
      objects: [{ kind: 'gate', id: 'g', x: xg, y: yg }],
      finish: { x: L, y: yEnd, look: 'hut' },
      hint: { points: [[0, y0], [xg, yg]], text: 'שיפוע = השינוי בגובה חלקי השינוי במרחק.' },
    }, 'עברו בשער והגיעו לבקתה. השיפוע מחושב משתי נקודות.');
  }
  if (world === 2) {
    const m = pick(r, [-0.25, -0.5, -0.75, -1, -1.5]);
    const b = pick(r, [14, 16, 18, 20, 22, 24, 26]);
    const x1 = pick(r, [2, 4, 6]);
    const x2 = x1 + pick(r, [4, 6, 8, 10]);
    const L = x2 + pick(r, [6, 8, 10]);
    const ya = m * x1 + b;
    const yb = m * x2 + b;
    const yEnd = m * L + b;
    if (yEnd < 0 || !isHalf(ya) || !isHalf(yb) || !isHalf(yEnd)) return null;
    return level(world, { x1: L + 4, y1: Math.ceil(b + 4) }, {
      segments: [{ id: 'a', x0: 0, x1: L, m: mDial, b: { min: 0, max: 32, step: 0.5, initial: 10 } }],
      objects: [
        { kind: 'gate', id: 'f1', x: x1, y: ya, look: 'flag' },
        { kind: 'gate', id: 'f2', x: x2, y: yb, look: 'flag' },
      ],
      finish: { x: L, y: yEnd, look: 'hut' },
      hint: { points: [[x1, ya], [x2, yb]], text: 'משתי נקודות מוצאים שיפוע, ואז מציבים נקודה כדי למצוא את b.' },
    }, 'עברו דרך שני הדגלים. מצאו את השיפוע ואת האיבר החופשי.');
  }
  if (world === 3) {
    const m = pick(r, [-0.25, -0.5, -0.75]);
    const L = pick(r, [12, 16, 20]);
    const rock = pick(r, [2, 3, 4, 5]);
    // Rocks bind at the far end: m L + b ≥ rock. Branch at the start: b < branch.
    const bLo = rock - m * L;
    const width = pick(r, [1.5, 2, 2.5]);
    const branch = bLo + width + 0.5;
    if (!isHalf(bLo) || !isHalf(branch)) return null;
    const mid = bLo + width / 2;
    return level(world, { x1: L + 6, y1: Math.ceil(branch + 3) }, {
      segments: [{ id: 'a', x0: 0, x1: L, m: { fixed: m }, b: { min: 0, max: 30, step: 0.5, initial: 4 }, launch: true }],
      objects: [
        { kind: 'constraint', id: 'rocks', side: 'above', m: 0, b: rock, x0: 0, x1: L, look: 'rocks' },
        { kind: 'constraint', id: 'branch', side: 'below', m: 0, b: branch, x0: 0, x1: 2, strict: true, look: 'branch' },
      ],
      finish: { x: L, y: m * L + mid, tol: width / 2 + 0.01, look: 'powder' },
      hint: { boundaries: ['rocks', 'branch'], text: 'בדקו את שני הקצוות: איפה המסלול הכי נמוך, ואיפה הענף.' },
    }, 'בחרו b כך שהמסלול יעבור מעל הסלעים ומתחת לענף.');
  }
  // world 4: meet the dog at the hut
  const md = pick(r, [-0.25, -0.5, -0.75]);
  const bd = pick(r, [14, 16, 18, 20]);
  const ys = bd + pick(r, [6, 8, 10, 12]);
  const xh = pick(r, [8, 10, 12, 16, 20]);
  const yh = md * xh + bd;
  const m = (yh - ys) / xh;
  if (yh < 0 || !isHalf(yh) || Math.abs(m / 0.05 - Math.round(m / 0.05)) > 1e-9 || Math.abs(m + 1) < 1e-9) return null;
  return level(world, { x1: xh + 6, y1: ys + 4 }, {
    segments: [{ id: 'a', x0: 0, x1: xh, m: mDial, b: { fixed: ys } }],
    objects: [{ kind: 'gate', id: 'meet', x: xh, y: yh, look: 'meet', hideLabel: true }],
    rival: { who: 'dog', m: md, b: bd, x0: 0, x1: xh + 4 },
    finish: { x: xh, y: yh, look: 'hut' },
    hint: { points: [[0, ys], [xh, yh]], text: 'מצאו את גובה הכלב ליד הבקתה — זו נקודת הפגישה.' },
  }, 'פגשו את הכלב בדיוק ליד הבקתה.');
}

function level(world: 1 | 2 | 3 | 4, v: { x1: number; y1: number }, st: Omit<StageSpec, 'id' | 'joints'>, goal: string): LevelSpec {
  return {
    id: 100 + world,
    world,
    title: WORLD_TITLES[world],
    goal,
    view: { x0: 0, x1: v.x1, y0: 0, y1: v.y1 },
    modules: [],
    stages: [{ id: `gen-${world}`, joints: [], ...st }],
  };
}

/** A verified fresh run for a world. Deterministic for a given seed. */
export function generateRun(world: 1 | 2 | 3 | 4, seed: number): LevelSpec {
  const r = rng(seed * 7919 + world);
  for (let tries = 0; tries < 400; tries++) {
    const lv = build(world, r);
    if (!lv) continue;
    const st = lv.stages[0];
    const sols = solveSingle(st);
    if (sols.length === 0 || sols.length > 5) continue;
    const s = st.segments[0];
    const always = [{ m: -1, b: s.b.fixed ?? sols[0][0].b }];
    if (s.m.fixed === undefined && simulateRide(st, always).ok) continue;
    return lv;
  }
  throw new Error(`could not generate a run for world ${world}`);
}
