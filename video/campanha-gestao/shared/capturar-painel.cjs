// Captura as telas REAIS do painel de gestão (dados de demonstração) para a campanha.
// Uso: BASE_URL=http://localhost:3400 node capturar-painel.cjs <pasta-de-saída>
// Antes: DEMO_MARCA=generica PORT=3400 npm run demo (banco separado) e o prepare de video/anuncio-cardapio/scripts/capturar.cjs
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:3400';
const OUT = path.resolve(process.argv[2] || 'painel');
fs.mkdirSync(OUT, { recursive: true });
const meta = {};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

async function settle(page, ms = 900) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; });
    const wait = Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })));
    await Promise.race([wait, new Promise((r) => setTimeout(r, 6000))]);
  });
  await sleep(ms);
}

// retângulo do cartão que contém um texto (título de seção, rótulo de indicador)
const cardOf = (page, text) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('body *')].find((e) => e.childElementCount === 0 && e.textContent.trim().startsWith(t));
  if (!el) return null;
  let n = el;
  while (n && n !== document.body) {
    const cs = getComputedStyle(n);
    if (parseFloat(cs.borderTopLeftRadius) >= 12 && n.getBoundingClientRect().width > 160 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') break;
    n = n.parentElement;
  }
  const r = (n && n !== document.body ? n : el).getBoundingClientRect();
  return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
}, text);
const rowOf = (page, text) => page.evaluate((t) => {
  const el = [...document.querySelectorAll('td,th,div,span,p')].find((e) => e.childElementCount === 0 && e.textContent.trim().startsWith(t));
  if (!el) return null;
  const row = el.closest('tr') || el.parentElement;
  const r = row.getBoundingClientRect();
  return { x: r.x, y: r.y + scrollY, w: r.width, h: r.height };
}, text);

(async () => {
  const token = (await api(null, '/auth/login', { method: 'POST', body: { login: 'admin', password: 'demo1234' } })).token;
  const browser = await browser0();
  async function browser0() { return chromium.launch(); }
  const desk = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await desk.addInitScript((t) => localStorage.setItem('lacos_token', t), token);
  const p = await desk.newPage();
  p.on('pageerror', (e) => console.log('pageerror', e.message));
  const shot = async (name, opts = {}) => { await p.screenshot({ path: path.join(OUT, name), ...opts }); };
  const go = async (route, ms = 1600) => { await p.goto(BASE + route); await settle(p, ms); };

  // Início (dashboard)
  await go('/admin', 2200);
  await shot('d-inicio.png');
  meta.inicio = {};
  for (const t of ['Vendas hoje', 'Pedidos hoje', 'Ticket médio', 'Pedidos em aberto', 'Faturamento dos últimos 30 dias', 'Mais vendidos (7 dias)', 'Estoque baixo', 'Vendas de hoje por canal', 'Contas a pagar', 'Encomendas (próximos 3 dias)']) meta.inicio[t] = await cardOf(p, t);
  await shot('d-inicio-full.png', { fullPage: true });
  meta.inicioHeight = await p.evaluate(() => document.documentElement.scrollHeight);

  // Pedidos: quadro antes e depois de um pedido novo chegar (tempo real)
  await go('/admin/pedidos', 1800);
  await shot('d-pedidos.png');
  const menu = await api(null, '/public/menu');
  const prod = menu.categories.flatMap((c) => c.products).find((x) => /Brigadeiro com morango/.test(x.name));
  const zone = (await api(null, '/public/store')).zones[1];
  await api(null, '/public/orders', { method: 'POST', body: { type: 'entrega', customer: { name: 'Juliana Prado', phone: '11976543210' }, zone_id: zone.id, payment_method: 'pix', address: { street: 'Rua das Acácias', number: '45' }, items: [{ variant_id: prod.variants[1].id, qty: 1 }] } });
  await sleep(2500);
  await shot('d-pedidos-novo.png');
  meta.novoCard = await cardOf(p, 'Juliana Prado');
  // custo estimado do pedido (gaveta do pedido)
  await p.getByText('Juliana Prado').first().click();
  await settle(p, 1200);
  await shot('d-pedido-custo.png');
  meta.custoRow = await rowOf(p, 'Custo estimado (CMV)');
  meta.totalRow = await rowOf(p, 'Total');
  await p.keyboard.press('Escape');

  // Financeiro: contas, fluxo de caixa, DRE
  await go('/admin/financeiro', 1800);
  await shot('d-fin-contas.png');
  await p.getByRole('button', { name: 'Fluxo de caixa' }).click(); await settle(p, 1500);
  await shot('d-fin-fluxo.png');
  await p.getByRole('button', { name: 'DRE' }).click(); await settle(p, 1500);
  await shot('d-fin-dre.png');
  meta.dre = {};
  for (const t of ['Vendas de produtos', 'Receita líquida', '(−) CMV', '(−) Comissões iFood e 99Food', '(−) Taxas de cartão', 'Lucro bruto', 'Despesas operacionais', 'Resultado do período']) meta.dre[t] = await rowOf(p, t);
  meta.dreTable = await cardOf(p, 'Demonstrativo de resultado');

  // Estoque e CMV
  await go('/admin/estoque', 1800);
  await shot('d-estoque.png');
  meta.valorEstoque = await rowOf(p, 'Valor em estoque');
  await p.getByRole('button', { name: 'Custo dos produtos (CMV)' }).click(); await settle(p, 1500);
  await shot('d-estoque-cmv.png');
  await p.getByRole('button', { name: 'Movimentações' }).click(); await settle(p, 1500);
  await shot('d-estoque-mov.png');

  // Produtos com margem, relatórios, clientes, caixa, cozinha, encomendas, cupons
  for (const [route, file, ms] of [['/admin/produtos', 'd-produtos.png'], ['/admin/relatorios', 'd-relatorios.png', 2200], ['/admin/clientes', 'd-clientes.png'],
    ['/admin/caixa', 'd-caixa.png'], ['/admin/cozinha', 'd-cozinha.png'], ['/admin/encomendas', 'd-encomendas.png'], ['/admin/cupons', 'd-cupons.png'], ['/admin/entregas', 'd-entregas.png']]) {
    await go(route, ms || 1600);
    await shot(file);
  }
  await go('/admin/relatorios', 2200);
  await shot('d-relatorios-full.png', { fullPage: true });
  meta.relatorios = {};
  for (const t of ['Faturamento por canal', 'Ticket médio', 'Comissão apps', 'Faturamento por dia', 'Pedidos por horário', 'Por forma de pagamento', 'Produtos vendidos']) meta.relatorios[t] = await cardOf(p, t);
  await go('/admin/clientes', 1600);
  await p.locator('tbody tr').first().click().catch(() => {});
  await settle(p, 1200);
  await shot('d-cliente.png');

  // Celular: o painel na palma da mão
  const mob = await browser.newContext({ viewport: { width: 390, height: 797 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
  await mob.addInitScript((t) => localStorage.setItem('lacos_token', t), token);
  const m = await mob.newPage();
  for (const [route, file] of [['/admin', 'm-inicio.png'], ['/admin/pedidos', 'm-pedidos.png'], ['/admin/estoque', 'm-estoque.png'], ['/admin/relatorios', 'm-relatorios.png']]) {
    await m.goto(BASE + route); await settle(m, 1800);
    await m.screenshot({ path: path.join(OUT, file) });
  }
  await m.goto(BASE + '/admin/financeiro'); await settle(m, 1500);
  await m.getByRole('button', { name: 'DRE' }).click(); await settle(m, 1500);
  await m.screenshot({ path: path.join(OUT, 'm-dre.png'), fullPage: true });
  await m.goto(BASE + '/admin'); await settle(m, 1800);
  await m.screenshot({ path: path.join(OUT, 'm-inicio-full.png'), fullPage: true });

  fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 2));
  console.log('ok', Object.keys(meta).join(', '));
  await browser.close();
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
