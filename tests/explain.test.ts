import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explain } from '../src/game/explain.ts';
import { starsFor } from '../src/game/progress.ts';
import { simulateRide } from '../src/math/ride.ts';
import { LEVELS, levelById } from '../src/math/levels.ts';
import { equation } from '../src/math/format.ts';

test('every failing ride gets a Hebrew title and a worked sentence with LTR math', () => {
  const seen = new Set<string>();
  for (const lv of LEVELS) {
    for (const st of lv.stages) {
      for (const m of [-2, -1, -0.5, 0, 0.5]) {
        const params = st.segments.map((s) => ({ m: s.m.fixed ?? m, b: s.b.fixed ?? 10 }));
        const o = simulateRide(st, params);
        if (o.ok) continue;
        const e = explain(o, st);
        seen.add(o.reason === 'stall' ? 'stall' : o.hazard.kind);
        assert.ok(e.title.length > 0 && e.subtitle.length > 0, `level ${lv.id}`);
        assert.ok(/[֐-׿]/.test(e.text), 'Hebrew text');
        assert.ok(!/undefined|NaN/.test(e.plain), e.plain);
      }
    }
  }
  assert.ok(seen.size >= 6, `kinds covered: ${[...seen].join(', ')}`);
});

test('level 2 uphill: the explanation says positive slope is a climb', () => {
  const st = levelById(2).stages[0];
  const e = explain(simulateRide(st, [{ m: 0.75, b: 24 }]), st);
  assert.match(e.text, /שיפוע חיובי/);
});

test('equations keep a real minus sign', () => {
  assert.equal(equation(-0.5, 20), 'y = −0.5x + 20');
  assert.equal(equation(0.25, -5), 'y = 0.25x − 5');
  assert.equal(equation(0, 4), 'y = 4');
});

test('stars: 3 for a first unaided build, minus one for a hint, minus for many builds, never below 1', () => {
  assert.equal(starsFor(1, false), 3);
  assert.equal(starsFor(1, true), 2);
  assert.equal(starsFor(2, false), 2);
  assert.equal(starsFor(5, true), 1);
});
