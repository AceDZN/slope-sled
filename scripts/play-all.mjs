// Plays every authored level in a real browser with key presses only (no state injection),
// riding the verified solution from LEVELS.md, and saves a build + result screenshot per level.
// usage: node scripts/play-all.mjs <outdir> [levelIds...]
import { chromium } from 'playwright';
import fs from 'node:fs';

const SOL = {
  1: [[[-0.5, 20]]], 2: [[[-0.75, 24]]], 3: [[[-1, 20], [0, 4], [0.25, -5]]], 4: [[[-0.5, 24]]], 5: [[[-0.75, 18]]],
  6: [[[-0.5, 20]]], 7: [[[-0.5, 24]]], 8: [[[-1.5, 18]]], 9: [[null, [-0.5, 20]]], 10: [[[-0.4, 22]]],
  11: [[[-0.5, 13]]], 12: [[[-0.75, 10]]], 13: [[null, [-2, 40]]], 14: [[[-0.2, 18]]], 15: [[[-1.25, 32]]],
  16: [[[-0.75, 16]], [[-0.75, 18]], [[-0.5, 18]]], 17: [[[-1, 20], [0, 8], [0.5, -2], [-1, 40]]],
  18: [[[-0.75, 30], [null, 20], null, [-0.25, 17]]],
};
const out = process.argv[2];
const only = process.argv.slice(3).map(Number);
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
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
        for (let guard = 0; guard < 400; guard++) {
          s = await st();
          const cur = s.segments[k][key];
          const chosen = s.segments[k].chosen;
          if (Math.abs(cur - t[idx]) < 1e-6 && chosen) break;
          if (s.segments.length === 1 && s.segments[0].choices && key === 'm') {
            await page.keyboard.press(String(s.segments[0].choices.indexOf(t[idx]) + 1));
            continue;
          }
          await page.keyboard.press(cur < t[idx] || !chosen && cur === t[idx] ? up : down);
        }
      }
    }
    await adv(200);
    if (si === 0) await page.screenshot({ path: `${out}/L${id}-build.png` });
    s = await st();
    await page.keyboard.press('Enter');
    for (let i = 0; i < 60 && (await st()).mode !== 'result'; i++) await adv(500);
    s = await st();
    outcome = s.outcome;
    if (si === stages.length - 1 || outcome !== 'success') {
      await page.screenshot({ path: `${out}/L${id}-result.png` });
      results.push({ id: Number(id), stage: si + 1, outcome, params: s.segments.map((x) => x.equation), explanation: outcome === 'success' ? '' : s.explanation });
      break;
    }
    await page.click('[data-a=next]');
    await adv(300);
  }
}
console.log(JSON.stringify(results, null, 1));
if (errors.length) console.log('ERRORS', errors.slice(0, 10));
await browser.close();
