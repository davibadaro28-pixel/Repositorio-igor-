// Integração com apps de delivery: iFood (polling) e 99Food (webhook).
// Os pedidos entram no mesmo quadro, caixa, estoque e relatórios dos pedidos da loja.
import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { all, get, run, getSetting, setSetting, today } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { getOrder, onStatusChange } from '../services/orders.js';
import { DEFAULT_INTEGRATIONS } from '../seed.js';
import { int, num, str } from '../util.js';
import * as ifood from './ifood.js';
import * as food99 from './food99.js';
import { PLATFORMS, importExternalOrder, setSyncError } from './importer.js';

const CONNECTORS = { ifood, '99food': food99 };
const SECRET_FIELDS = ['client_secret', 'app_secret'];
const MASK = '********';

// situação em tempo real de cada integração (some ao reiniciar o servidor)
const runtime = { ifood: {}, '99food': {} };

const isTestId = (id) => String(id || '').startsWith('TESTE-');

// ---------- Avisar a plataforma quando a loja muda o status ----------

onStatusChange(async (order, status, opts) => {
  const platform = order.external_platform;
  if (opts.fromPlatform || !platform || !order.external_id || isTestId(order.external_id)) return;
  const cfg = getSetting('integrations', {})[PLATFORMS[platform].settingsKey] || {};
  if (!cfg.enabled) return;
  try {
    await CONNECTORS[platform].pushStatus(order, status);
    if (order.external_sync_error) setSyncError(order.id, null);
  } catch (e) {
    console.error(`[${PLATFORMS[platform].label}] pedido #${order.id}:`, e.message);
    setSyncError(order.id, `Não foi possível avisar o ${PLATFORMS[platform].label}: ${e.message}`);
  }
});

// ---------- Polling do iFood (a cada 30 s; mantém a loja aberta no iFood) ----------

let pollTimer = null;
export function startIntegrations(intervalMs = 30e3) {
  stopIntegrations();
  const tick = async () => {
    const cfg = getSetting('integrations', {}).ifood || {};
    if (cfg.enabled && cfg.client_id && cfg.client_secret) {
      runtime.ifood.last_poll_at = new Date().toISOString();
      try {
        const n = await ifood.poll();
        runtime.ifood.last_ok_at = runtime.ifood.last_poll_at;
        runtime.ifood.last_error = null;
        if (n) runtime.ifood.last_events = n;
      } catch (e) {
        runtime.ifood.last_error = e.message;
        console.error('[iFood] polling:', e.message);
      }
    }
    pollTimer = setTimeout(tick, intervalMs);
    pollTimer.unref?.();
  };
  pollTimer = setTimeout(tick, 1000);
  pollTimer.unref?.();
}
export function stopIntegrations() {
  if (pollTimer) clearTimeout(pollTimer);
  pollTimer = null;
}

// ---------- Webhooks (públicos, protegidos pela assinatura) ----------

export const hooks = Router();

hooks.post('/hooks/99food', (req, res) => {
  const raw = req.rawBody || '';
  if (!food99.verifyWebhook(raw, req.headers['didi-header-sign'])) {
    runtime['99food'].last_error = 'Webhook recebido com assinatura inválida';
    return res.status(401).json({ errno: 1, errmsg: 'invalid sign' });
  }
  runtime['99food'].last_webhook_at = new Date().toISOString();
  try {
    food99.handleWebhook(raw);
    runtime['99food'].last_error = null;
  } catch (e) {
    runtime['99food'].last_error = e.message;
    console.error('[99Food] webhook:', e.message);
    return res.status(500).json({ errno: 1, errmsg: 'error' }); // a 99Food reenvia
  }
  return res.json({ errno: 0, errmsg: 'ok' });
});

hooks.post('/hooks/ifood', (req, res) => {
  const raw = req.rawBody || '';
  if (!ifood.verifyWebhook(raw, req.headers['x-ifood-signature'])) return res.status(401).end();
  runtime.ifood.last_webhook_at = new Date().toISOString();
  const cfg = getSetting('integrations', {}).ifood || {};
  const events = [].concat(JSON.parse(raw || '[]'));
  res.status(202).end(); // responde logo; o pedido é buscado em seguida
  for (const ev of events) {
    ifood.handleEvent(cfg, ev).catch((e) => {
      runtime.ifood.last_error = e.message;
      console.error('[iFood] webhook:', e.message);
    });
  }
});

// ---------- Painel ----------

export const admin = Router();
const config = requireModule('configuracoes');

function publicConfig(platform) {
  const cfg = { ...DEFAULT_INTEGRATIONS[PLATFORMS[platform].settingsKey], ...(getSetting('integrations', {})[PLATFORMS[platform].settingsKey] || {}) };
  for (const f of SECRET_FIELDS) if (cfg[f]) cfg[f] = MASK;
  return cfg;
}

function stats(platform) {
  const t = today();
  const day = get(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents), 0) AS revenue_cents, COALESCE(SUM(platform_fee_cents), 0) AS fee_cents
     FROM orders WHERE channel = ? AND status != 'cancelado' AND substr(created_at, 1, 10) = ?`, platform, t,
  );
  const last = get('SELECT MAX(created_at) AS at FROM orders WHERE channel = ? AND external_id IS NOT NULL', platform);
  const unmatched = get('SELECT COUNT(*) AS n FROM integration_items WHERE platform = ? AND variant_id IS NULL', platform).n;
  return { ...day, last_order_at: last?.at || null, unmatched_items: unmatched };
}

admin.get('/integrations', config, (req, res) => {
  const origin = `${req.protocol || 'https'}://${req.get?.('host') || req.headers?.host || 'seu-dominio'}`;
  res.json(Object.fromEntries(Object.keys(PLATFORMS).map((p) => [p, {
    config: publicConfig(p),
    runtime: runtime[p],
    stats: stats(p),
    webhook_url: `${origin}/api/hooks/${p}`,
  }])));
});

admin.put('/integrations/:platform', config, (req, res) => {
  const p = req.params.platform;
  if (!PLATFORMS[p]) fail(404, 'Integração desconhecida');
  const key = PLATFORMS[p].settingsKey;
  const saved = getSetting('integrations', {});
  const cur = saved[key] || {};
  const b = req.body || {};
  const next = { ...DEFAULT_INTEGRATIONS[key], ...cur };
  for (const f of Object.keys(DEFAULT_INTEGRATIONS[key])) {
    if (!(f in b)) continue;
    if (SECRET_FIELDS.includes(f)) { if (b[f] !== MASK) next[f] = str(b[f], 200) || ''; }
    else if (f === 'enabled' || f === 'auto_accept') next[f] = !!b[f];
    else if (f === 'commission_pct') next[f] = Math.min(Math.max(num(b[f], 0), 0), 50);
    else next[f] = str(b[f], 120) || '';
  }
  if ('courier_phone' in b) next.courier_phone = str(b.courier_phone, 20) || '';
  setSetting('integrations', { ...saved, [key]: next });
  if (p === 'ifood') runtime.ifood = {};
  res.json(publicConfig(p));
});

admin.post('/integrations/:platform/test', config, async (req, res) => {
  const c = CONNECTORS[req.params.platform];
  if (!c) fail(404, 'Integração desconhecida');
  try {
    res.json({ ok: true, message: await c.testConnection() });
  } catch (e) {
    res.json({ ok: false, message: e.message });
  }
});

/** Pedido de teste no formato real de cada app, passando pelo mesmo caminho dos pedidos de verdade */
admin.post('/integrations/:platform/simulate', config, (req, res) => {
  const p = req.params.platform;
  if (!PLATFORMS[p]) fail(404, 'Integração desconhecida');
  const picks = all(
    `SELECT v.id, v.price_cents, v.name AS vname, p.name FROM product_variants v JOIN products p ON p.id = v.product_id
     WHERE v.active = 1 AND p.active = 1 AND p.featured = 1 ORDER BY RANDOM() LIMIT 2`,
  );
  if (!picks.length) fail(400, 'Cadastre produtos antes de simular');
  const markup = (c) => Math.round((c * 1.15) / 10) * 10; // nos apps o preço costuma ser maior
  const id = `TESTE-${randomBytes(5).toString('hex').toUpperCase()}`;
  const code = String(1000 + Math.floor(Math.random() * 9000));
  let result;
  if (p === 'ifood') {
    const items = picks.map((v, i) => ({
      name: i === 0 ? v.name : `${v.name} (cardápio iFood)`, externalCode: i === 0 ? `V${v.id}` : '', quantity: 1,
      unitPrice: markup(v.price_cents) / 100, totalPrice: markup(v.price_cents) / 100, options: [], observations: i === 0 ? 'Capricha no recheio!' : '',
    }));
    const sub = items.reduce((s, i) => s + i.totalPrice, 0);
    result = importExternalOrder(ifood.mapOrder({
      id, displayId: code, orderType: 'DELIVERY', orderTiming: 'IMMEDIATE', createdAt: new Date().toISOString(), isTest: true,
      customer: { name: 'Cliente iFood (teste)', phone: { number: '0800 705 0000', localizer: '12345678' } },
      items, total: { subTotal: sub, deliveryFee: 7.99, benefits: 0, orderAmount: sub + 7.99 },
      payments: { prepaid: sub + 7.99, pending: 0, methods: [{ value: sub + 7.99, method: 'CREDIT', type: 'ONLINE' }] },
      delivery: { deliveredBy: 'IFOOD', deliveryAddress: { streetName: 'Rua Ipê Roxo', streetNumber: '120', neighborhood: 'Ermelino Matarazzo', complement: 'Casa 2', reference: 'Portão verde' } },
    }));
  } else {
    const items = picks.map((v, i) => ({
      name: i === 0 ? v.name : `${v.name} (99Food)`, app_item_id: i === 0 ? String(v.id) : `99-${v.id}`, app_external_id: i === 0 ? `V${v.id}` : '',
      amount: 1, sku_price: markup(v.price_cents), total_price: markup(v.price_cents), sub_item_list: [], remark: '',
    }));
    const sub = items.reduce((s, i) => s + i.total_price, 0);
    result = importExternalOrder(food99.mapOrder({
      order_id: id, order_index: Number(code.slice(-2)), status: 100, delivery_type: 1, pay_method: 1, pay_channel: 212, create_time: Math.floor(Date.now() / 1000),
      remark: 'Sem talheres', price: { order_price: sub, delivery_price: 599, real_pay_price: sub + 599 }, is_test: true,
      receive_address: { name: 'Cliente 99Food (teste)', street_name: 'Av. Paranaguá', street_number: '880', district: 'Ponte Rasa', virtual_phone_number: '0800 000 0099', locator: '4321' },
      order_items: items, promotions: [],
    }));
  }
  res.status(201).json(result.order);
});

// tentar de novo o aviso que falhou
admin.post('/integrations/orders/:id/resync', requireModule('pedidos'), async (req, res) => {
  const o = getOrder(int(req.params.id));
  if (!o?.external_platform) fail(404, 'Pedido não veio de app de delivery');
  try {
    if (!isTestId(o.external_id)) await CONNECTORS[o.external_platform].pushStatus(o, o.status);
    setSyncError(o.id, null);
    res.json(getOrder(o.id));
  } catch (e) {
    setSyncError(o.id, `Não foi possível avisar o ${PLATFORMS[o.external_platform].label}: ${e.message}`);
    fail(502, e.message);
  }
});

// vínculo dos itens dos apps com os produtos da loja
admin.get('/integrations/items', requireModule('produtos', 'configuracoes'), (_req, res) => {
  res.json(all(
    `SELECT i.*, p.name AS product_name, v.name AS variant_name FROM integration_items i
     LEFT JOIN product_variants v ON v.id = i.variant_id LEFT JOIN products p ON p.id = v.product_id
     ORDER BY (i.variant_id IS NOT NULL), i.last_seen_at DESC`,
  ));
});

admin.put('/integrations/items/:id', requireModule('produtos', 'configuracoes'), (req, res) => {
  const vid = int(req.body.variant_id);
  if (vid && !get('SELECT 1 FROM product_variants WHERE id = ?', vid)) fail(400, 'Produto inválido');
  run('UPDATE integration_items SET variant_id = ? WHERE id = ?', vid || null, int(req.params.id));
  res.json(get('SELECT * FROM integration_items WHERE id = ?', int(req.params.id)));
});
