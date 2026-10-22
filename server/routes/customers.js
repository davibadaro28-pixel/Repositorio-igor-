import { Router } from 'express';
import { all, get, run, now, today } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { hydrate, normalizePhone } from '../services/orders.js';
import { addDays, int, required, str } from '../util.js';

const r = Router();
r.use('/customers', requireModule('clientes', 'pdv', 'pedidos'));

const STATS = `
  SELECT c.*, COUNT(o.id) AS orders, COALESCE(SUM(o.total_cents), 0) AS spent_cents, MAX(o.created_at) AS last_order_at
  FROM customers c LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'cancelado'`;

r.get('/customers', (req, res) => {
  const where = [];
  const params = [];
  const q = str(req.query.q, 80);
  if (q) {
    const digits = q.replace(/\D/g, '');
    where.push(`(c.name LIKE ?${digits ? ' OR c.phone LIKE ?' : ''})`);
    params.push(`%${q}%`, ...(digits ? [`%${digits}%`] : []));
  }
  let having = '';
  const havingParams = [];
  const segment = req.query.segment;
  if (segment === 'aniversariantes') {
    where.push(`substr(c.birthday, -5, 2) = ?`);
    params.push(today().slice(5, 7));
  }
  if (segment === 'inativos') {
    having = 'HAVING last_order_at < ?';
    havingParams.push(`${addDays(today(), -30)} 00:00:00`);
  }
  if (segment === 'novos') having = 'HAVING orders = 1';
  if (segment === 'fieis') having = 'HAVING orders >= 5';
  const order = segment === 'top' || segment === 'fieis' ? 'spent_cents DESC' : 'last_order_at DESC NULLS LAST, c.name';
  res.json(all(
    `${STATS} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} GROUP BY c.id ${having} ORDER BY ${order} LIMIT ?`,
    ...params, ...havingParams, Math.min(int(req.query.limit, 300), 2000),
  ));
});

r.get('/customers/by-phone/:phone', (req, res) => {
  const p = normalizePhone(req.params.phone);
  res.json((p && get(`${STATS} WHERE c.phone = ? GROUP BY c.id`, p)) || null);
});

r.get('/customers/:id', (req, res) => {
  const c = get(`${STATS} WHERE c.id = ? GROUP BY c.id`, int(req.params.id));
  if (!c) fail(404, 'Cliente não encontrado');
  c.history = all('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC LIMIT 50', c.id).map(hydrate);
  c.favorites = all(
    `SELECT i.name, SUM(i.qty) AS qty FROM order_items i JOIN orders o ON o.id = i.order_id
     WHERE o.customer_id = ? AND o.status != 'cancelado' GROUP BY i.name ORDER BY qty DESC LIMIT 5`, c.id,
  );
  res.json(c);
});

function fields(b) {
  const phone = normalizePhone(b.phone);
  if (phone && (phone.length < 10 || phone.length > 11)) fail(400, 'Telefone inválido (use DDD + número)');
  const bday = str(b.birthday, 10);
  if (bday && !/^(\d{4}-)?\d{2}-\d{2}$/.test(bday)) fail(400, 'Aniversário inválido');
  return [required(b.name, 'o nome', 120), phone, str(b.email, 120), bday, str(b.address, 200), str(b.number, 20),
    str(b.complement, 100), str(b.neighborhood, 100), str(b.reference, 200), str(b.notes, 1000)];
}

r.post('/customers', (req, res) => {
  const f = fields(req.body);
  if (f[1] && get('SELECT 1 FROM customers WHERE phone = ?', f[1])) fail(400, 'Já existe um cliente com este telefone');
  const x = run(
    `INSERT INTO customers (name, phone, email, birthday, address, number, complement, neighborhood, reference, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ...f, now(),
  );
  res.status(201).json(get('SELECT * FROM customers WHERE id = ?', x.lastInsertRowid));
});

r.put('/customers/:id', (req, res) => {
  const id = int(req.params.id);
  const f = fields(req.body);
  if (f[1] && get('SELECT 1 FROM customers WHERE phone = ? AND id != ?', f[1], id)) fail(400, 'Já existe um cliente com este telefone');
  run(
    `UPDATE customers SET name = ?, phone = ?, email = ?, birthday = ?, address = ?, number = ?, complement = ?,
       neighborhood = ?, reference = ?, notes = ? WHERE id = ?`, ...f, id,
  );
  if (req.body.points != null && ['admin', 'gerente'].includes(req.user.role)) {
    run('UPDATE customers SET points = ? WHERE id = ?', Math.max(0, int(req.body.points, 0)), id);
  }
  res.json(get('SELECT * FROM customers WHERE id = ?', id));
});

export default r;
