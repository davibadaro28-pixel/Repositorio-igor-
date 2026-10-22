// Monta a NFC-e (modelo 65) de um pedido no formato JSON da Focus NFe.
// Campos: https://campos.focusnfe.com.br/nfe/NotaFiscalXML.html — os dados do emitente (endereço, IE,
// regime, CSC) vêm do cadastro da empresa no emissor; o total aproximado de tributos (IBPT) é calculado por ele.
import { all, get } from '../db.js';

export const onlyDigits = (s) => String(s || '').replace(/\D/g, '');

export function validCpf(v) {
  const d = onlyDigits(v);
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  const dv = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(d[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return dv(9) === Number(d[9]) && dv(10) === Number(d[10]);
}

export function validCnpj(v) {
  const d = onlyDigits(v);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const dv = (len) => {
    const w = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const r = w.reduce((s, x, i) => s + x * Number(d[i]), 0) % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return dv(12) === Number(d[12]) && dv(13) === Number(d[13]);
}

/** CPF ou CNPJ válido (só dígitos) ou null; lança erro se informado e inválido */
export function cleanDoc(v) {
  const d = onlyDigits(v);
  if (!d) return null;
  if (d.length === 11 && validCpf(d)) return d;
  if (d.length === 14 && validCnpj(d)) return d;
  throw Object.assign(new Error('CPF/CNPJ inválido. Confira os números.'), { status: 400 });
}

/** Divide um valor em centavos proporcionalmente aos pesos (soma exata, maior resto) */
export function allocate(amount, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  if (!amount || !total) return weights.map(() => 0);
  const raw = weights.map((w) => (amount * w) / total);
  const out = raw.map(Math.floor);
  let rest = amount - out.reduce((s, x) => s + x, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; rest > 0; k = (k + 1) % order.length, rest--) out[order[k][1]]++;
  return out;
}

const money = (c) => Number((c / 100).toFixed(2));
const pct = (base, rate) => Math.round((base * (Number(rate) || 0)) / 100);

// Horário de Brasília com fuso, como a SEFAZ exige (diferença máxima de 5 min)
export function isoNowSP(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour === '24' ? '00' : p.hour}:${p.minute}:${p.second}-03:00`;
}

// CST/CSOSN aceitos pelo sistema (os demais exigem campos que a loja não usa)
export const ICMS_CODES = {
  simples: { 102: 'Tributada pelo Simples sem permissão de crédito', 103: 'Isenção do ICMS no Simples para faixa de receita', 300: 'Imune', 400: 'Não tributada pelo Simples', 500: 'ICMS cobrado anteriormente por substituição tributária' },
  normal: { '00': 'Tributada integralmente', 40: 'Isenta', 41: 'Não tributada', 60: 'ICMS cobrado anteriormente por substituição tributária' },
};
export const PIS_COFINS_CODES = {
  '01': 'Tributável (alíquota básica)', '04': 'Monofásica (revenda a alíquota zero)', '06': 'Alíquota zero', '07': 'Isenta',
  '08': 'Sem incidência', '09': 'Suspensão', 49: 'Outras operações de saída', 99: 'Outras operações',
};

function taxFields(profile, net, regime) {
  const f = { icms_origem: '0', icms_situacao_tributaria: profile.icms_cst };
  if (regime === 'normal' && profile.icms_cst === '00') {
    Object.assign(f, { icms_modalidade_base_calculo: '3', icms_base_calculo: money(net), icms_aliquota: Number(profile.icms_aliquota) || 0, icms_valor: money(pct(net, profile.icms_aliquota)) });
  }
  for (const [tax, cst, rate] of [['pis', profile.pis_cst, profile.pis_aliquota], ['cofins', profile.cofins_cst, profile.cofins_aliquota]]) {
    f[`${tax}_situacao_tributaria`] = cst;
    if (['01', '02'].includes(cst)) Object.assign(f, { [`${tax}_base_calculo`]: money(net), [`${tax}_aliquota_porcentual`]: Number(rate) || 0, [`${tax}_valor`]: money(pct(net, rate)) });
    else if (['49', '99'].includes(cst)) Object.assign(f, { [`${tax}_base_calculo`]: 0, [`${tax}_aliquota_porcentual`]: 0, [`${tax}_valor`]: 0 });
  }
  // Reforma tributária: grupo IBS/CBS (alíquotas de teste de 2026: IBS 0,1% e CBS 0,9%)
  if (regime === 'normal' && profile.ibs_cbs_cst) {
    const ibs = Math.round(net * 0.001);
    const cbs = Math.round(net * 0.009);
    Object.assign(f, {
      ibs_cbs_situacao_tributaria: profile.ibs_cbs_cst, ibs_cbs_classificacao_tributaria: profile.ibs_cbs_class || '000001',
      ibs_cbs_base_calculo: money(net), ibs_uf_aliquota: 0.1, ibs_uf_valor: money(ibs), ibs_mun_aliquota: 0, ibs_mun_valor: 0,
      ibs_valor_total: money(ibs), cbs_aliquota: 0.9, cbs_valor: money(cbs),
    });
  }
  return f;
}

/**
 * Pagamentos da nota: o que já foi recebido + o restante na forma combinada com o cliente.
 * Retorna { formas, troco } ou lança com a lista de problemas.
 */
function paymentsFor(order, cfg, methods, problems) {
  const byMethod = new Map();
  for (const p of order.payments || []) byMethod.set(p.method, (byMethod.get(p.method) || 0) + p.amount_cents);
  const paid = [...byMethod.values()].reduce((s, x) => s + x, 0);
  if (paid < order.total_cents) {
    if (!order.payment_method) problems.push('Informe a forma de pagamento do pedido antes de emitir a nota.');
    else byMethod.set(order.payment_method, (byMethod.get(order.payment_method) || 0) + order.total_cents - paid);
  }
  const formas = [];
  for (const [method, amount] of byMethod) {
    if (amount <= 0) continue;
    const label = methods.find((m) => m.id === method)?.label || method;
    const code = cfg.payment_codes?.[method] || '99';
    const f = { forma_pagamento: code, valor_pagamento: money(amount) };
    if (['03', '04', '17'].includes(code)) f.tipo_integracao = '2'; // maquininha/PIX não integrado ao sistema
    if (code === '99') f.descricao_pagamento = label.slice(0, 60);
    formas.push(f);
  }
  const total = [...byMethod.values()].reduce((s, x) => s + x, 0);
  return { formas, troco: Math.max(0, total - order.total_cents) };
}

/**
 * Converte o pedido (getOrder) na requisição de NFC-e.
 * Retorna { payload, problems } — com problemas, a nota não deve ser enviada.
 */
export function buildNfce(order, cfg, { methods = [], integrations = {}, at = new Date() } = {}) {
  const problems = [];
  const regime = cfg.regime === 'normal' ? 'normal' : 'simples';
  if (cfg.provider !== 'simulado' && !validCnpj(cfg.cnpj)) problems.push('Informe o CNPJ da loja na configuração fiscal.');
  if (order.status === 'cancelado') problems.push('Pedido cancelado não pode ter nota fiscal.');
  if (!(order.total_cents > 0)) problems.push('Pedido sem valor.');

  const profiles = new Map(all('SELECT * FROM tax_profiles').map((p) => [p.id, p]));
  const items = order.items || [];
  const platform = order.external_platform;
  const appName = platform === 'ifood' ? 'iFood' : '99Food';
  // item de app que chegou sem vínculo: vale o vínculo feito depois em "Vincular produtos"
  const productOf = (i) => {
    const id = i.product_id || (platform && get(
      `SELECT v.product_id AS id FROM integration_items x JOIN product_variants v ON v.id = x.variant_id
       WHERE x.platform = ? AND x.name = ? ORDER BY x.last_seen_at DESC LIMIT 1`, platform, i.name,
    )?.id);
    return id ? get('SELECT id, name, ncm, cest, tax_profile_id FROM products WHERE id = ?', id) : null;
  };

  // desconto primeiro sobre os produtos; o que passar disso abate a taxa de entrega (ex.: frete grátis)
  const subtotal = items.reduce((s, i) => s + i.total_cents, 0);
  const discountOnItems = Math.min(order.discount_cents || 0, subtotal);
  const extra = Math.max(0, (order.delivery_fee_cents || 0) - ((order.discount_cents || 0) - discountOnItems));
  const weights = items.map((i) => i.total_cents);
  const discounts = allocate(discountOnItems, weights);
  const others = allocate(extra, weights);

  const itens = items.map((i, k) => {
    const p = productOf(i);
    const label = `${i.name}${i.variant_name ? ` - ${i.variant_name}` : ''}`;
    if (!p && platform && !i.product_id) problems.push(`"${label}" do ${appName} não está vinculado a um produto da loja. Vincule em iFood e 99Food → Vincular produtos e emita de novo.`);
    else if (!p) problems.push(`"${label}": produto excluído do cardápio; não dá para emitir.`);
    const ncm = onlyDigits(p?.ncm);
    if (p && ncm.length !== 8) problems.push(`"${p.name}" está sem NCM. Complete em Notas fiscais → Tributação.`);
    const profile = profiles.get(p?.tax_profile_id) || profiles.get(cfg.default_profile_id);
    if (p && !profile) problems.push(`"${p.name}" está sem perfil tributário. Complete em Notas fiscais → Tributação.`);
    const options = (i.options || []).map((o) => o.name).join(', ');
    const net = i.total_cents - discounts[k] + others[k];
    const unit = i.unit_price_cents / 100;
    return {
      numero_item: String(k + 1),
      codigo_produto: i.variant_id ? `V${i.variant_id}` : `P${i.product_id || k + 1}`,
      descricao: `${label}${options ? ` (${options})` : ''}`.slice(0, 120),
      codigo_ncm: ncm,
      ...(p?.cest ? { cest: onlyDigits(p.cest) } : {}),
      cfop: profile?.cfop,
      unidade_comercial: 'UN',
      quantidade_comercial: i.qty,
      valor_unitario_comercial: unit,
      unidade_tributavel: 'UN',
      quantidade_tributavel: i.qty,
      valor_unitario_tributavel: unit,
      valor_bruto: money(i.total_cents),
      ...(discounts[k] ? { valor_desconto: money(discounts[k]) } : {}),
      ...(others[k] ? { valor_outras_despesas: money(others[k]) } : {}),
      ...(profile ? taxFields(profile, net, regime) : {}),
    };
  });
  if (!itens.length) problems.push('Pedido sem itens.');

  const { formas, troco } = paymentsFor(order, cfg, methods, problems);

  const payload = {
    cnpj_emitente: onlyDigits(cfg.cnpj),
    data_emissao: isoNowSP(at),
    natureza_operacao: 'VENDA AO CONSUMIDOR',
    tipo_documento: '1',
    finalidade_emissao: '1',
    consumidor_final: '1',
    presenca_comprador: order.type === 'entrega' ? '4' : '1',
    modalidade_frete: '9',
    local_destino: '1',
    indicador_inscricao_estadual_destinatario: '9',
    items: itens,
    formas_pagamento: formas,
  };
  if (troco) payload.valor_troco = money(troco);

  // venda feita em app de delivery: o app é o intermediador da transação
  if (platform && cfg.intermediarios?.[platform]) {
    const inter = cfg.intermediarios[platform];
    const fallbackId = platform === 'ifood' ? integrations.ifood?.merchant_id : integrations.food99?.app_shop_id;
    const id = String(inter.id || fallbackId || '').trim();
    if (!validCnpj(inter.cnpj)) problems.push(`Informe o CNPJ do ${appName} na configuração fiscal.`);
    if (!id) problems.push(`Informe o identificador da loja no ${appName} na configuração fiscal.`);
    Object.assign(payload, { indicador_intermediario: '1', cnpj_intermediario: onlyDigits(inter.cnpj), id_intermediario: id.slice(0, 60) });
  } else {
    payload.indicador_intermediario = '0';
  }

  const doc = onlyDigits(order.customer_doc);
  if (doc.length === 11) payload.cpf_destinatario = doc;
  if (doc.length === 14) payload.cnpj_destinatario = doc;
  if (doc && order.customer_name) payload.nome_destinatario = order.customer_name.slice(0, 60);

  const info = [`Pedido #${order.id}${order.external_code ? ` (${appName} #${order.external_code})` : ''}`, cfg.info_adicional]
    .filter(Boolean).join(' - ');
  payload.informacoes_adicionais_contribuinte = info.slice(0, 2000);

  return { payload, problems: [...new Set(problems)] };
}
