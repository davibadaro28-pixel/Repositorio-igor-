import { Router } from 'express';
import { all, get, run, now } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { getOrder, hydrate, setStatus } from '../services/orders.js';
import { bool, cents, int, range, required } from '../util.js';

const r = Router();

// ---------- Bairros / taxas ----------

r.get('/zones', requireModule('entregas', 'pdv', 'pedidos', 'configuracoes'), (_req, res) => {
  res.json(all('SELECT * FROM delivery_zones ORDER BY active DESC, name'));
});

const zoneFields = (b) => [required(b.name, 'o bairro', 100), cents(b.fee_cents || 0), cents(b.min_order_cents || 0), bool(b.active ?? 1)];

r.post('/zones', requireModule('entregas', 'configuracoes'), (req, res) => {
  const x = run('INSERT INTO delivery_zones (name, fee_cents, min_order_cents, active) VALUES (?, ?, ?, ?)', ...zoneFields(req.body));
  res.status(201).json(get('SELECT * FROM delivery_zones WHERE id = ?', x.lastInsertRowid));
});

r.put('/zones/:id', requireModule('entregas', 'configuracoes'), (req, res) => {
  run('UPDATE delivery_zones SET name = ?, fee_cents = ?, min_order_cents = ?, active = ? WHERE id = ?', ...zoneFields(req.body), int(req.params.id));
  res.json(get('SELECT * FROM delivery_zones WHERE id = ?', int(req.params.id)));
});

r.delete('/zones/:id', requireModule('entregas', 'configuracoes'), (req, res) => {
  run('DELETE FROM delivery_zones WHERE id = ?', int(req.params.id));
  res.json({ ok: true });
});

// ---------- Entregadores ----------

r.get('/couriers', requireModule('entregas', 'pedidos', 'pdv'), (_req, res) => {
  res.json(all(
    `SELECT u.id, u.name, u.phone, u.delivery_fee_cents,
       (SELECT COUNT(*) FROM orders o WHERE o.courier_id = u.id AND o.status = 'entrega') AS on_route
     FROM users u WHERE u.role = 'entregador' AND u.active = 1 ORDER BY u.name`,
  ));
});

// Acerto com entregadores no período
r.get('/couriers/report', requireModule('entregas'), (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 7);
  const rows = all(
    `SELECT u.id, u.name, u.delivery_fee_cents, COUNT(o.id) AS deliveries, COALESCE(SUM(o.delivery_fee_cents), 0) AS fees_charged_cents,
       COALESCE(SUM(CASE WHEN o.payment_method = 'dinheiro' THEN o.total_cents ELSE 0 END), 0) AS cash_collected_cents
     FROM users u LEFT JOIN orders o ON o.courier_id = u.id AND o.status = 'concluido' AND o.type = 'entrega'
       AND o.completed_at BETWEEN ? AND ?
     WHERE u.role = 'entregador' GROUP BY u.id ORDER BY deliveries DESC`, fromTs, toTs,
  );
  res.json({ from, to, couriers: rows.map((c) => ({ ...c, to_pay_cents: c.deliveries * c.delivery_fee_cents })) });
});

// ---------- App do entregador ----------

const courierOnly = requireModule('entregador', 'entregas');

r.get('/courier/orders', courierOnly, (req, res) => {
  const mine = all(
    `SELECT * FROM orders WHERE courier_id = ? AND (status IN ('pronto','entrega') OR (status = 'concluido' AND substr(completed_at, 1, 10) = substr(?, 1, 10)))
     ORDER BY CASE status WHEN 'entrega' THEN 0 WHEN 'pronto' THEN 1 ELSE 2 END, id`, req.user.id, now(),
  ).map(hydrate);
  res.json(mine.map((o) => getOrder(o.id)));
});

r.post('/courier/orders/:id/status', courierOnly, (req, res) => {
  const id = int(req.params.id);
  const o = get('SELECT * FROM orders WHERE id = ?', id);
  if (!o || (o.courier_id !== req.user.id && req.user.role === 'entregador')) fail(404, 'Entrega não encontrada');
  const status = req.body.status === 'concluido' ? 'concluido' : 'entrega';
  res.json(setStatus(id, status, req.user, { note: status === 'concluido' ? 'Entregue pelo entregador' : 'Saiu para entrega' }));
});

export default r;
