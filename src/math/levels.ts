// Authored levels. Every level is proven solvable (and its advertised wrong answers proven to fail) in tests/levels.test.ts.

import type { LevelSpec } from './types.ts';

const M_DIAL = { min: -3, max: 3, step: 0.05, initial: 0 };

export const LEVELS: LevelSpec[] = [
  {
    id: 1,
    world: 1,
    title: 'הירידה הראשונה',
    goal: 'הגיעו מנקודת ההתחלה אל בקתת הסקי.',
    fullPreview: true,
    view: { x0: 0, x1: 44, y0: 0, y1: 24 },
    modules: ['grade-8/chapter-1/slope-meaning', 'grade-8/chapter-1/slope-sign-parallel'],
    stages: [
      {
        id: '1',
        segments: [{ id: 'a', x0: 0, x1: 40, m: { choices: [-0.5, 0, 0.5] }, b: { fixed: 20 } }],
        joints: [],
        objects: [],
        finish: { x: 40, y: 0, look: 'lodge' },
        hint: { points: [[0, 20], [40, 0]], text: 'כמה יורדים לכל מטר שמתקדמים ימינה?' },
      },
    ],
  },
  {
    id: 2,
    world: 1,
    title: 'עלייה חלקי ריצה',
    goal: 'עברו דרך שער הקרח והגיעו לבקתה.',
    view: { x0: 0, x1: 36, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-1/slope-formula', 'grade-8/chapter-1/slope-meaning'],
    stages: [
      {
        id: '2',
        segments: [{ id: 'a', x0: 0, x1: 32, m: { ...M_DIAL }, b: { fixed: 24 } }],
        joints: [],
        objects: [{ kind: 'gate', id: 'flag', x: 16, y: 12 }],
        finish: { x: 32, y: 0, look: 'hut' },
        hint: { points: [[0, 24], [16, 12]], text: 'השיפוע הוא השינוי בגובה חלקי השינוי במרחק.' },
      },
    ],
  },
];

export function levelById(id: number): LevelSpec {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}
