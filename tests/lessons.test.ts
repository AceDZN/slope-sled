import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, LEVEL_LESSON, LEVEL_DIFFICULTY } from '../src/game/lessons.ts';
import { levelById, LEVELS } from '../src/math/levels.ts';
import { num } from '../src/math/format.ts';

test('every level has a difficulty tag and every lesson id exists', () => {
  for (const l of LEVELS) assert.ok(LEVEL_DIFFICULTY[l.id], `level ${l.id}`);
  for (const id of Object.values(LEVEL_LESSON)) assert.ok(LESSONS[id], id);
});

test('lesson cards never quote the answer of the level they open', () => {
  // Answers taken from LEVELS.md (slope / free term that solve each lesson's level).
  const answers: Record<number, number[]> = { 1: [-0.5], 2: [-0.75], 4: [-0.5], 6: [20], 7: [-0.5, 24], 9: [20], 11: [12, 12.5, 13, 13.5, 14], 15: [-1.25], 17: [], 18: [] };
  for (const [lvl, id] of Object.entries(LEVEL_LESSON)) {
    const text = LESSONS[id].lines.join(' ');
    for (const a of answers[Number(lvl)] ?? []) {
      const s = num(a);
      // Allow generic single digits used as concept examples (0, 1, 2) but never the exact decimal/large answer.
      if (Math.abs(a) < 3 && Number.isInteger(a)) continue;
      assert.ok(!text.includes(s), `lesson ${id} quotes ${s}, the answer to level ${lvl} (${levelById(Number(lvl)).title})`);
    }
  }
});
