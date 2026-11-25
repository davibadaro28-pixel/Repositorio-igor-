// Renderiza os vídeos quadro a quadro no Chromium (WebGL por software) e monta o MP4 sem som com o ffmpeg.
// Uso:
//   node render.cjs video <pasta-saida> V01 V02 ...   [--paralelo 3]   (grava <id>.mp4 e <id>.cues.json)
//   node render.cjs quadros <pasta-saida> V01 1.2,4.5,9          (grava quadros para conferir)
// Serve a raiz do repositório num servidor local (o motor carrega as telas, as fotos e o three.js por HTTP).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const RAIZ = path.resolve(__dirname, '..', '..');
const TIPOS = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      const f = path.join(RAIZ, decodeURIComponent(req.url.split('?')[0]));
      if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': TIPOS[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}
const ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--font-render-hinting=none'];

async function abre(browser, porta, id) {
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const erros = [];
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); });
  await page.goto(`http://127.0.0.1:${porta}/marketing/videos-hamburgueria/motor/index.html?v=${id}`);
  try { await page.waitForFunction(() => window.READY === true, null, { timeout: 120000 }); }
  catch (e) { throw new Error(`${id}: não carregou: ${erros.join(' | ') || e.message}`); }
  if (erros.length) console.error(`${id}: erros na página: ${erros.join(' | ')}`);
  return page;
}

async function video(browser, porta, id, saida) {
  const page = await abre(browser, porta, id);
  const D = await page.evaluate(() => window.DURATION);
  const cues = await page.evaluate(() => window.CUES);
  const cenas = await page.evaluate(() => window.CENAS);
  fs.writeFileSync(path.join(saida, `${id}.cues.json`), JSON.stringify({ duracao: D, cues, cenas }, null, 1));
  const fps = 30, n = Math.round(D * fps);
  const out = path.join(saida, `${id}.mudo.mp4`);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium', '-r', String(fps), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await page.evaluate((x) => window.renderAt(x), i / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await page.close();
  console.log(`${id}: ${n} quadros em ${((Date.now() - t0) / 1000).toFixed(0)} s`);
}

(async () => {
  const [modo, saida, ...resto] = process.argv.slice(2);
  fs.mkdirSync(saida, { recursive: true });
  const srv = await servidor();
  const porta = srv.address().port;
  if (modo === 'quadros') {
    const [id, ts] = resto;
    const browser = await chromium.launch({ args: ARGS });
    const page = await abre(browser, porta, id);
    console.log(id, 'duração', await page.evaluate(() => window.DURATION), 's');
    let tempos = ts === 'auto' ? (await page.evaluate(() => window.CENAS)).flatMap((c) => [c.t0 + (c.t1 - c.t0) * 0.45, c.t0 + (c.t1 - c.t0) * 0.88]) : ts.split(',').map(Number);
    for (const t of tempos) {
      await page.evaluate((x) => window.renderAt(x), t);
      await page.screenshot({ path: path.join(saida, `${id}-t${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
    }
    await browser.close();
  } else {
    const ip = resto.indexOf('--paralelo');
    const par = ip >= 0 ? Number(resto[ip + 1]) : 3;
    const ids = resto.filter((x, i) => !x.startsWith('--') && (ip < 0 || i !== ip + 1));
    let k = 0;
    const falhas = [];
    await Promise.all(Array.from({ length: Math.min(par, ids.length) }, async () => {
      const browser = await chromium.launch({ args: ARGS });
      while (k < ids.length) {
        const id = ids[k++];
        try { await video(browser, porta, id, saida); } catch (e) { falhas.push(id); console.error('FALHOU', id, e.message); }
      }
      await browser.close();
    }));
    if (falhas.length) console.log('falharam:', falhas.join(' '));
  }
  srv.close();
})().catch((e) => { console.error('FALHOU', e); process.exit(1); });
