// Straight lines y = mx + b and systems of two lines. Pure math, no rendering.

export interface Line {
  m: number;
  b: number;
}

export const EPS = 1e-9;

export function yAt(line: Line, x: number): number {
  return line.m * x + line.b;
}

/** Slope from two points: rise ÷ run (Δy / Δx). */
export function slopeFromPoints(x1: number, y1: number, x2: number, y2: number): number {
  if (Math.abs(x2 - x1) < EPS) throw new Error('vertical line has no slope');
  return (y2 - y1) / (x2 - x1);
}

export function lineFromPoints(x1: number, y1: number, x2: number, y2: number): Line {
  const m = slopeFromPoints(x1, y1, x2, y2);
  return { m, b: y1 - m * x1 };
}

export function lineFromPointSlope(x: number, y: number, m: number): Line {
  return { m, b: y - m * x };
}

/** x-intercept (where y = 0); null for a flat line. */
export function xIntercept(line: Line): number | null {
  if (Math.abs(line.m) < EPS) return null;
  return -line.b / line.m;
}

export type SystemSolution =
  | { kind: 'one'; x: number; y: number }
  | { kind: 'none' }
  | { kind: 'infinite' };

/** Solve the system y = m1 x + b1, y = m2 x + b2. */
export function solveSystem(a: Line, c: Line): SystemSolution {
  if (Math.abs(a.m - c.m) < EPS) {
    return Math.abs(a.b - c.b) < EPS ? { kind: 'infinite' } : { kind: 'none' };
  }
  const x = (c.b - a.b) / (a.m - c.m);
  return { kind: 'one', x, y: a.m * x + a.b };
}

export type SlopeSign = 'decreasing' | 'constant' | 'increasing';

export function slopeSign(m: number): SlopeSign {
  if (Math.abs(m) < EPS) return 'constant';
  return m < 0 ? 'decreasing' : 'increasing';
}

/** Snap to a step grid (e.g. 0.05 for m, 0.5 for b) without float drift. */
export function snap(value: number, step: number): number {
  const n = Math.round(value / step);
  return Number((n * step).toFixed(6));
}

export function nearlyEqual(a: number, b: number, tol = 1e-6): boolean {
  return Math.abs(a - b) <= tol;
}
