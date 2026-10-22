import { Router } from 'express';
import { all, get, run, tx, now, today } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { variantCost } from '../services/orders.js';
import { bool, int, num, required, str } from '../util.js';

const r = Router();
const stock = requireModule('estoque');

const UNITS = ['g', 'ml', 'un', 'kg', 'l'];

r.get('/ingredients', requireModule('estoque', 'produtos'), (_req, res) => {
  res.json(all(
    `SELECT i.*, (SELECT COUNT(*) FROM recipe_items r WHERE r.ingredient_id = i.id) AS used_in
     FROM ingredients i ORDER BY i.active DESC, i.name`,
  ));
});

function fields(b) {
  const unit = UNITS.includes(b.unit) ? b.unit : 'un';
  return [required(b.name, 'o nome', 100), unit, Math.max(0, num(b.unit_cost, 0)), Math.max(0, num(b.min_qty, 0)), str(b.supplier, 120), bool(b.active ?? 1)];
}

r.post('/ingredients', stock, (req, res) => {
  const x = run('INSERT INTO ingredients (name, unit, unit_cost, min_qty, supplier, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ...fields(req.body), now());
  res.status(201).json(get('SELECT * FROM ingredients WHERE id = ?', x.lastInsertRowid));
});

r.put('/ingredients/:id', stock, (req, res) => {
  run('UPDATE ingredients SET name = ?, unit = ?, unit_cost = ?, min_qty = ?, supplier = ?, active = ? WHERE id = ?',
    ...fields(req.body), int(req.params.id));
  res.json(get('SELECT * FROM ingredients WHERE id = ?', int(req.params.id)));
});

r.delete('/ingredients/:id', stock, (req, res) => {
  const id = int(req.params.id);
  if (get('SELECT 1 FROM recipe_items WHERE ingredient_id = ? LIMIT 1', id)) {
    run('UPDATE ingredients SET active = 0 WHERE id = ?', id);
    return res.json({ ok: true, archived: true });
  }
  run('DELETE FROM ingredients WHERE id = ?', id);
  res.json({ ok: true });
});

/**
 * Movimentação de insumo.
 * entrada: compra (qty + custo total opcional, atualiza custo médio e pode lançar despesa no financeiro)
 * saida/perda: baixa manual | ajuste: define o saldo contado no inventário
 */
r.post('/ingredients/:id/movement', stock, (req, res) => {
  const id = int(req.params.id);
  const type = ['entrada', 'saida', 'perda', 'ajuste'].includes(req.body.type) ? req.body.type : fail(400, 'Tipo inválido');
  const qty = num(req.body.qty);
  if (qty == null || qty < 0 || (type !== 'ajuste' && qty === 0)) fail(400, 'Informe a quantidade');
  const result = tx(() => {
    const ing = get('SELECT * FROM ingredients WHERE id = ?', id);
    if (!ing) fail(404, 'Insumo não encontrado');
    let delta = type === 'entrada' ? qty : type === 'ajuste' ? qty - ing.stock_qty : -qty;
    let unitCost = null;
    if (type === 'entrada') {
      const total = int(req.body.total_cents, 0);
      if (total > 0) {
        unitCost = total / qty;
        // custo médio ponderado
        const base = Math.max(ing.stock_qty, 0);
        const avg = (base * ing.unit_cost + total) / (base + qty);
        run('UPDATE ingredients SET unit_cost = ? WHERE id = ?', Math.round(avg * 10000) / 10000, id);
        if (req.body.to_finance) {
          const cat = get(`SELECT id FROM fin_categories WHERE is_cmv = 1 AND type = 'despesa' ORDER BY id LIMIT 1`);
          run(
            `INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, paid_at, status, supplier, user_id, created_at)
             VALUES ('despesa', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            cat?.id || null, `Compra: ${ing.name} (${qty} ${ing.unit})`, total, today(),
            req.body.paid === false ? null : today(), req.body.paid === false ? 'pendente' : 'pago',
            str(req.body.supplier, 120) || ing.supplier, req.user.id, now(),
          );
        }
      }
    }
    run('UPDATE ingredients SET stock_qty = stock_qty + ? WHERE id = ?', delta, id);
    run('INSERT INTO stock_movements (ingredient_id, type, qty, unit_cost, note, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, type, delta, unitCost, str(req.body.note, 200), req.user.id, now());
    return get('SELECT * FROM ingredients WHERE id = ?', id);
  });
  res.json(result);
});

// Estoque de produto pronto (ex.: bolos já assados na vitrine)
r.post('/products/:id/stock', stock, (req, res) => {
  const id = int(req.params.id);
  const type = ['entrada', 'perda', 'ajuste'].includes(req.body.type) ? req.body.type : 'entrada';
  const qty = num(req.body.qty);
  if (qty == null || qty < 0) fail(400, 'Informe a quantidade');
  tx(() => {
    const p = get('SELECT * FROM products WHERE id = ?', id);
    if (!p) fail(404, 'Produto não encontrado');
    const delta = type === 'entrada' ? qty : type === 'ajuste' ? qty - p.stock_qty : -qty;
    run('UPDATE products SET stock_qty = stock_qty + ?, stock_control = 1 WHERE id = ?', delta, id);
    run('INSERT INTO stock_movements (product_id, type, qty, note, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, type === 'entrada' ? 'entrada' : type, delta, str(req.body.note, 200), req.user.id, now());
  });
  res.json(get('SELECT id, name, stock_qty, stock_control FROM products WHERE id = ?', id));
});

r.get('/stock/movements', stock, (req, res) => {
  const where = [];
  const params = [];
  if (int(req.query.ingredient_id)) { where.push('m.ingredient_id = ?'); params.push(int(req.query.ingredient_id)); }
  if (req.query.type) { where.push('m.type = ?'); params.push(String(req.query.type)); }
  res.json(all(
    `SELECT m.*, i.name AS ingredient_name, i.unit, p.name AS product_name, u.name AS user_name
     FROM stock_movements m LEFT JOIN ingredients i ON i.id = m.ingredient_id LEFT JOIN products p ON p.id = m.product_id
     LEFT JOIN users u ON u.id = m.user_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
     ORDER BY m.id DESC LIMIT ?`, ...params, Math.min(int(req.query.limit, 200), 1000),
  ));
});

// Ficha técnica de um produto (todas as variações)
r.get('/recipes/:productId', requireModule('estoque', 'produtos'), (req, res) => {
  const variants = all('SELECT * FROM product_variants WHERE product_id = ? AND active = 1 ORDER BY position, id', int(req.params.productId));
  res.json(variants.map((v) => ({
    ...v,
    cost_cents: variantCost(v.id),
    items: all(
      `SELECT r.ingredient_id, r.qty, i.name, i.unit, i.unit_cost FROM recipe_items r JOIN ingredients i ON i.id = r.ingredient_id
       WHERE r.variant_id = ? ORDER BY i.name`, v.id,
    ),
  })));
});

r.put('/recipes/variant/:variantId', requireModule('estoque', 'produtos'), (req, res) => {
  const vid = int(req.params.variantId);
  if (!get('SELECT 1 FROM product_variants WHERE id = ?', vid)) fail(404, 'Variação não encontrada');
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  tx(() => {
    run('DELETE FROM recipe_items WHERE variant_id = ?', vid);
    for (const it of items) {
      const q = num(it.qty, 0);
      if (q > 0 && get('SELECT 1 FROM ingredients WHERE id = ?', int(it.ingredient_id))) {
        run('INSERT OR REPLACE INTO recipe_items (variant_id, ingredient_id, qty) VALUES (?, ?, ?)', vid, int(it.ingredient_id), q);
      }
    }
  });
  res.json({ ok: true, cost_cents: variantCost(vid) });
});

// CMV teórico x preço de venda de todos os produtos
r.get('/stock/cmv', requireModule('estoque', 'produtos', 'relatorios'), (_req, res) => {
  const rows = all(
    `SELECT v.id AS variant_id, v.name AS variant_name, v.price_cents, p.id AS product_id, p.name, c.name AS category_name,
       (SELECT COUNT(*) FROM recipe_items r WHERE r.variant_id = v.id) AS recipe_items
     FROM product_variants v JOIN products p ON p.id = v.product_id JOIN categories c ON c.id = p.category_id
     WHERE v.active = 1 AND p.active = 1 ORDER BY c.position, p.position, v.position`,
  );
  res.json(rows.map((r) => {
    const cost = variantCost(r.variant_id);
    return { ...r, cost_cents: cost, profit_cents: r.price_cents - cost, cmv_pct: r.price_cents ? Math.round((cost / r.price_cents) * 1000) / 10 : 0 };
  }));
});

export default r;
