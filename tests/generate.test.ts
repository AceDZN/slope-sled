import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateRun, solveSingle } from '../src/math/generate.ts';
import { simulateRide } from '../src/math/ride.ts';

for (const world of [1, 2, 3, 4] as const) {
  test(`generated runs for world ${world}: solvable, narrow, and "always m = −1" fails`, () => {
    for (let seed = 1; seed <= 12; seed++) {
      const lv = generateRun(world, seed);
      const st = lv.stages[0];
      const sols = solveSingle(st);
      assert.ok(sols.length >= 1 && sols.length <= 5, `world ${world} seed ${seed}: ${sols.length} solutions`);
      for (const s of sols) assert.equal(simulateRide(st, s).ok, true);
      const seg = st.segments[0];
      if (seg.m.fixed === undefined) {
        assert.equal(simulateRide(st, [{ m: -1, b: seg.b.fixed ?? sols[0][0].b }]).ok, false);
      }
    }
  });
}

test('generation is deterministic per seed', () => {
  assert.deepEqual(generateRun(2, 5), generateRun(2, 5));
});

import { generateExpert, solveEditable } from '../src/math/generate.ts';

for (const world of [1, 2, 3, 4] as const) {
  test(`expert runs for world ${world}: solvable, narrow, no hints, "always m = −1" fails`, () => {
    for (let seed = 1; seed <= 8; seed++) {
      const lv = generateExpert(world, seed);
      assert.equal(lv.noHints, true);
      const st = lv.stages[0];
      const sols = solveEditable(st);
      assert.ok(sols.length >= 1 && sols.length <= 4, `world ${world} seed ${seed}: ${sols.length}`);
      for (const s of sols) assert.equal(simulateRide(st, s).ok, true);
    }
  });
}

test('expert and window runs never label the answer: hidden gates, unlabeled powder landings', () => {
  for (const world of [1, 2, 3, 4] as const) {
    for (let seed = 1; seed <= 6; seed++) {
      const st = generateExpert(world, seed).stages[0];
      for (const o of st.objects) if (o.kind === 'gate') assert.equal(o.hideLabel, true, `expert ${world}/${seed} gate ${o.id}`);
      assert.equal(st.finish.label, 'none', `expert ${world}/${seed} finish`);
    }
    const p3 = generateRun(3, world).stages[0];
    assert.equal(p3.finish.label, 'none');
    const p4 = generateRun(4, world).stages[0];
    assert.equal(p4.finish.label, 'x');
  }
});
