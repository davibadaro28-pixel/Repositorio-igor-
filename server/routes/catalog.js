import { Router } from 'express';
import { all, get, run, tx, now } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { variantCost } from '../services/orders.js';
import { bool, cents, int, required, str } from '../util.js';

const r = Router();
const read = requireModule('produtos', 'pdv', 'estoque', 'pedidos');
const write = requireModule('produtos');

// ---------- Categorias ----------

r.get('/categories', read, (_req, res) => {
  res.json(all(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.active = 1) AS products
                FROM categories c ORDER BY c.position, c.id`));
});

r.post('/categories', write, (req, res) => {
  const pos = get('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM categories').p;
  const x = run('INSERT INTO categories (name, section, position) VALUES (?, ?, ?)', required(req.body.name, 'o nome'), str(req.body.section, 60), pos);
  res.status(201).json(get('SELECT * FROM categories WHERE id = ?', x.lastInsertRowid));
});

r.put('/categories/:id', write, (req, res) => {
  run('UPDATE categories SET name = ?, section = ?, active = ? WHERE id = ?',
    required(req.body.name, 'o nome'), str(req.body.section, 60), bool(req.body.active ?? 1), int(req.params.id));
  res.json(get('SELECT * FROM categories WHERE id = ?', int(req.params.id)));
});

r.post('/categories/reorder', write, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  tx(() => ids.forEach((id, i) => run('UPDATE categories SET position = ? WHERE id = ?', i, int(id))));
  res.json({ ok: true });
});

r.delete('/categories/:id', write, (req, res) => {
  const id = int(req.params.id);
  if (get('SELECT 1 FROM products WHERE category_id = ? LIMIT 1', id)) fail(400, 'Mova ou exclua os produtos desta categoria antes');
  run('DELETE FROM categories WHERE id = ?', id);
  res.json({ ok: true });
});

// ---------- Produtos ----------

function loadProducts(where = '1 = 1', ...params) {
  const products = all(
    `SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id
     WHERE ${where} ORDER BY c.position, p.position, p.id`, ...params,
  );
  const variants = all('SELECT * FROM product_variants WHERE active = 1 ORDER BY position, id');
  const byProduct = Map.groupBy(variants, (v) => v.product_id);
  return products.map((p) => ({
    ...p,
    option_groups: JSON.parse(p.option_groups),
    variants: (byProduct.get(p.id) || []).map((v) => {
      const cost = variantCost(v.id);
      return { ...v, cost_cents: cost, margin_pct: v.price_cents ? Math.round(((v.price_cents - cost) / v.price_cents) * 1000) / 10 : 0 };
    }),
  }));
}

r.get('/products', read, (req, res) => {
  const onlyActive = req.query.all ? '1 = 1' : 'p.active = 1';
  res.json(loadProducts(onlyActive));
});

r.get('/products/:id', read, (req, res) => {
  const [p] = loadProducts('p.id = ?', int(req.params.id));
  if (!p) fail(404, 'Produto não encontrado');
  res.json(p);
});

function parseGroups(groups) {
  if (!Array.isArray(groups)) return '[]';
  const clean = groups
    .map((g) => ({
      name: str(g.name, 80),
      min: Math.max(0, int(g.min, 0)),
      max: Math.max(0, int(g.max, 1)),
      options: (Array.isArray(g.options) ? g.options : [])
        .map((o) => ({ name: str(o.name, 80), price_cents: Math.max(0, int(o.price_cents, 0)) }))
        .filter((o) => o.name),
    }))
    .filter((g) => g.name && g.options.length);
  return JSON.stringify(clean);
}

function saveVariants(productId, variants) {
  if (!Array.isArray(variants) || !variants.length) fail(400, 'Informe pelo menos um preço');
  const keep = [];
  variants.forEach((v, i) => {
    const price = cents(v.price_cents);
    const name = str(v.name, 80);
    if (v.id && get('SELECT 1 FROM product_variants WHERE id = ? AND product_id = ?', int(v.id), productId)) {
      run('UPDATE product_variants SET name = ?, price_cents = ?, position = ?, active = 1 WHERE id = ?', name, price, i, int(v.id));
      keep.push(int(v.id));
    } else {
      const x = run('INSERT INTO product_variants (product_id, name, price_cents, position) VALUES (?, ?, ?, ?)', productId, name, price, i);
      keep.push(Number(x.lastInsertRowid));
    }
  });
  // tamanhos removidos ficam inativos (pedidos antigos continuam com o histórico)
  for (const v of all('SELECT id FROM product_variants WHERE product_id = ? AND active = 1', productId)) {
    if (!keep.includes(v.id)) run('UPDATE product_variants SET active = 0 WHERE id = ?', v.id);
  }
}

function productFields(b) {
  const categoryId = int(b.category_id);
  if (!get('SELECT 1 FROM categories WHERE id = ?', categoryId)) fail(400, 'Escolha a categoria');
  return [
    categoryId, required(b.name, 'o nome do produto', 120), str(b.description, 1000) || '', str(b.image, 300),
    bool(b.active ?? 1), bool(b.available ?? 1), bool(b.featured), bool(b.online ?? 1), Math.max(0, int(b.lead_time_hours, 0)),
    parseGroups(b.option_groups), bool(b.stock_control),
  ];
}

r.post('/products', write, (req, res) => {
  const id = tx(() => {
    const f = productFields(req.body);
    const pos = get('SELECT COALESCE(MAX(position), -1) + 1 AS p FROM products WHERE category_id = ?', f[0]).p;
    const x = run(
      `INSERT INTO products (category_id, name, description, image, active, available, featured, online, lead_time_hours,
         option_groups, stock_control, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ...f, pos, now(),
    );
    saveVariants(Number(x.lastInsertRowid), req.body.variants);
    return Number(x.lastInsertRowid);
  });
  res.status(201).json(loadProducts('p.id = ?', id)[0]);
});

r.put('/products/:id', write, (req, res) => {
  const id = int(req.params.id);
  if (!get('SELECT 1 FROM products WHERE id = ?', id)) fail(404, 'Produto não encontrado');
  tx(() => {
    run(
      `UPDATE products SET category_id = ?, name = ?, description = ?, image = ?, active = ?, available = ?, featured = ?,
         online = ?, lead_time_hours = ?, option_groups = ?, stock_control = ? WHERE id = ?`,
      ...productFields(req.body), id,
    );
    saveVariants(id, req.body.variants);
  });
  res.json(loadProducts('p.id = ?', id)[0]);
});

// Ligar/desligar rápido: disponível (esgotado), ativo, online, destaque
r.patch('/products/:id', requireModule('produtos', 'pdv', 'cozinha'), (req, res) => {
  const id = int(req.params.id);
  for (const field of ['available', 'active', 'online', 'featured']) {
    if (field in req.body) {
      if (field !== 'available' && !['admin', 'gerente'].includes(req.user.role)) fail(403, 'Sem permissão');
      run(`UPDATE products SET ${field} = ? WHERE id = ?`, bool(req.body[field]), id);
    }
  }
  res.json(loadProducts('p.id = ?', id)[0]);
});

r.post('/products/reorder', write, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  tx(() => ids.forEach((id, i) => run('UPDATE products SET position = ? WHERE id = ?', i, int(id))));
  res.json({ ok: true });
});

r.delete('/products/:id', write, (req, res) => {
  const id = int(req.params.id);
  if (get('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1', id)) {
    run('UPDATE products SET active = 0 WHERE id = ?', id); // tem histórico de vendas: só arquiva
    return res.json({ ok: true, archived: true });
  }
  run('DELETE FROM products WHERE id = ?', id);
  res.json({ ok: true });
});

export default r;
