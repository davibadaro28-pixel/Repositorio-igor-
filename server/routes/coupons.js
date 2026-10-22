import { Router } from 'express';
import { all, get, run, now } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { bool, cents, date, int, required } from '../util.js';

const r = Router();
r.use('/coupons', requireModule('cupons'));

r.get('/coupons', (_req, res) => res.json(all('SELECT * FROM coupons ORDER BY active DESC, id DESC')));

function fields(b) {
  const type = ['percent', 'fixed', 'frete'].includes(b.type) ? b.type : fail(400, 'Tipo inválido');
  const value = type === 'percent' ? Math.min(Math.max(int(b.value, 0), 1), 100) : type === 'fixed' ? cents(b.value) : 0;
  const code = required(b.code, 'o código', 30).toUpperCase().replace(/\s+/g, '');
  if (!/^[A-Z0-9_-]+$/.test(code)) fail(400, 'Use apenas letras e números no código');
  return [code, type, value, cents(b.min_order_cents || 0), date(b.starts_at), date(b.ends_at),
    int(b.max_uses) || null, bool(b.first_order_only), bool(b.active ?? 1)];
}

r.post('/coupons', (req, res) => {
  const f = fields(req.body);
  if (get('SELECT 1 FROM coupons WHERE code = ?', f[0])) fail(400, 'Já existe um cupom com este código');
  const x = run(
    `INSERT INTO coupons (code, type, value, min_order_cents, starts_at, ends_at, max_uses, first_order_only, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ...f, now(),
  );
  res.status(201).json(get('SELECT * FROM coupons WHERE id = ?', x.lastInsertRowid));
});

r.put('/coupons/:id', (req, res) => {
  const f = fields(req.body);
  if (get('SELECT 1 FROM coupons WHERE code = ? AND id != ?', f[0], int(req.params.id))) fail(400, 'Já existe um cupom com este código');
  run(
    `UPDATE coupons SET code = ?, type = ?, value = ?, min_order_cents = ?, starts_at = ?, ends_at = ?, max_uses = ?,
       first_order_only = ?, active = ? WHERE id = ?`, ...f, int(req.params.id),
  );
  res.json(get('SELECT * FROM coupons WHERE id = ?', int(req.params.id)));
});

r.delete('/coupons/:id', (req, res) => {
  run('DELETE FROM coupons WHERE id = ?', int(req.params.id));
  res.json({ ok: true });
});

export default r;
