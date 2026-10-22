// Conector iFood (Merchant API v1.0): busca eventos a cada 30 s (polling), importa pedidos novos,
// confirma o recebimento dos eventos e avisa o iFood quando a loja muda o status do pedido.
// Endereço da API configurável por IFOOD_API_URL (testes usam um servidor simulado).
import { createHmac } from 'node:crypto';
import { now } from '../db.js';
import { applyPlatformStatus, importExternalOrder, platformConfig } from './importer.js';

const base = () => process.env.IFOOD_API_URL || 'https://merchant-api.ifood.com.br';
let token = null;
let tokenExpires = 0;
let tokenFor = '';

const cents = (v) => Math.round((Number(v) || 0) * 100);
const isoToLocal = (iso) => (iso ? now(new Date(iso)) : null);

async function authenticate(cfg, force = false) {
  if (!cfg.client_id || !cfg.client_secret) throw new Error('Informe o Client ID e o Client Secret do iFood');
  if (!force && token && tokenFor === cfg.client_id && Date.now() < tokenExpires - 60e3) return token;
  const res = await fetch(`${base()}/authentication/v1.0/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grantType: 'client_credentials', clientId: cfg.client_id, clientSecret: cfg.client_secret }),
  });
  if (!res.ok) throw new Error(`iFood recusou as credenciais (HTTP ${res.status})`);
  const data = await res.json();
  token = data.accessToken;
  tokenFor = cfg.client_id;
  tokenExpires = Date.now() + (Number(data.expiresIn) || 3600) * 1000;
  return token;
}

async function call(cfg, method, path, body, headers = {}, retry = true) {
  const t = await authenticate(cfg);
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: { authorization: `Bearer ${t}`, ...(body ? { 'content-type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && retry) {
    await authenticate(cfg, true);
    return call(cfg, method, path, body, headers, false);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) throw new Error(`iFood respondeu ${res.status} em ${path}${text ? `: ${text.slice(0, 160)}` : ''}`);
  return text ? JSON.parse(text) : null;
}

const OFFLINE_METHOD = { CASH: 'dinheiro', CREDIT: 'credito', DEBIT: 'debito', MEAL_VOUCHER: 'vr', FOOD_VOUCHER: 'va', PIX: 'pix' };

/** Pedido do iFood → formato do importador */
export function mapOrder(o) {
  const deliveredBy = o.delivery?.deliveredBy === 'MERCHANT' ? 'store' : 'platform';
  const type = o.orderType === 'DELIVERY' ? 'entrega' : o.orderType === 'TAKEOUT' ? 'retirada' : 'balcao';
  const methods = o.payments?.methods || [];
  const offline = methods.find((m) => m.type === 'OFFLINE');
  const merchantDiscount = (o.benefits || []).reduce(
    (s, b) => s + (b.sponsorshipValues || []).filter((x) => x.name === 'MERCHANT').reduce((a, x) => a + cents(x.value), 0), 0,
  );
  const a = o.delivery?.deliveryAddress;
  const phone = o.customer?.phone;
  return {
    platform: 'ifood',
    external_id: o.id,
    external_code: o.displayId,
    type,
    delivered_by: deliveredBy,
    created_at: isoToLocal(o.createdAt),
    scheduled_for: o.orderTiming === 'SCHEDULED' ? isoToLocal(o.schedule?.deliveryDateTimeStart) : null,
    customer: { name: o.customer?.name, phone: phone?.number },
    address: a && type === 'entrega'
      ? { street: a.streetName || a.formattedAddress || '', number: a.streetNumber || '', complement: a.complement || '', neighborhood: a.neighborhood || '', reference: a.reference || '' }
      : null,
    items: (o.items || []).map((i) => ({
      external_key: i.externalCode || null,
      name: i.name,
      qty: i.quantity,
      total_cents: cents(i.totalPrice ?? (Number(i.price || 0) + Number(i.optionsPrice || 0))),
      options: (i.options || []).map((op) => ({ name: `${op.quantity > 1 ? `${op.quantity}x ` : ''}${op.name}`, price_cents: cents(op.price) })),
      notes: i.observations,
    })),
    delivery_fee_cents: cents(o.total?.deliveryFee),
    discount_cents: merchantDiscount,
    customer_paid_cents: cents(o.total?.orderAmount),
    payment: offline
      ? { method: OFFLINE_METHOD[offline.method] || 'ifood', prepaid: false, change_for_cents: offline.cash?.changeFor ? cents(offline.cash.changeFor) : null }
      : { method: 'ifood', prepaid: true },
    notes: [
      o.extraInfo,
      o.delivery?.observations,
      phone?.number && `Telefone iFood ${phone.number}${phone.localizer ? ` · código ${phone.localizer}` : ''}`,
      deliveredBy === 'platform' && type === 'entrega' && 'Entrega pelo iFood',
      offline && offline.method === 'CASH' && 'Cliente paga em dinheiro na entrega',
      `Cliente pagou R$ ${(cents(o.total?.orderAmount) / 100).toFixed(2).replace('.', ',')} no iFood`,
    ].filter(Boolean),
    external_status: 'PLC',
    is_test: !!o.isTest,
  };
}

const INBOUND = { CFM: 'preparo', RTP: 'pronto', DSP: 'entrega', CON: 'concluido', CAN: 'cancelado' };

/** Trata um evento do iFood (vindo do polling ou do webhook) */
export async function handleEvent(cfg, ev) {
  if (ev.code === 'PLC') {
    const order = await call(cfg, 'GET', `/order/v1.0/orders/${encodeURIComponent(ev.orderId)}`);
    return importExternalOrder(mapOrder(order));
  }
  const status = INBOUND[ev.code];
  if (status) return applyPlatformStatus('ifood', ev.orderId, status, { rawStatus: ev.code, note: ev.code === 'CAN' ? 'Cancelado no iFood' : undefined });
  return null;
}

export async function poll() {
  const cfg = platformConfig('ifood');
  const events = (await call(cfg, 'GET', '/events/v1.0/events:polling', null, cfg.merchant_id ? { 'x-polling-merchants': cfg.merchant_id } : {})) || [];
  const done = [];
  for (const ev of events) {
    try {
      await handleEvent(cfg, ev);
      done.push({ id: ev.id });
    } catch (e) {
      console.error('[iFood] evento', ev.code, ev.orderId, e.message);
      if (ev.code !== 'PLC') done.push({ id: ev.id }); // pedido novo volta no próximo polling
    }
  }
  if (done.length) await call(cfg, 'POST', '/events/v1.0/events/acknowledgment', done);
  return events.length;
}

// Motivos de cancelamento do iFood
const CANCEL_CODES = [
  [/indispon|esgot|falta/i, '503', 'Item indisponível'],
  [/fora da área|area|distân/i, '506', 'Pedido fora da área de entrega'],
  [/motoboy|entregador/i, '504', 'Restaurante sem motoboy'],
  [/duplic/i, '502', 'Pedido em duplicidade'],
  [/trote|golp|fraude/i, '507', 'Cliente golpista / trote'],
  [/fech|horário/i, '508', 'Fora do horário do delivery'],
];

/** Avisa o iFood da mudança feita na loja */
export async function pushStatus(order, status) {
  const cfg = platformConfig('ifood');
  const id = encodeURIComponent(order.external_id);
  const path = (action) => `/order/v1.0/orders/${id}/${action}`;
  switch (status) {
    case 'confirmado': return call(cfg, 'POST', path('confirm'));
    case 'preparo':
      if (!order.events?.some((e) => e.status === 'confirmado')) await call(cfg, 'POST', path('confirm'));
      return call(cfg, 'POST', path('startPreparation')).catch(() => null); // opcional no iFood
    case 'pronto':
      if (order.type === 'entrega' && order.external_delivered_by === 'store') return null;
      return call(cfg, 'POST', path('readyToPickup'));
    case 'entrega':
      return order.external_delivered_by === 'store' ? call(cfg, 'POST', path('dispatch')) : null;
    case 'cancelado': {
      const [, code, label] = CANCEL_CODES.find(([re]) => re.test(order.cancel_reason || '')) || [null, '509', 'Dificuldades internas do restaurante'];
      return call(cfg, 'POST', path('requestCancellation'), { reason: order.cancel_reason || label, cancellationCode: code });
    }
    default: return null;
  }
}

export async function testConnection() {
  const cfg = platformConfig('ifood');
  await authenticate(cfg, true);
  return 'Credenciais aceitas pelo iFood';
}

/** Webhook do iFood (alternativa ao polling): assinatura HMAC-SHA256 do corpo com o Client Secret */
export function verifyWebhook(raw, signature) {
  const cfg = platformConfig('ifood');
  if (!cfg.client_secret || !signature) return false;
  const expected = createHmac('sha256', cfg.client_secret).update(raw).digest('hex');
  return expected === String(signature).toLowerCase();
}
