import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

// Instalação de outra loja: a hamburgueria em lojas/vs-burger
process.env.LOJA = 'vs-burger';
process.env.DB_PATH = ':memory:';
process.env.ADMIN_PASSWORD = 'admin123';

const { app, renderIndex } = await import('../index.js');
const { setSetting, getSetting } = await import('../db.js');

let server;
let base;
let admin;

async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text();
  return { status: res.status, data };
}

before(async () => {
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
  const store = getSetting('store');
  for (const d of Object.values(store.hours)) Object.assign(d, { active: true, open: '00:00', close: '23:59' });
  setSetting('store', store);
  admin = (await api('/api/auth/login', { method: 'POST', body: { login: 'admin', password: 'admin123' } })).data.token;
});

after(() => server.close());

async function product(name) {
  const { data } = await api('/api/public/menu');
  for (const c of data.categories) for (const p of c.products) if (p.name === name) return p;
  throw new Error('produto não encontrado: ' + name);
}

test('a loja vem da pasta lojas/vs-burger: dados, tema e cardápio', async () => {
  const { data: store } = await api('/api/public/store');
  assert.equal(store.name, 'VS Burger e Gelato');
  assert.equal(store.segment, 'hamburgueria');
  assert.deepEqual({ color: store.theme.color, font: store.theme.font }, { color: '#c8203f', font: 'pixel' });
  assert.equal(store.scheduling_enabled, false);
  assert.ok(!store.payment_methods.some((m) => m.id === 'va'), 'vale-alimentação desligado');
  const { data: menu } = await api('/api/public/menu');
  assert.equal(menu.categories.reduce((n, c) => n + c.products.length, 0), 75);
  const smash = await product('Vs Smash');
  assert.ok(smash.option_groups.some((g) => g.name === 'Ponto da carne' || g.name === 'Ponto da Carne'));
  // logo, fotos e ícones servidos da pasta da loja
  const logo = await fetch(base + '/img/logo.webp');
  assert.equal(logo.status, 200);
  const manifest = await (await fetch(base + '/manifest.webmanifest')).json();
  assert.equal(manifest.short_name, 'VS Burger e Gelato');
  assert.equal(manifest.theme_color, '#c8203f');
});

test('index.html sai com o nome, a cor e a fonte da loja', () => {
  const html = renderIndex('<head><title>Cardápio digital</title><!--loja--></head>');
  assert.match(html, /<title>VS Burger e Gelato – Hamburgueria gamer<\/title>/);
  assert.match(html, /--color-brand-600:#c8203f/);
  assert.match(html, /Pixelify\+Sans/);
});

test('combo família: a mesma opção pode ser escolhida mais de uma vez, até o limite', async () => {
  const combo = await product('Vs Combo Hits 4 Pessoas');
  const lanches = combo.option_groups.find((g) => g.name === 'Escolha seu lanche');
  const bebidas = combo.option_groups.find((g) => /bebida/i.test(g.name));
  const adicionais = combo.option_groups.find((g) => g.name === 'Adicionais');
  assert.ok(lanches.repeat && lanches.min === 4 && lanches.max === 4);
  const pick = (g, name, n) => Array.from({ length: n }, () => ({ group: g.name, name }));
  const bacon = adicionais.options.find((o) => o.name === 'Bacon');
  const item = (extra = []) => ({
    variant_id: combo.variants[0].id, qty: 1,
    options: [...pick(lanches, lanches.options[0].name, 3), ...pick(lanches, lanches.options[1].name, 1), ...pick(bebidas, bebidas.options[0].name, 4), ...extra],
  });
  const ok = await api('/api/orders', { method: 'POST', token: admin, body: { type: 'balcao', channel: 'pdv', payment_method: 'pix', items: [item(pick(adicionais, 'Bacon', 2))] } });
  assert.equal(ok.status, 201, JSON.stringify(ok.data));
  const order = ok.data.order || ok.data;
  assert.equal(order.items[0].unit_price_cents, combo.variants[0].price_cents + 2 * bacon.price_cents);

  const poucos = await api('/api/orders', { method: 'POST', token: admin, body: { type: 'balcao', channel: 'pdv', payment_method: 'pix', items: [{ ...item(), options: item().options.slice(1) }] } });
  assert.equal(poucos.status, 400);
  const demais = await api('/api/orders', { method: 'POST', token: admin, body: { type: 'balcao', channel: 'pdv', payment_method: 'pix', items: [item(pick(adicionais, 'Bacon', 6))] } });
  assert.equal(demais.status, 400);
});

test('aparência: cor e fonte são validadas ao salvar', async () => {
  const cur = (await api('/api/settings', { token: admin })).data.store;
  const saved = await api('/api/settings/store', { method: 'PUT', token: admin, body: { ...cur, segment: 'xyz', theme: { color: 'vermelho', font: 'pixel', style: 'onda' } } });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.segment, 'hamburgueria');
  assert.equal(saved.data.theme.color, '#c8203f');
  assert.equal(saved.data.theme.style, 'onda');
});
