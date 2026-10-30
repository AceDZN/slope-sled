// Turns a stage + the player's (m, b) choices into the actual track: segments cut at the
// intersections of consecutive lines. A joint whose intersection misses its zone is a gap.

import { type Line, type SystemSolution, solveSystem, yAt } from './line.ts';
import type { StageParams, StageSpec } from './types.ts';

export interface Piece {
  seg: number;
  line: Line;
  xa: number;
  xb: number;
}

export interface JointResult {
  index: number;
  solution: SystemSolution;
  /** x where the pieces are cut. For a gap: the intersection clamped into the zone (zone center if parallel). */
  x: number;
  ok: boolean;
  reason: 'cross' | 'outside' | 'parallel' | 'same';
  /** Heights of both lines at the cut (equal when ok). */
  yLeft: number;
  yRight: number;
}

export interface Track {
  pieces: Piece[];
  joints: JointResult[];
  x0: number;
  x1: number;
}

export function paramsLines(params: StageParams): Line[] {
  return params.map((p) => ({ m: p.m, b: p.b }));
}

export function buildTrack(stage: StageSpec, params: StageParams): Track {
  const segs = stage.segments;
  if (params.length !== segs.length) throw new Error(`stage ${stage.id}: expected ${segs.length} params`);
  const lines = paramsLines(params);
  const joints: JointResult[] = [];
  for (let i = 0; i < segs.length - 1; i++) {
    const [z0, z1] = stage.joints[i].zone;
    const sol = solveSystem(lines[i], lines[i + 1]);
    const zc = (z0 + z1) / 2;
    let x = zc;
    let ok = false;
    let reason: JointResult['reason'];
    if (sol.kind === 'one') {
      reason = sol.x >= z0 - 1e-9 && sol.x <= z1 + 1e-9 ? 'cross' : 'outside';
      ok = reason === 'cross';
      x = Math.min(z1, Math.max(z0, sol.x));
    } else if (sol.kind === 'infinite') {
      reason = 'same';
      ok = true;
    } else {
      reason = 'parallel';
    }
    joints.push({ index: i, solution: sol, x, ok, reason, yLeft: yAt(lines[i], x), yRight: yAt(lines[i + 1], x) });
  }
  const pieces: Piece[] = segs.map((s, i) => ({
    seg: i,
    line: lines[i],
    xa: i === 0 ? s.x0 : joints[i - 1].x,
    xb: i === segs.length - 1 ? s.x1 : joints[i].x,
  }));
  return { pieces, joints, x0: pieces[0].xa, x1: pieces[pieces.length - 1].xb };
}

/** Track height at x (the piece that covers x; at a cut, the left piece). */
export function trackY(track: Track, x: number): number {
  for (const p of track.pieces) if (x <= p.xb + 1e-9) return yAt(p.line, x);
  return yAt(track.pieces[track.pieces.length - 1].line, x);
}

export function pieceAt(track: Track, x: number): Piece {
  for (const p of track.pieces) if (x < p.xb - 1e-9) return p;
  return track.pieces[track.pieces.length - 1];
}

/** Fog preview: the drawn part of a segment while building (first 15 % of its nominal length). */
export const FOG_FRACTION = 0.15;

export function fogVisibleRange(stage: StageSpec, track: Track, seg: number): [number, number] {
  const s = stage.segments[seg];
  const p = track.pieces[seg];
  const len = (s.x1 - s.x0) * FOG_FRACTION;
  return [p.xa, Math.min(p.xb, p.xa + len)];
}
