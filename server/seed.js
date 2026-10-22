import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { all, get, run, tx, now, getSetting, setSetting } from './db.js';
import { hashPassword } from './auth.js';

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_STORE = {
  name: 'Laços de Mãe',
  tagline: 'Bolos e Doces',
  slogan: 'Há 10 anos espalhando o sabor que traz lembranças',
  whatsapp: '5511963406419',
  phone: '(11) 96340-6419',
  instagram: 'lacos_de_mae',
  address: 'Av. Boturussu, 1785 – Parque Boturussu, São Paulo – SP, 03801-000',
  notice: '',
  hours: {
    sunday: { active: false, open: '10:00', close: '14:00' },
    monday: { active: true, open: '11:00', close: '21:00' },
    tuesday: { active: true, open: '11:00', close: '21:00' },
    wednesday: { active: true, open: '11:00', close: '21:00' },
    thursday: { active: true, open: '11:00', close: '21:00' },
    friday: { active: true, open: '11:00', close: '21:00' },
    saturday: { active: true, open: '11:00', close: '21:00' },
  },
  accepting_orders: true,
  delivery_enabled: true,
  pickup_enabled: true,
  scheduling_enabled: true,
  allow_out_of_zone: false,
  min_order_cents: 0,
  prep_time_min: 30,
  delivery_time_min: 60,
  pix_key: '',
  pix_name: '',
};

const DEFAULT_PAYMENT_METHODS = [
  { id: 'pix', label: 'Pix', fee_pct: 0, active: true, online: true },
  { id: 'dinheiro', label: 'Dinheiro', fee_pct: 0, active: true, online: true },
  { id: 'credito', label: 'Cartão de crédito', fee_pct: 0, active: true, online: true },
  { id: 'debito', label: 'Cartão de débito', fee_pct: 0, active: true, online: true },
  { id: 'vr', label: 'Vale-refeição (VR, Alelo, Pluxee, Ticket)', fee_pct: 0, active: true, online: true },
  { id: 'va', label: 'Vale-alimentação', fee_pct: 0, active: true, online: true },
  { id: 'ifood', label: 'Pago no iFood', fee_pct: 0, active: true, online: false },
  { id: '99food', label: 'Pago na 99Food', fee_pct: 0, active: true, online: false },
];

// Comissão em % sobre o valor dos produtos (ver o plano contratado em cada app)
export const DEFAULT_INTEGRATIONS = {
  ifood: { enabled: false, client_id: '', client_secret: '', merchant_id: '', commission_pct: 0, auto_accept: false },
  food99: { enabled: false, app_id: '', app_secret: '', app_shop_id: '', commission_pct: 0, auto_accept: false },
};

const DEFAULT_LOYALTY = { enabled: true, points_per_real: 1, redeem_points: 100, redeem_value_cents: 1000 };

const DEFAULT_FISCAL = {
  enabled: false, provider: '', token: '', cnpj: '', ie: '', razao_social: '', regime: 'simples_nacional',
  ambiente: 'homologacao', csc_id: '', csc: '',
};

// Faixas atuais do delivery: até 4 km R$ 12; de 5 a 12 km R$ 20
const DEFAULT_ZONES = [
  ['Parque Boturussu', 1200], ['Ermelino Matarazzo', 1200], ['Ponte Rasa', 1200], ['Vila Paranaguá', 1200],
  ['Jardim Belém', 1200], ['Cangaíba', 1200], ['Vila Cisper', 1200],
  ['Penha', 2000], ['São Miguel Paulista', 2000], ['Vila Jacuí', 2000], ['Jardim Helena', 2000],
  ['Artur Alvim', 2000], ['Vila Matilde', 2000], ['Itaquera', 2000],
];

const FIN_CATEGORIES = [
  ['Vendas', 'receita'], ['Encomendas e eventos', 'receita'], ['Outras receitas', 'receita'],
  ['Insumos e matéria-prima', 'despesa'], ['Embalagens', 'despesa'], ['Aluguel', 'despesa'], ['Energia elétrica', 'despesa'],
  ['Água', 'despesa'], ['Gás', 'despesa'], ['Internet e telefone', 'despesa'], ['Salários e encargos', 'despesa'],
  ['Pró-labore', 'despesa'], ['Impostos (DAS)', 'despesa'], ['Taxas de cartão e apps', 'despesa'], ['Marketing', 'despesa'],
  ['Manutenção e equipamentos', 'despesa'], ['Entregadores', 'despesa'], ['Outras despesas', 'despesa'],
];

// Custos estimados (centavos por unidade) — devem ser atualizados com as notas de compra reais
const INGREDIENTS = [
  ['Leite condensado', 'g', 1.9], ['Creme de leite', 'g', 1.9], ['Leite em pó Ninho', 'g', 5.8],
  ['Chocolate em pó 50%', 'g', 4.5], ['Chocolate ao leite (cobertura)', 'g', 5.5], ['Chocolate branco (cobertura)', 'g', 5.5],
  ['Granulado / chocoball', 'g', 3.5], ['Nutella', 'g', 6.9], ['Morango', 'g', 2.0], ['Abacaxi', 'g', 0.8],
  ['Polpa de maracujá', 'g', 1.5], ['Uva verde', 'g', 1.6], ['Coco ralado', 'g', 4.0], ['Doce de leite', 'g', 2.4],
  ['Farinha de trigo', 'g', 0.5], ['Açúcar', 'g', 0.45], ['Ovos', 'un', 80], ['Manteiga', 'g', 4.5], ['Leite', 'ml', 0.55],
  ['Óleo', 'ml', 0.9], ['Fermento', 'g', 4.0], ['Cenoura', 'g', 0.6], ['Fubá', 'g', 0.6], ['Chantilly', 'ml', 2.2],
  ['Bolacha (farofinha)', 'g', 2.0], ['Frango desfiado', 'g', 3.2], ['Requeijão', 'g', 3.5], ['Calabresa', 'g', 3.8],
  ['Pote 200 ml', 'un', 90], ['Embalagem bolo', 'un', 350], ['Forminha / embalagem doce', 'un', 45], ['Travessa 1 L', 'un', 280],
  ['Refrigerante lata 350 ml', 'un', 300], ['Água 500 ml', 'un', 120],
];

// Fichas técnicas de exemplo (insumo, quantidade por unidade vendida)
const RECIPES = {
  'Bombom de morango - Leite ninho': [['Leite condensado', 30], ['Leite em pó Ninho', 8], ['Creme de leite', 6], ['Morango', 30], ['Chocolate ao leite (cobertura)', 18], ['Forminha / embalagem doce', 1]],
  'Bombom de morango - Chocolate': [['Leite condensado', 30], ['Chocolate em pó 50%', 5], ['Creme de leite', 6], ['Morango', 30], ['Chocolate ao leite (cobertura)', 18], ['Forminha / embalagem doce', 1]],
  'Docinho - brigadeiro Gourmet': [['Leite condensado', 18], ['Chocolate em pó 50%', 3], ['Creme de leite', 3], ['Manteiga', 1], ['Granulado / chocoball', 3], ['Forminha / embalagem doce', 1]],
  'Bolo no pote - Dois Amores': [['Farinha de trigo', 25], ['Açúcar', 20], ['Ovos', 0.4], ['Chocolate em pó 50%', 10], ['Leite condensado', 60], ['Creme de leite', 20], ['Leite em pó Ninho', 8], ['Pote 200 ml', 1]],
  'Coca-Cola': [['Refrigerante lata 350 ml', 1]],
  'Coca-Cola ZERO': [['Refrigerante lata 350 ml', 1]],
  'Guaraná': [['Refrigerante lata 350 ml', 1]],
  'Guaraná ZERO': [['Refrigerante lata 350 ml', 1]],
  'Água': [['Água 500 ml', 1]],
};

export function seedIfEmpty() {
  if (!getSetting('store')) setSetting('store', DEFAULT_STORE);
  if (!getSetting('payment_methods')) setSetting('payment_methods', DEFAULT_PAYMENT_METHODS);
  if (!getSetting('loyalty')) setSetting('loyalty', DEFAULT_LOYALTY);
  if (!getSetting('fiscal')) setSetting('fiscal', DEFAULT_FISCAL);
  if (!getSetting('integrations')) setSetting('integrations', DEFAULT_INTEGRATIONS);
  const methods = getSetting('payment_methods', []);
  if (!methods.some((m) => m.id === '99food')) {
    setSetting('payment_methods', [...methods, DEFAULT_PAYMENT_METHODS.find((m) => m.id === '99food')]);
  }

  const t = now();
  tx(() => {
    if (!get('SELECT 1 FROM categories LIMIT 1')) {
      const catalog = JSON.parse(readFileSync(join(here, 'seed', 'catalog.json'), 'utf8'));
      catalog.forEach((cat, ci) => {
        const c = run('INSERT INTO categories (name, section, position) VALUES (?, ?, ?)', cat.name, cat.section || null, ci);
        cat.products.forEach((p, pi) => {
          const groups = (p.option_groups || []).map((g) => ({
            ...g, options: g.options.map((o) => ({ name: o.name, price_cents: Math.round((o.price || 0) * 100) })),
          }));
          const r = run(
            `INSERT INTO products (category_id, name, description, image, featured, lead_time_hours, option_groups, position, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            c.lastInsertRowid, p.name, p.description, p.image, p.featured ? 1 : 0, p.lead_time_hours || 0, JSON.stringify(groups), pi, t,
          );
          p.variants.forEach((v, vi) => {
            run('INSERT INTO product_variants (product_id, name, price_cents, position) VALUES (?, ?, ?, ?)',
              r.lastInsertRowid, v.name, Math.round(v.price * 100), vi);
          });
        });
      });
    }

    if (!get('SELECT 1 FROM delivery_zones LIMIT 1')) {
      for (const [name, fee] of DEFAULT_ZONES) run('INSERT INTO delivery_zones (name, fee_cents) VALUES (?, ?)', name, fee);
    }

    if (!get('SELECT 1 FROM fin_categories LIMIT 1')) {
      for (const [name, type] of FIN_CATEGORIES) {
        const isCmv = name === 'Insumos e matéria-prima' || name === 'Embalagens' ? 1 : 0;
        run('INSERT INTO fin_categories (name, type, is_cmv) VALUES (?, ?, ?)', name, type, isCmv);
      }
    }

    if (!get('SELECT 1 FROM ingredients LIMIT 1')) {
      for (const [name, unit, cost] of INGREDIENTS) {
        run('INSERT INTO ingredients (name, unit, unit_cost, created_at) VALUES (?, ?, ?, ?)', name, unit, cost, t);
      }
      for (const [productName, items] of Object.entries(RECIPES)) {
        const variants = all(
          'SELECT v.id FROM product_variants v JOIN products p ON p.id = v.product_id WHERE p.name = ?', productName,
        );
        for (const v of variants) {
          for (const [ing, qty] of items) {
            const i = get('SELECT id FROM ingredients WHERE name = ?', ing);
            if (i) run('INSERT OR IGNORE INTO recipe_items (variant_id, ingredient_id, qty) VALUES (?, ?, ?)', v.id, i.id, qty);
          }
        }
      }
    }
  });

  if (!get('SELECT 1 FROM users LIMIT 1')) {
    const password = process.env.ADMIN_PASSWORD || randomBytes(6).toString('base64url');
    run('INSERT INTO users (name, login, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      'Administrador', 'admin', hashPassword(password), 'admin', t);
    if (!process.env.ADMIN_PASSWORD) {
      const dataDir = dirname(process.env.DB_PATH && process.env.DB_PATH !== ':memory:' ? process.env.DB_PATH : join(here, 'data', 'x'));
      mkdirSync(dataDir, { recursive: true });
      if (process.env.DB_PATH !== ':memory:') {
        writeFileSync(join(dataDir, 'PRIMEIRO_ACESSO.txt'), `Login: admin\nSenha: ${password}\nTroque a senha em Usuários depois de entrar.\n`);
      }
      console.log('\n==============================================');
      console.log(' Primeiro acesso ao painel (/admin)');
      console.log(`   login: admin   senha: ${password}`);
      if (process.env.DB_PATH !== ':memory:') console.log(` (também salvo em ${join(dataDir, 'PRIMEIRO_ACESSO.txt')})`);
      console.log('==============================================\n');
    }
  }
}
