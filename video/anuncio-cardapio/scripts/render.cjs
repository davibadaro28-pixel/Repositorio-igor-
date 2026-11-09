// Renderiza a composição (comp/index.html) quadro a quadro com o Chromium e monta o vídeo com o ffmpeg.
// Uso:
//   node render.cjs video <saida.mp4> [--fps 30] [--escala 1] [--de 0] [--ate 39]
//   node render.cjs quadros <pasta> 1.2,5.4,9.0 [--escala 0.5]
//   node render.cjs marcas <cues.json>        (marcações de som definidas na composição)
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const [mode, out, third] = process.argv.slice(2);
const arg = (name, def) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? Number(process.argv[i + 1]) : def; };
const scale = arg('escala', 1);
const COMP = 'file://' + path.resolve(__dirname, '..', 'comp', 'index.html');

(async () => {
  const browser = await chromium.launch({ args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--font-render-hinting=none'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  await page.goto(COMP);
  await page.waitForFunction(() => window.READY !== undefined);
  await page.evaluate(() => window.READY);
  const frame = page.locator('#frame');
  const D = await page.evaluate(() => window.DURATION);

  if (mode === 'marcas') {
    fs.writeFileSync(out, JSON.stringify({ duration: D, cues: await page.evaluate(() => window.CUES) }, null, 2));
    console.log('marcas salvas em', out);
  } else if (mode === 'quadros') {
    fs.mkdirSync(out, { recursive: true });
    for (const t of third.split(',').map(Number)) {
      await page.evaluate((x) => window.renderAt(x), t);
      await frame.screenshot({ path: path.join(out, `t${t.toFixed(2).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
    }
    console.log('quadros em', out);
  } else {
    const fps = arg('fps', 30);
    const from = arg('de', 0);
    const to = arg('ate', D);
    const n = Math.round((to - from) * fps);
    const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', scale < 1 ? '22' : '14', '-preset', scale < 1 ? 'veryfast' : 'slow',
      '-r', String(fps), '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const started = Date.now();
    for (let i = 0; i < n; i++) {
      const t = from + i / fps;
      await page.evaluate((x) => window.renderAt(x), t);
      const buf = await frame.screenshot({ type: 'jpeg', quality: 96 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
      if (i % 60 === 0) process.stdout.write(`\r${i}/${n} quadros (${((Date.now() - started) / 1000).toFixed(0)} s)`);
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    console.log(`\nvídeo: ${out} (${n} quadros em ${((Date.now() - started) / 1000).toFixed(0)} s)`);
  }
  await browser.close();
})().catch((e) => { console.error('FALHOU', e); process.exit(1); });
