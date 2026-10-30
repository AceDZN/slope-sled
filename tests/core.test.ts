import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solveSystem, lineFromPoints, snap } from '../src/math/line.ts';
import { simulateRide } from '../src/math/ride.ts';
import { levelById } from '../src/math/levels.ts';

test('systems: one, none, infinite', () => {
  assert.deepEqual(solveSystem({ m: -1, b: 30 }, { m: -0.5, b: 20 }), { kind: 'one', x: 20, y: 10 });
  assert.equal(solveSystem({ m: -0.5, b: 30 }, { m: -0.5, b: 24 }).kind, 'none');
  assert.equal(solveSystem({ m: -0.5, b: 24 }, { m: -0.5, b: 24 }).kind, 'infinite');
});

test('line from two points and snapping', () => {
  assert.deepEqual(lineFromPoints(4, 22, 12, 18), { m: -0.5, b: 24 });
  assert.equal(snap(-0.7499999, 0.05), -0.75);
});

test('level 1: −½ rides to the lodge, 0 coasts to a stop, +½ slides back', () => {
  const st = levelById(1).stages[0];
  const ok = simulateRide(st, [{ m: -0.5, b: 20 }]);
  assert.equal(ok.ok, true, JSON.stringify(ok));
  console.log('L1 ride time', ok.time.toFixed(2), 'max', ok.ok && ok.maxSpeed.toFixed(1));
  const flat = simulateRide(st, [{ m: 0, b: 20 }]);
  assert.equal(flat.ok, false);
  assert.equal(!flat.ok && flat.reason, 'stall');
  const up = simulateRide(st, [{ m: 0.5, b: 20 }]);
  assert.equal(!up.ok && up.reason, 'stall');
  assert.ok(!up.ok && up.reason === 'stall' && up.x < 1.5);
});

test('level 2: −0.75 passes the flag; +0.75 refuses to climb; −0.7 misses the gate', () => {
  const st = levelById(2).stages[0];
  assert.equal(simulateRide(st, [{ m: -0.75, b: 24 }]).ok, true);
  const up = simulateRide(st, [{ m: 0.75, b: 24 }]);
  assert.equal(!up.ok && up.reason, 'stall');
  const near = simulateRide(st, [{ m: -0.7, b: 24 }]);
  assert.equal(!near.ok && near.reason === 'hazard' && near.hazard.kind, 'gate-high');
});

test('wipeout explanation reports the worst point, not the touching point', async () => {
  const { judge } = await import('../src/math/judge.ts');
  const st = levelById(11).stages[0];
  const h = judge(st, [{ m: -0.5, b: 7 }]).first!;
  assert.equal(h.kind, 'rocks');
  assert.equal(h.x, 6); // the track dips below the rocks right after x = 6
  assert.deepEqual(h.worst, { x: 16, trackY: -1, needY: 4 });
});

test('build view leaks nothing about the joint: fog stubs do not move when the lines change', async () => {
  const { buildTrack, fogVisibleRange } = await import('../src/math/track.ts');
  const { LEVELS } = await import('../src/math/levels.ts');
  for (const lv of LEVELS) {
    for (const st of lv.stages) {
      if (st.segments.length < 2) continue;
      const a = st.segments.map((s) => ({ m: s.m.fixed ?? -0.5, b: s.b.fixed ?? 10 }));
      const b = st.segments.map((s) => ({ m: s.m.fixed ?? -1.25, b: s.b.fixed ?? 23.5 }));
      st.segments.forEach((_, i) => {
        assert.deepEqual(fogVisibleRange(st, buildTrack(st, a), i), fogVisibleRange(st, buildTrack(st, b), i), `level ${lv.id} seg ${i}`);
      });
    }
  }
});
