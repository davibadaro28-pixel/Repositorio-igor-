import { Router } from 'express';
import { all, get, run, now, today } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { addPayments, createOrder, getOrder, hydrate, setStatus, STATUSES } from '../services/orders.js';
import { broadcast } from '../realtime.js';
import { date, int, str } from '../util.js';

const r = Router();

// situação da última nota fiscal de cada pedido (selo no quadro e no histórico)
const FISCAL_COLS = `(SELECT f.status FROM fiscal_docs f WHERE f.order_id = o.id ORDER BY f.id DESC LIMIT 1) AS fiscal_status,
  (SELECT f.alert FROM fiscal_docs f WHERE f.order_id = o.id ORDER BY f.id DESC LIMIT 1) AS fiscal_alert`;
const view = requireModule('pedidos', 'pdv', 'cozinha', 'encomendas', 'caixa');
const manage = requireModule('pedidos', 'pdv', 'caixa');

function itemsFor(ids) {
  if (!ids.length) return new Map();
  const rows = all(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => '?').join(',')}) ORDER BY id`, ...ids);
  return Map.groupBy(rows.map((i) => ({ ...i, options: JSON.parse(i.options) })), (i) => i.order_id);
}

// Pedidos em andamento + concluídos/cancelados de hoje (Kanban, cozinha)
r.get('/orders/board', view, (_req, res) => {
  const t = today();
  const orders = all(
    `SELECT o.*, u.name AS courier_name, ${FISCAL_COLS} FROM orders o LEFT JOIN users u ON u.id = o.courier_id
     WHERE o.status NOT IN ('concluido','cancelado') OR substr(o.updated_at, 1, 10) = ?
     ORDER BY COALESCE(o.scheduled_for, o.created_at), o.id`, t,
  ).map(hydrate);
  const items = itemsFor(orders.map((o) => o.id));
  res.json(orders.map((o) => ({ ...o, items: items.get(o.id) || [] })));
});

r.get('/orders', view, (req, res) => {
  const where = [];
  const params = [];
  const statuses = String(req.query.status || '').split(',').filter((s) => STATUSES.includes(s));
  if (statuses.length) { where.push(`o.status IN (${statuses.map(() => '?').join(',')})`); params.push(...statuses); }
  const dateField = req.query.by === 'scheduled' ? 'o.scheduled_for' : 'o.created_at';
  if (date(req.query.from)) { where.push(`${dateField} >= ?`); params.push(`${req.query.from} 00:00:00`); }
  if (date(req.query.to)) { where.push(`${dateField} <= ?`); params.push(`${req.query.to} 23:59:59`); }
  if (req.query.scheduled === '1') where.push('o.scheduled_for IS NOT NULL');
  if (['entrega', 'retirada', 'balcao'].includes(req.query.type)) { where.push('o.type = ?'); params.push(req.query.type); }
  if (req.query.channel) { where.push('o.channel = ?'); params.push(String(req.query.channel)); }
  if (int(req.query.customer_id)) { where.push('o.customer_id = ?'); params.push(int(req.query.customer_id)); }
  const q = str(req.query.q, 80);
  if (q) {
    where.push('(o.customer_name LIKE ? OR o.customer_phone LIKE ? OR CAST(o.id AS TEXT) = ? OR o.code = ?)');
    params.push(`%${q}%`, `%${q.replace(/\D/g, '') || q}%`, q.replace('#', ''), q.toUpperCase());
  }
  const limit = Math.min(int(req.query.limit, 200), 1000);
  const orders = all(
    `SELECT o.*, u.name AS courier_name, ${FISCAL_COLS} FROM orders o LEFT JOIN users u ON u.id = o.courier_id
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY ${req.query.by === 'scheduled' ? 'o.scheduled_for ASC' : 'o.id DESC'} LIMIT ?`, ...params, limit,
  ).map(hydrate);
  const items = itemsFor(orders.map((o) => o.id));
  res.json(orders.map((o) => ({ ...o, items: items.get(o.id) || [] })));
});

r.get('/orders/:id', view, (req, res) => {
  const o = getOrder(int(req.params.id));
  if (!o) fail(404, 'Pedido não encontrado');
  res.json(o);
});

r.post('/orders', manage, (req, res) => {
  const body = { ...req.body };
  if (body.discount_cents && !['admin', 'gerente', 'caixa'].includes(req.user.role)) delete body.discount_cents;
  res.status(201).json(createOrder(body, { user: req.user }));
});

r.post('/orders/:id/status', requireModule('pedidos', 'pdv', 'cozinha', 'caixa'), (req, res) => {
  const status = String(req.body.status);
  if (req.user.role === 'cozinha' && !['confirmado', 'preparo', 'pronto'].includes(status)) fail(403, 'A cozinha só altera o preparo');
  res.json(setStatus(int(req.params.id), status, req.user, { reason: str(req.body.reason, 300), note: str(req.body.note, 300) }));
});

r.post('/orders/:id/payments', manage, (req, res) => {
  res.json(addPayments(int(req.params.id), Array.isArray(req.body.payments) ? req.body.payments : [], req.user));
});

r.patch('/orders/:id', manage, (req, res) => {
  const id = int(req.params.id);
  const order = get('SELECT * FROM orders WHERE id = ?', id);
  if (!order) fail(404, 'Pedido não encontrado');
  if ('courier_id' in req.body) {
    const cid = int(req.body.courier_id);
    if (cid && !get(`SELECT 1 FROM users WHERE id = ? AND role = 'entregador' AND active = 1`, cid)) fail(400, 'Entregador inválido');
    run('UPDATE orders SET courier_id = ?, updated_at = ? WHERE id = ?', cid || null, now(), id);
  }
  if ('notes' in req.body) run('UPDATE orders SET notes = ?, updated_at = ? WHERE id = ?', str(req.body.notes, 500), now(), id);
  if ('scheduled_for' in req.body) {
    const s = req.body.scheduled_for ? String(req.body.scheduled_for).replace('T', ' ').slice(0, 16) + ':00' : null;
    if (s && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:00$/.test(s)) fail(400, 'Data inválida');
    run('UPDATE orders SET scheduled_for = ?, updated_at = ? WHERE id = ?', s, now(), id);
  }
  if ('payment_method' in req.body) run('UPDATE orders SET payment_method = ?, updated_at = ? WHERE id = ?', str(req.body.payment_method, 30), now(), id);
  broadcast('order', { id, status: order.status });
  res.json(getOrder(id));
});

export default r;
