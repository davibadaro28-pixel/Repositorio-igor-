// Rotas do painel: configuração fiscal, tributação dos produtos, emissão/cancelamento e arquivo do contador.
import { Router } from 'express';
import { all, get, run, tx, now, getSetting, setSetting } from '../db.js';
import { fail, requireModule } from '../auth.js';
import { getOrder } from '../services/orders.js';
import { int, num, range, str, toCsv, money } from '../util.js';
import { ICMS_CODES, PIS_COFINS_CODES, onlyDigits, validCnpj } from './nfce.js';
import { PROVIDERS, cancelDoc, emitForOrder, environmentOf, fiscalConfig, getDoc, syncDoc } from './service.js';
import { makeZip } from './zip.js';

const r = Router();
const manage = requireModule('fiscal');
const operate = requireModule('pedidos', 'pdv', 'caixa', 'fiscal');
const MASK = '********';
const TOKENS = ['token_homologacao', 'token_producao'];
const PAY_CODES = ['01', '02', '03', '04', '05', '10', '11', '12', '13', '15', '16', '17', '18', '19', '20', '99'];
const CHANNELS = ['pdv', 'cardapio', 'whatsapp', 'telefone', 'ifood', '99food', 'outro'];

function publicConfig() {
  const cfg = fiscalConfig();
  for (const k of TOKENS) if (cfg[k]) cfg[k] = MASK;
  return cfg;
}

r.get('/fiscal/config', manage, (_req, res) => {
  const cfg = fiscalConfig();
  const env = environmentOf(cfg);
  const month = now().slice(0, 7);
  const integrations = getSetting('integrations', {});
  res.json({
    config: publicConfig(),
    environment: env,
    profiles: all('SELECT * FROM tax_profiles ORDER BY id'),
    codes: { icms: ICMS_CODES, pis_cofins: PIS_COFINS_CODES },
    store_ids: { ifood: integrations.ifood?.merchant_id || '', '99food': integrations.food99?.app_shop_id || '' },
    missing_ncm: get(`SELECT COUNT(*) AS n FROM products WHERE active = 1 AND (ncm IS NULL OR length(ncm) != 8)`).n,
    month: all(
      `SELECT status, COUNT(*) AS n, COALESCE(SUM(total_cents), 0) AS total_cents FROM fiscal_docs
       WHERE environment = ? AND substr(created_at, 1, 7) = ? GROUP BY status`, env, month,
    ),
  });
});

r.put('/fiscal/config', manage, (req, res) => {
  const b = req.body || {};
  const cur = fiscalConfig();
  const next = { ...cur };
  if ('enabled' in b) next.enabled = !!b.enabled;
  if ('provider' in b) next.provider = b.provider === 'simulado' ? 'simulado' : 'focusnfe';
  if ('ambiente' in b) next.ambiente = b.ambiente === 'producao' ? 'producao' : 'homologacao';
  for (const k of TOKENS) if (k in b && b[k] !== MASK) next[k] = str(b[k], 200) || '';
  if ('cnpj' in b) {
    next.cnpj = onlyDigits(b.cnpj);
    if (next.cnpj && !validCnpj(next.cnpj)) fail(400, 'CNPJ da loja inválido');
  }
  if ('razao_social' in b) next.razao_social = str(b.razao_social, 120) || '';
  if ('regime' in b) next.regime = ['simples_nacional', 'mei', 'normal'].includes(b.regime) ? b.regime : 'simples_nacional';
  if ('auto_emit' in b) next.auto_emit = !!b.auto_emit;
  if ('auto_channels' in b) next.auto_channels = (Array.isArray(b.auto_channels) ? b.auto_channels : []).filter((c) => CHANNELS.includes(c));
  if ('default_profile_id' in b) {
    const id = int(b.default_profile_id);
    if (id && !get('SELECT 1 FROM tax_profiles WHERE id = ?', id)) fail(400, 'Perfil tributário inválido');
    next.default_profile_id = id || null;
  }
  if (b.payment_codes && typeof b.payment_codes === 'object') {
    next.payment_codes = { ...cur.payment_codes };
    for (const [method, code] of Object.entries(b.payment_codes)) {
      if (!PAY_CODES.includes(String(code))) fail(400, `Código de pagamento inválido para "${method}"`);
      next.payment_codes[String(method).slice(0, 30)] = String(code);
    }
  }
  if (b.intermediarios && typeof b.intermediarios === 'object') {
    next.intermediarios = { ...cur.intermediarios };
    for (const p of ['ifood', '99food']) {
      const x = b.intermediarios[p];
      if (!x) continue;
      const cnpj = onlyDigits(x.cnpj);
      if (cnpj && !validCnpj(cnpj)) fail(400, `CNPJ do ${p === 'ifood' ? 'iFood' : '99Food'} inválido`);
      next.intermediarios[p] = { cnpj, id: str(x.id, 60) || '' };
    }
  }
  if ('info_adicional' in b) next.info_adicional = str(b.info_adicional, 500) || '';
  if (next.enabled && next.provider === 'focusnfe') {
    if (!next.cnpj) fail(400, 'Informe o CNPJ da loja para ativar a emissão');
    if (!next[next.ambiente === 'producao' ? 'token_producao' : 'token_homologacao']) {
      fail(400, `Informe o token de ${next.ambiente === 'producao' ? 'produção' : 'homologação'} da Focus NFe`);
    }
  }
  setSetting('fiscal', next);
  res.json(publicConfig());
});

r.post('/fiscal/test', manage, async (_req, res) => {
  const cfg = fiscalConfig();
  try {
    res.json({ ok: true, message: await PROVIDERS[cfg.provider].testConnection(cfg) });
  } catch (e) {
    res.json({ ok: false, message: e.message });
  }
});

// ---------- Perfis tributários ----------

function profileFields(b, regime) {
  const cfop = onlyDigits(b.cfop);
  if (!/^5\d{3}$/.test(cfop)) fail(400, 'CFOP inválido (venda dentro do estado começa com 5, ex.: 5101)');
  const icms = String(b.icms_cst || '');
  if (!ICMS_CODES.simples[icms] && !ICMS_CODES.normal[icms]) fail(400, 'CSOSN/CST do ICMS não suportado');
  if (regime !== 'normal' && ICMS_CODES.normal[icms]) fail(400, 'No Simples Nacional use um CSOSN (ex.: 102 ou 500)');
  if (regime === 'normal' && ICMS_CODES.simples[icms]) fail(400, 'No regime normal use um CST do ICMS (ex.: 00 ou 60)');
  for (const k of ['pis_cst', 'cofins_cst']) if (!PIS_COFINS_CODES[String(b[k] || '')]) fail(400, 'CST de PIS/COFINS inválido');
  const rate = (v) => Math.min(Math.max(num(v, 0), 0), 100);
  const ibsCst = onlyDigits(b.ibs_cbs_cst);
  const ibsClass = onlyDigits(b.ibs_cbs_class);
  if (ibsCst && ibsCst.length !== 3) fail(400, 'CST do IBS/CBS tem 3 dígitos');
  if (ibsClass && ibsClass.length !== 6) fail(400, 'Classificação tributária do IBS/CBS tem 6 dígitos');
  const name = str(b.name, 100);
  if (!name) fail(400, 'Dê um nome ao perfil');
  return [name, cfop, icms, rate(b.icms_aliquota), String(b.pis_cst), rate(b.pis_aliquota), String(b.cofins_cst), rate(b.cofins_aliquota), ibsCst || null, ibsClass || null];
}

r.post('/fiscal/profiles', manage, (req, res) => {
  const x = run(
    `INSERT INTO tax_profiles (name, cfop, icms_cst, icms_aliquota, pis_cst, pis_aliquota, cofins_cst, cofins_aliquota, ibs_cbs_cst, ibs_cbs_class)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, ...profileFields(req.body || {}, fiscalConfig().regime),
  );
  res.status(201).json(get('SELECT * FROM tax_profiles WHERE id = ?', x.lastInsertRowid));
});

r.put('/fiscal/profiles/:id', manage, (req, res) => {
  const id = int(req.params.id);
  if (!get('SELECT 1 FROM tax_profiles WHERE id = ?', id)) fail(404, 'Perfil não encontrado');
  run(
    `UPDATE tax_profiles SET name = ?, cfop = ?, icms_cst = ?, icms_aliquota = ?, pis_cst = ?, pis_aliquota = ?, cofins_cst = ?, cofins_aliquota = ?,
       ibs_cbs_cst = ?, ibs_cbs_class = ? WHERE id = ?`, ...profileFields(req.body || {}, fiscalConfig().regime), id,
  );
  res.json(get('SELECT * FROM tax_profiles WHERE id = ?', id));
});

r.delete('/fiscal/profiles/:id', manage, (req, res) => {
  const id = int(req.params.id);
  if (fiscalConfig().default_profile_id === id) fail(400, 'Este é o perfil padrão. Escolha outro padrão antes de excluir.');
  if (get('SELECT 1 FROM products WHERE tax_profile_id = ? LIMIT 1', id)) fail(400, 'Há produtos usando este perfil. Troque o perfil deles antes.');
  run('DELETE FROM tax_profiles WHERE id = ?', id);
  res.json({ ok: true });
});

// ---------- Tributação dos produtos (NCM, CEST e perfil) ----------

r.get('/fiscal/products', manage, (_req, res) => {
  res.json(all(
    `SELECT p.id, p.name, p.active, p.ncm, p.cest, p.tax_profile_id, c.name AS category_name, c.section
     FROM products p JOIN categories c ON c.id = p.category_id ORDER BY p.active DESC, c.position, p.position, p.id`,
  ));
});

r.put('/fiscal/products', manage, (req, res) => {
  const list = Array.isArray(req.body?.products) ? req.body.products : [];
  tx(() => {
    for (const p of list) {
      const ncm = onlyDigits(p.ncm);
      const cest = onlyDigits(p.cest);
      const profile = int(p.tax_profile_id);
      const name = get('SELECT name FROM products WHERE id = ?', int(p.id))?.name;
      if (!name) fail(400, 'Produto não encontrado');
      if (ncm && ncm.length !== 8) fail(400, `NCM de "${name}" precisa ter 8 dígitos`);
      if (cest && cest.length !== 7) fail(400, `CEST de "${name}" precisa ter 7 dígitos`);
      if (profile && !get('SELECT 1 FROM tax_profiles WHERE id = ?', profile)) fail(400, 'Perfil tributário inválido');
      run('UPDATE products SET ncm = ?, cest = ?, tax_profile_id = ? WHERE id = ?', ncm || null, cest || null, profile || null, int(p.id));
    }
  });
  res.json({ ok: true, updated: list.length });
});

// ---------- Notas ----------

r.get('/fiscal/docs', manage, (req, res) => {
  const { fromTs, toTs } = range(req.query, 31);
  const where = ['f.created_at BETWEEN ? AND ?'];
  const params = [fromTs, toTs];
  const env = ['producao', 'homologacao', 'simulado'].includes(req.query.environment) ? req.query.environment : environmentOf(fiscalConfig());
  where.push('f.environment = ?');
  params.push(env);
  if (['processando', 'autorizado', 'rejeitado', 'cancelado', 'denegado'].includes(req.query.status)) { where.push('f.status = ?'); params.push(req.query.status); }
  if (req.query.status === 'atencao') where.push(`(f.alert IS NOT NULL OR f.status IN ('rejeitado','processando'))`);
  const q = str(req.query.q, 60);
  if (q) {
    where.push('(f.number = ? OR f.order_id = ? OR f.access_key LIKE ? OR f.customer_doc LIKE ? OR o.customer_name LIKE ?)');
    params.push(q.replace('#', ''), int(q.replace('#', ''), 0), `%${onlyDigits(q) || q}%`, `%${onlyDigits(q) || '-'}%`, `%${q}%`);
  }
  const docs = all(
    `SELECT f.id, f.order_id, f.provider, f.environment, f.status, f.number, f.series, f.access_key, f.total_cents, f.customer_doc, f.message,
            f.alert, f.danfe_url, f.contingency, f.cancel_reason, f.cancelled_at, f.issued_at, f.created_at, (f.xml IS NOT NULL) AS has_xml,
            o.customer_name, o.channel, o.type, o.external_code, o.status AS order_status
     FROM fiscal_docs f JOIN orders o ON o.id = f.order_id WHERE ${where.join(' AND ')} ORDER BY f.id DESC LIMIT 500`, ...params,
  );
  const totals = all(
    `SELECT f.status, COUNT(*) AS n, COALESCE(SUM(f.total_cents), 0) AS total_cents FROM fiscal_docs f
     WHERE f.created_at BETWEEN ? AND ? AND f.environment = ? GROUP BY f.status`, fromTs, toTs, env,
  );
  res.json({ environment: env, docs, totals });
});

r.get('/fiscal/docs/:id', operate, (req, res) => {
  const doc = getDoc(int(req.params.id));
  if (!doc) fail(404, 'Nota não encontrada');
  const { xml, cancel_xml: cancelXml, payload, ...rest } = doc;
  res.json({ ...rest, has_xml: !!xml, has_cancel_xml: !!cancelXml, payload: payload ? JSON.parse(payload) : null, order: getOrder(doc.order_id) });
});

r.get('/fiscal/docs/:id/xml', manage, (req, res) => {
  const doc = get('SELECT * FROM fiscal_docs WHERE id = ?', int(req.params.id));
  const xml = req.query.cancel ? doc?.cancel_xml : doc?.xml;
  if (!xml) fail(404, 'XML ainda não disponível. Tente “Consultar” na nota.');
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${doc.access_key || doc.ref}${req.query.cancel ? '-cancelamento' : ''}.xml"`);
  res.send(xml);
});

r.post('/fiscal/orders/:id/emit', operate, async (req, res) => {
  const doc = await emitForOrder(int(req.params.id), { user: req.user, customerDoc: req.body?.customer_doc });
  res.status(doc.status === 'rejeitado' ? 422 : 201).json({ doc, error: doc.status === 'rejeitado' ? doc.message : undefined });
});

r.post('/fiscal/docs/:id/sync', operate, async (req, res) => {
  try {
    res.json(await syncDoc(int(req.params.id)));
  } catch (e) {
    fail(e.status || 502, `Não foi possível consultar: ${e.message}`);
  }
});

r.post('/fiscal/docs/:id/cancel', manage, async (req, res) => {
  res.json(await cancelDoc(int(req.params.id), req.body?.reason));
});

// XMLs do período (autorizadas e canceladas) + resumo em planilha, para mandar ao contador
r.get('/fiscal/export.zip', manage, async (req, res) => {
  const { from, to, fromTs, toTs } = range(req.query, 31);
  const env = ['producao', 'homologacao', 'simulado'].includes(req.query.environment) ? req.query.environment : 'producao';
  const docs = all(
    `SELECT * FROM fiscal_docs WHERE environment = ? AND status IN ('autorizado','cancelado') AND COALESCE(issued_at, created_at) BETWEEN ? AND ?
     ORDER BY COALESCE(issued_at, created_at)`, env, fromTs, toTs,
  );
  const files = [];
  for (const d of docs) {
    // XML que ainda não foi copiado: busca agora no emissor
    for (const [col, urlCol] of [['xml', 'xml_url'], ['cancel_xml', 'cancel_xml_url']]) {
      if (d[col] || !d[urlCol] || !PROVIDERS[d.provider].download) continue;
      try {
        d[col] = await PROVIDERS[d.provider].download({ ...fiscalConfig(), ambiente: d.environment }, d[urlCol]);
        run(`UPDATE fiscal_docs SET ${col} = ? WHERE id = ?`, d[col], d.id);
      } catch { /* fica de fora do arquivo; aparece no resumo */ }
    }
    const name = d.access_key || d.ref;
    if (d.xml) files.push({ name: `NFCe/${name}-nfce.xml`, content: d.xml });
    if (d.cancel_xml) files.push({ name: `NFCe/${name}-cancelamento.xml`, content: d.cancel_xml });
  }
  const STATUS = { autorizado: 'Autorizada', cancelado: 'Cancelada' };
  files.unshift({
    name: 'resumo.csv',
    content: toCsv(docs, [
      { label: 'Número', value: (d) => d.number },
      { label: 'Série', value: (d) => d.series },
      { label: 'Chave de acesso', value: (d) => d.access_key },
      { label: 'Emissão', value: (d) => d.issued_at || d.created_at },
      { label: 'Pedido', value: (d) => d.order_id },
      { label: 'Situação', value: (d) => STATUS[d.status] },
      { label: 'Valor (R$)', value: (d) => money(d.total_cents) },
      { label: 'CPF/CNPJ', value: (d) => d.customer_doc },
      { label: 'XML no arquivo', value: (d) => (d.xml ? 'sim' : 'não') },
    ]),
  });
  const zip = makeZip(files);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="nfce_${env}_${from}_a_${to}.zip"`);
  res.send(Buffer.from(zip.buffer, zip.byteOffset, zip.byteLength));
});

export default r;
