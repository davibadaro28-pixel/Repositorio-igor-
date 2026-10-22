import { randomBytes } from 'node:crypto';
import { all, get, run, tx, now, getSetting } from '../db.js';
import { fail } from '../auth.js';
import { broadcast } from '../realtime.js';
import { cleanDoc } from '../fiscal/nfce.js';

export const STATUSES = ['novo', 'confirmado', 'preparo', 'pronto', 'entrega', 'concluido', 'cancelado'];
const STATUS_TIME = { confirmado: 'confirmed_at', preparo: 'confirmed_at', pronto: 'ready_at', entrega: 'dispatched_at', concluido: 'completed_at' };

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');
export function normalizePhone(phone) {
  let d = onlyDigits(phone);
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  return d || null;
}

const newCode = () => randomBytes(6).toString('base64url').replace(/[-_]/g, 'x').slice(0, 8).toUpperCase();

// ---------- Custos (ficha técnica) ----------

export function variantCost(variantId) {
  const row = get(
    `SELECT COALESCE(SUM(r.qty * i.unit_cost), 0) AS cost
     FROM recipe_items r JOIN ingredients i ON i.id = r.ingredient_id
     WHERE r.variant_id = ?`,
    variantId,
  );
  return Math.round(row.cost);
}

// ---------- Loja aberta? ----------

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function storeStatus(store, at = now()) {
  if (!store.accepting_orders) return { open: false, reason: 'Pedidos pausados no momento' };
  const weekday = new Date(at.slice(0, 10) + 'T12:00:00Z').getUTCDay();
  const day = store.hours?.[DAYS[weekday]];
  const hhmm = at.slice(11, 16);
  if (!day || !day.active) return { open: false, reason: 'Fechado hoje' };
  if (hhmm < day.open || hhmm >= day.close) return { open: false, reason: `Abrimos das ${day.open} às ${day.close}` };
  return { open: true, closes_at: day.close };
}

// ---------- Precificação do carrinho (sempre no servidor) ----------

export function priceCart(items, { publicMenu = false } = {}) {
  if (!Array.isArray(items) || items.length === 0) fail(400, 'Adicione pelo menos um item');
  if (items.length > 100) fail(400, 'Pedido com itens demais');
  let subtotal = 0;
  let cost = 0;
  let leadHours = 0;
  const lines = items.map((it) => {
    const qty = Math.floor(Number(it.qty));
    if (!(qty >= 1 && qty <= 999)) fail(400, 'Quantidade inválida');
    const v = get(
      `SELECT v.id AS variant_id, v.name AS variant_name, v.price_cents, v.active AS v_active,
              p.id AS product_id, p.name, p.active, p.available, p.online, p.option_groups, p.lead_time_hours
       FROM product_variants v JOIN products p ON p.id = v.product_id WHERE v.id = ?`,
      Number(it.variant_id),
    );
    if (!v || !v.active || !v.v_active) fail(400, 'Produto não encontrado ou inativo');
    if (!v.available) fail(400, `"${v.name}" está esgotado no momento`);
    if (publicMenu && !v.online) fail(400, `"${v.name}" não está disponível no cardápio online`);

    // adicionais / escolhas
    const groups = JSON.parse(v.option_groups || '[]');
    const chosen = Array.isArray(it.options) ? it.options : [];
    const options = [];
    let extra = 0;
    for (const g of groups) {
      const picks = chosen.filter((o) => o.group === g.name);
      if (picks.length < (g.min || 0)) fail(400, `Escolha "${g.name}" em ${v.name}`);
      if (g.max && picks.length > g.max) fail(400, `Muitas opções em "${g.name}"`);
      for (const pick of picks) {
        const opt = g.options.find((o) => o.name === pick.name);
        if (!opt) fail(400, `Opção inválida em "${g.name}"`);
        options.push({ group: g.name, name: opt.name, price_cents: opt.price_cents || 0 });
        extra += opt.price_cents || 0;
      }
    }
    if (chosen.some((o) => !groups.some((g) => g.name === o.group))) fail(400, 'Opção inválida');

    const unit = v.price_cents + extra;
    const unitCost = variantCost(v.variant_id);
    subtotal += unit * qty;
    cost += unitCost * qty;
    leadHours = Math.max(leadHours, v.lead_time_hours || 0);
    return {
      product_id: v.product_id,
      variant_id: v.variant_id,
      name: v.name,
      variant_name: v.variant_name,
      options,
      qty,
      unit_price_cents: unit,
      unit_cost_cents: unitCost,
      total_cents: unit * qty,
      notes: String(it.notes || '').slice(0, 300) || null,
    };
  });
  return { lines, subtotal, cost, leadHours };
}

// ---------- Cupons ----------

export function evaluateCoupon(code, subtotal, deliveryFee, phone) {
  if (!code) return { discount: 0, coupon: null };
  const c = get('SELECT * FROM coupons WHERE code = ? AND active = 1', String(code).trim());
  if (!c) fail(400, 'Cupom inválido');
  const t = now().slice(0, 10);
  if (c.starts_at && t < c.starts_at) fail(400, 'Cupom ainda não está válido');
  if (c.ends_at && t > c.ends_at) fail(400, 'Cupom expirado');
  if (c.max_uses && c.uses >= c.max_uses) fail(400, 'Cupom esgotado');
  if (subtotal < c.min_order_cents) fail(400, `Cupom válido para pedidos a partir de R$ ${(c.min_order_cents / 100).toFixed(2).replace('.', ',')}`);
  if (c.first_order_only) {
    const p = normalizePhone(phone);
    const prev = p && get(`SELECT 1 FROM orders WHERE customer_phone = ? AND status != 'cancelado' LIMIT 1`, p);
    if (prev) fail(400, 'Cupom válido apenas na primeira compra');
  }
  let discount = 0;
  if (c.type === 'percent') discount = Math.round((subtotal * Math.min(c.value, 100)) / 100);
  else if (c.type === 'fixed') discount = Math.min(c.value, subtotal);
  else if (c.type === 'frete') discount = deliveryFee;
  return { discount, coupon: c };
}

// ---------- Clientes ----------

export function upsertCustomer({ name, phone, address, birthday }) {
  const p = normalizePhone(phone);
  if (!p) return null;
  const existing = get('SELECT * FROM customers WHERE phone = ?', p);
  const addr = address || {};
  if (existing) {
    run(
      `UPDATE customers SET name = COALESCE(?, name), address = COALESCE(?, address), number = COALESCE(?, number),
         complement = COALESCE(?, complement), neighborhood = COALESCE(?, neighborhood), reference = COALESCE(?, reference),
         birthday = COALESCE(?, birthday) WHERE id = ?`,
      name || null, addr.street || null, addr.number || null, addr.complement || null, addr.neighborhood || null,
      addr.reference || null, birthday || null, existing.id,
    );
    return existing.id;
  }
  const r = run(
    `INSERT INTO customers (name, phone, address, number, complement, neighborhood, reference, birthday, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    name || 'Cliente', p, addr.street || null, addr.number || null, addr.complement || null,
    addr.neighborhood || null, addr.reference || null, birthday || null, now(),
  );
  return Number(r.lastInsertRowid);
}

// ---------- Estoque ----------

function applyStock(order, direction, userId) {
  const items = all('SELECT * FROM order_items WHERE order_id = ?', order.id);
  const type = direction < 0 ? 'venda' : 'estorno';
  const t = now();
  for (const item of items) {
    if (item.variant_id) {
      for (const r of all('SELECT ingredient_id, qty FROM recipe_items WHERE variant_id = ?', item.variant_id)) {
        const q = r.qty * item.qty * direction;
        run('UPDATE ingredients SET stock_qty = stock_qty + ? WHERE id = ?', q, r.ingredient_id);
        run(
          'INSERT INTO stock_movements (ingredient_id, type, qty, note, order_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          r.ingredient_id, type, q, `Pedido #${order.id}`, order.id, userId || null, t,
        );
      }
    }
    if (item.product_id) {
      const p = get('SELECT stock_control FROM products WHERE id = ?', item.product_id);
      if (p?.stock_control) {
        run('UPDATE products SET stock_qty = stock_qty + ? WHERE id = ?', item.qty * direction, item.product_id);
        run(
          'INSERT INTO stock_movements (product_id, type, qty, note, order_id, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          item.product_id, type, item.qty * direction, `Pedido #${order.id}`, order.id, userId || null, t,
        );
      }
    }
  }
  run('UPDATE orders SET stock_applied = ? WHERE id = ?', direction < 0 ? 1 : 0, order.id);
}

// ---------- Pagamentos / caixa ----------

export const openCashSession = () => get(`SELECT * FROM cash_sessions WHERE status = 'aberto' ORDER BY id DESC LIMIT 1`);

export function paymentMethods() {
  return getSetting('payment_methods', []);
}

export function recordPayments(orderId, payments, userId) {
  const methods = paymentMethods();
  const session = openCashSession();
  const t = now();
  for (const p of payments) {
    const amount = Math.round(Number(p.amount_cents));
    if (!(amount > 0)) continue;
    const m = methods.find((x) => x.id === p.method);
    if (!m) fail(400, `Forma de pagamento inválida: ${p.method}`);
    const fee = Math.round((amount * (Number(m.fee_pct) || 0)) / 100);
    run(
      `INSERT INTO order_payments (order_id, method, amount_cents, fee_cents, cash_session_id, user_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      orderId, m.id, amount, fee, session?.id || null, userId || null, t,
    );
  }
}

export function settlePaid(order) {
  const paid = get('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM order_payments WHERE order_id = ?', order.id).s;
  if (paid >= order.total_cents && !order.paid) run('UPDATE orders SET paid = 1, paid_at = ? WHERE id = ?', now(), order.id);
}

export function addPayments(orderId, payments, user) {
  return tx(() => {
    const order = get('SELECT * FROM orders WHERE id = ?', orderId);
    if (!order) fail(404, 'Pedido não encontrado');
    if (order.status === 'cancelado') fail(400, 'Pedido cancelado');
    recordPayments(orderId, payments, user?.id);
    settlePaid(order);
    const full = getOrder(orderId);
    broadcast('order', { id: orderId, status: full.status });
    return full;
  });
}

// ---------- Fidelidade ----------

function awardPoints(order, direction) {
  const loyalty = getSetting('loyalty', {});
  if (!loyalty.enabled || !order.customer_id) return;
  if (direction > 0) {
    const pts = Math.floor((order.total_cents / 100) * (Number(loyalty.points_per_real) || 0));
    if (pts > 0) {
      run('UPDATE customers SET points = points + ? WHERE id = ?', pts, order.customer_id);
      run('UPDATE orders SET points_awarded = ? WHERE id = ?', pts, order.id);
    }
  } else if (order.points_awarded) {
    run('UPDATE customers SET points = MAX(0, points - ?) WHERE id = ?', order.points_awarded, order.customer_id);
    run('UPDATE orders SET points_awarded = 0 WHERE id = ?', order.id);
  }
}

// ---------- Criação de pedido ----------

/**
 * input: { items, type, customer:{name,phone,birthday}, address, zone_id, scheduled_for, coupon_code,
 *          payment_method, change_for_cents, notes, channel,
 *          // somente pelo painel/PDV:
 *          status, payments:[{method, amount_cents}], discount_cents, delivery_fee_cents, redeem_points }
 */
// Quem precisa saber de cada pedido novo (ex.: emitir a NFC-e de uma venda de balcão já concluída)
const createdListeners = [];
export const onOrderCreated = (fn) => createdListeners.push(fn);

export function createOrder(input, opts = {}) {
  const full = insertOrder(input, opts);
  for (const fn of createdListeners) setTimeout(() => fn(full), 0);
  return full;
}

function insertOrder(input, { user = null, publicMenu = false } = {}) {
  const store = getSetting('store');
  const type = input.type;
  if (!['entrega', 'retirada', 'balcao'].includes(type)) fail(400, 'Tipo de pedido inválido');
  if (publicMenu && type === 'balcao') fail(400, 'Tipo de pedido inválido');
  if (publicMenu && type === 'entrega' && !store.delivery_enabled) fail(400, 'Delivery indisponível no momento');
  if (publicMenu && type === 'retirada' && !store.pickup_enabled) fail(400, 'Retirada indisponível no momento');

  const customer = input.customer || {};
  const phone = normalizePhone(customer.phone);
  if (publicMenu) {
    if (!String(customer.name || '').trim()) fail(400, 'Informe seu nome');
    if (!phone || phone.length < 10 || phone.length > 11) fail(400, 'Informe um WhatsApp válido com DDD');
  }

  const { lines, subtotal, cost, leadHours } = priceCart(input.items, { publicMenu });
  const customerDoc = cleanDoc(input.customer_doc); // CPF/CNPJ na nota (opcional)

  // agendamento / encomenda
  let scheduled = input.scheduled_for ? String(input.scheduled_for).replace('T', ' ').slice(0, 16) + ':00' : null;
  if (scheduled && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/.test(scheduled)) fail(400, 'Data da encomenda inválida');
  const t = now();
  if (publicMenu) {
    const status = storeStatus(store, t);
    if (scheduled) {
      if (!store.scheduling_enabled) fail(400, 'Encomendas agendadas indisponíveis');
      if (scheduled < t) fail(400, 'Escolha uma data futura para a encomenda');
      const sched = storeStatus({ ...store, accepting_orders: true }, scheduled);
      if (!sched.open) fail(400, 'Escolha um horário dentro do funcionamento da loja');
    } else if (!status.open) {
      fail(400, `Loja fechada agora (${status.reason}). Você pode agendar uma encomenda.`);
    }
    if (leadHours > 0) {
      const min = now(new Date(Date.now() + leadHours * 3600e3));
      if (!scheduled || scheduled < min) fail(400, `Há itens que precisam de encomenda com ${leadHours}h de antecedência. Agende a data.`);
    }
    if (subtotal < (store.min_order_cents || 0)) fail(400, `Pedido mínimo de R$ ${(store.min_order_cents / 100).toFixed(2).replace('.', ',')}`);
  }

  // entrega
  let address = null;
  let zone = null;
  let deliveryFee = 0;
  if (type === 'entrega') {
    const a = input.address || {};
    if (publicMenu && (!String(a.street || '').trim() || !String(a.number || '').trim())) fail(400, 'Informe o endereço de entrega');
    address = {
      street: String(a.street || '').slice(0, 200),
      number: String(a.number || '').slice(0, 20),
      complement: String(a.complement || '').slice(0, 100),
      neighborhood: String(a.neighborhood || '').slice(0, 100),
      reference: String(a.reference || '').slice(0, 200),
    };
    if (input.zone_id) {
      zone = get('SELECT * FROM delivery_zones WHERE id = ? AND active = 1', Number(input.zone_id));
      if (!zone) fail(400, 'Bairro de entrega inválido');
      address.neighborhood = zone.name;
      deliveryFee = zone.fee_cents;
      if (publicMenu && subtotal < zone.min_order_cents) fail(400, `Pedido mínimo para ${zone.name}: R$ ${(zone.min_order_cents / 100).toFixed(2).replace('.', ',')}`);
    } else if (publicMenu && !store.allow_out_of_zone) {
      fail(400, 'Escolha o bairro de entrega');
    }
    if (!publicMenu && input.delivery_fee_cents != null) deliveryFee = Math.max(0, Math.round(Number(input.delivery_fee_cents)));
  }

  // pagamento informado
  const methods = paymentMethods().filter((m) => m.active);
  if (input.payment_method && !methods.some((m) => m.id === input.payment_method)) fail(400, 'Forma de pagamento inválida');
  if (publicMenu && !input.payment_method) fail(400, 'Escolha a forma de pagamento');

  return tx(() => {
    const { discount: couponDiscount, coupon } = evaluateCoupon(input.coupon_code, subtotal, deliveryFee, phone);
    let discount = couponDiscount;
    if (!publicMenu && input.discount_cents) discount += Math.max(0, Math.round(Number(input.discount_cents)));

    const customerId = phone ? upsertCustomer({ name: String(customer.name || '').trim(), phone, address, birthday: customer.birthday }) : null;

    // resgate de pontos (somente painel)
    if (!publicMenu && input.redeem_points && customerId) {
      const loyalty = getSetting('loyalty', {});
      const c = get('SELECT points FROM customers WHERE id = ?', customerId);
      const blocks = Math.floor(Math.min(Number(input.redeem_points), c.points) / (loyalty.redeem_points || Infinity));
      if (loyalty.enabled && blocks > 0) {
        discount += blocks * loyalty.redeem_value_cents;
        run('UPDATE customers SET points = points - ? WHERE id = ?', blocks * loyalty.redeem_points, customerId);
      }
    }

    discount = Math.min(discount, subtotal + deliveryFee);
    const total = subtotal + deliveryFee - discount;

    let status = 'novo';
    if (!publicMenu && input.status && STATUSES.includes(input.status) && input.status !== 'cancelado') status = input.status;
    const channel = publicMenu ? 'cardapio' : ['pdv', 'whatsapp', 'telefone', 'ifood', '99food', 'outro'].includes(input.channel) ? input.channel : 'pdv';

    const changeFor = input.payment_method === 'dinheiro' && input.change_for_cents ? Math.round(Number(input.change_for_cents)) : null;
    const r = run(
      `INSERT INTO orders (code, channel, type, status, customer_id, customer_name, customer_phone, address, zone_id,
         scheduled_for, subtotal_cents, discount_cents, delivery_fee_cents, total_cents, cost_cents, coupon_code,
         payment_method, change_for_cents, notes, customer_doc, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newCode(), channel, type, status, customerId, String(customer.name || '').trim() || null, phone,
      address ? JSON.stringify(address) : null, zone?.id || null, scheduled, subtotal, discount, deliveryFee, total, cost,
      coupon?.code || null, input.payment_method || null, changeFor, String(input.notes || '').slice(0, 500) || null,
      customerDoc, user?.id || null, t, t,
    );
    const orderId = Number(r.lastInsertRowid);
    for (const l of lines) {
      run(
        `INSERT INTO order_items (order_id, product_id, variant_id, name, variant_name, options, qty, unit_price_cents, unit_cost_cents, total_cents, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        orderId, l.product_id, l.variant_id, l.name, l.variant_name, JSON.stringify(l.options), l.qty,
        l.unit_price_cents, l.unit_cost_cents, l.total_cents, l.notes,
      );
    }
    run('INSERT INTO order_events (order_id, status, user_id, created_at) VALUES (?, ?, ?, ?)', orderId, status, user?.id || null, t);
    if (coupon) run('UPDATE coupons SET uses = uses + 1 WHERE id = ?', coupon.id);

    const order = get('SELECT * FROM orders WHERE id = ?', orderId);
    if (status !== 'novo') {
      applyStock(order, -1, user?.id);
      const col = STATUS_TIME[status];
      if (col) run(`UPDATE orders SET ${col} = ? WHERE id = ?`, t, orderId);
    }
    if (Array.isArray(input.payments) && input.payments.length && !publicMenu) {
      recordPayments(orderId, input.payments, user?.id);
      settlePaid(order);
    }
    if (status === 'concluido') {
      run('UPDATE orders SET completed_at = ? WHERE id = ?', t, orderId);
      awardPoints(get('SELECT * FROM orders WHERE id = ?', orderId), 1);
    }

    const full = getOrder(orderId);
    broadcast('order', { id: orderId, status, new: true, channel });
    return full;
  });
}

// ---------- Mudança de status ----------

// Quem precisa saber de cada mudança (ex.: avisar o iFood/99Food que o pedido ficou pronto)
const statusListeners = [];
export const onStatusChange = (fn) => statusListeners.push(fn);

/** opts.fromPlatform: a mudança veio do próprio app de delivery (não precisa avisá-lo de volta) */
export function setStatus(orderId, status, user, opts = {}) {
  const before = get('SELECT status FROM orders WHERE id = ?', orderId)?.status;
  const full = changeStatus(orderId, status, user, opts);
  if (before !== status && full.status === status) {
    for (const fn of statusListeners) setTimeout(() => fn(full, status, opts), 0);
  }
  return full;
}

function changeStatus(orderId, status, user, { note, reason } = {}) {
  if (!STATUSES.includes(status)) fail(400, 'Status inválido');
  return tx(() => {
    const order = get('SELECT * FROM orders WHERE id = ?', orderId);
    if (!order) fail(404, 'Pedido não encontrado');
    if (order.status === status) return getOrder(orderId);
    if (order.status === 'cancelado') fail(400, 'Pedido já cancelado');
    if (order.status === 'concluido' && status !== 'cancelado') fail(400, 'Pedido já concluído');
    if (status === 'entrega' && order.type !== 'entrega') fail(400, 'Este pedido não é para entrega');
    if (status === 'cancelado' && order.status === 'concluido' && !['admin', 'gerente'].includes(user?.role)) {
      fail(403, 'Somente gerente ou administrador cancela pedido concluído');
    }

    const t = now();
    const col = STATUS_TIME[status];
    run(`UPDATE orders SET status = ?, updated_at = ?${col ? `, ${col} = COALESCE(${col}, ?)` : ''}${status === 'cancelado' ? ', cancel_reason = ?' : ''} WHERE id = ?`,
      ...[status, t, ...(col ? [t] : []), ...(status === 'cancelado' ? [String(reason || note || '').slice(0, 300) || null] : []), orderId]);
    run('INSERT INTO order_events (order_id, status, note, user_id, created_at) VALUES (?, ?, ?, ?, ?)', orderId, status, note || reason || null, user?.id || null, t);

    if (status === 'cancelado') {
      if (order.stock_applied) applyStock(order, 1, user?.id);
      awardPoints(order, -1);
    } else {
      if (!order.stock_applied) applyStock(order, -1, user?.id);
      if (status === 'concluido') {
        // pedido do cardápio pago na entrega/retirada: registra o pagamento informado
        const paid = get('SELECT COALESCE(SUM(amount_cents), 0) AS s FROM order_payments WHERE order_id = ?', orderId).s;
        if (paid < order.total_cents && order.payment_method) {
          recordPayments(orderId, [{ method: order.payment_method, amount_cents: order.total_cents - paid }], user?.id);
        }
        settlePaid(order);
        awardPoints(order, 1);
      }
    }
    const full = getOrder(orderId);
    broadcast('order', { id: orderId, status });
    return full;
  });
}

// ---------- Leitura ----------

export function hydrate(order) {
  if (!order) return order;
  order.address = order.address ? JSON.parse(order.address) : null;
  return order;
}

export function getOrder(id) {
  const order = hydrate(get(
    `SELECT o.*, u.name AS courier_name FROM orders o LEFT JOIN users u ON u.id = o.courier_id WHERE o.id = ?`, id,
  ));
  if (!order) return null;
  order.items = all('SELECT * FROM order_items WHERE order_id = ? ORDER BY id', id).map((i) => ({ ...i, options: JSON.parse(i.options) }));
  order.payments = all('SELECT * FROM order_payments WHERE order_id = ? ORDER BY id', id);
  order.events = all(
    'SELECT e.*, u.name AS user_name FROM order_events e LEFT JOIN users u ON u.id = e.user_id WHERE order_id = ? ORDER BY e.id', id,
  );
  order.fiscal_docs = all(
    `SELECT id, provider, environment, status, number, series, access_key, total_cents, customer_doc, message, alert, danfe_url,
            qrcode_url, consult_url, contingency, cancel_reason, cancelled_at, issued_at, created_at FROM fiscal_docs WHERE order_id = ? ORDER BY id DESC`, id,
  );
  return order;
}
