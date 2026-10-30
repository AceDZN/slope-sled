// One-line worked explanations (Hebrew, numbers in LTR spans) built from the ride outcome.
import type { RideOutcome } from '../math/ride.ts';
import type { StageSpec } from '../math/types.ts';
import { ltr, num, equation } from '../math/format.ts';

export interface Explanation {
  title: string;
  subtitle: string;
  /** Comparison rows: [label, value html, tone]. */
  rows: Array<[string, string, 'bad' | 'need']>;
  text: string;
  /** Plain-text version for render_game_to_text. */
  plain: string;
}

const WHO: Record<string, string> = { dog: 'הכלב', friend: 'החבר', ghost: 'מסלול הרוח', rival: 'היריב' };

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

export function explain(outcome: RideOutcome, stage: StageSpec): Explanation {
  const mk = (title: string, subtitle: string, rows: Explanation['rows'], text: string): Explanation => ({
    title,
    subtitle,
    rows,
    text,
    plain: strip(`${title} ${subtitle}. ${rows.map((r) => `${r[0]} ${r[1]}`).join(', ')}. ${text}`),
  });
  if (outcome.ok) return mk('יש!', 'הגעתם!', [], 'המסלול שלכם עבד.');

  if (outcome.reason === 'stall') {
    const m = outcome.slope;
    const at = ltr(`x = ${num(outcome.x, 1)}`);
    if (m > 1e-9) {
      return mk('אופס!', 'המזחלת נעצרה בעלייה', [['שיפוע המקטע', ltr(num(m)), 'bad']],
        `שיפוע חיובי פירושו עלייה: ככל ש־x גדל, הגובה עולה. בעלייה עם שיפוע ${ltr(num(m))} המהירות נגמרה ב־${at} והמזחלת גלשה אחורה.`);
    }
    if (Math.abs(m) <= 1e-9) {
      return mk('אופס!', 'נעצרתם על המישור', [['שיפוע המקטע', ltr('0'), 'bad']],
        `שיפוע 0 הוא קו ישר אופקי — הגובה לא משתנה, אז אין מה שיאיץ אתכם. עצרתם ב־${at}.`);
    }
    return mk('אופס!', 'הירידה מתונה מדי', [['שיפוע המקטע', ltr(num(m)), 'bad']],
      `בשיפוע ${ltr(num(m))} החיכוך עם השלג חזק יותר מהירידה. עצרתם ב־${at}.`);
  }

  const h = outcome.hazard;
  const x = ltr(`x = ${num(h.x, 2)}`);
  const you = ltr(`y = ${num(h.trackY, 2)}`);
  const need = ltr(`y = ${num(h.needY, 2)}`);
  switch (h.kind) {
    case 'rocks': {
      const c = h.constraint!;
      const op = c.strict ? '>' : '≥';
      const rhs = equation(c.m, c.b).replace('y = ', '');
      return mk('אופס!', c.look === 'ridge' ? 'פגעתם ברכס הסלעים' : 'נתקעתם בסלע', [['המסלול', you, 'bad'], ['הסלע', need, 'need']],
        `ב־${x} המסלול שלכם בגובה ${ltr(num(h.trackY, 2))}, והסלעים מגיעים עד ${ltr(num(h.needY, 2))}. המסלול צריך לקיים ${ltr(`y ${op} ${rhs}`)} — לעבור מעל.`);
    }
    case 'branch': {
      const c = h.constraint!;
      const op = c.strict ? '<' : '≤';
      const rhs = equation(c.m, c.b).replace('y = ', '');
      const what = { branch: 'נתקעתם בענף', bridge: 'התנגשתם בגשר הקרח', avalanche: 'נכנסתם לאזור המפולת', cornice: 'התנגשתם בכרכוב השלג' }[c.look as string] ?? 'התנגשתם';
      const thing = { branch: 'הענף', bridge: 'הגשר', avalanche: 'גבול המפולת', cornice: 'הכרכוב' }[c.look as string] ?? 'הגבול';
      return mk('אופס!', what, [['המסלול', you, 'bad'], [thing, need, 'need']],
        `ב־${x} המסלול שלכם בגובה ${ltr(num(h.trackY, 2))}, ו${thing} בגובה ${ltr(num(h.needY, 2))}. המסלול צריך לקיים ${ltr(`y ${op} ${rhs}`)} — לעבור מתחת${c.strict ? ' (לא לגעת)' : ''}.`);
    }
    case 'gate-high':
    case 'gate-low':
      return mk('אופס!', h.kind === 'gate-high' ? 'עפתם מעל השער' : 'נכנסתם בקיר הקרח', [['המסלול', you, 'bad'], ['השער', need, 'need']],
        `ב־${x} המסלול שלכם בגובה ${ltr(num(h.trackY, 2))}, אבל הפתח בשער בגובה ${ltr(num(h.needY, 2))}.`);
    case 'gap': {
      const j = h.joint!;
      const zone = ltr(`${num(j.zone[0])} ≤ x ≤ ${num(j.zone[1])}`);
      if (j.reason === 'parallel') {
        return mk('אופס!', 'המקטעים לא התחברו', [['מקטע ' + h.seg, ltr(`y = ${num(h.trackY, 2)}`), 'bad'], ['מקטע ' + (h.seg + 1), ltr(`y = ${num(h.needY, 2)}`), 'need']],
          `לשני הישרים אותו שיפוע — הם מקבילים, ולכן אין להם נקודת חיתוך בכלל. נשאר חור באזור החיבור ${zone}.`);
      }
      return mk('אופס!', 'נפלתם בחור בין המקטעים', [['נקודת החיתוך', ltr(`x = ${num(j.solutionX ?? h.x, 2)}`), 'bad'], ['אזור החיבור', zone, 'need']],
        `שני הישרים נחתכים ב־${ltr(`x = ${num(j.solutionX ?? h.x, 2)}`)} — מחוץ לאזור החיבור ${zone}, אז שם אין גשר ביניהם.`);
    }
    case 'finish-high':
      return mk('אופס!', 'עפתם מעל הבקתה', [['המסלול', you, 'bad'], ['הבקתה', need, 'need']],
        `ב־${x} המסלול שלכם בגובה ${ltr(num(h.trackY, 2))}, והדלת של הבקתה בגובה ${ltr(num(h.needY, 2))}.`);
    case 'finish-low':
      return mk('אופס!', 'נחתתם בשלג מתחת לבקתה', [['המסלול', you, 'bad'], ['הבקתה', need, 'need']],
        `ב־${x} המסלול שלכם בגובה ${ltr(num(h.trackY, 2))}, והדלת של הבקתה בגובה ${ltr(num(h.needY, 2))}.`);
    case 'collide': {
      const who = WHO[stage.rival?.who ?? 'rival'];
      return mk('בום!', `התנגשתם ב${who}`, [['נקודת החיתוך', ltr(`(${num(h.x, 2)}, ${num(h.trackY, 2)})`), 'bad']],
        `לישרים שיפועים שונים, ולכן הם נחתכים בנקודה אחת: ${ltr(`x = ${num(h.x, 2)}`)}. רצינו שלא תיפגשו — צריך ישר מקביל.`);
    }
    case 'never-met': {
      const who = WHO[stage.rival?.who ?? 'rival'];
      return mk('אוי…', `לא נפגשתם עם ${who}`, [],
        `לשני הישרים אותו שיפוע ואיבר חופשי שונה — ישרים מקבילים לא נפגשים אף פעם. למערכת אין פתרון.`);
    }
    case 'not-tandem':
      return mk('כמעט!', 'לא רכבתם יחד', [],
        `כדי לרכוב צמודים כל הדרך צריך את אותו ישר בדיוק — אותו שיפוע ואותו איבר חופשי. אז יש אינסוף נקודות משותפות.`);
    case 'tangled':
      return mk('אופס!', 'הסתבכתם זה בזה', [],
        `בחרתם בדיוק את אותו הישר — כל הנקודות משותפות (אינסוף פתרונות), אז נתקעתם יחד מההתחלה.`);
  }
}

export const CHEERS = ['יש! איזו ירידה!', 'וואו! נחיתה מושלמת!', 'מעולה! הכלב גאה בך!', 'ככה גולשים!'];
