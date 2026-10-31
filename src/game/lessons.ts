// "New skill" lesson cards shown the first time a concept appears, plus per-level difficulty tags.
// Content follows the Workbook modules listed in CURRICULUM.md; diagrams are small inline SVGs.
import { ltr } from '../math/format.ts';

export type Difficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'transfer' | 'final' | 'expert';

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  tutorial: 'הדרכה',
  easy: 'קל',
  medium: 'בינוני',
  hard: 'מאתגר',
  transfer: 'העברה',
  final: 'גמר',
  expert: 'מומחה',
};

export const LEVEL_DIFFICULTY: Record<number, Difficulty> = {
  1: 'tutorial', 2: 'easy', 3: 'medium', 4: 'medium', 5: 'transfer',
  6: 'easy', 7: 'medium', 8: 'medium', 9: 'hard', 10: 'transfer',
  11: 'easy', 12: 'medium', 13: 'hard', 14: 'transfer',
  15: 'medium', 16: 'medium', 17: 'hard', 18: 'final',
};

export interface Lesson {
  id: string;
  title: string;
  /** Workbook term(s) introduced. */
  term: string;
  lines: string[];
  svg: string;
  url: string;
}

const W = 'https://math.workbook.co.il';

// Mini graph frame: x grows left → right (always drawn LTR).
function frame(inner: string): string {
  return `<svg viewBox="0 0 220 130" width="220" height="130" direction="ltr" class="lesson-svg">
    <defs><marker id="ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#9fd8ff"/></marker></defs>
    <line x1="18" y1="112" x2="208" y2="112" stroke="#9fd8ff" stroke-width="2" marker-end="url(#ah)"/>
    <line x1="18" y1="112" x2="18" y2="8" stroke="#9fd8ff" stroke-width="2" marker-end="url(#ah)"/>
    <text x="206" y="126" fill="#cfe8ff" font-size="12">x</text><text x="4" y="14" fill="#cfe8ff" font-size="12">y</text>
    ${inner}</svg>`;
}

export const LESSONS: Record<string, Lesson> = {
  slope: {
    id: 'slope',
    title: 'שיפוע: לאן המסלול הולך',
    term: 'שיפוע · עולה / יורדת / קבועה',
    lines: [
      `ציר ${ltr('x')} גדל <b>משמאל לימין</b> — גם כשהמסך בעברית.`,
      `שיפוע <b>שלילי</b> = ירידה (טסים!), שיפוע ${ltr('0')} = מישור (מאטים), שיפוע <b>חיובי</b> = עלייה (נעצרים).`,
    ],
    svg: frame(`<line x1="30" y1="20" x2="90" y2="70" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><text x="40" y="92" fill="#ffd2b0" font-size="13">−</text>
      <line x1="100" y1="60" x2="150" y2="60" stroke="#35d0ff" stroke-width="5" stroke-linecap="round"/><text x="120" y="80" fill="#bff0ff" font-size="13">0</text>
      <line x1="160" y1="95" x2="205" y2="45" stroke="#b56cff" stroke-width="5" stroke-linecap="round"/><text x="185" y="100" fill="#e6d0ff" font-size="13">+</text>`),
    url: `${W}/grade-8/chapter-1/slope-meaning`,
  },
  riseRun: {
    id: 'riseRun',
    title: 'שיפוע = עלייה חלקי ריצה',
    term: 'שיפוע · קצב השתנות',
    lines: [
      `בוחרים שתי נקודות על הישר: ${ltr('m = Δy ÷ Δx')} — השינוי בגובה חלקי השינוי במרחק.`,
      `ירדנו 3 מ׳ לאורך 12 מ׳? ${ltr('m = −3 ÷ 12 = −0.25')}. לא להפך (${ltr('12 ÷ 3')})!`,
    ],
    svg: frame(`<line x1="30" y1="24" x2="190" y2="104" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/>
      <line x1="60" y1="39" x2="160" y2="39" stroke="#fff" stroke-dasharray="5 4" stroke-width="2"/><line x1="160" y1="39" x2="160" y2="89" stroke="#fff" stroke-dasharray="5 4" stroke-width="2"/>
      <text x="95" y="33" fill="#fff" font-size="13">Δx</text><text x="166" y="68" fill="#fff" font-size="13">Δy</text>
      <circle cx="60" cy="39" r="4" fill="#ffc93c"/><circle cx="160" cy="89" r="4" fill="#ffc93c"/>`),
    url: `${W}/grade-8/chapter-1/slope-formula`,
  },
  parallel: {
    id: 'parallel',
    title: 'ישרים מקבילים',
    term: 'ישרים מקבילים',
    lines: [`ישרים מקבילים הם ישרים עם <b>אותו שיפוע</b>. הם לא נפגשים — לא קרוב ולא "רחוק מאוד".`],
    svg: frame(`<line x1="30" y1="30" x2="200" y2="90" stroke="#c79bff" stroke-width="5" stroke-linecap="round"/><line x1="30" y1="55" x2="200" y2="115" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/>`),
    url: `${W}/grade-8/chapter-1/slope-sign-parallel`,
  },
  intercept: {
    id: 'intercept',
    title: 'האיבר החופשי b',
    term: 'האיבר החופשי · חיתוך עם ציר y',
    lines: [
      `ב־${ltr('y = mx + b')}, המספר ${ltr('b')} הוא הגובה של הישר כש־${ltr('x = 0')} — איפה הוא חותך את ציר ${ltr('y')}.`,
      `זה <b>לא</b> החיתוך עם ציר ${ltr('x')}! שם ${ltr('y = 0')}.`,
    ],
    svg: frame(`<line x1="18" y1="40" x2="170" y2="112" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><circle cx="18" cy="40" r="6" fill="#ffc93c"/><text x="26" y="36" fill="#ffe7a0" font-size="13">b</text><circle cx="170" cy="112" r="5" fill="#9fd8ff"/>`),
    url: `${W}/grade-8/chapter-1/intercepts-and-free-term`,
  },
  twoPoints: {
    id: 'twoPoints',
    title: 'משוואת ישר משתי נקודות',
    term: 'משוואת ישר',
    lines: [`1. מחשבים שיפוע משתי הנקודות. 2. מציבים נקודה אחת ב־${ltr('y = mx + b')} ומוצאים את ${ltr('b')}.`],
    svg: frame(`<line x1="20" y1="30" x2="200" y2="100" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><circle cx="60" cy="46" r="6" fill="#ffc93c"/><circle cx="150" cy="81" r="6" fill="#ffc93c"/>`),
    url: `${W}/grade-8/chapter-1/equation-from-points`,
  },
  joint: {
    id: 'joint',
    title: 'מפרק = נקודת חיתוך',
    term: 'פתרון גרפי של מערכת · נקודת חיתוך',
    lines: [
      `שני קטעים מתחברים רק איפה ששני הישרים <b>נחתכים</b> — הפתרון של מערכת שתי המשוואות.`,
      `אם נקודת החיתוך מחוץ לאזור החיבור 🔩 — נשאר חור. ישרים מקבילים לא נחתכים בכלל.`,
    ],
    svg: frame(`<rect x="100" y="8" width="34" height="104" fill="#ffe27a33"/><line x1="20" y1="20" x2="130" y2="85" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><line x1="100" y1="70" x2="205" y2="105" stroke="#35d0ff" stroke-width="5" stroke-linecap="round"/><circle cx="117" cy="76" r="6" fill="#fff"/>`),
    url: `${W}/grade-8/chapter-7/systems-graphical-solution`,
  },
  inequality: {
    id: 'inequality',
    title: 'אי-שוויון: מעל או מתחת',
    term: 'אי-שוויון',
    lines: [
      `${ltr('y ≥ 6')}: המסלול חייב להיות <b>מעל</b> הסלעים (או בדיוק עליהם). ${ltr('y < 18')}: <b>מתחת</b> לענף (בלי לגעת).`,
      `${ltr('>')} ו־${ltr('<')} בלי קו תחתון — אסור אפילו לגעת. בודקים את שני קצוות הקטע!`,
    ],
    svg: frame(`<rect x="18" y="80" width="190" height="32" fill="#ff5a4e55"/><line x1="18" y1="80" x2="208" y2="80" stroke="#ffb0a8" stroke-dasharray="6 4" stroke-width="2"/>
      <rect x="18" y="8" width="190" height="22" fill="#35d0ff44"/><line x1="18" y1="30" x2="208" y2="30" stroke="#d8f6ff" stroke-dasharray="6 4" stroke-width="2"/>
      <line x1="20" y1="44" x2="205" y2="70" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/>`),
    url: `${W}/grade-8/chapter-1/linear-inequality-meaning`,
  },
  meet: {
    id: 'meet',
    title: 'פגישה = פתרון המערכת',
    term: 'פתרון גרפי של מערכת',
    lines: [`איפה שני מסלולים נפגשים? ב־${ltr('x')} שבו לשני הישרים אותו ${ltr('y')}. מחשבים את גובה הכלב שם — ואז את השיפוע שלכם.`],
    svg: frame(`<line x1="20" y1="20" x2="200" y2="100" stroke="#ff7a1a" stroke-width="5" stroke-linecap="round"/><line x1="20" y1="60" x2="200" y2="80" stroke="#c79bff" stroke-width="5" stroke-linecap="round"/><circle cx="155" cy="80" r="7" fill="#3ee08f"/>`),
    url: `${W}/grade-8/chapter-7/systems-graphical-solution`,
  },
  counts: {
    id: 'counts',
    title: 'פתרון יחיד, אין פתרון, אינסוף',
    term: 'מספר הפתרונות של מערכת',
    lines: [
      `שיפועים שונים → נפגשים פעם אחת (פתרון יחיד).`,
      `אותו שיפוע, ${ltr('b')} שונה → מקבילים, לא נפגשים (אין פתרון). אותו ישר בדיוק → אינסוף פתרונות.`,
    ],
    svg: frame(`<line x1="20" y1="30" x2="80" y2="100" stroke="#ff7a1a" stroke-width="4"/><line x1="20" y1="90" x2="80" y2="40" stroke="#c79bff" stroke-width="4"/>
      <line x1="90" y1="40" x2="140" y2="90" stroke="#ff7a1a" stroke-width="4"/><line x1="105" y1="40" x2="155" y2="90" stroke="#c79bff" stroke-width="4"/>
      <line x1="160" y1="40" x2="205" y2="90" stroke="#ff7a1a" stroke-width="7"/><line x1="160" y1="40" x2="205" y2="90" stroke="#c79bff" stroke-width="3" stroke-dasharray="5 4"/>`),
    url: `${W}/grade-8/chapter-7/solution-counts-systems`,
  },
  graphShape: {
    id: 'graphShape',
    title: 'קוראים גרף: עולה, יורדת, קבועה',
    term: 'פונקציה עולה / יורדת / קבועה · נקודת שיא',
    lines: [`קטע יורד = שיפוע שלילי, קטע קבוע = ${ltr('0')}, קטע עולה = חיובי. בנקודת השיא הגרף מפסיק לעלות ומתחיל לרדת.`],
    svg: frame(`<polyline points="20,25 70,70 110,70 150,40 205,105" fill="none" stroke="#ff7a1a" stroke-width="5" stroke-linejoin="round"/><circle cx="150" cy="40" r="6" fill="#ffc93c"/>`),
    url: `${W}/grade-7/chapter-10/function-change`,
  },
  final: {
    id: 'final',
    title: 'הירידה הגדולה',
    term: 'הכול ביחד — בלי רמזים',
    lines: [`ארבעה קטעים: משוואה משתי נקודות, חלון אי-שוויונות, מפרק בנקודת חיתוך ופגישה עם הכלב. בהצלחה!`],
    svg: frame(`<polyline points="20,20 70,50 120,62 160,95 205,105" fill="none" stroke="#ff7a1a" stroke-width="5" stroke-linejoin="round"/>`),
    url: `${W}/grade-8/chapter-7/systems-graphical-solution`,
  },
};

/** Which lesson card opens a level (shown the first time that level is entered). */
export const LEVEL_LESSON: Record<number, string> = {
  1: 'slope', 2: 'riseRun', 4: 'parallel', 6: 'intercept', 7: 'twoPoints', 9: 'joint',
  11: 'inequality', 15: 'meet', 16: 'counts', 17: 'graphShape', 18: 'final',
};
