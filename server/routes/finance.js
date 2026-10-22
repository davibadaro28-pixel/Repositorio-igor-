import { Router } from 'express';
import { all, get, run, tx, now, today } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { addDays, addMonths, cents, date, int, range, required, str } from '../util.js';

const r = Router();
r.use('/finance', requireModule('financeiro'));

r.get('/finance/categories', (_req, res) => res.json(all('SELECT * FROM fin_categories ORDER BY type DESC, name')));

r.post('/finance/categories', (req, res) => {
  const type = req.body.type === 'receita' ? 'receita' : 'despesa';
  const x = run('INSERT INTO fin_categories (name, type, is_cmv) VALUES (?, ?, ?)',
    required(req.body.name, 'o nome', 80), type, type === 'despesa' && req.body.is_cmv ? 1 : 0);
  res.status(201).json(get('SELECT * FROM fin_categories WHERE id = ?', x.lastInsertRowid));
});

r.get('/finance/entries', (req, res) => {
  const { from, to } = range(req.query, 31);
  const where = ['e.due_date BETWEEN ? AND ?'];
  const params = [from, to];
  if (['receita', 'despesa'].includes(req.query.type)) { where.push('e.type = ?'); params.push(req.query.type); }
  if (req.query.status === 'pendente') where.push(`e.status = 'pendente'`);
  if (req.query.status === 'pago') where.push(`e.status = 'pago'`);
  if (req.query.status === 'vencido') { where.push(`e.status = 'pendente' AND e.due_date < ?`); params.push(today()); }
  res.json(all(
    `SELECT e.*, c.name AS category_name FROM fin_entries e LEFT JOIN fin_categories c ON c.id = e.category_id
     WHERE ${where.join(' AND ')} ORDER BY e.due_date, e.id`, ...params,
  ));
});

function fields(b) {
  const type = b.type === 'receita' ? 'receita' : 'despesa';
  const amount = cents(b.amount_cents);
  if (!amount) fail(400, 'Informe o valor');
  const due = date(b.due_date);
  if (!due) fail(400, 'Informe o vencimento');
  const paid = b.status === 'pago';
  return {
    type, amount, due, paid,
    values: [type, int(b.category_id), required(b.description, 'a descrição'), amount, due, paid ? date(b.paid_at, today()) : null,
      paid ? 'pago' : 'pendente', str(b.method, 30), str(b.supplier, 120), str(b.notes, 500)],
  };
}

r.post('/finance/entries', (req, res) => {
  const f = fields(req.body);
  const repeat = Math.min(Math.max(int(req.body.repeat_months, 1), 1), 36); // conta recorrente (ex.: aluguel)
  const ids = tx(() => {
    const out = [];
    for (let i = 0; i < repeat; i++) {
      const v = [...f.values];
      v[4] = addMonths(f.due, i);
      if (i > 0) { v[5] = null; v[6] = 'pendente'; }
      if (repeat > 1) v[2] = `${v[2]} (${i + 1}/${repeat})`;
      const x = run(
        `INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, paid_at, status, method, supplier, notes, user_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ...v, req.user.id, now(),
      );
      out.push(Number(x.lastInsertRowid));
    }
    return out;
  });
  res.status(201).json({ ids });
});

r.put('/finance/entries/:id', (req, res) => {
  const f = fields(req.body);
  run(
    `UPDATE fin_entries SET type = ?, category_id = ?, description = ?, amount_cents = ?, due_date = ?, paid_at = ?, status = ?,
       method = ?, supplier = ?, notes = ? WHERE id = ?`, ...f.values, int(req.params.id),
  );
  res.json(get('SELECT * FROM fin_entries WHERE id = ?', int(req.params.id)));
});

r.post('/finance/entries/:id/pay', (req, res) => {
  const paid = req.body.paid !== false;
  run('UPDATE fin_entries SET status = ?, paid_at = ? WHERE id = ?', paid ? 'pago' : 'pendente', paid ? date(req.body.paid_at, today()) : null, int(req.params.id));
  res.json(get('SELECT * FROM fin_entries WHERE id = ?', int(req.params.id)));
});

r.delete('/finance/entries/:id', (req, res) => {
  run('DELETE FROM fin_entries WHERE id = ?', int(req.params.id));
  res.json({ ok: true });
});

// Fluxo de caixa realizado (por dia): recebimentos de vendas + lançamentos pagos
r.get('/finance/cashflow', (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 30);
  const sales = all(
    `SELECT substr(created_at, 1, 10) AS day, SUM(amount_cents) AS gross, SUM(fee_cents) AS fees
     FROM order_payments WHERE created_at BETWEEN ? AND ? GROUP BY day`, fromTs, toTs,
  );
  const entries = all(
    `SELECT paid_at AS day, type, SUM(amount_cents) AS amount FROM fin_entries
     WHERE status = 'pago' AND paid_at BETWEEN ? AND ? GROUP BY day, type`, from, to,
  );
  const days = [];
  let balance = 0;
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const s = sales.find((x) => x.day === d);
    const inc = entries.find((x) => x.day === d && x.type === 'receita')?.amount || 0;
    const out = entries.find((x) => x.day === d && x.type === 'despesa')?.amount || 0;
    const entradas = (s?.gross || 0) - (s?.fees || 0) + inc;
    const saidas = out;
    balance += entradas - saidas;
    days.push({ day: d, vendas: (s?.gross || 0) - (s?.fees || 0), outras_receitas: inc, entradas, saidas, saldo_dia: entradas - saidas, saldo_acumulado: balance });
  }
  const pending = all(
    `SELECT type, SUM(amount_cents) AS amount, SUM(CASE WHEN due_date < ? THEN amount_cents ELSE 0 END) AS overdue
     FROM fin_entries WHERE status = 'pendente' GROUP BY type`, today(),
  );
  res.json({ from, to, days, pending });
});

// DRE simplificada (competência pela data do pedido)
r.get('/finance/dre', (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 30);
  const s = get(
    `SELECT COALESCE(SUM(subtotal_cents), 0) AS produtos, COALESCE(SUM(delivery_fee_cents), 0) AS entregas,
            COALESCE(SUM(discount_cents), 0) AS descontos, COALESCE(SUM(total_cents), 0) AS liquida,
            COALESCE(SUM(cost_cents), 0) AS cmv, COALESCE(SUM(platform_fee_cents), 0) AS comissoes, COUNT(*) AS pedidos
     FROM orders WHERE status != 'cancelado' AND created_at BETWEEN ? AND ?`, fromTs, toTs,
  );
  const fees = get(
    `SELECT COALESCE(SUM(p.fee_cents), 0) AS v FROM order_payments p JOIN orders o ON o.id = p.order_id
     WHERE o.status != 'cancelado' AND o.created_at BETWEEN ? AND ?`, fromTs, toTs,
  ).v;
  const allDespesas = all(
    `SELECT COALESCE(c.name, 'Sem categoria') AS categoria, COALESCE(c.is_cmv, 0) AS is_cmv, SUM(e.amount_cents) AS valor
     FROM fin_entries e LEFT JOIN fin_categories c ON c.id = e.category_id
     WHERE e.type = 'despesa' AND e.due_date BETWEEN ? AND ? GROUP BY categoria ORDER BY valor DESC`, from, to,
  );
  const compras = allDespesas.filter((d) => d.is_cmv).reduce((a, d) => a + d.valor, 0);
  // CMV pela ficha técnica (teórico) ou pelas compras de insumos/embalagens lançadas no período
  const mode = req.query.cmv === 'ficha' ? 'ficha' : 'compras';
  const cmv = mode === 'ficha' ? s.cmv : compras;
  const despesas = allDespesas.filter((d) => !d.is_cmv);
  const outras = get(`SELECT COALESCE(SUM(amount_cents), 0) AS v FROM fin_entries WHERE type = 'receita' AND due_date BETWEEN ? AND ?`, from, to).v;
  const totalDespesas = despesas.reduce((a, d) => a + d.valor, 0);
  const lucroBruto = s.liquida - cmv - fees - s.comissoes;
  res.json({
    from, to, cmv_mode: mode, cmv_ficha: s.cmv, compras_insumos: compras,
    receita_bruta: s.produtos + s.entregas, produtos: s.produtos, entregas: s.entregas, descontos: s.descontos,
    receita_liquida: s.liquida, cmv, taxas: fees, comissoes: s.comissoes, lucro_bruto: lucroBruto, outras_receitas: outras,
    despesas, total_despesas: totalDespesas, resultado: lucroBruto + outras - totalDespesas, pedidos: s.pedidos,
  });
});

export default r;
