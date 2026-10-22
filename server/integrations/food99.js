// Conector 99Food (Open Platform): os pedidos chegam por webhook assinado (MD5 do corpo + app_secret),
// e a loja avisa a 99Food de cada etapa (confirmar em até 5 minutos, pronto, saiu, entregue, cancelar).
// Endereço da API configurável por FOOD99_API_URL (testes usam um servidor simulado).
import { createHash } from 'node:crypto';
import { now } from '../db.js';
import { addPlatformNote, applyPlatformStatus, importExternalOrder, parseBigJson, platformConfig } from './importer.js';

const base = () => process.env.FOOD99_API_URL || 'https://openapi.99food.com';
let token = null;
let tokenExpires = 0;
let tokenFor = '';

const md5 = (s) => createHash('md5').update(s, 'utf8').digest('hex');
const unixToLocal = (t) => (t ? now(new Date(Number(t) * 1000)) : null);

async function request(method, path, params, body) {
  const url = `${base()}${path}${params ? `?${new URLSearchParams(params)}` : ''}`;
  const res = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : {}, body });
  const text = await res.text();
  if (!res.ok) throw new Error(`99Food respondeu ${res.status} em ${path}`);
  const data = parseBigJson(text || '{}');
  if (Number(data.errno) !== 0) {
    const err = new Error(`99Food: ${data.errmsg || 'erro'} (código ${data.errno})`);
    err.errno = Number(data.errno);
    throw err;
  }
  return data.data;
}

async function authToken(cfg, force = false) {
  if (!cfg.app_id || !cfg.app_secret || !cfg.app_shop_id) throw new Error('Informe o App ID, o App Secret e o código da loja (app_shop_id) da 99Food');
  const key = `${cfg.app_id}:${cfg.app_shop_id}`;
  if (!force && token && tokenFor === key && Date.now() < tokenExpires - 120e3) return token;
  const params = { app_id: cfg.app_id, app_secret: cfg.app_secret, app_shop_id: cfg.app_shop_id };
  let data;
  try {
    data = await request('GET', '/v1/auth/authtoken/get', params);
  } catch (e) {
    if (e.errno !== 10102) throw e; // token vencido: renova e busca de novo
    await request('GET', '/v1/auth/authtoken/refresh', params);
    data = await request('GET', '/v1/auth/authtoken/get', params);
  }
  token = data.auth_token;
  tokenFor = key;
  tokenExpires = Number(data.token_expiration_time) * 1000 || Date.now() + 3600e3;
  return token;
}

// order_id tem 64 bits: vai no JSON como número, montado como texto para não perder precisão
async function orderAction(path, orderId, extra = {}) {
  const cfg = platformConfig('99food');
  const t = await authToken(cfg);
  const id = String(orderId).replace(/\D/g, '');
  const rest = Object.entries(extra).map(([k, v]) => `,${JSON.stringify(k)}:${JSON.stringify(v)}`).join('');
  return request('POST', path, null, `{"auth_token":${JSON.stringify(t)},"order_id":${id}${rest}}`);
}

const OFFLINE_CHANNEL = { 153: 'dinheiro', 262: 'credito', 263: 'debito', 264: 'vr', 257: 'vr', 258: 'vr', 259: 'vr', 260: 'vr' };

/** Pedido da 99Food (order_info) → formato do importador. Valores já vêm em centavos. */
export function mapOrder(info) {
  const deliveryType = Number(info.delivery_type);
  const type = deliveryType === 0 ? 'retirada' : 'entrega';
  const price = info.price || {};
  const addr = info.receive_address || {};
  const promos = info.promotions || [];
  const merchantDiscount = promos.reduce((s, p) => s + (Number(p.shop_subside_price) || 0), 0);
  const offline = Number(info.pay_method) === 2;
  const remark = (r) => (Array.isArray(r) ? r.join(', ') : r) || null;
  return {
    platform: '99food',
    external_id: String(info.order_id),
    external_code: info.order_index != null ? String(info.order_index) : null,
    type,
    delivered_by: deliveryType === 2 ? 'store' : 'platform',
    created_at: unixToLocal(info.create_time),
    scheduled_for: null,
    customer: { name: addr.name || [addr.first_name, addr.last_name].filter(Boolean).join(' ') || 'Cliente 99Food', phone: addr.phone },
    address: type === 'entrega'
      ? { street: addr.street_name || addr.poi_display_name || addr.poi_address || '', number: addr.street_number || '', complement: addr.complement || '', neighborhood: addr.district || '', reference: addr.reference || '' }
      : null,
    items: (info.order_items || []).map((i) => ({
      external_key: i.app_external_id || i.app_item_id || null,
      name: i.name,
      qty: Number(i.amount) || 1,
      total_cents: Number(i.total_price) || 0,
      options: (i.sub_item_list || []).map((s) => ({ name: `${Number(s.amount) > 1 ? `${s.amount}x ` : ''}${s.name}`, price_cents: (Number(s.sku_price) || 0) * (Number(s.amount) || 1) })),
      notes: remark(i.remark),
    })),
    delivery_fee_cents: Number(price.delivery_price) || 0,
    discount_cents: merchantDiscount,
    customer_paid_cents: Number(price.real_pay_price) || 0,
    payment: offline
      ? { method: OFFLINE_CHANNEL[info.pay_channel] || '99food', prepaid: false, change_for_cents: Number(info.change_for) || null }
      : { method: '99food', prepaid: true },
    notes: [
      remark(info.remark),
      addr.virtual_phone_number && `Telefone 99Food ${addr.virtual_phone_number}${addr.locator ? ` · ramal ${addr.locator}` : ''}`,
      info.handover_code && `Código de entrega ${info.handover_code}`,
      deliveryType === 1 && 'Entrega pela 99Food',
      `Cliente pagou R$ ${((Number(price.real_pay_price) || 0) / 100).toFixed(2).replace('.', ',')} na 99Food`,
    ].filter(Boolean),
    external_status: info.status != null ? String(info.status) : '100',
    is_test: !!info.is_test,
  };
}

const DELIVERY_STATUS = { 400: 'entrega', 500: 'entrega', 600: 'concluido' };

export function verifyWebhook(raw, signature) {
  const cfg = platformConfig('99food');
  return !!cfg.app_secret && !!signature && md5(raw + cfg.app_secret) === String(signature).toLowerCase();
}

/** Trata um evento recebido no webhook (corpo cru, já com assinatura conferida) */
export function handleWebhook(raw) {
  const ev = parseBigJson(raw);
  const data = ev.data || {};
  const id = data.order_id;
  switch (ev.type) {
    case 'orderNew': return importExternalOrder(mapOrder({ ...data.order_info, order_id: data.order_info?.order_id ?? id }));
    case 'orderConfirm': return applyPlatformStatus('99food', id, 'preparo', { rawStatus: 200 });
    case 'orderReady': return applyPlatformStatus('99food', id, 'pronto');
    case 'deliveryStatus': {
      const st = Number(data.status ?? data.delivery_status ?? data.order_info?.status);
      return DELIVERY_STATUS[st] ? applyPlatformStatus('99food', id, DELIVERY_STATUS[st], { rawStatus: st }) : null;
    }
    case 'orderFinish': return applyPlatformStatus('99food', id, 'concluido', { rawStatus: 600 });
    case 'orderCancel': return applyPlatformStatus('99food', id, 'cancelado', { rawStatus: 'cancel', note: 'Cancelado na 99Food' });
    case 'orderCancelApply': return addPlatformNote('99food', id, `Cliente pediu cancelamento na 99Food: ${data.apply_reason || 'sem motivo'}. Responda pelo app da 99Food em até 5 minutos.`);
    case 'orderRefundApply': return addPlatformNote('99food', id, `Cliente pediu reembolso na 99Food: ${data.apply_reason || 'sem motivo'}.`);
    case 'orderPartialCancel': return addPlatformNote('99food', id, 'A 99Food cancelou parte do pedido. Confira os itens no app da 99Food.');
    default: return null;
  }
}

const CANCEL_REASONS = [
  [/indispon|esgot|falta/i, 1010], [/fechad|horário/i, 1020], [/movimento|ocupad|demora/i, 1030],
  [/cliente|desist/i, 1050], [/motoboy|entregador/i, 1060], [/fora da área|area/i, 1071], [/trote|fraude|golp/i, 1073],
];

/** Avisa a 99Food da mudança feita na loja */
export async function pushStatus(order, status) {
  const selfDelivery = order.external_delivered_by === 'store' && order.type === 'entrega';
  switch (status) {
    case 'confirmado':
      return orderAction('/v1/order/order/confirm', order.external_id);
    case 'preparo':
      return order.events?.some((e) => e.status === 'confirmado') ? null : orderAction('/v1/order/order/confirm', order.external_id);
    case 'pronto':
      return orderAction('/v1/order/order/ready', order.external_id);
    case 'entrega': {
      if (!selfDelivery) return null;
      const t = Math.floor(Date.now() / 1000);
      const store = platformConfig('99food');
      const name = order.courier_name || 'Entregador da loja';
      const [first, ...last] = name.split(' ');
      return orderAction('/v1/order/selfdelivery/dispatch', order.external_id, {
        courier_info: { courier_name: name, courier_first_name: first, courier_last_name: last.join(' ') || first, courier_phone_code: '+55', courier_phone: store.courier_phone || '' },
        limit_time: { pickup_time: t, delivery_time: t + 40 * 60 },
      });
    }
    case 'concluido':
      return selfDelivery ? orderAction('/v1/order/selfdelivery/delivered', order.external_id) : null;
    case 'cancelado': {
      const reasonId = CANCEL_REASONS.find(([re]) => re.test(order.cancel_reason || ''))?.[1] || 1080;
      return orderAction('/v1/order/order/cancel', order.external_id, { reason_id: reasonId, reason: order.cancel_reason || 'Cancelado pela loja' });
    }
    default: return null;
  }
}

export async function testConnection() {
  await authToken(platformConfig('99food'), true);
  return 'Credenciais aceitas pela 99Food';
}
