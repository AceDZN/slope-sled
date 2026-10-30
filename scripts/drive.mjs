// Drive the running game headlessly with real inputs and capture real frames.
// usage: node scripts/drive.mjs [--size=1280x800] [--url=http://localhost:5215/] cmd...
//   click:<css>  key:<Key>  hold:<Key>:<ms>  adv:<ms>  wait:<ms>  shot:<file.png>  text  eval:<js>  reload
import { chromium } from 'playwright';

const args = process.argv.slice(2);
let size = [1280, 800];
let url = 'http://localhost:5215/';
const cmds = [];
for (const a of args) {
  if (a.startsWith('--size=')) size = a.slice(7).split('x').map(Number);
  else if (a.startsWith('--url=')) url = a.slice(6);
  else cmds.push(a);
}
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(url);
await page.waitForFunction(() => typeof window.render_game_to_text === 'function' && !document.getElementById('boot'), null, { timeout: 30000 });
await page.evaluate(() => { try { localStorage.clear(); } catch {} });
for (const c of cmds) {
  const [op, ...rest] = c.split(':');
  const arg = rest.join(':');
  if (op === 'click') await page.click(arg);
  else if (op === 'key') await page.keyboard.press(arg);
  else if (op === 'hold') { const [k, ms] = arg.split(':'); await page.keyboard.down(k); await page.evaluate((m) => window.advanceTime(Number(m)), ms); await page.keyboard.up(k); }
  else if (op === 'adv') await page.evaluate((m) => window.advanceTime(Number(m)), arg);
  else if (op === 'wait') await page.waitForTimeout(Number(arg));
  else if (op === 'shot') { await page.evaluate(() => window.advanceTime(16)); await page.screenshot({ path: arg }); console.log('shot', arg); }
  else if (op === 'text') console.log(await page.evaluate(() => window.render_game_to_text()));
  else if (op === 'eval') console.log(JSON.stringify(await page.evaluate(arg)));
  else if (op === 'reload') { await page.reload(); await page.waitForFunction(() => !document.getElementById('boot')); }
}
if (errors.length) console.log('CONSOLE:', errors.slice(0, 20).join('\n'));
await browser.close();
