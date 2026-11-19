// Renders the README screenshots from src/app.html with made-up demo plants (no real data).
// Needs Playwright with Chromium:  node scripts/screenshots.js
// Writes docs/screenshots/{today,plants,plant,family}.png. hero.png is these three side by side.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = (f) => path.join(root, 'docs', 'screenshots', f);
const html = fs.readFileSync(path.join(root, 'src', 'app.html'), 'utf8');
const today = new Date(); const ago = (n) => { const d = new Date(today); d.setDate(d.getDate() - n); return d.toISOString().slice(0,10); };
const data = {
  rooms: [
    { id: 'living', name: 'Living room', facing: 'S', light: 'bright', cats: 'everywhere' },
    { id: 'kitchen', name: 'Kitchen', facing: 'E', light: 'medium', cats: 'some' },
    { id: 'bedroom', name: 'Bedroom', facing: 'N', light: 'low', cats: 'closed' },
  ],
  plants: [
    { id: 'p1', name: 'Big Leaf', common: 'Monstera', species: 'Monstera deliciosa', roomId: 'living', waterEvery: 7, lastWatered: ago(8), catReach: 'yes', care: { lightNeed: 'bright indirect' }, log: [] },
    { id: 'p2', common: 'Golden pothos', species: 'Epipremnum aureum', roomId: 'kitchen', waterEvery: 7, lastWatered: ago(7), catReach: 'no', log: [] },
    { id: 'p3', name: 'Mother snake', common: 'Snake plant', species: 'Sansevieria trifasciata', roomId: 'living', waterEvery: 21, lastWatered: ago(3), log: [] },
    { id: 'p4', common: 'Snake plant', species: 'Sansevieria trifasciata', roomId: 'bedroom', waterEvery: 21, lastWatered: ago(3), parentId: 'p3', origin: { t: 'division', d: ago(30) }, log: [] },
    { id: 'p5', common: 'Snake plant', species: 'Sansevieria trifasciata', roomId: 'kitchen', waterEvery: 21, lastWatered: ago(10), parentId: 'p3', origin: { t: 'division', d: ago(30) }, log: [] },
    { id: 'p6', common: 'Chinese money plant', species: 'Pilea peperomioides', roomId: 'kitchen', waterEvery: 9, lastWatered: ago(1), log: [] },
    { id: 'p7', common: 'Spider plant', species: 'Chlorophytum comosum', roomId: 'bedroom', waterEvery: 6, lastWatered: ago(6), log: [] },
    { id: 'p8', common: 'Jade plant', species: 'Crassula ovata', roomId: 'living', waterEvery: 18, lastWatered: ago(5), log: [] },
    { id: 'p9', common: 'String of hearts', species: 'Ceropegia woodii', roomId: 'living', waterEvery: 12, lastWatered: ago(2), log: [] },
    { id: 'p10', common: 'Nerve plant', species: 'Fittonia albivenis', roomId: 'bedroom', waterEvery: 4, lastWatered: ago(5), log: [] },
  ],
  props: [ { id: 'c1', parentId: 'p2', species: 'Epipremnum aureum', taken: ago(14), qty: 3, method: 'water', status: 'rooting' } ],
  checkins: [],
};
const mock = `(() => { const DATA = ${JSON.stringify(data)};
  const coll = (n) => ({ onSnapshot(cb){ setTimeout(()=>cb({docs:(DATA[n]||[]).map(d=>({id:d.id,data:()=>{const {id,...r}=d;return r;}}))}),0); return ()=>{}; },
    doc:(id)=>({update:async()=>{},set:async()=>{},delete:async()=>{}}), add: async()=>({id:'x'}) });
  window.claude = { use: async (k) => k === 'db' ? { collection: coll } : { upload: async()=>{}, delete: async()=>{} } };
})();`;
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><script>' + mock + '</script></head><body>' + html + '</body></html>', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out('today.png') });
  await page.click('button[data-tab="plants"]'); await page.waitForTimeout(400);
  await page.screenshot({ path: out('plants.png') });
  await page.click('button[data-tab="today"]'); await page.waitForTimeout(300);
  await page.evaluate(() => { S.sheetPlant = 'p3'; openSheet(plantSheet(getPlant('p3'))); });
  await page.waitForTimeout(700);
  // scroll sheet to family section
  await page.screenshot({ path: out('plant.png') });
  await page.evaluate(() => { const h = [...document.querySelectorAll('h2,h3,.group-h')].find(e => /Family/.test(e.textContent)); if (h) h.scrollIntoView({block:'start'}); });
  await page.waitForTimeout(400);
  await page.screenshot({ path: out('family.png') });
  await b.close();
})();
