// Number and equation formatting. Output is plain text meant for LTR spans (<bdi dir="ltr">).

const MINUS = '−';

export function num(v: number, maxDec = 2): string {
  const r = Number(v.toFixed(maxDec));
  const s = Math.abs(r).toString();
  return (r < 0 ? MINUS : '') + s;
}

/** "y = −0.5x + 20", "y = 12", "y = x − 3" */
export function equation(m: number, b: number): string {
  const mr = Number(m.toFixed(4));
  const br = Number(b.toFixed(4));
  let s = 'y = ';
  if (mr === 0) return s + num(br);
  if (mr === 1) s += 'x';
  else if (mr === -1) s += MINUS + 'x';
  else s += num(mr, 3) + 'x';
  if (br > 0) s += ' + ' + num(br);
  else if (br < 0) s += ' ' + MINUS + ' ' + num(-br);
  return s;
}

export function point(x: number, y: number): string {
  return `(${num(x)}, ${num(y)})`;
}

/** Smallest rise/run with run in {1, 2, 4, 5, 10, 20} that equals m exactly (m on a 0.05 grid). */
export function riseRun(m: number): { rise: number; run: number } {
  for (const run of [1, 2, 4, 5, 10, 20]) {
    const rise = m * run;
    if (Math.abs(rise - Math.round(rise)) < 1e-6) return { rise: Math.round(rise), run };
  }
  return { rise: Math.round(m * 20), run: 20 };
}

export function ltr(text: string): string {
  return `<bdi dir="ltr" class="math">${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</bdi>`;
}
