// Deterministic ride physics along the built track (game physics, not curriculum):
// gravity along the slope, constant snow friction, light drag, ballistic flight off a kicker.
// Player input (tuck, lean, tricks) never changes this — it is style only.

import { judge, type Hazard, type Judgement } from './judge.ts';
import { pieceAt, trackY } from './track.ts';
import type { StageParams, StageSpec } from './types.ts';

export const PHYS = {
  g: 4.2,
  mu: 0.06,
  drag: 0.006,
  /** The dog's push at the start (m/s). */
  v0: 2.5,
  dt: 1 / 120,
  /** Ride time limit (s) — a safety net, never reached by authored levels. */
  maxTime: 40,
};

export type RidePhase = 'ride' | 'air' | 'slideback' | 'crash' | 'finished';

export interface RideState {
  t: number;
  x: number;
  y: number;
  /** Speed along the track (m/s), negative when sliding back. */
  v: number;
  /** Track angle (radians, positive = climbing). */
  angle: number;
  phase: RidePhase;
  /** In the air: vertical velocity. */
  vy: number;
  seg: number;
  maxSpeed: number;
  airTime: number;
}

export type RideOutcome =
  | { ok: true; time: number; maxSpeed: number; airTime: number }
  | { ok: false; time: number; reason: 'hazard'; hazard: Hazard }
  | { ok: false; time: number; reason: 'stall'; x: number; y: number; seg: number; slope: number };

export class RideSim {
  readonly judgement: Judgement;
  readonly stage: StageSpec;
  state: RideState;
  outcome: RideOutcome | null = null;
  private hazardIdx = 0;
  private settle = 0;
  private landY = 0;

  constructor(stage: StageSpec, params: StageParams) {
    this.stage = stage;
    this.judgement = judge(stage, params);
    const tr = this.judgement.track;
    const p = tr.pieces[0];
    this.state = {
      t: 0,
      x: tr.x0,
      y: trackY(tr, tr.x0),
      v: PHYS.v0,
      angle: Math.atan(p.line.m),
      phase: 'ride',
      vy: 0,
      seg: 0,
      maxSpeed: PHYS.v0,
      airTime: 0,
    };
    // A hazard sitting exactly at the start (e.g. tangled lines) fires immediately.
    this.checkHazards(tr.x0 - 1e-6, tr.x0);
  }

  get done(): boolean {
    return this.state.phase === 'crash' || this.state.phase === 'finished' || (this.state.phase === 'slideback' && this.settle > 0.6);
  }

  private checkHazards(fromX: number, toX: number): boolean {
    const hz = this.judgement.hazards;
    while (this.hazardIdx < hz.length && hz[this.hazardIdx].x <= toX + 1e-9) {
      const h = hz[this.hazardIdx];
      if (h.x >= fromX - 1e-9) {
        this.state.phase = 'crash';
        this.state.x = h.x;
        this.state.y = h.trackY;
        this.outcome = { ok: false, time: this.state.t, reason: 'hazard', hazard: h };
        return true;
      }
      this.hazardIdx++;
    }
    return false;
  }

  /** Advance by one fixed physics step. */
  step(): void {
    const s = this.state;
    if (this.done) return;
    const dt = PHYS.dt;
    s.t += dt;
    const tr = this.judgement.track;

    if (s.phase === 'air') {
      s.airTime += dt;
      const vx = s.v * Math.cos(s.angle);
      s.vy -= PHYS.g * dt;
      s.x += vx * dt;
      s.y += s.vy * dt;
      if (s.y <= this.landY) {
        s.y = this.landY;
        s.phase = 'finished';
        this.outcome = { ok: true, time: s.t, maxSpeed: s.maxSpeed, airTime: s.airTime };
      }
      return;
    }

    if (s.phase === 'slideback') {
      // Visual only after a stall: slide back down, come to rest.
      const p = pieceAt(tr, Math.max(tr.x0, s.x));
      const sin = p.line.m / Math.hypot(1, p.line.m);
      const cos = 1 / Math.hypot(1, p.line.m);
      const a = -PHYS.g * sin - PHYS.mu * PHYS.g * cos * Math.sign(s.v || -1);
      s.v += a * dt;
      if (s.v > 0 || s.x <= tr.x0) {
        s.v = 0;
        this.settle += dt;
      }
      s.x = Math.max(tr.x0, s.x + s.v * cos * dt);
      s.y = trackY(tr, s.x);
      s.angle = Math.atan(p.line.m);
      return;
    }

    const p = pieceAt(tr, s.x);
    s.seg = p.seg;
    const m = p.line.m;
    const sin = m / Math.hypot(1, m);
    const cos = 1 / Math.hypot(1, m);
    const a = -PHYS.g * sin - PHYS.mu * PHYS.g * cos - PHYS.drag * s.v * s.v;
    s.v += a * dt;
    s.angle = Math.atan(m);
    if (s.v <= 0) {
      s.v = 0;
      s.phase = 'slideback';
      this.outcome = { ok: false, time: s.t, reason: 'stall', x: s.x, y: s.y, seg: p.seg, slope: m };
      return;
    }
    s.maxSpeed = Math.max(s.maxSpeed, s.v);
    const nx = Math.min(tr.x1, s.x + s.v * cos * dt);
    if (this.checkHazards(s.x, nx)) return;
    s.x = nx;
    s.y = trackY(tr, s.x);

    if (s.x >= tr.x1 - 1e-9) {
      const last = this.stage.segments[this.stage.segments.length - 1];
      if (last.launch) {
        s.phase = 'air';
        s.vy = s.v * Math.sin(s.angle);
        this.landY = this.stage.finish.y;
        // Launch from a kicker lip above the landing so there is always airtime.
        if (s.y <= this.landY) this.landY = s.y - 1.5;
      } else {
        s.phase = 'finished';
        this.outcome = { ok: true, time: s.t, maxSpeed: s.maxSpeed, airTime: 0 };
      }
    }
  }

  /** Advance by ms of real time using fixed steps; returns steps taken. */
  advance(ms: number): number {
    let n = Math.round(ms / 1000 / PHYS.dt);
    let k = 0;
    while (n-- > 0 && !this.done && this.state.t < PHYS.maxTime) {
      this.step();
      k++;
    }
    return k;
  }
}

/** Run a whole ride headlessly (tests, solvers). */
export function simulateRide(stage: StageSpec, params: StageParams): RideOutcome {
  const sim = new RideSim(stage, params);
  while (!sim.outcome && sim.state.t < PHYS.maxTime) sim.step();
  if (!sim.outcome) {
    return { ok: false, time: sim.state.t, reason: 'stall', x: sim.state.x, y: sim.state.y, seg: sim.state.seg, slope: 0 };
  }
  return sim.outcome;
}
