import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';

// Servidores que imitam as APIs do iFood e da 99Food, registrando o que o sistema enviou
function fakeApi(handler) {
  const calls = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const call = { method: req.method, url: req.url, body, headers: req.headers };
      calls.push(call);
      const out = handler(call) ?? { status: 200, body: {} };
      res.writeHead(out.status || 200, { 'content-type': 'application/json' });
      res.end(out.raw ?? (out.body === undefined ? '' : JSON.stringify(out.body)));
    });
  });
  return { server, calls };
}

const IFOOD_ORDER = {
  id: 'a1b2c3d4-ifood', displayId: '4821', orderType: 'DELIVERY', orderTiming: 'IMMEDIATE', createdAt: '2026-10-22T15:00:00Z',
  customer: { name: 'Joana Lima', phone: { number: '0800 705 2000', localizer: '55443322' } },
  items: [{ name: 'Brownie Tradicional iFood', externalCode: '', quantity: 2, unitPrice: 24, totalPrice: 48, options: [], observations: 'sem nozes' }],
  total: { subTotal: 48, deliveryFee: 6.99, benefits: 0, orderAmount: 54.99 },
  payments: { prepaid: 54.99, pending: 0, methods: [{ value: 54.99, method: 'CREDIT', type: 'ONLINE' }] },
  delivery: { deliveredBy: 'IFOOD', deliveryAddress: { streetName: 'Rua A', streetNumber: '10', neighborhood: 'Penha' } },
};

let ifoodEvents = [];
let ifoodActionsFail = false;
const ifoodApi = fakeApi(({ method, url }) => {
  if (url.startsWith('/authentication/')) return { body: { accessToken: 'tok-ifood', type: 'bearer', expiresIn: 21600 } };
  if (url.startsWith('/events/v1.0/events:polling')) {
    const ev = ifoodEvents;
    ifoodEvents = [];
    return ev.length ? { body: ev } : { status: 204 };
  }
  if (url.startsWith('/events/v1.0/events/acknowledgment')) return { status: 202 };
  if (method === 'GET' && url === `/order/v1.0/orders/${IFOOD_ORDER.id}`) return { body: IFOOD_ORDER };
  if (method === 'POST' && url.startsWith('/order/v1.0/orders/')) return ifoodActionsFail ? { status: 500, body: { message: 'indisponível' } } : { status: 202 };
  return { status: 404, body: {} };
});

const food99Api = fakeApi(({ url }) => {
  if (url.startsWith('/v1/auth/authtoken/get')) return { body: { errno: 0, errmsg: 'ok', data: { auth_token: 'tok-99', token_expiration_time: Math.floor(Date.now() / 1000) + 86400 } } };
  if (url.startsWith('/v1/order/')) return { body: { errno: 0, errmsg: 'ok', data: true } };
  return { status: 404 };
});

let base;
let admin;
let app;
let srv;

async function api(path, { method = 'GET', body, token = admin, headers = {}, raw } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw ?? (body ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const listen = (s) => new Promise((r) => s.listen(0, () => r(`http://127.0.0.1:${s.address().port}`)));
async function waitFor(fn, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('tempo esgotado esperando');
}

before(async () => {
  process.env.IFOOD_API_URL = await listen(ifoodApi.server);
  process.env.FOOD99_API_URL = await listen(food99Api.server);
  process.env.DB_PATH = ':memory:';
  process.env.ADMIN_PASSWORD = 'admin123';
  ({ app } = await import('../index.js'));
  srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}/api`;
  admin = (await api('/auth/login', { method: 'POST', body: { login: 'admin', password: 'admin123' }, token: null })).data.token;
  await api('/integrations/ifood', { method: 'PUT', body: { enabled: true, client_id: 'cid', client_secret: 'csecret', merchant_id: 'm1', commission_pct: 12 } });
  await api('/integrations/99food', { method: 'PUT', body: { enabled: true, app_id: '5764607584567296012', app_secret: 's3cr3t', app_shop_id: 'lacos', commission_pct: 10 } });
});

after(() => {
  srv.close();
  ifoodApi.server.close();
  food99Api.server.close();
});

// ---------- 99Food ----------

const ORDER_99 = '5764607801871631353'; // 64 bits: não pode virar 5764607801871631000

function orderNew(variantId) {
  return `{"app_id":5764607584567296012,"app_shop_id":"lacos","timestamp":1615432308,"type":"orderNew","data":{"order_id":${ORDER_99},"order_info":{"order_id":${ORDER_99},"status":100,"order_index":7,"remark":"Sem talheres","pay_type":1,"pay_method":1,"pay_channel":212,"delivery_type":2,"create_time":1761145200,"price":{"order_price":5400,"delivery_price":800,"real_pay_price":6200,"items_discount":0,"delivery_discount":0},"receive_address":{"name":"Pedro Alves","street_name":"Rua B","street_number":"20","district":"Cangaíba","virtual_phone_number":"08000000000","locator":"777"},"order_items":[{"app_item_id":"x1","app_external_id":"V${variantId}","name":"Bolo no pote Dois Amores","amount":2,"sku_price":2400,"total_price":4800,"sub_item_list":[],"remark":""},{"app_item_id":"x2","app_external_id":"","name":"Item só da 99","amount":1,"sku_price":600,"total_price":600,"sub_item_list":[]}],"promotions":[]}}}`;
}
const sign = (raw) => createHash('md5').update(raw + 's3cr3t').digest('hex');

test('99Food: webhook com assinatura importa o pedido sem perder o id de 64 bits', async () => {
  const menu = (await api('/public/menu', { token: null })).data;
  const variant = menu.categories.flatMap((c) => c.products).find((p) => p.name === 'Bolo no pote - Dois Amores').variants[0];
  const raw = orderNew(variant.id);

  const bad = await api('/hooks/99food', { method: 'POST', raw, token: null, headers: { 'didi-header-sign': 'errado' } });
  assert.equal(bad.status, 401);

  const ok = await api('/hooks/99food', { method: 'POST', raw, token: null, headers: { 'didi-header-sign': sign(raw) } });
  assert.deepEqual(ok.data, { errno: 0, errmsg: 'ok' });
  await api('/hooks/99food', { method: 'POST', raw, token: null, headers: { 'didi-header-sign': sign(raw) } }); // reenvio

  const list = (await api('/orders?channel=99food')).data;
  assert.equal(list.length, 1, 'reenvio não duplica');
  const o = (await api(`/orders/${list[0].id}`)).data;
  assert.equal(o.external_id, ORDER_99);
  assert.equal(o.external_code, '7');
  assert.equal(o.subtotal_cents, 5400);
  assert.equal(o.delivery_fee_cents, 800, 'entrega própria: taxa fica com a loja');
  assert.equal(o.total_cents, 6200);
  assert.equal(o.platform_fee_cents, 540, '10% sobre os produtos');
  assert.equal(o.paid, 1, 'pago online pela 99Food');
  assert.equal(o.items[0].variant_id, variant.id, 'item vinculado pelo código V<id>');
  assert.equal(o.items[1].variant_id, null);
  const pending = (await api('/integrations/items')).data.filter((i) => i.platform === '99food' && !i.variant_id);
  assert.ok(pending.some((i) => i.name === 'Item só da 99'), 'item sem vínculo aparece para vincular');
});

test('99Food: aceitar, pronto e saiu para entrega avisam a 99Food', async () => {
  const [o] = (await api('/orders?channel=99food')).data;
  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'preparo' } });
  const confirm = await waitFor(() => food99Api.calls.find((c) => c.url === '/v1/order/order/confirm'));
  assert.ok(confirm.body.includes(`"order_id":${ORDER_99}`), 'id enviado com todos os dígitos');
  assert.ok(confirm.body.includes('"auth_token":"tok-99"'));
  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'pronto' } });
  await waitFor(() => food99Api.calls.find((c) => c.url === '/v1/order/order/ready'));
  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'entrega' } });
  const dispatch = await waitFor(() => food99Api.calls.find((c) => c.url === '/v1/order/selfdelivery/dispatch'));
  assert.ok(dispatch.body.includes('courier_info'));
});

test('99Food: cancelamento pelo app cancela na loja e devolve o estoque', async () => {
  const raw = `{"app_id":1,"app_shop_id":"lacos","type":"orderCancel","timestamp":1,"data":{"order_id":${ORDER_99}}}`;
  await api('/hooks/99food', { method: 'POST', raw, token: null, headers: { 'didi-header-sign': sign(raw) } });
  const [o] = (await api('/orders?channel=99food')).data;
  assert.equal(o.status, 'cancelado');
  await new Promise((r) => setTimeout(r, 100));
  assert.ok(!food99Api.calls.some((c) => c.url === '/v1/order/order/cancel'), 'não avisa de volta quem cancelou');
});

// ---------- iFood ----------

test('iFood: polling importa o pedido, confirma o evento e aceitar avisa o iFood', async () => {
  const { poll } = await import('../integrations/ifood.js');
  ifoodEvents = [{ id: 'ev1', code: 'PLC', fullCode: 'PLACED', orderId: IFOOD_ORDER.id, merchantId: 'm1' }];
  assert.equal(await poll(), 1);
  const ack = ifoodApi.calls.find((c) => c.url === '/events/v1.0/events/acknowledgment');
  assert.deepEqual(JSON.parse(ack.body), [{ id: 'ev1' }]);
  const polling = ifoodApi.calls.find((c) => c.url.startsWith('/events/v1.0/events:polling'));
  assert.equal(polling.headers.authorization, 'Bearer tok-ifood');
  assert.equal(polling.headers['x-polling-merchants'], 'm1');

  const [o] = (await api('/orders?channel=ifood')).data;
  assert.equal(o.external_code, '4821');
  assert.equal(o.subtotal_cents, 4800);
  assert.equal(o.delivery_fee_cents, 0, 'entrega do iFood: taxa não é da loja');
  assert.equal(o.total_cents, 4800);
  assert.equal(o.platform_fee_cents, 576, '12% de comissão');
  assert.equal(o.created_at, '2026-10-22 12:00:00', 'horário convertido para São Paulo');
  assert.equal(o.items[0].notes, 'sem nozes');

  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'preparo' } });
  await waitFor(() => ifoodApi.calls.find((c) => c.url === `/order/v1.0/orders/${IFOOD_ORDER.id}/confirm`));
  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'pronto' } });
  await waitFor(() => ifoodApi.calls.find((c) => c.url === `/order/v1.0/orders/${IFOOD_ORDER.id}/readyToPickup`));

  ifoodEvents = [{ id: 'ev2', code: 'CON', orderId: IFOOD_ORDER.id }];
  await poll();
  const done = (await api(`/orders/${o.id}`)).data;
  assert.equal(done.status, 'concluido');
  assert.equal(done.paid, 1);
});

test('iFood: falha ao avisar fica registrada no pedido', async () => {
  const { poll } = await import('../integrations/ifood.js');
  IFOOD_ORDER.id = 'zz-falha';
  ifoodActionsFail = true;
  ifoodEvents = [{ id: 'ev3', code: 'PLC', orderId: 'zz-falha' }];
  await poll();
  const o = (await api('/orders?channel=ifood')).data.find((x) => x.external_id === 'zz-falha');
  await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: 'preparo' } });
  let detail = null;
  for (let i = 0; i < 60 && !detail?.external_sync_error; i++) {
    await new Promise((r) => setTimeout(r, 50));
    detail = (await api(`/orders/${o.id}`)).data;
  }
  assert.match(detail.external_sync_error, /Não foi possível avisar o iFood/);
  ifoodActionsFail = false;
  const retry = await api(`/integrations/orders/${o.id}/resync`, { method: 'POST' });
  assert.equal(retry.status, 200);
  assert.equal(retry.data.external_sync_error, null);
});

// ---------- Visão consolidada ----------

test('relatório por canal mostra bruto, comissão e líquido; DRE desconta comissões', async () => {
  const s = (await api('/reports/summary')).data;
  const ifood = s.byChannel.find((c) => c.channel === 'ifood');
  assert.ok(ifood.commission_cents > 0);
  assert.equal(ifood.net_cents, ifood.revenue_cents - ifood.commission_cents - ifood.payment_fee_cents);
  const dre = (await api('/finance/dre')).data;
  assert.ok(dre.comissoes >= ifood.commission_cents);
});

test('pedido de teste pelo painel para as duas plataformas', async () => {
  for (const p of ['ifood', '99food']) {
    const r = await api(`/integrations/${p}/simulate`, { method: 'POST' });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(r.data.channel, p);
    assert.match(r.data.notes, /PEDIDO DE TESTE/);
  }
  const cfg = (await api('/integrations')).data;
  assert.equal(cfg.ifood.config.client_secret, '********', 'segredo não volta para a tela');
  assert.ok(cfg['99food'].webhook_url.endsWith('/api/hooks/99food'));
});
