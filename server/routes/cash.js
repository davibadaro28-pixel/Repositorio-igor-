import { Router } from 'express';
import { all, get, run, tx, now } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { openCashSession, paymentMethods } from '../services/orders.js';
import { cents, int, str } from '../util.js';

const r = Router();
r.use('/cash', requireModule('caixa', 'pdv'));

// Resumo de uma sessão de caixa: vendas por forma de pagamento, sangrias, suprimentos e o esperado na gaveta
function summary(session) {
  const byMethod = all(
    `SELECT method, SUM(amount_cents) AS amount_cents, SUM(fee_cents) AS fee_cents, COUNT(*) AS count
     FROM order_payments WHERE cash_session_id = ? GROUP BY method`, session.id,
  );
  const movements = all(
    `SELECT m.*, u.name AS user_name FROM cash_movements m LEFT JOIN users u ON u.id = m.user_id
     WHERE session_id = ? ORDER BY m.id`, session.id,
  );
  const sum = (type) => movements.filter((m) => m.type === type).reduce((s, m) => s + m.amount_cents, 0);
  const cashSales = byMethod.find((m) => m.method === 'dinheiro')?.amount_cents || 0;
  const expected = {};
  for (const m of byMethod) expected[m.method] = m.amount_cents;
  expected.dinheiro = session.opening_cents + cashSales + sum('suprimento') - sum('sangria');
  const orders = get(
    `SELECT COUNT(DISTINCT order_id) AS n FROM order_payments WHERE cash_session_id = ?`, session.id,
  ).n;
  return {
    ...session,
    counted: session.counted ? JSON.parse(session.counted) : null,
    expected_saved: session.expected ? JSON.parse(session.expected) : null,
    by_method: byMethod,
    movements,
    sangrias_cents: sum('sangria'),
    suprimentos_cents: sum('suprimento'),
    sales_cents: byMethod.reduce((s, m) => s + m.amount_cents, 0),
    orders,
    expected,
    methods: paymentMethods(),
  };
}

r.get('/cash/current', (_req, res) => {
  const s = openCashSession();
  res.json(s ? summary(get(`SELECT c.*, u.name AS opened_by_name FROM cash_sessions c LEFT JOIN users u ON u.id = c.opened_by WHERE c.id = ?`, s.id)) : null);
});

r.post('/cash/open', (req, res) => {
  const s = tx(() => {
    if (openCashSession()) fail(400, 'Já existe um caixa aberto');
    const x = run('INSERT INTO cash_sessions (opened_by, opened_at, opening_cents) VALUES (?, ?, ?)',
      req.user.id, now(), cents(req.body.opening_cents || 0));
    return get('SELECT * FROM cash_sessions WHERE id = ?', x.lastInsertRowid);
  });
  res.status(201).json(summary(s));
});

r.post('/cash/movement', (req, res) => {
  const s = openCashSession();
  if (!s) fail(400, 'Abra o caixa primeiro');
  const type = req.body.type === 'suprimento' ? 'suprimento' : 'sangria';
  const amount = cents(req.body.amount_cents);
  if (!amount) fail(400, 'Informe o valor');
  run('INSERT INTO cash_movements (session_id, type, amount_cents, note, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    s.id, type, amount, str(req.body.note, 200), req.user.id, now());
  res.json(summary(s));
});

r.post('/cash/close', (req, res) => {
  const s = openCashSession();
  if (!s) fail(400, 'Nenhum caixa aberto');
  const sum = summary(s);
  const counted = {};
  for (const [k, v] of Object.entries(req.body.counted || {})) counted[k] = cents(v || 0);
  run(`UPDATE cash_sessions SET status = 'fechado', closed_by = ?, closed_at = ?, counted = ?, expected = ?, notes = ? WHERE id = ?`,
    req.user.id, now(), JSON.stringify(counted), JSON.stringify(sum.expected), str(req.body.notes, 500), s.id);
  res.json(summary(get('SELECT * FROM cash_sessions WHERE id = ?', s.id)));
});

r.get('/cash/sessions', (req, res) => {
  res.json(all(
    `SELECT c.*, uo.name AS opened_by_name, uc.name AS closed_by_name,
       (SELECT COALESCE(SUM(amount_cents), 0) FROM order_payments p WHERE p.cash_session_id = c.id) AS sales_cents
     FROM cash_sessions c LEFT JOIN users uo ON uo.id = c.opened_by LEFT JOIN users uc ON uc.id = c.closed_by
     ORDER BY c.id DESC LIMIT ?`, Math.min(int(req.query.limit, 60), 365),
  ).map((c) => ({ ...c, counted: c.counted ? JSON.parse(c.counted) : null, expected: c.expected ? JSON.parse(c.expected) : null })));
});

r.get('/cash/sessions/:id', (req, res) => {
  const s = get(`SELECT c.*, u.name AS opened_by_name FROM cash_sessions c LEFT JOIN users u ON u.id = c.opened_by WHERE c.id = ?`, int(req.params.id));
  if (!s) fail(404, 'Caixa não encontrado');
  res.json(summary(s));
});

export default r;
