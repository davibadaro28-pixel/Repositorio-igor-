// Captura as telas REAIS do cardápio digital (servidor de demonstração com a marca genérica) para o anúncio.
// Uso: BASE_URL=http://localhost:3400 node capturar.cjs <pasta-de-saída>
// Antes: DEMO_MARCA=generica PORT=3400 npm run demo (banco separado, não mexe nos dados reais).
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3400';
const OUT = path.resolve(process.argv[2] || 'capturas');
fs.mkdirSync(OUT, { recursive: true });
const meta = {};
const VH = 797; // tela do celular sem a barra de status (390 x 844 no total)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Logo de exemplo (a loja troca pelo dela no painel)
const LOGO = (c) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'><circle cx='60' cy='60' r='60' fill='#fffaf6'/><circle cx='60' cy='60' r='51' fill='none' stroke='${c}' stroke-width='1.6' stroke-dasharray='1.5 4.5' stroke-linecap='round'/><g fill='none' stroke='${c}' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'><path d='M31 85h58'/><path d='M37 85V67q0-4 4-4h38q4 0 4 4v18'/><path d='M37 72q5.75 5 11.5 0t11.5 0 11.5 0 11.5 0'/><path d='M45 63V53q0-3 3-3h24q3 0 3 3v10'/><path d='M60 50v-8'/></g><path d='M60 30c4 4 4 8 0 10c-4-2-4-6 0-10z' fill='${c}'/></svg>`)}`;

async function api(token, p, opts = {}) {
  const res = await fetch(BASE + '/api' + p, {
    method: opts.method || 'GET',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`${p}: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function prepare() {
  const token = (await api(null, '/auth/login', { method: 'POST', body: { login: 'admin', password: 'demo1234' } })).token;
  const { store } = await api(token, '/settings');
  const hours = Object.fromEntries(Object.keys(store.hours).map((d) => [d, { active: true, open: '08:00', close: '20:00' }]));
  const base = { ...store, name: 'Sua Doceria Aqui', tagline: 'Bolos e Doces', logo: LOGO('#7d2949'), hours, notice: '',
    theme: { color: '#973358', font: 'script', style: 'renda' } };
  await api(token, '/settings/store', { method: 'PUT', body: base });
  // Só produtos com foto, sem marcas de terceiros (refrigerantes) e destaques com fotos boas
  const products = await api(token, '/products');
  const feature = ['Bolo Premium - Ninho com morango', 'Brownie - Ninho com nutella', 'Bombom de morango - Leite ninho', 'Fatia - Ninho c/ frutas vermelhas', 'Bolo de cenoura com calda'];
  for (const p of products) {
    const hide = !p.image || /coca|guaran|coquinha|água|cobertura extra/i.test(p.name);
    if (hide && p.online) await api(token, `/products/${p.id}`, { method: 'PATCH', body: { online: 0 } });
    const f = feature.includes(p.name);
    if (!!p.featured !== f) await api(token, `/products/${p.id}`, { method: 'PATCH', body: { featured: f ? 1 : 0 } });
  }
  return { token, base };
}

async function settle(page, ms = 700) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('load').catch(() => {});
  // fotos com carregamento preguiçoso: carrega todas (a captura da página inteira precisa delas)
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
    const wait = Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
    await Promise.race([wait, new Promise((r) => setTimeout(r, 8000))]);
  });
  await sleep(ms);
}
const rect = (page, sel) => page.locator(sel).first().evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
const shot = (page, name, opts = {}) => page.screenshot({ path: path.join(OUT, name), ...opts });

(async () => {
  const { token, base } = await prepare();
  const browser = await chromium.launch();
  const mobile = { viewport: { width: 390, height: VH }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' };
  const ctx = await browser.newContext(mobile);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('pageerror', e.message));

  // 1. Cardápio: topo, página inteira (para a rolagem) e posições
  await page.goto(BASE + '/');
  await page.getByRole('heading', { name: 'Sua Doceria Aqui' }).waitFor();
  await settle(page, 1200);
  await shot(page, 'menu-top.png');
  meta.viewport = { w: 390, h: VH };
  meta.nav = await rect(page, 'nav');
  meta.tabs = await page.evaluate(() => [...document.querySelectorAll('nav button')].map((b) => { const r = b.getBoundingClientRect(); return { label: b.textContent.trim() || b.getAttribute('aria-label'), x: r.x, y: r.y, w: r.width, h: r.height }; }));
  meta.header = await rect(page, 'header');
  meta.status = await rect(page, 'header span.rounded-full');
  meta.sections = await page.evaluate(() => [...document.querySelectorAll('[data-sec]')].map((s) => ({ id: s.dataset.sec, top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight })));
  meta.tiles = await page.evaluate(() => [...document.querySelectorAll('main button')].filter((b) => b.querySelector('img')).map((b) => { const r = b.getBoundingClientRect(); return { name: b.querySelector('p')?.textContent, x: r.x, y: r.y + scrollY, w: r.width, h: r.height }; }));
  meta.pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  const H = Math.min(meta.pageHeight, 3600);
  await shot(page, 'menu-strip.png', { fullPage: true, clip: { x: 0, y: 0, width: 390, height: H } });
  meta.stripHeight = H;

  // 2. Barra de categorias presa no topo, em cada seção (o destaque acompanha a rolagem)
  meta.navStates = [];
  for (const s of meta.sections) {
    await page.evaluate((top) => window.scrollTo(0, top - 64), s.top);
    await sleep(1300);
    const file = `nav-${s.id}.png`;
    await shot(page, file, { clip: { x: 0, y: 0, width: 390, height: meta.nav.h } });
    meta.navStates.push({ id: s.id, file, scroll: await page.evaluate(() => scrollY) });
  }

  // 3. Produto: o bolo na lista, a folha do produto, o tamanho escolhido e a sacola
  const tile = page.locator('main button').filter({ hasText: 'Brigadeiro com morango' }).first();
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const tileTop = await tile.evaluate((el) => el.getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => window.scrollTo(0, y - 330), tileTop);
  await settle(page, 1300);
  await shot(page, 'menu-premium.png');
  meta.premiumTile = await tile.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  meta.premiumScroll = await page.evaluate(() => scrollY);
  await tile.click();
  const dlg = page.getByRole('dialog');
  await dlg.waitFor();
  await settle(page, 900);
  await shot(page, 'product-1.png');
  meta.sheet1 = await rect(page, '[role=dialog]');
  const second = dlg.locator('label').filter({ has: page.locator('input[type=radio]') }).nth(1);
  meta.variantRect = await second.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await second.click();
  await sleep(500);
  await shot(page, 'product-2.png');
  meta.addRect = await rect(page, '[role=dialog] button:has-text("Adicionar")');
  await dlg.getByRole('button', { name: /Adicionar ·/ }).click();
  await settle(page, 900);
  await shot(page, 'menu-bag.png');
  meta.bagRect = await rect(page, 'button:has-text("Ver sacola")');

  // 4. Finalização: como receber, encomenda com data e hora, pagamento
  await page.getByRole('button', { name: /Ver sacola/ }).click();
  const co = page.getByRole('dialog');
  await co.waitFor();
  const body = co.locator('.overflow-y-auto').first();
  await settle(page, 700);
  await shot(page, 'checkout-0.png');
  meta.sheetCheckout = await rect(page, '[role=dialog]');
  meta.checkoutBody = await body.evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  meta.agendarRect = await rect(page, '[role=dialog] button:has-text("Agendar encomenda")');
  await co.getByRole('button', { name: /Agendar encomenda/ }).click();
  await sleep(300);
  const selects = co.locator('select');
  await selects.nth(0).selectOption({ index: 1 });
  await sleep(200);
  const times = await selects.nth(1).locator('option').allTextContents();
  await selects.nth(1).selectOption(times.includes('15:00') ? '15:00' : times[Math.min(4, times.length - 1)]);
  await co.getByLabel('Seu nome').fill('Mariana Alves');
  await co.getByLabel('WhatsApp').fill('11987654321');
  await co.locator('select').nth(2).selectOption({ index: 2 });
  await co.getByLabel('Rua / Avenida').fill('Rua das Flores');
  await co.getByLabel('Número').fill('120');
  await co.locator('label').filter({ hasText: /^\s*Pix/ }).first().click().catch(() => {});
  const sectionTop = (re) => body.evaluate((el, src) => {
    const h = [...el.querySelectorAll('h3,label,p')].find((x) => new RegExp(src).test(x.textContent));
    return h ? h.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop : 0;
  }, re);
  meta.checkoutShots = [];
  for (const [file, re] of [['checkout-1.png', null], ['checkout-2.png', '^Seu nome'], ['checkout-3.png', '^Pagamento']]) {
    const y = re ? (await sectionTop(re)) - 12 : 0;
    const top = await body.evaluate((el, v) => { el.scrollTop = v; return el.scrollTop; }, y);
    await settle(page, 500);
    await shot(page, file);
    meta.checkoutShots.push({ file, scrollTop: top });
  }
  meta.checkoutMax = await body.evaluate((el) => el.scrollHeight - el.clientHeight);
  meta.sendRect = await rect(page, '[role=dialog] button:has-text("Enviar pedido")');

  // 5. Pedido enviado: acompanhamento
  await co.getByRole('button', { name: /Enviar pedido/ }).click();
  await page.waitForURL(/\/pedido\//);
  await settle(page, 1200);
  await shot(page, 'track.png');
  meta.orderUrl = page.url();

  // 7. Painel da loja: o pedido chega na hora
  const desk = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await desk.addInitScript((t) => localStorage.setItem('lacos_token', t), token);
  const adm = await desk.newPage();
  await adm.goto(BASE + '/admin/pedidos');
  await settle(adm, 1500);
  await adm.screenshot({ path: path.join(OUT, 'painel-pedidos.png') });
  await adm.goto(BASE + '/admin/encomendas');
  await settle(adm, 1500);
  await adm.screenshot({ path: path.join(OUT, 'painel-encomendas.png') });
  const row = adm.getByText('Mariana Alves').first();
  meta.encRow = await row.evaluate((el) => { let n = el; while (n && n.getBoundingClientRect().width < 300) n = n.parentElement; const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  meta.encCard = await row.evaluate((el) => { let n = el; while (n && !/rounded-2xl|rounded-3xl/.test(n.className)) n = n.parentElement; const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await adm.goto(BASE + '/admin');
  await settle(adm, 1800);
  await adm.screenshot({ path: path.join(OUT, 'painel-inicio.png') });

  // 8. A mesma plataforma com a identidade de outras lojas (cor, fonte e acabamento do topo)
  const themes = [
    { file: 'theme-1.png', name: 'Sua Doceria Aqui', tagline: 'Bolos e Doces', theme: { color: '#973358', font: 'script', style: 'renda' }, logo: '#7d2949' },
    { file: 'theme-2.png', name: 'Seu Café Aqui', tagline: 'Café e Confeitaria', theme: { color: '#6f4a35', font: 'moderna', style: 'onda' }, logo: '#5b3a28' },
    { file: 'theme-3.png', name: 'Sua Confeitaria', tagline: 'Doces Finos', theme: { color: '#2f6f62', font: 'retro', style: 'reto' }, logo: '#24574d' },
    { file: 'theme-4.png', name: 'Seu Ateliê', tagline: 'Bolos de Festa', theme: { color: '#b4532a', font: 'impacto', style: 'onda' }, logo: '#8f3f1f' },
  ];
  const fresh = await browser.newContext(mobile);
  const tp = await fresh.newPage();
  for (const t of themes) {
    await api(token, '/settings/store', { method: 'PUT', body: { ...base, name: t.name, tagline: t.tagline, theme: t.theme, logo: LOGO(t.logo) } });
    await tp.goto(BASE + '/');
    await tp.getByRole('heading', { name: t.name }).waitFor();
    await settle(tp, 1200);
    await tp.screenshot({ path: path.join(OUT, t.file) });
  }
  await api(token, '/settings/store', { method: 'PUT', body: base });

  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('ok', Object.keys(meta).join(', '));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
