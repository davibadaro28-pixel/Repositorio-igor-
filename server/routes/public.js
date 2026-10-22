import { Router } from 'express';
import { all, get, getSetting } from '../db.js';
import { fail } from '../auth.js';
import { createOrder, evaluateCoupon, hydrate, storeStatus } from '../services/orders.js';
import { int } from '../util.js';

const r = Router();

// Limite simples por IP para evitar spam de pedidos
const hits = new Map();
setInterval(() => {
  const t = Date.now();
  for (const [key, list] of hits) if (!list.some((x) => t - x < 3600e3)) hits.delete(key);
}, 600e3).unref();
function rateLimit(max, windowMs) {
  return (req, _res, next) => {
    const key = `${req.path}:${req.ip}`;
    const t = Date.now();
    const list = (hits.get(key) || []).filter((x) => t - x < windowMs);
    if (list.length >= max) return next(Object.assign(new Error('Muitas tentativas. Aguarde alguns minutos.'), { status: 429 }));
    list.push(t);
    hits.set(key, list);
    next();
  };
}
export { rateLimit };

export function publicStore() {
  const store = getSetting('store');
  return {
    ...store,
    status: storeStatus(store),
    payment_methods: getSetting('payment_methods', []).filter((m) => m.active && m.online).map(({ id, label }) => ({ id, label })),
    zones: all('SELECT id, name, fee_cents, min_order_cents FROM delivery_zones WHERE active = 1 ORDER BY name'),
  };
}

r.get('/store', (_req, res) => res.json(publicStore()));

r.get('/menu', (_req, res) => {
  const categories = all('SELECT id, name FROM categories WHERE active = 1 ORDER BY position, id');
  const products = all(
    `SELECT id, category_id, name, description, image, available, featured, lead_time_hours, option_groups
     FROM products WHERE active = 1 AND online = 1 ORDER BY position, id`,
  );
  const variants = all(
    `SELECT v.id, v.product_id, v.name, v.price_cents FROM product_variants v
     JOIN products p ON p.id = v.product_id WHERE v.active = 1 AND p.active = 1 ORDER BY v.position, v.id`,
  );
  const byProduct = Map.groupBy(variants, (v) => v.product_id);
  const list = products
    .map((p) => ({ ...p, option_groups: JSON.parse(p.option_groups), variants: byProduct.get(p.id) || [] }))
    .filter((p) => p.variants.length);
  res.json({
    categories: categories
      .map((c) => ({ ...c, products: list.filter((p) => p.category_id === c.id) }))
      .filter((c) => c.products.length),
  });
});

r.post('/coupon', rateLimit(20, 10 * 60e3), (req, res) => {
  const { discount, coupon } = evaluateCoupon(req.body.code, int(req.body.subtotal_cents, 0), int(req.body.delivery_fee_cents, 0), req.body.phone);
  res.json({ code: coupon.code, type: coupon.type, discount_cents: discount });
});

r.post('/orders', rateLimit(8, 10 * 60e3), (req, res) => {
  const order = createOrder(req.body, { publicMenu: true });
  res.status(201).json({ code: order.code, id: order.id, total_cents: order.total_cents });
});

r.get('/orders/:code', (req, res) => {
  const o = hydrate(get(
    `SELECT id, code, type, status, customer_name, address, scheduled_for, subtotal_cents, discount_cents, delivery_fee_cents,
            total_cents, payment_method, change_for_cents, paid, notes, created_at, confirmed_at, ready_at, dispatched_at,
            completed_at, cancel_reason
     FROM orders WHERE code = ?`,
    String(req.params.code).toUpperCase(),
  ));
  if (!o) fail(404, 'Pedido não encontrado');
  o.items = all('SELECT name, variant_name, options, qty, unit_price_cents, total_cents, notes FROM order_items WHERE order_id = ?', o.id)
    .map((i) => ({ ...i, options: JSON.parse(i.options) }));
  res.json(o);
});

export default r;
