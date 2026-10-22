// Importa pedidos do iFood e da 99Food para dentro do sistema, no mesmo formato dos pedidos da loja.
// Os preços vêm da plataforma (o cardápio dos apps costuma ter preços próprios); o vínculo com os
// produtos da loja serve para baixar estoque e calcular o custo (CMV).
import { randomBytes } from 'node:crypto';
import { all, get, run, tx, now, getSetting } from '../db.js';
import { broadcast } from '../realtime.js';
import { getOrder, normalizePhone, recordPayments, setStatus, settlePaid, upsertCustomer, variantCost } from '../services/orders.js';

export const PLATFORMS = {
  ifood: { key: 'ifood', label: 'iFood', settingsKey: 'ifood', payment: 'ifood' },
  '99food': { key: '99food', label: '99Food', settingsKey: 'food99', payment: '99food' },
};

export const SYSTEM_USER = { id: null, role: 'admin', name: 'Integração' };

export function platformConfig(platform) {
  return getSetting('integrations', {})[PLATFORMS[platform].settingsKey] || {};
}

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Acha o tamanho do produto da loja que corresponde ao item do app */
function resolveItem(platform, item) {
  const code = String(item.external_key || '').trim();
  // 1) "Código PDV" cadastrado no app igual ao código do produto na loja (ex.: V12 ou 12)
  const m = /^v?(\d+)$/i.exec(code);
  if (m) {
    const v = get('SELECT id FROM product_variants WHERE id = ? AND active = 1', Number(m[1]));
    if (v) return v.id;
  }
  // 2) vínculo feito no painel
  const key = code || `nome:${norm(item.name)}`;
  const row = get('SELECT * FROM integration_items WHERE platform = ? AND external_key = ?', platform, key);
  let variantId = row?.variant_id || null;
  // 3) mesmo nome do produto (ou "produto tamanho") no cardápio da loja
  if (!variantId && !row) {
    const wanted = norm(item.name);
    for (const v of all(
      `SELECT v.id, v.name AS vname, p.name, (SELECT COUNT(*) FROM product_variants x WHERE x.product_id = p.id AND x.active = 1) AS n
       FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.active = 1 AND p.active = 1`,
    )) {
      if (norm(`${v.name} ${v.vname || ''}`) === wanted || (v.n === 1 && norm(v.name) === wanted)) {
        variantId = v.id;
        break;
      }
    }
  }
  if (row) {
    run('UPDATE integration_items SET seen = seen + 1, last_seen_at = ?, name = ? WHERE id = ?', now(), item.name, row.id);
  } else {
    run('INSERT INTO integration_items (platform, external_key, name, variant_id, seen, last_seen_at) VALUES (?, ?, ?, ?, 1, ?)',
      platform, key, item.name, variantId, now());
  }
  return variantId;
}

/**
 * Cria o pedido a partir dos dados já convertidos pelo conector da plataforma.
 * n: { platform, external_id, external_code, type, delivered_by, created_at, scheduled_for, customer:{name, phone},
 *      address, items:[{external_key, name, qty, total_cents, options:[{name, price_cents}], notes}],
 *      delivery_fee_cents, discount_cents, customer_paid_cents, payment:{method, prepaid, change_for_cents},
 *      notes, external_status, is_test }
 * Repetir a importação do mesmo pedido não duplica.
 */
export function importExternalOrder(n) {
  const cfg = platformConfig(n.platform);
  const result = tx(() => {
    const existing = get('SELECT id FROM orders WHERE external_platform = ? AND external_id = ?', n.platform, String(n.external_id));
    if (existing) return { id: existing.id, created: false };

    const lines = n.items.map((it) => {
      const qty = Math.max(1, Math.round(Number(it.qty) || 1));
      const total = Math.max(0, Math.round(it.total_cents));
      const variantId = resolveItem(n.platform, it);
      const v = variantId ? get('SELECT v.id, v.name, v.product_id FROM product_variants v WHERE v.id = ?', variantId) : null;
      return {
        product_id: v?.product_id || null, variant_id: v?.id || null, name: it.name, variant_name: null,
        options: (it.options || []).map((o) => ({ group: 'Adicionais', name: o.name, price_cents: Math.round(o.price_cents || 0) })),
        qty, unit_price_cents: Math.round(total / qty), unit_cost_cents: v ? variantCost(v.id) : 0, total_cents: total,
        notes: it.notes ? String(it.notes).slice(0, 300) : null,
      };
    });
    const subtotal = lines.reduce((s, l) => s + l.total_cents, 0);
    const cost = lines.reduce((s, l) => s + l.unit_cost_cents * l.qty, 0);
    const deliveryFee = n.delivered_by === 'store' && n.type === 'entrega' ? Math.max(0, Math.round(n.delivery_fee_cents || 0)) : 0;
    const discount = Math.min(Math.max(0, Math.round(n.discount_cents || 0)), subtotal + deliveryFee);
    const total = subtotal + deliveryFee - discount;
    const fee = Math.round((subtotal * (Number(cfg.commission_pct) || 0)) / 100);

    // telefone real vira cliente cadastrado; números virtuais/mascarados dos apps não
    const phone = normalizePhone(n.customer?.phone);
    const realPhone = phone && /^\d{2}9\d{8}$/.test(phone) ? phone : null;
    const customerId = realPhone ? upsertCustomer({ name: n.customer?.name, phone: realPhone, address: n.address }) : null;

    const t = now();
    const createdAt = n.created_at || t;
    const notes = [n.is_test && 'PEDIDO DE TESTE', ...(n.notes || [])].filter(Boolean).join(' · ').slice(0, 500) || null;
    const r = run(
      `INSERT INTO orders (code, channel, type, status, customer_id, customer_name, customer_phone, address, scheduled_for,
         subtotal_cents, discount_cents, delivery_fee_cents, total_cents, cost_cents, payment_method, change_for_cents, notes,
         external_platform, external_id, external_code, external_status, external_delivered_by, platform_fee_cents, created_at, updated_at)
       VALUES (?, ?, ?, 'novo', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8).toUpperCase(), n.platform, n.type, customerId,
      n.customer?.name || null, realPhone, n.address ? JSON.stringify(n.address) : null, n.scheduled_for || null,
      subtotal, discount, deliveryFee, total, cost, n.payment?.method || PLATFORMS[n.platform].payment,
      n.payment?.change_for_cents || null, notes, n.platform, String(n.external_id), n.external_code ? String(n.external_code) : null,
      n.external_status || null, n.delivered_by || null, fee, createdAt, createdAt,
    );
    const id = Number(r.lastInsertRowid);
    for (const l of lines) {
      run(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, variant_name, options, qty, unit_price_cents, unit_cost_cents, total_cents, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, l.product_id, l.variant_id, l.name, l.variant_name, JSON.stringify(l.options), l.qty, l.unit_price_cents, l.unit_cost_cents, l.total_cents, l.notes,
      );
    }
    run('INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)', id, 'novo', `Recebido do ${PLATFORMS[n.platform].label}`, createdAt);
    // pago pelo app: o dinheiro vem no repasse da plataforma
    if (n.payment?.prepaid) {
      recordPayments(id, [{ method: PLATFORMS[n.platform].payment, amount_cents: total }], null);
      settlePaid(get('SELECT * FROM orders WHERE id = ?', id));
    }
    return { id, created: true };
  });

  if (result.created) {
    broadcast('order', { id: result.id, status: 'novo', new: true, channel: n.platform });
    if (cfg.auto_accept) {
      // aceite automático evita cancelamento por demora (a 99Food cancela em 5 minutos)
      const o = getOrder(result.id);
      setStatus(result.id, o.scheduled_for ? 'confirmado' : 'preparo', SYSTEM_USER, { note: 'Aceito automaticamente' });
    }
  }
  return { order: getOrder(result.id), created: result.created };
}

const RANK = { novo: 0, confirmado: 1, preparo: 2, pronto: 3, entrega: 4, concluido: 5 };

/** Aplica uma mudança de status vinda da plataforma (só avança; cancelamento vale sempre) */
export function applyPlatformStatus(platform, externalId, status, { note, rawStatus } = {}) {
  const o = get('SELECT id, status, type FROM orders WHERE external_platform = ? AND external_id = ?', platform, String(externalId));
  if (!o) return null;
  if (rawStatus) run('UPDATE orders SET external_status = ? WHERE id = ?', String(rawStatus), o.id);
  if (o.status === 'cancelado' || o.status === status) return getOrder(o.id);
  if (status === 'entrega' && o.type !== 'entrega') status = 'concluido';
  if (status !== 'cancelado' && (o.status === 'concluido' || RANK[status] <= RANK[o.status])) return getOrder(o.id);
  return setStatus(o.id, status, SYSTEM_USER, { note: note || `Atualizado pelo ${PLATFORMS[platform].label}`, reason: note, fromPlatform: true });
}

/** Registra um aviso no histórico do pedido sem mudar o status (ex.: cliente pediu cancelamento) */
export function addPlatformNote(platform, externalId, note) {
  const o = get('SELECT id, status FROM orders WHERE external_platform = ? AND external_id = ?', platform, String(externalId));
  if (!o) return;
  run('INSERT INTO order_events (order_id, status, note, created_at) VALUES (?, ?, ?, ?)', o.id, o.status, note.slice(0, 300), now());
  run('UPDATE orders SET external_sync_error = ?, updated_at = ? WHERE id = ?', note.slice(0, 300), now(), o.id);
  broadcast('order', { id: o.id, status: o.status, alert: note });
}

export function setSyncError(orderId, message) {
  run('UPDATE orders SET external_sync_error = ? WHERE id = ?', message ? String(message).slice(0, 300) : null, orderId);
  broadcast('order', { id: orderId });
}

/** JSON com números de 64 bits preservados como texto (ids de pedido da 99Food) */
export function parseBigJson(text) {
  return JSON.parse(String(text).replace(/([:[,]\s*)(-?\d{16,})(?=\s*[,}\]])/g, '$1"$2"'));
}
