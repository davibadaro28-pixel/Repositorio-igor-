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
  logo: '/img/logo.jpg',             // vazio = iniciais do nome
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

// NFC-e: os dados da empresa, o certificado A1 e o CSC ficam cadastrados no emissor (Focus NFe);
// aqui ficam só o token de acesso e as regras de emissão. Tributação: ver TAX_PROFILES e NCM_SUGGESTIONS.
export const DEFAULT_FISCAL = {
  enabled: false,
  provider: 'focusnfe',            // 'focusnfe' ou 'simulado' (treinamento, sem valor fiscal)
  ambiente: 'homologacao',         // 'homologacao' (testes) ou 'producao'
  token_homologacao: '',
  token_producao: '',
  cnpj: '',
  razao_social: '',
  regime: 'simples_nacional',      // 'simples_nacional', 'mei' ou 'normal'
  auto_emit: false,                // emite sozinho quando o pedido sai para entrega ou é concluído
  auto_channels: ['pdv', 'cardapio', 'whatsapp', 'telefone', 'ifood', '99food', 'outro'],
  default_profile_id: null,
  // código da forma de pagamento na nota (tPag) para cada forma cadastrada na loja
  payment_codes: { pix: '20', dinheiro: '01', credito: '03', debito: '04', vr: '11', va: '10', ifood: '99', '99food': '99' },
  // CNPJ dos apps de delivery (intermediadores); o identificador da loja vem das integrações
  intermediarios: { ifood: { cnpj: '14380200000121', id: '' }, '99food': { cnpj: '18033552000161', id: '' } },
  info_adicional: '',
};

// Perfis comuns de padaria/confeitaria no Simples Nacional — confirmar com o contador antes de emitir em produção
export const TAX_PROFILES = [
  { key: 'producao', name: 'Produção própria (Simples Nacional)', cfop: '5101', icms_cst: '102', pis_cst: '49', cofins_cst: '49' },
  { key: 'revenda_st', name: 'Revenda com substituição tributária – bebidas (Simples Nacional)', cfop: '5405', icms_cst: '500', pis_cst: '04', cofins_cst: '04' },
  { key: 'revenda', name: 'Revenda sem substituição tributária (Simples Nacional)', cfop: '5102', icms_cst: '102', pis_cst: '49', cofins_cst: '49' },
];

// Sugestão de NCM por categoria do cardápio (o nome do produto tem prioridade)
const NCM_SUGGESTIONS = {
  byName: [[/água/i, '22011000', 'revenda_st'], [/coca|guaraná|refri/i, '22021000', 'revenda_st'], [/^cookie/i, '19053100'], [/pudim/i, '21069090']],
  byCategory: {
    'Bolo Premium': '19059090', 'Bolos Caseiros': '19059090', 'Torta na Travessa': '19059090', 'Bolo em Fatia': '19059090',
    'Bolo no Pote (200ml)': '19059090', 'Bolo Gelado': '19059090', 'Tortinhas da Laços': '19059090', 'Pudim (Novidade)': '21069090',
    'Delícias de Morango': '18069000', 'Delícias da Laços': '18069000', 'Doces Gourmet (unidade)': '18069000', Brownie: '19059090',
    Cookies: '19053100', 'Salgados (Lançamento)': '19059090', Bebidas: '22021000', 'Cobertura Extra': '21069090',
  },
};

/** Cria os perfis tributários e sugere NCM para os produtos que ainda não têm (bancos novos e antigos) */
export function seedFiscal() {
  tx(() => {
    if (!get('SELECT 1 FROM tax_profiles LIMIT 1')) {
      for (const p of TAX_PROFILES) {
        run('INSERT INTO tax_profiles (name, cfop, icms_cst, pis_cst, cofins_cst) VALUES (?, ?, ?, ?, ?)', p.name, p.cfop, p.icms_cst, p.pis_cst, p.cofins_cst);
      }
    }
    const profileId = (key) => get('SELECT id FROM tax_profiles WHERE name = ?', TAX_PROFILES.find((p) => p.key === key).name)?.id ?? null;
    const cfg = getSetting('fiscal', {});
    if (cfg.ncm_suggested) return;
    const products = all('SELECT p.id, p.name, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id WHERE p.ncm IS NULL');
    for (const p of products) {
      const hit = NCM_SUGGESTIONS.byName.find(([re]) => re.test(p.name));
      const ncm = hit?.[1] || NCM_SUGGESTIONS.byCategory[p.category];
      if (!ncm) continue;
      run('UPDATE products SET ncm = ?, tax_profile_id = COALESCE(tax_profile_id, ?) WHERE id = ?', ncm, hit?.[2] ? profileId(hit[2]) : null, p.id);
    }
    // só uma vez: produtos cadastrados depois recebem o NCM na tela de tributação
    setSetting('fiscal', { ...cfg, default_profile_id: cfg.default_profile_id || profileId('producao'), ncm_suggested: true });
  });
}

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

// Versões antigas guardavam só os dados da empresa e um token único
function migrateFiscal(old) {
  if (!old) return DEFAULT_FISCAL;
  const token = old.token || '';
  return {
    ...DEFAULT_FISCAL,
    cnpj: String(old.cnpj || '').replace(/\D/g, ''),
    razao_social: old.razao_social || '',
    regime: old.regime === 'lucro_presumido' ? 'normal' : old.regime || 'simples_nacional',
    ambiente: old.ambiente === 'producao' ? 'producao' : 'homologacao',
    token_homologacao: old.ambiente === 'producao' ? '' : token,
    token_producao: old.ambiente === 'producao' ? token : '',
  };
}

export function seedIfEmpty() {
  if (!getSetting('store')) setSetting('store', DEFAULT_STORE);
  if (!getSetting('payment_methods')) setSetting('payment_methods', DEFAULT_PAYMENT_METHODS);
  if (!getSetting('loyalty')) setSetting('loyalty', DEFAULT_LOYALTY);
  if (!getSetting('fiscal')?.payment_codes) setSetting('fiscal', migrateFiscal(getSetting('fiscal')));
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

  seedFiscal();

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
