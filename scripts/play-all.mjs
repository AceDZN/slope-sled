// Plays every authored level in a real browser with key presses only (no state injection),
// riding the verified solution from LEVELS.md, and saves a build + result screenshot per level.
// usage: node scripts/play-all.mjs <outdir> [levelIds...]
import { chromium } from 'playwright';
import fs from 'node:fs';

const SOL = {
  1: [[[-0.5, 20]]], 2: [[[-0.75, 24]]], 3: [[[-1, 20], [0, 4], [0.25, -5]]], 4: [[[-0.5, 24]]], 5: [[[-0.75, 18]]],
  6: [[[-0.5, 20]]], 7: [[[-0.5, 24]]], 8: [[[-1.5, 18]]], 9: [[null, [-0.5, 20]]], 10: [[[-0.4, 22]]],
  11: [[[-0.5, 13]]], 12: [[[-0.75, 10]]], 13: [[null, [-2, 40]]], 14: [[null, [-0.2, null]]], 15: [[[-1.25, 32]]],
  16: [[[-0.75, 16]], [[-0.75, 18]], [[-0.5, 18]]], 17: [[[-1, 20], [0, 8], [0.5, -2], [-1, 40]]],
  18: [[[-0.75, 30], [null, 20], null, [-0.25, 17]]],
};
const out = process.argv[2];
const only = process.argv.slice(3).map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(process.env.W ?? 960), height: Number(process.env.H ?? 600) } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
await page.goto(process.env.URL ?? 'http://localhost:5215/');
await page.waitForFunction(() => !document.getElementById('boot'));
const st = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text()));
const adv = (ms) => page.evaluate((m) => window.advanceTime(m), ms);
const results = [];
for (const [id, stages] of Object.entries(SOL)) {
  if (only.length && !only.includes(Number(id))) continue;
  await page.evaluate((i) => window.__game.loadLevel(i), Number(id));
  await adv(300);
  if ((await st()).lesson) { await page.keyboard.press('Enter'); await adv(100); }
  let outcome = null;
  for (let si = 0; si < stages.length; si++) {
    const segs = stages[si];
    let s = await st();
    for (let k = 0; k < segs.length; k++) {
      const t = segs[k];
      if (!t) continue;
      const seg = s.segments[k];
      if (seg.given) continue;
      if (s.segments.length > 1) await page.keyboard.press(String(k + 1));
      for (const [key, idx, up, down] of [['m', 0, 'ArrowUp', 'ArrowDown'], ['b', 1, 'ArrowRight', 'ArrowLeft']]) {
        if (t[idx] === null || t[idx] === undefined || !seg.editable[key]) continue;
        if (key === 'm' && s.segments.length === 1 && s.segments[0].choices) {
          await page.keyboard.press(String(s.segments[0].choices.indexOf(t[idx]) + 1));
          continue;
        }
        if (key === 'm' && seg.choices) {
          // Choice lists cycle with ↑/↓ from the current option.
          for (let g = 0; g < 8; g++) {
            s = await st();
            if (Math.abs(s.segments[k].m - t[idx]) < 1e-6 && s.segments[k].chosen) break;
            await page.keyboard.press(s.segments[k].choices.indexOf(s.segments[k].m) < seg.choices.indexOf(t[idx]) ? up : down);
          }
          continue;
        }
        if (key === 'b' && seg.bChoices) {
          for (let g = 0; g < 6; g++) {
            s = await st();
            if (Math.abs(s.segments[k].b - t[idx]) < 1e-6) break;
            await page.keyboard.press(s.segments[k].b < t[idx] ? up : down);
          }
          continue;
        }
        // Dials: press the exact number of steps (0.05 for m, 0.5 for b), then verify.
        const step = key === 'm' ? 0.05 : 0.5;
        const n = Math.round((t[idx] - seg[key]) / step);
        for (let p = 0; p < Math.abs(n); p++) await page.keyboard.press(n > 0 ? up : down);
        s = await st();
        if (Math.abs(s.segments[k][key] - t[idx]) > 1e-6) console.log(`WARN level ${id} seg ${k} ${key}: got ${s.segments[k][key]} want ${t[idx]}`);
      }
    }
    await adv(200);
    if (si === 0 && process.env.SHOTS) await page.screenshot({ path: `${out}/L${id}-build.png` });
    s = await st();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 60 && (await st()).mode !== 'result'; i++) await adv(500);
    s = await st();
    outcome = s.outcome;
    if (si === stages.length - 1 || outcome !== 'success') {
      if (process.env.SHOTS) await page.screenshot({ path: `${out}/L${id}-result.png` });
      const r = { id: Number(id), stage: si + 1, outcome, rideTime: s.ride?.t, params: s.segments.map((x) => x.equation), explanation: outcome === 'success' ? '' : s.explanation };
      results.push(r);
      console.log('RESULT', JSON.stringify(r));
      if (process.env.WRONG && outcome === 'success') {
        // Retry, then break the slope of the selected segment on purpose and ride again.
        await page.keyboard.press('r');
        await adv(200);
        s = await st();
        const sel = s.segments[s.selectedSegment - 1];
        if (sel?.editable.m && !sel.choices) {
          for (let p = 0; p < 5; p++) await page.keyboard.press('ArrowUp');
        } else if (sel?.editable.b) {
          for (let p = 0; p < 3; p++) await page.keyboard.press('ArrowRight');
        } else if (sel?.choices) {
          await page.keyboard.press('ArrowUp');
        }
        await adv(100);
        s = await st();
        const eqs = s.segments.map((x) => x.equation);
        await page.keyboard.press('Enter');
        for (let i = 0; i < 60 && (await st()).mode !== 'result'; i++) await adv(500);
        s = await st();
        await page.screenshot({ path: `${out}/L${id}-wrong.png` });
        console.log('WRONG', JSON.stringify({ id: Number(id), outcome: s.outcome, params: eqs, explanation: s.explanation }));
      }
      break;
    }
    await page.click('[data-a=next]');
    await adv(300);
  }
}
console.log(JSON.stringify(results, null, 1));
if (errors.length) console.log('ERRORS', errors.slice(0, 10));
await browser.close();
