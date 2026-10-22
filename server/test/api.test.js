import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.ADMIN_PASSWORD = 'admin123';

const { app } = await import('../index.js');
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
  base = `http://127.0.0.1:${server.address().port}/api`;
  // loja sempre aberta durante os testes
  const store = getSetting('store');
  for (const d of Object.values(store.hours)) Object.assign(d, { active: true, open: '00:00', close: '23:59' });
  setSetting('store', store);
  admin = (await api('/auth/login', { method: 'POST', body: { login: 'admin', password: 'admin123' } })).data.token;
});

after(() => server.close());

async function menuVariant(name) {
  const { data } = await api('/public/menu');
  for (const c of data.categories) for (const p of c.products) if (p.name === name) return { product: p, variant: p.variants[0] };
  throw new Error('produto não encontrado: ' + name);
}

const customer = { name: 'Maria Teste', phone: '(11) 98888-7777' };

test('cardápio público lista o catálogo real', async () => {
  const { status, data } = await api('/public/menu');
  assert.equal(status, 200);
  assert.ok(data.categories.length >= 10);
  const names = data.categories.flatMap((c) => c.products.map((p) => p.name));
  assert.ok(names.includes('Bolo Premium - Ninho com morango'));
});

test('pedido do cardápio usa o preço do servidor e baixa estoque ao confirmar', async () => {
  const { variant } = await menuVariant('Bombom de morango - Leite ninho');
  const zone = (await api('/public/store')).data.zones[0];
  const created = await api('/public/orders', {
    method: 'POST',
    body: {
      type: 'entrega', customer, zone_id: zone.id, payment_method: 'pix',
      address: { street: 'Rua A', number: '10' },
      items: [{ variant_id: variant.id, qty: 2, unit_price_cents: 1 }], // preço enviado pelo cliente é ignorado
    },
  });
  assert.equal(created.status, 201, JSON.stringify(created.data));
  const order = (await api(`/orders/${created.data.id}`, { token: admin })).data;
  assert.equal(order.subtotal_cents, variant.price_cents * 2);
  assert.equal(order.total_cents, variant.price_cents * 2 + zone.fee_cents);
  assert.equal(order.status, 'novo');
  assert.ok(order.cost_cents > 0, 'CMV calculado pela ficha técnica');

  const ings = async () => (await api('/ingredients', { token: admin })).data.find((i) => i.name === 'Morango').stock_qty;
  const before = await ings();
  await api(`/orders/${order.id}/status`, { method: 'POST', token: admin, body: { status: 'preparo' } });
  assert.equal(await ings(), before - 60);

  // cancelar devolve o estoque
  await api(`/orders/${order.id}/status`, { method: 'POST', token: admin, body: { status: 'cancelado', reason: 'teste' } });
  assert.equal(await ings(), before);

  const pub = await api(`/public/orders/${created.data.code}`);
  assert.equal(pub.data.status, 'cancelado');
  assert.equal(pub.data.cost_cents, undefined, 'custo não aparece para o cliente');
});

test('pedido público valida dados obrigatórios', async () => {
  const { variant } = await menuVariant('Coca-Cola');
  const r1 = await api('/public/orders', { method: 'POST', body: { type: 'retirada', customer: { name: 'X', phone: '123' }, payment_method: 'pix', items: [{ variant_id: variant.id, qty: 1 }] } });
  assert.equal(r1.status, 400);
  const r2 = await api('/public/orders', { method: 'POST', body: { type: 'balcao', customer, payment_method: 'pix', items: [{ variant_id: variant.id, qty: 1 }] } });
  assert.equal(r2.status, 400);
});

test('produto só por encomenda exige agendamento com antecedência', async () => {
  const { variant } = await menuVariant('Bolo de banana com canela');
  const r = await api('/public/orders', { method: 'POST', body: { type: 'retirada', customer, payment_method: 'pix', items: [{ variant_id: variant.id, qty: 1 }] } });
  assert.equal(r.status, 400);
  assert.match(r.data.error, /antecedência/);
});

test('combo com escolha obrigatória de sabor', async () => {
  const { product, variant } = await menuVariant('Torta+ bolo gelado + Coquinha GRÁTIS');
  const group = product.option_groups[0];
  const bad = await api('/public/orders', { method: 'POST', body: { type: 'retirada', customer, payment_method: 'pix', items: [{ variant_id: variant.id, qty: 1 }] } });
  assert.equal(bad.status, 400);
  const ok = await api('/public/orders', {
    method: 'POST',
    body: { type: 'retirada', customer, payment_method: 'pix', items: [{ variant_id: variant.id, qty: 1, options: [{ group: group.name, name: group.options[0].name }] }] },
  });
  assert.equal(ok.status, 201, JSON.stringify(ok.data));
});

test('PDV: venda no balcão com caixa aberto, pagamento dividido e fechamento', async () => {
  await api('/cash/open', { method: 'POST', token: admin, body: { opening_cents: 10000 } });
  const { variant } = await menuVariant('Bolo Premium - Ninho com morango');
  const total = variant.price_cents;
  const sale = await api('/orders', {
    method: 'POST', token: admin,
    body: {
      type: 'balcao', status: 'concluido', channel: 'pdv', customer,
      items: [{ variant_id: variant.id, qty: 1 }],
      payments: [{ method: 'dinheiro', amount_cents: 5000 }, { method: 'credito', amount_cents: total - 5000 }],
    },
  });
  assert.equal(sale.status, 201, JSON.stringify(sale.data));
  assert.equal(sale.data.paid, 1);
  await api('/cash/movement', { method: 'POST', token: admin, body: { type: 'sangria', amount_cents: 2000, note: 'troco banco' } });
  const cur = (await api('/cash/current', { token: admin })).data;
  assert.equal(cur.expected.dinheiro, 10000 + 5000 - 2000);
  assert.equal(cur.expected.credito, total - 5000);
  const closed = (await api('/cash/close', { method: 'POST', token: admin, body: { counted: { dinheiro: 13000 } } })).data;
  assert.equal(closed.status, 'fechado');
});

test('cupom percentual e fidelidade', async () => {
  const c = await api('/coupons', { method: 'POST', token: admin, body: { code: 'doce10', type: 'percent', value: 10 } });
  assert.equal(c.status, 201);
  const { variant } = await menuVariant('Brownie - Tradicional');
  const v = await api('/public/coupon', { method: 'POST', body: { code: 'DOCE10', subtotal_cents: variant.price_cents * 2 } });
  assert.equal(v.data.discount_cents, Math.round(variant.price_cents * 2 * 0.1));
  const o = await api('/public/orders', {
    method: 'POST',
    body: { type: 'retirada', customer, payment_method: 'dinheiro', coupon_code: 'doce10', items: [{ variant_id: variant.id, qty: 2 }] },
  });
  const id = o.data.id;
  for (const s of ['confirmado', 'preparo', 'pronto', 'concluido']) {
    const r = await api(`/orders/${id}/status`, { method: 'POST', token: admin, body: { status: s } });
    assert.equal(r.status, 200, JSON.stringify(r.data));
  }
  const done = (await api(`/orders/${id}`, { token: admin })).data;
  assert.equal(done.paid, 1, 'pagamento registrado ao concluir');
  assert.ok(done.points_awarded > 0);
});

test('financeiro: conta recorrente, fluxo e DRE', async () => {
  const cats = (await api('/finance/categories', { token: admin })).data;
  const aluguel = cats.find((c) => c.name === 'Aluguel');
  const today = new Date().toISOString().slice(0, 10);
  const r = await api('/finance/entries', {
    method: 'POST', token: admin,
    body: { type: 'despesa', category_id: aluguel.id, description: 'Aluguel loja', amount_cents: 250000, due_date: today, status: 'pago', repeat_months: 3 },
  });
  assert.equal(r.data.ids.length, 3);
  const dre = (await api('/finance/dre', { token: admin })).data;
  assert.ok(dre.receita_liquida > 0);
  assert.ok(dre.despesas.some((d) => d.categoria === 'Aluguel'));
  const flow = (await api('/finance/cashflow', { token: admin })).data;
  assert.ok(flow.days.length >= 28);
});

test('permissões: cozinha não acessa financeiro nem cancela pedido', async () => {
  await api('/users', { method: 'POST', token: admin, body: { name: 'Cozinha', login: 'cozinha', role: 'cozinha', password: 'cozinha1' } });
  const k = (await api('/auth/login', { method: 'POST', body: { login: 'cozinha', password: 'cozinha1' } })).data.token;
  assert.equal((await api('/finance/dre', { token: k })).status, 403);
  const board = await api('/orders/board', { token: k });
  assert.equal(board.status, 200);
  const anyOrder = board.data[0];
  if (anyOrder) {
    assert.equal((await api(`/orders/${anyOrder.id}/status`, { method: 'POST', token: k, body: { status: 'cancelado' } })).status, 403);
  }
  assert.equal((await api('/finance/dre')).status, 401);
});

test('backup do banco só para administrador', async () => {
  const res = await fetch(`${base}/backup`, { headers: { authorization: `Bearer ${admin}` } });
  assert.equal(res.status, 200);
  const head = Buffer.from(await res.arrayBuffer()).subarray(0, 15).toString();
  assert.equal(head, 'SQLite format 3');
  const k = (await api('/auth/login', { method: 'POST', body: { login: 'cozinha', password: 'cozinha1' } })).data.token;
  assert.equal((await api('/backup', { token: k })).status, 403);
});

test('relatórios e dashboard respondem', async () => {
  const d = await api('/reports/dashboard', { token: admin });
  assert.equal(d.status, 200);
  assert.equal(d.data.last30.length, 30);
  const s = await api('/reports/summary', { token: admin });
  assert.ok(s.data.orders > 0);
  const csv = await api('/reports/orders.csv', { token: admin });
  assert.match(csv.data, /Pedido;Data/);
});
