// Dados de exemplo usados pelo modo demonstração (npm run demo) e pela prévia no navegador.
import { all, get, run, tx, now, today, getSetting, setSetting } from './db.js';
import { hashPassword } from './auth.js';
import { createOrder, getOrder, paymentMethods, setStatus } from './services/orders.js';
import { buildNfce } from './fiscal/nfce.js';
import { SIM_MESSAGE } from './fiscal/simulado.js';
import { importExternalOrder, SYSTEM_USER } from './integrations/importer.js';
import { addDays } from './util.js';
import { lojaConfig } from './loja.js';

let seed = 42;
const rand = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (list) => list[Math.floor(rand() * list.length)];
const weighted = (pairs) => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [v, w] of pairs) if ((r -= w) <= 0) return v;
  return pairs[0][0];
};

const FIRST = ['Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Mariana', 'Natália', 'Patrícia', 'Renata', 'Sabrina', 'Tatiane', 'Vanessa', 'Carlos', 'Diego', 'Felipe', 'Gustavo', 'João', 'Lucas', 'Marcos', 'Paulo', 'Rafael', 'Thiago', 'Vinícius', 'Bruno'];
const LAST = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Rodrigues', 'Gomes', 'Martins', 'Barbosa', 'Rocha'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Gera 30 dias de vendas, clientes, encomendas, estoque e contas de exemplo. */
export function generateDemoData() {
  seed = 42;
  const demo = lojaConfig().demo || {};
  const STREETS = demo.streets?.length ? demo.streets : ['Rua das Flores', 'Av. Brasil', 'Rua São José', 'Rua XV de Novembro'];
  const store = getSetting('store', {});
  const dayHours = (iso) => store.hours?.[DAY_KEYS[new Date(iso + 'T12:00:00Z').getUTCDay()]];
  const isOpen = (iso) => dayHours(iso)?.active !== false;
  // horário de um pedido dentro do expediente daquele dia
  const hourOn = (iso) => {
    const h = dayHours(iso);
    const open = Number((h?.open || '11:00').slice(0, 2));
    const close = Math.max(open + 1, Number((h?.close || '21:00').slice(0, 2)));
    return open + Math.floor(rand() * (close - open));
  };
  const integrations = getSetting('integrations', {});
  setSetting('integrations', {
    ...integrations,
    ifood: { ...integrations.ifood, commission_pct: 15.2 }, // exemplo: plano básico 12% + 3,2% de pagamento online
    food99: { ...integrations.food99, commission_pct: 10 },
  });
  const t = now();
  tx(() => {
    const users = [['Bia (caixa)', 'caixa', 'caixa', 'caixa123', 0], ['Cozinha', 'cozinha', 'cozinha', 'cozinha123', 0], ['Rogério', 'motoboy', 'entregador', 'moto123', 700], ['Wesley', 'motoboy2', 'entregador', 'moto123', 700]];
    for (const [name, login, role, pass, fee] of users) {
      if (!get('SELECT 1 FROM users WHERE login = ?', login)) {
        run('INSERT INTO users (name, login, role, password_hash, delivery_fee_cents, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          name, login, role, hashPassword(pass), fee, '1199' + String(Math.floor(rand() * 1e7)).padStart(7, '0'), t);
      }
    }
    // estoque inicial e mínimos
    for (const i of all('SELECT * FROM ingredients')) {
      const base = i.unit === 'un' ? 60 + Math.floor(rand() * 200) : 3000 + Math.floor(rand() * 15000);
      run('UPDATE ingredients SET stock_qty = ?, min_qty = ? WHERE id = ?', base, Math.round(base * (0.15 + rand() * 0.3)), i.id);
    }
    run(`INSERT OR IGNORE INTO coupons (code, type, value, min_order_cents, first_order_only, uses, created_at) VALUES ('PRIMEIRACOMPRA', 'percent', 10, 0, 1, 7, ?)`, t);
    run(`INSERT OR IGNORE INTO coupons (code, type, value, min_order_cents, uses, created_at) VALUES ('FRETEGRATIS', 'frete', 0, 8000, 12, ?)`, t);
  });

  const zones = all('SELECT * FROM delivery_zones WHERE active = 1');
  const customers = Array.from({ length: 45 }, (_, i) => {
    const z = pick(zones);
    const month = String(1 + Math.floor(rand() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, '0');
    return {
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `119${String(60000000 + i * 137911).slice(0, 8)}`,
      zone: z,
      birthday: rand() < 0.5 ? (i % 9 === 0 ? today().slice(5, 8) + String(Math.min(28, Number(today().slice(8)) + 2)).padStart(2, '0') : `${month}-${day}`) : undefined,
      address: { street: pick(STREETS), number: String(10 + Math.floor(rand() * 1900)), complement: rand() < 0.3 ? `Apto ${Math.floor(rand() * 90)}` : '' },
    };
  });

  const products = all(
    `SELECT p.id, p.name, p.featured, p.option_groups, p.lead_time_hours, c.name AS cat FROM products p JOIN categories c ON c.id = p.category_id WHERE p.active = 1`,
  ).map((p) => ({ ...p, groups: JSON.parse(p.option_groups), variants: all('SELECT id, price_cents FROM product_variants WHERE product_id = ? AND active = 1', p.id) }));
  const pool = products.filter((p) => !p.lead_time_hours).flatMap((p) => Array(p.featured ? 4 : /bebida|refrigerante|suco|água/i.test(p.cat) ? 2 : 1).fill(p));
  const cakes = demo.encomendas ? products.filter((p) => new RegExp(demo.encomendas).test(p.name)) : products.filter((p) => p.featured);
  const admin = get(`SELECT * FROM users WHERE login = 'admin'`);
  const couriers = all(`SELECT * FROM users WHERE role = 'entregador'`);

  const items = (n, list = pool) => Array.from({ length: n }, () => {
    const p = pick(list);
    return {
      variant_id: pick(p.variants).id,
      qty: rand() < 0.75 ? 1 : 2,
      options: p.groups.filter((g) => g.min > 0).flatMap((g) => {
        // escolhas obrigatórias: "4 lanches" no combo família podem repetir; nos outros grupos, opções diferentes
        const left = [...g.options];
        return Array.from({ length: Math.min(g.min, g.repeat ? g.min : left.length) }, () => {
          const o = g.repeat ? pick(g.options) : left.splice(Math.floor(rand() * left.length), 1)[0];
          return { group: g.name, name: o.name };
        });
      }),
      notes: demo.notas?.length && rand() < 0.12 ? pick(demo.notas) : undefined,
    };
  });

  const backdate = (orderId, ts) => {
    const shift = (col) => run(`UPDATE orders SET ${col} = ? WHERE id = ? AND ${col} IS NOT NULL`, ts, orderId);
    ['created_at', 'updated_at', 'confirmed_at', 'ready_at', 'dispatched_at', 'completed_at', 'paid_at'].forEach(shift);
    run('UPDATE order_payments SET created_at = ? WHERE order_id = ?', ts, orderId);
    run('UPDATE order_events SET created_at = ? WHERE order_id = ?', ts, orderId);
    run('UPDATE stock_movements SET created_at = ? WHERE order_id = ?', ts, orderId);
  };

  // pedido vindo do iFood ou da 99Food, pelo mesmo caminho da integração real
  const fromApp = (platform, n, status) => {
    const c = pick(customers);
    const type = weighted([['entrega', 85], ['retirada', 15]]);
    const lines = Array.from({ length: n }, () => {
      const p = pick(pool);
      const v = pick(p.variants);
      const qty = rand() < 0.8 ? 1 : 2;
      const unit = Math.round((v.price_cents * 1.15) / 10) * 10; // preço de app costuma ser maior
      return { external_key: rand() < 0.75 ? `V${v.id}` : null, name: rand() < 0.75 ? p.name : `${p.name} (app)`, qty, total_cents: unit * qty, options: [] };
    });
    const { order } = importExternalOrder({
      platform,
      external_id: `DEMO-${platform}-${Math.floor(rand() * 1e12)}`,
      external_code: String(platform === 'ifood' ? 1000 + Math.floor(rand() * 9000) : 1 + Math.floor(rand() * 60)),
      type,
      delivered_by: platform === 'ifood' && rand() < 0.7 ? 'platform' : 'store',
      customer: { name: c.name },
      address: type === 'entrega' ? { ...c.address, neighborhood: c.zone.name } : null,
      items: lines,
      delivery_fee_cents: 799,
      payment: { method: platform, prepaid: true },
      notes: [platform === 'ifood' ? 'Pedido do iFood' : 'Pedido da 99Food'],
    });
    const flow = ['preparo', 'pronto', ...(type === 'entrega' ? ['entrega'] : []), 'concluido'];
    for (const s of flow) {
      if (status === 'novo') break;
      setStatus(order.id, s, SYSTEM_USER, { fromPlatform: true });
      if (s === status) break;
    }
    if (status === 'cancelado') setStatus(order.id, 'cancelado', SYSTEM_USER, { fromPlatform: true, reason: 'Cancelado no app' });
    return order;
  };

  const make = (dayOffset, { status = 'concluido', hour, channel: forced } = {}) => {
    const channel = forced || weighted([['cardapio', 45], ['pdv', 28], ['whatsapp', 7], ['ifood', 14], ['99food', 6]]);
    if (channel === 'ifood' || channel === '99food') {
      const order = fromApp(channel, weighted([[1, 40], [2, 40], [3, 20]]), status);
      if (dayOffset !== 0) {
        const h = hour ?? hourOn(addDays(today(), -dayOffset));
        backdate(order.id, `${addDays(today(), -dayOffset)} ${String(h).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00`);
      }
      return order;
    }
    const type = channel === 'pdv' ? 'balcao' : weighted([['entrega', 65], ['retirada', 35]]);
    const c = channel === 'pdv' && rand() < 0.5 ? null : pick(customers);
    const method = channel === 'ifood' ? 'ifood' : weighted([['pix', 45], ['credito', 25], ['debito', 15], ['dinheiro', 15]]);
    const n = weighted([[1, 35], [2, 35], [3, 20], [4, 10]]);
    const input = {
      type, channel: channel === 'cardapio' ? 'whatsapp' : channel, status: status === 'novo' ? 'novo' : 'preparo',
      customer: c ? { name: c.name, phone: c.phone, birthday: c.birthday } : {},
      zone_id: type === 'entrega' ? c?.zone.id || zones[0].id : null,
      address: type === 'entrega' ? c?.address || { street: pick(STREETS), number: '100' } : null,
      payment_method: method,
      change_for_cents: method === 'dinheiro' && rand() < 0.5 ? 10000 : null,
      coupon_code: rand() < 0.05 && type === 'entrega' ? 'FRETEGRATIS' : null,
      items: items(n),
    };
    let order;
    try {
      order = createOrder(input, { user: admin });
    } catch {
      order = createOrder({ ...input, coupon_code: null }, { user: admin }); // cupom abaixo do mínimo
    }
    if (channel === 'cardapio') run(`UPDATE orders SET channel = 'cardapio' WHERE id = ?`, order.id);
    if (type === 'entrega' && status !== 'novo') run('UPDATE orders SET courier_id = ? WHERE id = ?', pick(couriers).id, order.id);
    const flow = ['pronto', ...(type === 'entrega' ? ['entrega'] : []), 'concluido'];
    for (const s of flow) {
      if (['preparo', 'novo', 'cancelado'].includes(status)) break;
      if (s === 'entrega' && type !== 'entrega') continue;
      setStatus(order.id, s, admin);
      if (s === status) break;
    }
    if (status === 'cancelado') setStatus(order.id, 'cancelado', admin, { reason: 'Cliente desistiu' });
    if (dayOffset !== 0) {
      const h = hour ?? hourOn(addDays(today(), -dayOffset));
      const ts = `${addDays(today(), -dayOffset)} ${String(h).padStart(2, '0')}:${String(Math.floor(rand() * 60)).padStart(2, '0')}:00`;
      backdate(order.id, ts);
    }
    return order;
  };

  for (let d = 29; d >= 1; d--) {
    const wd = new Date(addDays(today(), -d) + 'T12:00:00Z').getUTCDay();
    if (!isOpen(addDays(today(), -d))) continue; // dia em que a loja não abre
    const n = 6 + Math.floor(rand() * 8) + (wd >= 5 ? 6 : 0);
    for (let i = 0; i < n; i++) make(d, { status: rand() < 0.04 ? 'cancelado' : 'concluido' });
  }

  // hoje: caixa aberto e pedidos em andamento
  run('INSERT INTO cash_sessions (opened_by, opened_at, opening_cents) VALUES (?, ?, ?)', admin.id, `${today()} 10:45:00`, 15000);
  for (let i = 0; i < 6; i++) make(0, { status: 'concluido' });
  ['novo', 'novo', 'preparo', 'preparo', 'pronto', 'entrega'].forEach((status) => make(0, { status, channel: weighted([['cardapio', 60], ['pdv', 40]]) }));
  make(0, { status: 'novo', channel: 'ifood' });
  make(0, { status: 'preparo', channel: '99food' });

  // encomendas dos próximos dias (lojas que trabalham com encomenda)
  for (let d = 1; d <= 5 && store.scheduling_enabled !== false && cakes.length; d++) {
    if (!isOpen(addDays(today(), d))) continue;
    for (let k = 0; k < 1 + Math.floor(rand() * 3); k++) {
      const c = pick(customers);
      const o = createOrder({
        type: rand() < 0.6 ? 'retirada' : 'entrega', channel: 'whatsapp', status: 'confirmado',
        customer: { name: c.name, phone: c.phone }, zone_id: c.zone.id, address: c.address,
        scheduled_for: `${addDays(today(), d)} ${pick(['14:00', '15:30', '17:00', '18:30'])}`,
        payment_method: 'pix', payments: [{ method: 'pix', amount_cents: 5000 }],
        items: [...items(1, cakes), ...items(Math.floor(rand() * 2))],
        notes: demo.nota_encomenda && rand() < 0.5 ? demo.nota_encomenda : null,
      }, { user: admin });
      run(`UPDATE orders SET channel = 'cardapio' WHERE id = ? AND ?`, o.id, rand() < 0.5 ? 1 : 0);
    }
  }

  // contas
  const cat = (name) => get('SELECT id FROM fin_categories WHERE name = ?', name)?.id;
  const month = today().slice(0, 8);
  const prevMonth = addDays(month + '01', -1).slice(0, 8);
  const bills = [
    ['Aluguel da loja', 'Aluguel', 250000, '10'], ['Conta de luz', 'Energia elétrica', 48000, '15'], ['Sabesp', 'Água', 12000, '18'],
    ['Gás (botijões)', 'Gás', 26000, '05'], ['Internet + telefone', 'Internet e telefone', 11000, '20'], ['Folha de pagamento', 'Salários e encargos', 320000, '05'],
    ['DAS Simples Nacional', 'Impostos (DAS)', 60000, '20'], ['Instagram anúncios', 'Marketing', 30000, '25'],
  ];
  for (const [desc, c, amount, day] of bills) {
    for (const [m, paid] of [[prevMonth, true], [month, `${month}${day}` < today()]]) {
      const due = `${m}${day}`;
      const overdue = !paid && due < today();
      run(`INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, paid_at, status, user_id, created_at) VALUES ('despesa', ?, ?, ?, ?, ?, ?, ?, ?)`,
        cat(c), desc, amount, due, paid || (overdue && rand() < 0.6) ? due : null, paid || (overdue && rand() < 0.6) ? 'pago' : 'pendente', admin.id, t);
    }
  }
  for (let d = 28; d >= 0; d -= 4) {
    run(`INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, paid_at, status, supplier, user_id, created_at) VALUES ('despesa', ?, ?, ?, ?, ?, 'pago', ?, ?, ?)`,
      cat('Insumos e matéria-prima'), 'Compra de insumos (atacado)', 70000 + Math.floor(rand() * 60000), addDays(today(), -d), addDays(today(), -d), 'Atacadão', admin.id, t);
    run(`INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, paid_at, status, supplier, user_id, created_at) VALUES ('despesa', ?, ?, ?, ?, ?, 'pago', ?, ?, ?)`,
      cat('Embalagens'), 'Embalagens e potes', 15000 + Math.floor(rand() * 15000), addDays(today(), -d), addDays(today(), -d), 'Embalagens Leste', admin.id, t);
  }
  run(`INSERT INTO fin_entries (type, category_id, description, amount_cents, due_date, status, supplier, user_id, created_at) VALUES ('receita', ?, 'Festa de aniversário (saldo)', 42000, ?, 'pendente', 'Cliente', ?, ?)`,
    cat('Encomendas e eventos') || cat('Eventos e aniversários') || cat('Outras receitas'), addDays(today(), 4), admin.id, t);
  // estoque coerente depois das vendas de exemplo: nada negativo e só alguns insumos abaixo do mínimo
  const low = new Set(lojaConfig().low_stock || []);
  for (const i of all('SELECT id, name, stock_qty, min_qty FROM ingredients')) {
    if (low.has(i.name)) run('UPDATE ingredients SET stock_qty = ? WHERE id = ?', Math.round(i.min_qty * 6) / 10, i.id);
    else if (i.stock_qty < i.min_qty) run('UPDATE ingredients SET stock_qty = ? WHERE id = ?', Math.round(i.min_qty * (14 + rand() * 10)) / 10, i.id);
  }
  demoFiscal();
}

/** Nota fiscal no modo treinamento, com as notas dos últimos dias já emitidas */
function demoFiscal() {
  const cur = getSetting('fiscal', {});
  const cfg = { ...cur, enabled: true, provider: 'simulado', auto_emit: true, razao_social: cur.razao_social || lojaConfig().demo?.razao_social || getSetting('store', {}).name };
  setSetting('fiscal', cfg);
  const orders = all(
    `SELECT id, completed_at, dispatched_at FROM orders WHERE status != 'cancelado' AND completed_at >= ? ORDER BY COALESCE(dispatched_at, completed_at)`,
    `${addDays(today(), -3)} 00:00:00`,
  );
  let n = 0;
  for (const { id, completed_at: done, dispatched_at: out } of orders) {
    const order = getOrder(id);
    const { payload, problems } = buildNfce(order, cfg, { methods: paymentMethods(), integrations: getSetting('integrations', {}) });
    if (problems.length) continue;
    const at = out || done;
    n++;
    run(
      `INSERT INTO fiscal_docs (order_id, provider, environment, ref, status, number, series, total_cents, customer_doc, message, payload, xml, issued_at, created_at, updated_at)
       VALUES (?, 'simulado', 'simulado', ?, 'autorizado', ?, 'TREINO', ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, `DEMOP${id}N1`, String(n), order.total_cents, null, SIM_MESSAGE, JSON.stringify(payload),
      `<?xml version="1.0" encoding="UTF-8"?>\n<simulacao aviso="DOCUMENTO DE TREINAMENTO - SEM VALOR FISCAL" referencia="DEMOP${id}N1" numero="${n}"/>\n`, at, at, at,
    );
  }
  setSetting('fiscal_sim_seq', n);
}
