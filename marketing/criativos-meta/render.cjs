// Renderiza as páginas geradas por gerar.py em PNG.
// Uso: node render.cjs <pasta-html> <pasta-png> [filtro]
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

(async () => {
  const [dirHtml, dirPng, filtro] = process.argv.slice(2);
  fs.mkdirSync(dirPng, { recursive: true });
  const lista = JSON.parse(fs.readFileSync(path.join(dirHtml, 'lista.json'), 'utf8'))
    .filter((p) => !filtro || p.nome.includes(filtro));
  const browser = await chromium.launch();
  const problemas = {};
  for (const p of lista) {
    const page = await browser.newPage({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(dirHtml, p.nome + '.html'), { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.__ok === true, null, { timeout: 20000 });
    await page.evaluate(() => Promise.all([...document.images].map((i) => i.complete || new Promise((r) => { i.onload = i.onerror = r; }))));
    await page.waitForTimeout(150);
    const probs = await page.evaluate(() => window.__probs);
    if (probs.length) problemas[p.nome] = probs;
    await page.screenshot({ path: path.join(dirPng, p.nome + '.png') });
    await page.close();
  }
  await browser.close();
  console.log(lista.length, 'imagens');
  console.log(Object.keys(problemas).length ? JSON.stringify(problemas, null, 1) : 'sem problemas de layout');
})();
