import { Router } from 'express';
import { all, get, now, today } from '../db.js';
import { requireModule } from '../auth.js';
import { hydrate, openCashSession } from '../services/orders.js';
import { addDays, money, range, toCsv } from '../util.js';

const r = Router();
const VALID = `status != 'cancelado'`;

function totals(fromTs, toTs) {
  return get(
    `SELECT COUNT(*) AS orders, COALESCE(SUM(total_cents), 0) AS revenue_cents, COALESCE(SUM(cost_cents), 0) AS cost_cents,
            COALESCE(SUM(discount_cents), 0) AS discount_cents, COALESCE(SUM(delivery_fee_cents), 0) AS delivery_cents
     FROM orders WHERE ${VALID} AND created_at BETWEEN ? AND ?`, fromTs, toTs,
  );
}

r.get('/reports/dashboard', requireModule('dashboard'), (_req, res) => {
  const t = today();
  const y = addDays(t, -1);
  const day = (d) => [`${d} 00:00:00`, `${d} 23:59:59`];
  const hoje = totals(...day(t));
  const ontem = totals(`${y} 00:00:00`, `${y} ${now().slice(11)}`); // mesmo horário de ontem
  const start = addDays(t, -29);
  const series = all(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
     FROM orders WHERE ${VALID} AND created_at >= ? GROUP BY day`, `${start} 00:00:00`,
  );
  const last30 = [];
  for (let d = start; d <= t; d = addDays(d, 1)) {
    const s = series.find((x) => x.day === d);
    last30.push({ day: d, orders: s?.orders || 0, revenue_cents: s?.revenue_cents || 0 });
  }
  const statusCount = all(`SELECT status, COUNT(*) AS n FROM orders WHERE status NOT IN ('concluido','cancelado') GROUP BY status`);
  const top = all(
    `SELECT i.name, SUM(i.qty) AS qty, SUM(i.total_cents) AS revenue_cents FROM order_items i JOIN orders o ON o.id = i.order_id
     WHERE o.${VALID} AND o.created_at >= ? GROUP BY i.name ORDER BY qty DESC LIMIT 8`, `${addDays(t, -6)} 00:00:00`,
  );
  const channels = all(
    `SELECT channel, type, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents, SUM(platform_fee_cents) AS commission_cents FROM orders
     WHERE ${VALID} AND created_at BETWEEN ? AND ? GROUP BY channel, type`, ...day(t),
  );
  const upcoming = all(
    `SELECT * FROM orders WHERE scheduled_for >= ? AND scheduled_for < ? AND status NOT IN ('concluido','cancelado')
     ORDER BY scheduled_for LIMIT 10`, `${t} 00:00:00`, `${addDays(t, 3)} 00:00:00`,
  ).map(hydrate);
  const lowStock = all('SELECT id, name, unit, stock_qty, min_qty FROM ingredients WHERE active = 1 AND min_qty > 0 AND stock_qty <= min_qty ORDER BY name');
  const bills = all(
    `SELECT id, description, amount_cents, due_date FROM fin_entries WHERE type = 'despesa' AND status = 'pendente' AND due_date <= ?
     ORDER BY due_date LIMIT 8`, addDays(t, 3),
  );
  const [bStart, bEnd] = [t.slice(5), addDays(t, 7).slice(5)];
  const birthdays = all(
    `SELECT id, name, phone, birthday FROM customers WHERE birthday IS NOT NULL
     AND (substr(birthday, -5) BETWEEN ? AND ? OR (? > ? AND (substr(birthday, -5) >= ? OR substr(birthday, -5) <= ?)))
     ORDER BY substr(birthday, -5)`,
    bStart, bEnd, bStart, bEnd, bStart, bEnd,
  );
  const soldOut = all('SELECT id, name FROM products WHERE active = 1 AND available = 0 ORDER BY name');
  const cash = openCashSession();
  res.json({ today: hoje, yesterday_same_time: ontem, last30, statusCount, top, channels, upcoming, lowStock, bills, birthdays, soldOut, cash_open: !!cash });
});

r.get('/reports/summary', requireModule('relatorios'), (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 30);
  const sum = totals(fromTs, toTs);
  const cancelled = get(`SELECT COUNT(*) AS n, COALESCE(SUM(total_cents), 0) AS v FROM orders WHERE status = 'cancelado' AND created_at BETWEEN ? AND ?`, fromTs, toTs);
  const byDay = all(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents FROM orders
     WHERE ${VALID} AND created_at BETWEEN ? AND ? GROUP BY day ORDER BY day`, fromTs, toTs,
  );
  const byHour = all(
    `SELECT CAST(substr(created_at, 12, 2) AS INTEGER) AS hour, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents FROM orders
     WHERE ${VALID} AND created_at BETWEEN ? AND ? GROUP BY hour ORDER BY hour`, fromTs, toTs,
  );
  const byWeekday = all(
    `SELECT CAST(strftime('%w', created_at) AS INTEGER) AS weekday, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents FROM orders
     WHERE ${VALID} AND created_at BETWEEN ? AND ? GROUP BY weekday ORDER BY weekday`, fromTs, toTs,
  );
  // faturamento consolidado: loja + apps de delivery, com comissões e taxas para chegar ao líquido
  const byChannel = all(
    `SELECT o.channel, COUNT(*) AS orders, SUM(o.total_cents) AS revenue_cents, SUM(o.platform_fee_cents) AS commission_cents,
       COALESCE(SUM((SELECT SUM(p.fee_cents) FROM order_payments p WHERE p.order_id = o.id)), 0) AS payment_fee_cents
     FROM orders o WHERE o.${VALID} AND o.created_at BETWEEN ? AND ? GROUP BY o.channel ORDER BY revenue_cents DESC`, fromTs, toTs,
  ).map((c) => ({ ...c, net_cents: c.revenue_cents - c.commission_cents - c.payment_fee_cents, avg_ticket_cents: Math.round(c.revenue_cents / c.orders) }));
  const byType = all(
    `SELECT type, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents FROM orders
     WHERE ${VALID} AND created_at BETWEEN ? AND ? GROUP BY type ORDER BY revenue_cents DESC`, fromTs, toTs,
  );
  const byPayment = all(
    `SELECT p.method, COUNT(*) AS payments, SUM(p.amount_cents) AS amount_cents, SUM(p.fee_cents) AS fee_cents
     FROM order_payments p JOIN orders o ON o.id = p.order_id
     WHERE o.${VALID} AND p.created_at BETWEEN ? AND ? GROUP BY p.method ORDER BY amount_cents DESC`, fromTs, toTs,
  );
  const products = all(
    `SELECT i.product_id, i.name, SUM(i.qty) AS qty, SUM(i.total_cents) AS revenue_cents, SUM(i.unit_cost_cents * i.qty) AS cost_cents
     FROM order_items i JOIN orders o ON o.id = i.order_id
     WHERE o.${VALID} AND o.created_at BETWEEN ? AND ? GROUP BY i.name ORDER BY revenue_cents DESC`, fromTs, toTs,
  );
  const categories = all(
    `SELECT COALESCE(c.name, 'Outros') AS name, SUM(i.qty) AS qty, SUM(i.total_cents) AS revenue_cents
     FROM order_items i JOIN orders o ON o.id = i.order_id LEFT JOIN products p ON p.id = i.product_id
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE o.${VALID} AND o.created_at BETWEEN ? AND ? GROUP BY c.name ORDER BY revenue_cents DESC`, fromTs, toTs,
  );
  const neighborhoods = all(
    `SELECT COALESCE(json_extract(address, '$.neighborhood'), '—') AS name, COUNT(*) AS orders, SUM(total_cents) AS revenue_cents
     FROM orders WHERE ${VALID} AND type = 'entrega' AND created_at BETWEEN ? AND ? GROUP BY name ORDER BY orders DESC LIMIT 15`, fromTs, toTs,
  );
  const customers = get(
    `SELECT COUNT(DISTINCT customer_id) AS unique_customers FROM orders WHERE ${VALID} AND created_at BETWEEN ? AND ?`, fromTs, toTs,
  );
  res.json({
    from, to, ...sum, avg_ticket_cents: sum.orders ? Math.round(sum.revenue_cents / sum.orders) : 0, cancelled,
    byDay, byHour, byWeekday, byChannel, byType, byPayment, products, categories, neighborhoods, ...customers,
  });
});

r.get('/reports/orders.csv', requireModule('relatorios'), (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 30);
  const rows = all('SELECT * FROM orders WHERE created_at BETWEEN ? AND ? ORDER BY id', fromTs, toTs).map(hydrate);
  const csv = toCsv(rows, [
    { label: 'Pedido', value: (o) => o.id }, { label: 'Data', value: (o) => o.created_at },
    { label: 'Canal', value: (o) => o.channel }, { label: 'Tipo', value: (o) => o.type }, { label: 'Status', value: (o) => o.status },
    { label: 'Cliente', value: (o) => o.customer_name }, { label: 'Telefone', value: (o) => o.customer_phone },
    { label: 'Bairro', value: (o) => o.address?.neighborhood }, { label: 'Encomenda para', value: (o) => o.scheduled_for },
    { label: 'Subtotal', value: (o) => money(o.subtotal_cents) }, { label: 'Desconto', value: (o) => money(o.discount_cents) },
    { label: 'Entrega', value: (o) => money(o.delivery_fee_cents) }, { label: 'Total', value: (o) => money(o.total_cents) },
    { label: 'Custo (CMV)', value: (o) => money(o.cost_cents) }, { label: 'Pagamento', value: (o) => o.payment_method },
    { label: 'Pago', value: (o) => (o.paid ? 'sim' : 'não') }, { label: 'Cupom', value: (o) => o.coupon_code },
  ]);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="pedidos_${from}_a_${to}.csv"`);
  res.send(csv);
});

export default r;
