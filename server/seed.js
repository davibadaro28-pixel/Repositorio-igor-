import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { all, get, run, tx, now, getSetting, setSetting } from './db.js';
import { hashPassword } from './auth.js';
import { lojaCatalog, lojaConfig } from './loja.js';

const here = dirname(fileURLToPath(import.meta.url));

// Valores padrão de qualquer loja; o que for da loja (nome, contatos, horários, tema) vem de lojas/<loja>/loja.json
export const DEFAULT_THEME = { color: '#973358', font: 'script', style: 'renda' };
const DEFAULT_STORE = {
  name: 'Minha Loja',
  tagline: '',
  slogan: '',
  whatsapp: '',
  phone: '',
  instagram: '',
  logo: '',                          // vazio = iniciais do nome
  address: '',
  notice: '',
  segment: 'doceria',                // 'doceria', 'hamburgueria' ou 'outro' (textos e exemplos do sistema)
  theme: DEFAULT_THEME,
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

/** Dados iniciais da loja: padrão + loja.json */
export function initialStore() {
  const loja = lojaConfig();
  return { ...DEFAULT_STORE, ...loja.store, segment: loja.segment || DEFAULT_STORE.segment, theme: { ...DEFAULT_THEME, ...loja.store?.theme } };
}

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

// Perfis comuns de pequenos negócios de alimentação no Simples Nacional — confirmar com o contador antes de emitir em produção
export const TAX_PROFILES = [
  { key: 'producao', name: 'Produção própria (Simples Nacional)', cfop: '5101', icms_cst: '102', pis_cst: '49', cofins_cst: '49' },
  { key: 'revenda_st', name: 'Revenda com substituição tributária – bebidas (Simples Nacional)', cfop: '5405', icms_cst: '500', pis_cst: '04', cofins_cst: '04' },
  { key: 'revenda', name: 'Revenda sem substituição tributária (Simples Nacional)', cfop: '5102', icms_cst: '102', pis_cst: '49', cofins_cst: '49' },
];

// Sugestão de NCM por categoria do cardápio (o nome do produto tem prioridade), definida no loja.json
function ncmSuggestions() {
  const ncm = lojaConfig().ncm || {};
  return {
    byName: (ncm.byName || []).map(([re, code, profile]) => [new RegExp(re, 'i'), code, profile]),
    byCategory: ncm.byCategory || {},
  };
}

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
    const NCM_SUGGESTIONS = ncmSuggestions();
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

const DEFAULT_FIN_CATEGORIES = [
  ['Vendas', 'receita'], ['Outras receitas', 'receita'],
  ['Insumos e matéria-prima', 'despesa'], ['Embalagens', 'despesa'], ['Aluguel', 'despesa'], ['Energia elétrica', 'despesa'],
  ['Água', 'despesa'], ['Gás', 'despesa'], ['Internet e telefone', 'despesa'], ['Salários e encargos', 'despesa'],
  ['Pró-labore', 'despesa'], ['Impostos (DAS)', 'despesa'], ['Taxas de cartão e apps', 'despesa'], ['Marketing', 'despesa'],
  ['Manutenção e equipamentos', 'despesa'], ['Entregadores', 'despesa'], ['Outras despesas', 'despesa'],
];

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
  const loja = lojaConfig();
  const store = getSetting('store');
  if (!store) setSetting('store', initialStore());
  else if (!store.theme || !store.segment) {
    // lojas instaladas antes do tema por loja
    const base = initialStore();
    setSetting('store', { ...store, segment: store.segment || base.segment, theme: store.theme || base.theme });
  }
  if (!getSetting('payment_methods')) {
    const off = new Set(loja.payment_methods_off || []);
    setSetting('payment_methods', DEFAULT_PAYMENT_METHODS.map((m) => (off.has(m.id) ? { ...m, active: false } : m)));
  }
  if (!getSetting('loyalty')) setSetting('loyalty', DEFAULT_LOYALTY);
  if (!getSetting('fiscal')) setSetting('fiscal', { ...DEFAULT_FISCAL, ...loja.fiscal });
  else if (!getSetting('fiscal').payment_codes) setSetting('fiscal', migrateFiscal(getSetting('fiscal')));
  if (!getSetting('integrations')) setSetting('integrations', DEFAULT_INTEGRATIONS);
  const methods = getSetting('payment_methods', []);
  if (!methods.some((m) => m.id === '99food')) {
    setSetting('payment_methods', [...methods, DEFAULT_PAYMENT_METHODS.find((m) => m.id === '99food')]);
  }

  const t = now();
  tx(() => {
    if (!get('SELECT 1 FROM categories LIMIT 1')) {
      lojaCatalog().forEach((cat, ci) => {
        const c = run('INSERT INTO categories (name, section, position) VALUES (?, ?, ?)', cat.name, cat.section || null, ci);
        cat.products.forEach((p, pi) => {
          const groups = (p.option_groups || []).map((g) => ({
            name: g.name, min: g.min || 0, max: g.max || 1, ...(g.repeat ? { repeat: true } : {}),
            options: g.options.map((o) => ({ name: o.name, price_cents: Math.round((o.price || 0) * 100) })),
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
      for (const [name, fee] of loja.zones || []) run('INSERT INTO delivery_zones (name, fee_cents) VALUES (?, ?)', name, fee);
    }

    if (!get('SELECT 1 FROM fin_categories LIMIT 1')) {
      for (const [name, type] of loja.fin_categories || DEFAULT_FIN_CATEGORIES) {
        const isCmv = name === 'Insumos e matéria-prima' || name === 'Embalagens' ? 1 : 0;
        run('INSERT INTO fin_categories (name, type, is_cmv) VALUES (?, ?, ?)', name, type, isCmv);
      }
    }

    if (!get('SELECT 1 FROM ingredients LIMIT 1')) {
      for (const [name, unit, cost] of loja.ingredients || []) {
        run('INSERT INTO ingredients (name, unit, unit_cost, created_at) VALUES (?, ?, ?, ?)', name, unit, cost, t);
      }
      for (const [productName, items] of Object.entries(loja.recipes || {})) {
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
