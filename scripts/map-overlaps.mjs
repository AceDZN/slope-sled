// Reports overlapping level-flag buttons on the 3D map (they must never cover each other).
import { chromium } from 'playwright';
const sizes = process.argv.slice(2).length ? process.argv.slice(2) : ['1280x800', '390x844', '1672x941'];
const browser = await chromium.launch();
for (const sz of sizes) {
  const [w, h] = sz.split('x').map(Number);
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(process.env.URL ?? 'http://localhost:5215/');
  await page.waitForFunction(() => !document.getElementById('boot'));
  const res = await page.evaluate(() => {
    window.__game.setMode('select');
    window.advanceTime(3000);
    const rects = [...document.querySelectorAll('.mapflag')].map((e) => ({ id: e.dataset.i, r: e.getBoundingClientRect(), vis: e.parentElement.style.display !== 'none' }));
    const signs = [...document.querySelectorAll('.map-sign')].map((e) => ({ r: e.getBoundingClientRect(), vis: e.style.display !== 'none' }));
    const over = [];
    const inter = (a, b) => Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) if (inter(rects[i].r, rects[j].r) > 4) over.push(`${rects[i].id}/${rects[j].id}`);
    const signOver = [];
    signs.forEach((s, k) => rects.forEach((f) => { if (s.vis && inter(s.r, f.r) > 4) signOver.push(`sign${k + 1}/${f.id}`); }));
    const off = rects.filter((f) => !f.vis || f.r.right < 0 || f.r.left > innerWidth || f.r.top < 0 || f.r.bottom > innerHeight).map((f) => f.id);
    const signsOff = signs.filter((s) => !s.vis || s.r.right < 0 || s.r.left > innerWidth || s.r.top < 0 || s.r.bottom > innerHeight).length;
    return { over, signOver, off, signsOff };
  });
  console.log(sz, JSON.stringify(res));
  await page.close();
}
await browser.close();
