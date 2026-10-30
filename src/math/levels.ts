// Authored levels. Every level is proven solvable (and its advertised wrong answers proven to fail) in tests/levels.test.ts.
// Numbers, solution sets and ride times are documented in LEVELS.md; curriculum links in CURRICULUM.md.

import type { LevelSpec, ParamSpec } from './types.ts';

const M_DIAL = { min: -3, max: 3, step: 0.05, initial: 0 };

/** Slope dial (0.05 steps). The range is deliberately wider than the answer on both sides. */
function mDial(min: number, max: number, initial: number): ParamSpec {
  return { min, max, step: 0.05, initial };
}

/** Free-term stepper (0.5 steps). */
function bDial(min: number, max: number, initial: number): ParamSpec {
  return { min, max, step: 0.5, initial };
}

const W1 = ['grade-8/chapter-1/constant-rate-change', 'grade-8/chapter-1/slope-meaning', 'grade-8/chapter-1/slope-sign-parallel'];

export const LEVELS: LevelSpec[] = [
  // ───────────── World 1 — Bunny Hill · גבעת הארנבים ─────────────
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
        segments: [{ id: 'a', x0: 0, x1: 40, m: { choices: [-0.5, 0, 0.5], initial: 0 }, b: { fixed: 20 } }],
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
  {
    id: 3,
    world: 1,
    title: 'גלישה וטיפוס',
    goal: 'צברו מהירות, החליקו על האגם וזנקו מהרמפה.',
    view: { x0: 0, x1: 58, y0: -6, y1: 24 },
    modules: W1,
    stages: [
      {
        id: '3',
        segments: [
          { id: 'a', name: 'ירידה', x0: 0, x1: 16, m: { choices: [-1, 0, 0.25, 0.5], initial: 0 }, b: { fixed: 20 } },
          { id: 'b', name: 'האגם הקפוא', x0: 16, x1: 36, m: { choices: [-1, 0, 0.25, 0.5], initial: 0 }, b: { fixed: 4 } },
          { id: 'c', name: 'רמפת הזינוק', x0: 36, x1: 56, m: { choices: [-1, 0, 0.25, 0.5], initial: 0 }, b: { fixed: -5 }, launch: true },
        ],
        joints: [{ zone: [14, 18] }, { zone: [17, 38] }],
        objects: [],
        finish: { x: 56, y: 9, look: 'powder' },
        hint: {
          points: [[16, 4], [36, 4], [56, 9]],
          text: 'ירידה צוברת מהירות, אגם שטוח שומר עליה, ועלייה תלולה מדי גוזלת אותה.',
        },
      },
    ],
  },
  {
    id: 4,
    world: 1,
    title: 'נתיבים מקבילים',
    goal: 'גלשו ליד החבר בלי להתנגש ועברו בגשר הצר.',
    view: { x0: 0, x1: 44, y0: 0, y1: 32 },
    modules: ['grade-8/chapter-1/slope-sign-parallel', 'grade-8/chapter-1/slope-meaning'],
    stages: [
      {
        id: '4',
        segments: [{ id: 'a', x0: 0, x1: 40, m: mDial(-2, 1, 0), b: { fixed: 24 } }],
        joints: [],
        objects: [
          { kind: 'constraint', id: 'rocks', side: 'above', m: -0.5, b: 23, x0: 12, x1: 32, look: 'rocks' },
          { kind: 'constraint', id: 'bridge', side: 'below', m: -0.5, b: 25, x0: 12, x1: 32, look: 'bridge' },
        ],
        rival: { who: 'friend', m: -0.5, b: 30, x0: 0, x1: 40, goal: 'parallel' },
        finish: { x: 40, y: 4, look: 'hut' },
        hint: { points: [[0, 30], [0, 24]], boundaries: ['rocks', 'bridge'], text: 'ישרים מקבילים יורדים באותו קצב בדיוק.' },
      },
    ],
  },
  {
    id: 5,
    world: 1,
    title: 'העברה: הטבלה של המדריך',
    goal: 'בנו את המסלול לפי הטבלה בלבד.',
    transfer: true,
    view: { x0: 0, x1: 28, y0: 0, y1: 24 },
    modules: ['grade-8/chapter-1/linear-function-representations', 'grade-8/chapter-1/constant-rate-change', 'grade-8/chapter-1/slope-formula'],
    stages: [
      {
        id: '5',
        segments: [{ id: 'a', x0: 0, x1: 24, m: mDial(-2, 1, 0), b: bDial(0, 30, 10) }],
        joints: [],
        objects: [
          { kind: 'gate', id: 'g4', x: 4, y: 15, hideLabel: true },
          { kind: 'gate', id: 'g8', x: 8, y: 12, hideLabel: true },
        ],
        table: { xs: [0, 4, 8], ys: [18, 15, 12] },
        finish: { x: 24, y: 0, look: 'hut' },
        hint: { points: [[0, 18], [4, 15]], text: 'בכל צעד של 4 ב-x, בכמה משתנה y?' },
      },
    ],
  },

  // ───────────── World 2 — Pine Forest · יער האורנים ─────────────
  {
    id: 6,
    world: 2,
    title: 'מאיפה מתחילים?',
    goal: 'השיפוע נתון. מצאו את גובה ההתחלה שיעביר אתכם בשער.',
    view: { x0: 0, x1: 44, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-1/intercepts-and-free-term'],
    stages: [
      {
        id: '6',
        segments: [{ id: 'a', x0: 0, x1: 40, m: { fixed: -0.5 }, b: bDial(0, 30, 10) }],
        joints: [],
        objects: [{ kind: 'gate', id: 'gate', x: 10, y: 15 }],
        finish: { x: 40, y: 0, look: 'hut' },
        hint: { points: [[10, 15]], text: 'מהשער, חזרו אחורה עד x = 0: כמה עליתם בדרך?' },
      },
    ],
  },
  {
    id: 7,
    world: 2,
    title: 'שני דגלים',
    goal: 'עברו דרך שני הדגלים והגיעו לבקתה.',
    view: { x0: 0, x1: 28, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-1/equation-from-points', 'grade-8/chapter-1/slope-formula'],
    stages: [
      {
        id: '7',
        segments: [{ id: 'a', x0: 0, x1: 24, m: mDial(-2, 1, 0), b: bDial(0, 30, 10) }],
        joints: [],
        objects: [
          { kind: 'gate', id: 'f1', x: 4, y: 22, look: 'flag' },
          { kind: 'gate', id: 'f2', x: 12, y: 18, look: 'flag' },
        ],
        finish: { x: 24, y: 12, look: 'hut' },
        hint: { points: [[4, 22], [12, 18]], text: 'מהשיפוע בין הדגלים, חשבו לאחור עד x = 0.' },
      },
    ],
  },
  {
    id: 8,
    world: 2,
    title: 'נקודה ושיפוע',
    goal: 'רכבו לאורך כבל הרכבל הישן עד הבקתה בעמק.',
    view: { x0: 0, x1: 16, y0: 0, y1: 22 },
    modules: ['grade-8/chapter-1/equation-from-points', 'grade-8/chapter-1/intercepts-and-free-term'],
    stages: [
      {
        id: '8',
        segments: [{ id: 'a', x0: 0, x1: 12, m: { fixed: -1.5 }, b: bDial(0, 30, 10) }],
        joints: [],
        objects: [{ kind: 'gate', id: 'cable', x: 6, y: 9, look: 'cable' }],
        finish: { x: 12, y: 0, look: 'hut' },
        hint: { points: [[6, 9], [12, 0]], text: 'הבקתה נמצאת בדיוק איפה שהמסלול פוגש את ציר x.' },
      },
    ],
  },
  {
    id: 9,
    world: 2,
    title: 'המפרק הראשון',
    goal: 'חברו קטע שני לירידה הנתונה והגיעו לבקתה.',
    view: { x0: 0, x1: 44, y0: 0, y1: 32 },
    modules: ['grade-8/chapter-1/equation-from-points', 'grade-8/chapter-7/systems-graphical-solution', 'grade-8/chapter-1/intercepts-and-free-term'],
    stages: [
      {
        id: '9',
        segments: [
          { id: 'a', name: 'הירידה הנתונה', x0: 0, x1: 20, m: { fixed: -1 }, b: { fixed: 30 }, given: true },
          { id: 'b', name: 'אל הבקתה', x0: 20, x1: 40, m: { fixed: -0.5 }, b: bDial(0, 40, 10) },
        ],
        joints: [{ zone: [18, 22] }],
        objects: [],
        finish: { x: 40, y: 0, tol: 0.25, look: 'hut' },
        hint: { points: [[40, 0]], text: 'מהבקתה, חזרו אחורה בקצב הירידה של הקטע השני עד x = 0.' },
      },
    ],
  },
  {
    id: 10,
    world: 2,
    title: 'העברה: מרוץ הרוח',
    goal: 'גלשו בדיוק על המסלול הקפוא הישן כדי להתחרות ברוח.',
    transfer: true,
    mood: 'night',
    view: { x0: 0, x1: 44, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-1/equation-from-graph', 'grade-8/chapter-1/linear-function-representations'],
    stages: [
      {
        id: '10',
        segments: [{ id: 'a', x0: 0, x1: 40, m: mDial(-2, 1, 0), b: bDial(0, 30, 10) }],
        joints: [],
        objects: [],
        // Drawn as a graph only, through the readable grid points (5, 20) and (15, 16).
        rival: { who: 'ghost', m: -0.4, b: 22, x0: 0, x1: 40, goal: 'same', graphOnly: true },
        finish: { x: 40, y: 6, look: 'hut' },
        hint: { points: [[5, 20], [15, 16]], text: 'קראו שתי נקודות על המסלול הישן, ואז המשיכו אותו עד ציר y.' },
      },
    ],
  },

  // ───────────── World 3 — Rock Garden · גן הסלעים ─────────────
  {
    id: 11,
    world: 3,
    title: 'מעל הסלעים, מתחת לענף',
    goal: 'בחרו גובה התחלה שעובר מעל הסלעים ומתחת לענף.',
    view: { x0: 0, x1: 20, y0: 0, y1: 20 },
    modules: ['grade-8/chapter-1/linear-inequality-meaning', 'grade-8/chapter-1/linear-inequality-solving'],
    stages: [
      {
        id: '11',
        segments: [{ id: 'a', x0: 0, x1: 16, m: { fixed: -0.5 }, b: bDial(0, 24, 8), launch: true }],
        joints: [],
        objects: [
          { kind: 'constraint', id: 'rocks', side: 'above', m: 0, b: 4, x0: 0, x1: 16, look: 'rocks' },
          { kind: 'constraint', id: 'branch', side: 'below', m: 0, b: 14.5, x0: 0, x1: 2, strict: true, look: 'branch' },
        ],
        finish: { x: 16, y: 5, tol: 1, look: 'powder' },
        hint: { boundaries: ['rocks', 'branch'], points: [[16, 4], [0, 14.5]], text: 'בדקו את המסלול בנקודה הכי מסוכנת של כל מכשול.' },
      },
    ],
  },
  {
    id: 12,
    world: 3,
    title: 'מתחת לגשר הקרח',
    goal: 'החליקו מתחת לגשר הקרח בלי לגעת בו, ועברו מעל הסלעים.',
    view: { x0: 0, x1: 28, y0: 0, y1: 14 },
    modules: ['grade-8/chapter-1/linear-inequality-meaning', 'grade-8/chapter-1/linear-inequality-solving'],
    stages: [
      {
        id: '12',
        segments: [
          { id: 'a', x0: 0, x1: 14, m: mDial(-2, 0.5, 0), b: { fixed: 10 } },
          { id: 'b', name: 'העמק', x0: 10, x1: 26, m: { fixed: 0 }, b: { fixed: 0 }, given: true },
        ],
        joints: [{ zone: [10, 20] }],
        objects: [
          { kind: 'constraint', id: 'bridge', side: 'below', m: 0, b: 8, x0: 4, x1: 10, strict: true, look: 'bridge' },
          { kind: 'constraint', id: 'rocks', side: 'above', m: 0, b: 0, x0: 8, x1: 10, strict: true, look: 'rocks' },
        ],
        finish: { x: 26, y: 0, look: 'lodge' },
        hint: { boundaries: ['bridge', 'rocks'], points: [[4, 8], [10, 0]], text: 'גשר הקרח נמוך ביותר בתחילתו; הסלעים מסוכנים בסופם.' },
      },
    ],
  },
  {
    id: 13,
    world: 3,
    title: 'קו המפולת',
    goal: 'ברחו מהמסלול אל ערוץ המילוט לפני שהמפולת משיגה אתכם.',
    view: { x0: 0, x1: 34, y0: 0, y1: 32 },
    modules: ['grade-8/chapter-1/linear-inequality-solving', 'grade-8/chapter-7/systems-graphical-solution'],
    stages: [
      {
        id: '13',
        segments: [
          { id: 'a', name: 'המסלול', x0: 0, x1: 16, m: { fixed: -0.5 }, b: { fixed: 24 }, given: true },
          { id: 'b', name: 'ערוץ המילוט', x0: 10, x1: 22, m: { fixed: -2 }, b: bDial(20, 50, 30) },
          { id: 'c', name: 'העמק', x0: 18, x1: 32, m: { fixed: 0 }, b: { fixed: 0 }, given: true },
        ],
        joints: [{ zone: [10, 16] }, { zone: [16, 24] }],
        objects: [{ kind: 'constraint', id: 'avalanche', side: 'below', m: -1, b: 30, x0: 0, x1: 30, look: 'avalanche' }],
        finish: { x: 32, y: 0, look: 'lodge' },
        hint: { boundaries: ['avalanche'], text: 'מצאו עד איזה x המסלול עוד נמצא מתחת לקו המפולת.' },
      },
    ],
  },
  {
    id: 14,
    world: 3,
    title: 'העברה: הכרכוב',
    goal: 'מצאו שיפוע שמשאיר אתכם מעל רכס הסלע ומתחת לכרכוב השלג.',
    transfer: true,
    view: { x0: -8, x1: 28, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-1/linear-inequality-solving', 'grade-8/chapter-1/linear-inequality-meaning', 'grade-8/chapter-1/linear-models'],
    stages: [
      {
        id: '14',
        segments: [
          { id: 'a', name: 'זינוק פתיחה', x0: -8, x1: 0, m: { fixed: -1 }, b: { fixed: 18 }, given: true },
          { id: 'b', name: 'מתחת לכרכוב', x0: 0, x1: 24, m: mDial(-1.5, 1, 0.5), b: { fixed: 18 }, launch: true },
        ],
        joints: [{ zone: [-0.5, 0.5] }],
        objects: [
          { kind: 'constraint', id: 'ridge', side: 'above', m: 0.25, b: 2, x0: 0, x1: 24, look: 'ridge' },
          { kind: 'constraint', id: 'cornice', side: 'below', m: 0, b: 20, x0: 0, x1: 24, look: 'cornice' },
        ],
        finish: { x: 24, y: 14, tol: 6, look: 'powder' },
        hint: { boundaries: ['ridge', 'cornice'], points: [[24, 8], [24, 20]], text: 'שני המכשולים מתקרבים אליכם בסוף הקטע: בדקו שם.' },
      },
    ],
  },

  // ───────────── World 4 — Twin Trails · שבילים תאומים ─────────────
  {
    id: 15,
    world: 4,
    title: 'פגישה עם הכלב',
    goal: 'פגשו את הכלב בבקתה שב-x = 16 והמשיכו איתו יחד.',
    view: { x0: 0, x1: 40, y0: 0, y1: 36 },
    modules: ['grade-8/chapter-7/systems-graphical-solution', 'grade-8/chapter-7/substitution-method', 'grade-8/chapter-1/equation-from-points'],
    stages: [
      {
        id: '15',
        segments: [
          { id: 'a', x0: 0, x1: 16, m: mDial(-2.5, 0.5, -0.5), b: { fixed: 32 } },
          { id: 'b', name: 'יחד עם הכלב', x0: 16, x1: 36, m: { fixed: -0.5 }, b: { fixed: 20 }, given: true },
        ],
        joints: [{ zone: [15.5, 16.5] }],
        objects: [{ kind: 'gate', id: 'meet', x: 16, y: 12, look: 'meet', hideLabel: true }],
        rival: { who: 'dog', m: -0.5, b: 20, x0: 0, x1: 16, goal: 'cross' },
        finish: { x: 36, y: 2, look: 'lodge' },
        hint: { points: [[0, 32]], text: 'הציבו x = 16 במשוואה של הכלב: באיזה גובה הוא יחכה?' },
      },
    ],
  },
  {
    id: 16,
    world: 4,
    title: 'נפגשים, לעולם לא, או תמיד',
    goal: 'שלושה מרוצים: בחרו בכל אחד ישר שמתאים למשימה.',
    view: { x0: 0, x1: 28, y0: 0, y1: 28 },
    modules: ['grade-8/chapter-7/solution-counts-systems', 'grade-8/chapter-7/systems-graphical-solution', 'grade-8/chapter-1/slope-sign-parallel'],
    stages: [
      {
        id: '16a',
        brief: 'מרוץ 1: פגשו את הכלב בנקודה אחת בדיוק (כיף!).',
        segments: [{ id: 'a', x0: 0, x1: 20, m: { choices: [-0.5, -0.75], initial: -0.5 }, b: { choices: [16, 20], initial: 16 } }],
        joints: [],
        objects: [],
        rival: { who: 'dog', m: -0.5, b: 16, x0: 0, x1: 20, goal: 'cross' },
        finish: { x: 20, y: 5, tol: 5, look: 'hut' },
        hint: { text: 'כדי להיפגש בנקודה אחת, הקווים צריכים לרדת בקצב שונה.' },
      },
      {
        id: '16b',
        brief: 'מרוץ 2: גלשו לצד החבר ואל תיפגשו אף פעם.',
        segments: [{ id: 'a', x0: 0, x1: 24, m: { choices: [-0.5, -0.75], initial: -0.5 }, b: { choices: [24, 18], initial: 24 } }],
        joints: [],
        objects: [],
        rival: { who: 'friend', m: -0.75, b: 24, x0: 0, x1: 24, goal: 'parallel' },
        finish: { x: 24, y: 6, tol: 6, look: 'hut' },
        hint: { text: 'מקבילים שונים: אותו שיפוע, איבר חופשי אחר.' },
      },
      {
        id: '16c',
        brief: 'מרוץ 3: גלשו צמוד לרוח לאורך כל הדרך (בונוס טנדם).',
        segments: [{ id: 'a', x0: 0, x1: 24, m: { choices: [-0.25, -0.5], initial: -0.25 }, b: { choices: [14, 18], initial: 14 } }],
        joints: [],
        objects: [],
        rival: { who: 'ghost', m: -0.5, b: 18, x0: 0, x1: 24, goal: 'same' },
        finish: { x: 24, y: 7, tol: 5, look: 'hut' },
        hint: { text: 'כדי לחלוק כל נקודה, צריך את אותו ישר בדיוק.' },
      },
    ],
  },
  {
    id: 17,
    world: 4,
    title: 'ציירו את הגלישה',
    goal: 'בנו מסלול של ארבעה קטעים שהגרף שלו נראה כמו הגרף של המאמן.',
    view: { x0: 0, x1: 44, y0: 0, y1: 24 },
    modules: ['grade-7/chapter-10/function-change', 'grade-7/chapter-10/reading-graphs', 'grade-7/chapter-10/graph-representation', 'grade-8/chapter-1/equation-from-points'],
    stages: [
      {
        id: '17',
        segments: [
          { id: 'a', name: 'יורדת', x0: 0, x1: 12, m: mDial(-2, 1, 0), b: { fixed: 20 } },
          { id: 'b', name: 'קבועה', x0: 12, x1: 20, m: mDial(-2, 1, -0.5), b: bDial(-10, 30, 10) },
          { id: 'c', name: 'עולה', x0: 20, x1: 28, m: mDial(-2, 1, 0), b: bDial(-10, 30, 10) },
          { id: 'd', name: 'יורדת', x0: 28, x1: 40, m: mDial(-2, 1, 0), b: bDial(-10, 50, 10) },
        ],
        joints: [{ zone: [11.5, 12.5] }, { zone: [19.5, 20.5] }, { zone: [27.5, 28.5] }],
        objects: [
          { kind: 'gate', id: 'f1', x: 6, y: 14, tol: 0.15, look: 'flag' },
          { kind: 'gate', id: 'f2', x: 16, y: 8, tol: 0.15, look: 'flag' },
          { kind: 'gate', id: 'f3', x: 22, y: 9, tol: 0.15, look: 'flag' },
          { kind: 'gate', id: 'f4', x: 26, y: 11, tol: 0.15, look: 'flag' },
          { kind: 'gate', id: 'f5', x: 34, y: 6, tol: 0.15, look: 'flag' },
        ],
        // Schematic silhouette, not to scale: down, flat, up to a peak, down.
        shapeGraph: [[0, 4], [3, 1.5], [5, 1.5], [7, 3], [10, 0]],
        finish: { x: 40, y: 0, tol: 0.25, look: 'lodge' },
        hint: { points: [[0, 20], [6, 14], [22, 9], [26, 11]], text: 'הגרף של המאמן אומר לכם את סימן השיפוע של כל קטע; הדגלים אומרים את המספרים.' },
      },
    ],
  },
  {
    id: 18,
    world: 4,
    title: 'הגמר: הירידה מפסגת החרמון',
    goal: 'ארבעה קטעים בערפל, בלי רמזים: הגיעו לבקתה ופגשו את הכלב בדרך.',
    noHints: true,
    transfer: true,
    mood: 'dusk',
    view: { x0: 0, x1: 52, y0: 0, y1: 34 },
    modules: [
      'grade-8/chapter-1/equation-from-points',
      'grade-8/chapter-1/linear-inequality-solving',
      'grade-8/chapter-7/systems-graphical-solution',
      'grade-8/chapter-7/substitution-method',
    ],
    stages: [
      {
        id: '18',
        segments: [
          { id: 'a', name: 'שני דגלים', x0: 0, x1: 20, m: mDial(-2, 1, 0), b: bDial(0, 40, 20) },
          { id: 'b', name: 'בין הסלעים לגשר', x0: 20, x1: 32, m: { fixed: -0.25 }, b: bDial(0, 40, 10) },
          { id: 'c', name: 'מסלול הרכבל הישן', x0: 32, x1: 36, m: { fixed: -1 }, b: { fixed: 44 }, given: true },
          { id: 'd', name: 'אל הכלב', x0: 36, x1: 48, m: mDial(-2, 1, 0), b: bDial(0, 40, 10) },
        ],
        joints: [{ zone: [18, 22] }, { zone: [31, 34] }, { zone: [35.5, 36.5] }],
        objects: [
          { kind: 'gate', id: 'f1', x: 4, y: 27, tol: 0.2, look: 'flag' },
          { kind: 'gate', id: 'f2', x: 12, y: 21, tol: 0.2, look: 'flag' },
          { kind: 'constraint', id: 'bridge', side: 'below', m: 0, b: 15, x0: 22, x1: 30, strict: true, look: 'bridge' },
          { kind: 'constraint', id: 'rocks', side: 'above', m: 0, b: 12, x0: 22, x1: 30, look: 'rocks' },
          { kind: 'gate', id: 'meet', x: 44, y: 6, tol: 0.15, look: 'meet', hideLabel: true },
        ],
        rival: { who: 'dog', m: -0.5, b: 28, x0: 36, x1: 48, goal: 'cross' },
        finish: { x: 48, y: 5, tol: 0.25, look: 'lodge' },
      },
    ],
  },
];

export function levelById(id: number): LevelSpec {
  const l = LEVELS.find((x) => x.id === id);
  if (!l) throw new Error(`no level ${id}`);
  return l;
}
