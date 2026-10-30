// Geometric judgement of a built track: where along x the first thing goes wrong.
// Everything here is exact line math; the ride sim only decides whether you get there with speed left.

import { solveSystem, yAt, type Line } from './line.ts';
import { buildTrack, trackY, type Track } from './track.ts';
import type { ConstraintSpec, GateSpec, StageParams, StageSpec } from './types.ts';

export const GATE_TOL = 0.3;
export const FINISH_TOL = 0.5;
const TINY = 1e-9;

export type HazardKind =
  | 'gate-high'
  | 'gate-low'
  | 'rocks'
  | 'branch'
  | 'gap'
  | 'finish-high'
  | 'finish-low'
  | 'collide'
  | 'never-met'
  | 'not-tandem'
  | 'tangled';

export interface Hazard {
  kind: HazardKind;
  x: number;
  /** Your track height at x. */
  trackY: number;
  /** The height you needed (gate center, boundary, finish, other line). */
  needY: number;
  objectId?: string;
  /** Index of the segment that caused it. */
  seg: number;
  /** Constraint details for explanations. */
  constraint?: ConstraintSpec;
  joint?: { reason: 'outside' | 'parallel'; solutionX?: number; zone: [number, number] };
}

/** Rival-line outcome for races (level 15/16): where you meet, if anywhere. */
export interface RaceResult {
  kind: 'one' | 'none' | 'infinite';
  x?: number;
  y?: number;
  ok: boolean;
}

export interface Judgement {
  track: Track;
  hazards: Hazard[];
  /** First hazard along x, or null when the geometry is clean. */
  first: Hazard | null;
  race?: RaceResult;
}

function segAt(track: Track, x: number): number {
  for (const p of track.pieces) if (x <= p.xb + TINY) return p.seg;
  return track.pieces.length - 1;
}

/** First x in [c.x0, c.x1] where the track breaks the inequality, or null. */
export function firstViolation(track: Track, c: ConstraintSpec): { x: number; seg: number } | null {
  const sign = c.side === 'above' ? 1 : -1;
  for (const p of track.pieces) {
    const u = Math.max(p.xa, c.x0);
    const w = Math.min(p.xb, c.x1);
    if (u > w + TINY) continue;
    // f(x) = sign·(track − bound) must be ≥ 0 (or > 0 when strict)
    const fm = sign * (p.line.m - c.m);
    const fb = sign * (p.line.b - c.b);
    const f = (x: number) => fm * x + fb;
    const bad = (v: number) => (c.strict ? v <= TINY : v < -TINY);
    if (bad(f(u))) return { x: u, seg: p.seg };
    if (bad(f(w))) {
      // f crosses zero inside (u, w]; root is where it starts failing
      const root = -fb / fm;
      return { x: Math.min(w, Math.max(u, root)), seg: p.seg };
    }
  }
  return null;
}

function gateHazard(track: Track, g: GateSpec): Hazard | null {
  if (g.x < track.x0 - TINY || g.x > track.x1 + TINY) return null;
  const y = trackY(track, g.x);
  const tol = g.tol ?? GATE_TOL;
  if (Math.abs(y - g.y) <= tol + TINY) return null;
  return { kind: y > g.y ? 'gate-high' : 'gate-low', x: g.x, trackY: y, needY: g.y, objectId: g.id, seg: segAt(track, g.x) };
}

function raceAgainst(track: Track, rival: Line, rx0: number, rx1: number): RaceResult & { seg: number } {
  // Your track is one line in race stages; for multi-piece tracks take the first crossing.
  let sawInfinite = false;
  for (const p of track.pieces) {
    const u = Math.max(p.xa, rx0);
    const w = Math.min(p.xb, rx1);
    if (u > w + TINY) continue;
    const s = solveSystem(p.line, rival);
    if (s.kind === 'infinite') sawInfinite = true;
    else if (s.kind === 'one' && s.x >= u - TINY && s.x <= w + TINY) return { kind: 'one', x: s.x, y: s.y, ok: false, seg: p.seg };
  }
  return { kind: sawInfinite ? 'infinite' : 'none', ok: false, seg: 0 };
}

export function judge(stage: StageSpec, params: StageParams): Judgement {
  const track = buildTrack(stage, params);
  const hazards: Hazard[] = [];

  for (const j of track.joints) {
    if (j.ok) continue;
    hazards.push({
      kind: 'gap',
      x: j.x,
      trackY: j.yLeft,
      needY: j.yRight,
      seg: j.index + 1,
      joint: {
        reason: j.reason === 'parallel' ? 'parallel' : 'outside',
        solutionX: j.solution.kind === 'one' ? j.solution.x : undefined,
        zone: stage.joints[j.index].zone,
      },
    });
  }

  for (const o of stage.objects) {
    if (o.kind === 'gate') {
      const h = gateHazard(track, o);
      if (h) hazards.push(h);
    } else {
      const v = firstViolation(track, o);
      if (v) {
        hazards.push({
          kind: o.side === 'above' ? 'rocks' : 'branch',
          x: v.x,
          trackY: trackY(track, v.x),
          needY: o.m * v.x + o.b,
          objectId: o.id,
          seg: v.seg,
          constraint: o,
        });
      }
    }
  }

  let race: RaceResult | undefined;
  const rv = stage.rival;
  if (rv?.goal) {
    const r = raceAgainst(track, { m: rv.m, b: rv.b }, rv.x0, rv.x1);
    const startX = Math.max(track.x0, rv.x0);
    const endX = Math.min(track.x1, rv.x1);
    const at = (x: number) => ({ x, trackY: trackY(track, x), needY: yAt(rv, x), seg: r.seg });
    if (rv.goal === 'cross') {
      race = { ...r, ok: r.kind === 'one' };
      if (r.kind === 'none') hazards.push({ kind: 'never-met', ...at(endX) });
      if (r.kind === 'infinite') hazards.push({ kind: 'tangled', ...at(startX) });
    } else if (rv.goal === 'parallel') {
      race = { ...r, ok: r.kind === 'none' };
      if (r.kind === 'one') hazards.push({ kind: 'collide', ...at(r.x!) });
      if (r.kind === 'infinite') hazards.push({ kind: 'tangled', ...at(startX) });
    } else {
      race = { ...r, ok: r.kind === 'infinite' };
      if (r.kind === 'one') hazards.push({ kind: 'collide', ...at(r.x!) });
      if (r.kind === 'none') hazards.push({ kind: 'not-tandem', ...at(endX) });
    }
  }

  const f = stage.finish;
  const yEnd = trackY(track, f.x);
  if (Math.abs(yEnd - f.y) > (f.tol ?? FINISH_TOL) + TINY) {
    hazards.push({ kind: yEnd > f.y ? 'finish-high' : 'finish-low', x: f.x, trackY: yEnd, needY: f.y, seg: track.pieces.length - 1 });
  }

  hazards.sort((a, b) => a.x - b.x);
  return { track, hazards, first: hazards[0] ?? null, race };
}
