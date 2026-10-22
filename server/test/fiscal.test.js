import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';

// Servidor que imita a API da Focus NFe, registrando o que o sistema enviou
const calls = [];
let mode = 'ok'; // 'ok' | 'reject' | 'down' | 'cancelFail'
const notes = new Map(); // ref → nota autorizada
let seq = 100;

const focus = createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const call = { method: req.method, url: req.url, headers: req.headers, body: body ? JSON.parse(body) : null };
    calls.push(call);
    const send = (status, data, type = 'application/json') => {
      res.writeHead(status, { 'content-type': type });
      res.end(typeof data === 'string' ? data : JSON.stringify(data));
    };
    if (req.headers.authorization !== `Basic ${Buffer.from('tok-homolog:').toString('base64')}`) return send(401, 'HTTP Basic: Access denied', 'text/html');
    const url = new URL(req.url, 'http://x');
    if (url.pathname.startsWith('/arquivos/')) return send(200, `<nfeProc><chave>${url.pathname}</chave></nfeProc>`, 'application/xml');
    if (req.method === 'POST' && url.pathname === '/v2/nfce') {
      const ref = url.searchParams.get('ref');
      if (mode === 'down') {
        const n = authorize(ref);
        notes.set(ref, n); // a nota foi autorizada, mas a resposta não chegou
        return send(502, 'Bad gateway', 'text/html');
      }
      if (mode === 'reject') return send(201, { ref, status: 'erro_autorizacao', status_sefaz: '704', mensagem_sefaz: 'Rejeição: NFC-e com Data-Hora de emissão atrasada' });
      if (notes.has(ref)) return send(422, { codigo: 'already_processed', mensagem: 'A nota fiscal já foi autorizada' });
      const n = authorize(ref);
      notes.set(ref, n);
      return send(201, n);
    }
    const m = /^\/v2\/nfce\/([^/]+)$/.exec(url.pathname);
    if (m && req.method === 'GET') return notes.has(m[1]) ? send(200, notes.get(m[1])) : send(404, { codigo: 'nao_encontrado', mensagem: 'Nota fiscal não encontrada' });
    if (m && req.method === 'DELETE') {
      if (mode === 'cancelFail') return send(200, { status: 'erro_cancelamento', status_sefaz: '501', mensagem_sefaz: 'Rejeição: Prazo de cancelamento superior ao previsto na Legislação' });
      const n = notes.get(m[1]);
      Object.assign(n, { status: 'cancelado', status_sefaz: '135', mensagem_sefaz: 'Evento registrado e vinculado a NF-e', caminho_xml_cancelamento: `/arquivos/canc-${m[1]}.xml` });
      return send(200, { status: 'cancelado', status_sefaz: '135', mensagem_sefaz: 'Evento registrado e vinculado a NF-e', caminho_xml_cancelamento: `/arquivos/canc-${m[1]}.xml` });
    }
    return send(404, { codigo: 'nao_encontrado', mensagem: 'Não encontrado' });
  });
});

function authorize(ref) {
  const numero = String(++seq);
  const chave = `3526101234567800019565001${numero.padStart(9, '0')}1234567890`.slice(0, 44);
  return {
    cnpj_emitente: '11222333000181', ref, status: 'autorizado', status_sefaz: '100', mensagem_sefaz: 'Autorizado o uso da NF-e',
    chave_nfe: `NFe${chave}`, numero, serie: '1', caminho_xml_nota_fiscal: `/arquivos/${chave}-nfe.xml`,
    caminho_danfe: `/notas_fiscais_consumidor/NFe${chave}.html`, qrcode_url: `https://www.homologacao.nfce.fazenda.sp.gov.br/qrcode?p=${chave}`,
    url_consulta_nf: 'https://www.homologacao.nfce.fazenda.sp.gov.br/consulta',
  };
}

let base;
let admin;
let srv;
const listen = (s) => new Promise((r) => s.listen(0, () => r(`http://127.0.0.1:${s.address().port}`)));

async function api(path, { method = 'GET', body, token = admin } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const type = res.headers.get('content-type') || '';
  const data = type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, data, type };
}

async function waitFor(fn, ms = 3000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const v = await fn();
    if (v) return v;
    await new Promise((r) => setTimeout(r, 25));
  }
  throw new Error('tempo esgotado esperando');
}

const emits = () => calls.filter((c) => c.method === 'POST' && c.url.startsWith('/v2/nfce'));
let products;
const variantOf = (re) => products.find((p) => re.test(p.name)).variants[0];

async function sale({ items, status = 'concluido', type = 'balcao', payments, discount = 0, fee = 0, extra = {} }) {
  const r = await api('/orders', { method: 'POST', body: { type, channel: 'pdv', status, discount_cents: discount, delivery_fee_cents: fee, payments, items, ...extra } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  return r.data;
}

before(async () => {
  process.env.FOCUS_API_URL = await listen(focus);
  process.env.DB_PATH = ':memory:';
  process.env.ADMIN_PASSWORD = 'admin123';
  const { app } = await import('../index.js');
  srv = app.listen(0);
  await new Promise((r) => srv.once('listening', r));
  base = `http://127.0.0.1:${srv.address().port}/api`;
  admin = (await api('/auth/login', { method: 'POST', body: { login: 'admin', password: 'admin123' }, token: null })).data.token;
  products = (await api('/products')).data;
});

after(() => {
  srv?.close();
  focus.close();
});

test('regras de CPF/CNPJ e divisão de valores', async () => {
  const { validCpf, validCnpj, allocate, cleanDoc } = await import('../fiscal/nfce.js');
  assert.ok(validCpf('529.982.247-25'));
  assert.ok(!validCpf('529.982.247-24'));
  assert.ok(!validCpf('111.111.111-11'));
  assert.ok(validCnpj('11.222.333/0001-81'));
  assert.ok(validCnpj('14.380.200/0001-21')); // iFood
  assert.ok(!validCnpj('11.222.333/0001-82'));
  assert.throws(() => cleanDoc('123'), /inválido/);
  assert.equal(cleanDoc(''), null);
  const parts = allocate(1000, [3333, 3333, 3334]);
  assert.equal(parts.reduce((s, x) => s + x, 0), 1000);
  assert.deepEqual(allocate(0, [1, 2]), [0, 0]);
});

test('tributação sugerida para o cardápio e validação', async () => {
  const list = (await api('/fiscal/products')).data;
  const bolo = list.find((p) => /^Bolo Premium/.test(p.name));
  const coca = list.find((p) => p.name === 'Coca-Cola');
  const agua = list.find((p) => p.name === 'Água');
  assert.equal(bolo.ncm, '19059090');
  assert.equal(coca.ncm, '22021000');
  assert.equal(agua.ncm, '22011000');
  const cfg = (await api('/fiscal/config')).data;
  const st = cfg.profiles.find((p) => p.icms_cst === '500');
  assert.equal(coca.tax_profile_id, st.id);
  assert.equal(st.cfop, '5405');
  assert.equal(bolo.tax_profile_id, null); // usa o perfil padrão (produção própria)
  assert.equal(cfg.profiles.find((p) => p.id === cfg.config.default_profile_id).cfop, '5101');
  assert.equal(cfg.missing_ncm, 0);

  const bad = await api('/fiscal/products', { method: 'PUT', body: { products: [{ id: bolo.id, ncm: '1905' }] } });
  assert.equal(bad.status, 400);
  assert.match(bad.data.error, /8 dígitos/);
  const badProfile = await api('/fiscal/profiles', { method: 'POST', body: { name: 'X', cfop: '5101', icms_cst: '00', pis_cst: '49', cofins_cst: '49' } });
  assert.match(badProfile.data.error, /Simples Nacional/);
});

test('configuração: exige CNPJ e token, e nunca devolve o token', async () => {
  const off = await api('/fiscal/orders/1/emit', { method: 'POST', body: {} });
  assert.match(off.data.error, /Ative a emissão/);
  const noCnpj = await api('/fiscal/config', { method: 'PUT', body: { enabled: true, provider: 'focusnfe', ambiente: 'homologacao', token_homologacao: 'tok-homolog' } });
  assert.match(noCnpj.data.error, /CNPJ/);
  const badCnpj = await api('/fiscal/config', { method: 'PUT', body: { cnpj: '11.222.333/0001-00' } });
  assert.match(badCnpj.data.error, /inválido/);
  const ok = await api('/fiscal/config', {
    method: 'PUT',
    body: { enabled: true, provider: 'focusnfe', ambiente: 'homologacao', token_homologacao: 'tok-homolog', cnpj: '11.222.333/0001-81', razao_social: 'Laços de Mãe Doces Ltda' },
  });
  assert.equal(ok.status, 200, JSON.stringify(ok.data));
  assert.equal(ok.data.token_homologacao, '********');
  assert.equal(ok.data.cnpj, '11222333000181');
  // salvar de novo com a máscara mantém o token
  await api('/fiscal/config', { method: 'PUT', body: { token_homologacao: '********', info_adicional: 'Obrigada!' } });
  const test1 = await api('/fiscal/test', { method: 'POST' });
  assert.equal(test1.data.ok, true, test1.data.message);
  const settings = (await api('/settings')).data;
  assert.deepEqual(settings.fiscal, { enabled: true, provider: 'focusnfe', ambiente: 'homologacao', auto_emit: false, razao_social: 'Laços de Mãe Doces Ltda' });
});

test('emite NFC-e de venda de balcão com desconto, CPF e pagamento dividido', async () => {
  const bolo = variantOf(/^Bolo Premium/);
  const coca = variantOf(/^Coca-Cola$/);
  const order = await sale({
    items: [{ variant_id: bolo.id, qty: 1 }, { variant_id: coca.id, qty: 2 }],
    discount: 1000,
    payments: [], // recebido depois
  });
  const total = order.total_cents;
  await api(`/orders/${order.id}/payments`, { method: 'POST', body: { payments: [{ method: 'pix', amount_cents: total - 2000 }, { method: 'dinheiro', amount_cents: 2000 }] } });

  const before = emits().length;
  const r = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: { customer_doc: '529.982.247-25' } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.doc.status, 'autorizado');
  assert.equal(r.data.doc.number, String(seq));
  assert.equal(r.data.doc.access_key.length, 44);
  assert.ok(r.data.doc.danfe_url.startsWith(process.env.FOCUS_API_URL + '/notas_fiscais_consumidor/'));
  assert.equal(emits().length, before + 1);

  const sent = emits().at(-1).body;
  assert.equal(sent.cnpj_emitente, '11222333000181');
  assert.equal(sent.presenca_comprador, '1');
  assert.equal(sent.indicador_intermediario, '0');
  assert.equal(sent.cpf_destinatario, '52998224725');
  assert.match(sent.data_emissao, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}-03:00$/);
  assert.match(sent.informacoes_adicionais_contribuinte, new RegExp(`Pedido #${order.id} - Obrigada!`));
  const [i1, i2] = sent.items;
  assert.equal(i1.codigo_ncm, '19059090');
  assert.equal(i1.cfop, '5101');
  assert.equal(i1.icms_situacao_tributaria, '102');
  assert.equal(i1.pis_situacao_tributaria, '49');
  assert.equal(i1.pis_valor, 0);
  assert.equal(i2.codigo_ncm, '22021000');
  assert.equal(i2.cfop, '5405');
  assert.equal(i2.icms_situacao_tributaria, '500');
  assert.equal(i2.pis_situacao_tributaria, '04');
  assert.equal(i2.quantidade_comercial, 2);
  assert.equal(i2.codigo_produto, `V${coca.id}`);
  // os totais da nota fecham com o pedido
  const c = (v) => Math.round((v || 0) * 100);
  const itemsTotal = sent.items.reduce((s, i) => s + c(i.valor_bruto) - c(i.valor_desconto) + c(i.valor_outras_despesas), 0);
  assert.equal(itemsTotal, total);
  assert.equal(sent.items.reduce((s, i) => s + c(i.valor_desconto), 0), 1000);
  assert.deepEqual(sent.formas_pagamento.map((f) => [f.forma_pagamento, c(f.valor_pagamento)]).sort(), [['01', 2000], ['20', total - 2000]].sort());

  // XML guardado para o contador
  await waitFor(async () => (await api('/fiscal/docs?status=autorizado')).data.docs.find((d) => d.id === r.data.doc.id)?.has_xml);
  // o pedido mostra a nota
  const o = (await api(`/orders/${order.id}`)).data;
  assert.equal(o.fiscal_docs[0].status, 'autorizado');
  assert.equal(o.customer_doc, '52998224725');
  const board = (await api('/orders?limit=5')).data;
  assert.equal(board.find((x) => x.id === order.id).fiscal_status, 'autorizado');

  // não emite duas vezes
  const again = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  assert.match(again.data.error, /já tem NFC-e/);
  assert.equal(emits().length, before + 1);
  const badCpf = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: { customer_doc: '123.456.789-00' } });
  assert.match(badCpf.data.error, /CPF\/CNPJ inválido/);
});

test('produto sem NCM não é enviado; corrigido, reenvia com a mesma referência', async () => {
  const brownie = products.find((p) => /^Brownie/.test(p.name));
  await api('/fiscal/products', { method: 'PUT', body: { products: [{ id: brownie.id, ncm: '', tax_profile_id: null }] } });
  const order = await sale({ items: [{ variant_id: brownie.variants[0].id, qty: 3 }], payments: [{ method: 'credito', amount_cents: brownie.variants[0].price_cents * 3 }] });
  const before = emits().length;
  const r = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  assert.equal(r.status, 422);
  assert.match(r.data.error, /sem NCM/);
  assert.equal(emits().length, before, 'não deve chamar o emissor');
  assert.equal((await api('/fiscal/config')).data.missing_ncm, 1);

  await api('/fiscal/products', { method: 'PUT', body: { products: [{ id: brownie.id, ncm: '1905.90.90', tax_profile_id: null }] } });
  const ok = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  assert.equal(ok.data.doc.status, 'autorizado');
  assert.equal(ok.data.doc.id, r.data.doc.id);
  const sent = emits().at(-1);
  assert.match(sent.url, new RegExp(`ref=${ok.data.doc.ref}`));
  assert.deepEqual(sent.body.formas_pagamento, [{ forma_pagamento: '03', valor_pagamento: brownie.variants[0].price_cents * 3 / 100, tipo_integracao: '2' }]);
});

test('rejeição da SEFAZ fica registrada e pode ser reenviada', async () => {
  const v = variantOf(/^Cookie/);
  const order = await sale({ items: [{ variant_id: v.id, qty: 1 }], payments: [{ method: 'debito', amount_cents: v.price_cents }] });
  mode = 'reject';
  const r = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  mode = 'ok';
  assert.equal(r.status, 422);
  assert.match(r.data.error, /704 – Rejeição/);
  const attention = (await api('/fiscal/docs?status=atencao')).data.docs;
  assert.ok(attention.some((d) => d.order_id === order.id));
  const ok = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  assert.equal(ok.data.doc.status, 'autorizado');
});

test('sem resposta do emissor: fica "processando" e a consulta confirma a autorização', async () => {
  const v = variantOf(/^Cookie/);
  const order = await sale({ items: [{ variant_id: v.id, qty: 2 }], payments: [{ method: 'pix', amount_cents: v.price_cents * 2 }] });
  mode = 'down';
  const r = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  mode = 'ok';
  assert.equal(r.data.doc.status, 'processando');
  const dup = await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} });
  assert.match(dup.data.error, /sendo processada/);
  const s = await api(`/fiscal/docs/${r.data.doc.id}/sync`, { method: 'POST' });
  assert.equal(s.data.status, 'autorizado');
  assert.ok(s.data.access_key);
});

test('pedido do iFood: app como intermediador e entrega a domicílio', async () => {
  await api('/integrations/ifood', { method: 'PUT', body: { merchant_id: 'loja-ifood-123' } });
  const o = (await api('/integrations/ifood/simulate', { method: 'POST' })).data;
  // o 2º item do teste chega sem vínculo: sem produto não há NCM, então a nota espera o vínculo
  const unlinked = o.items.find((i) => !i.product_id);
  const first = await api(`/fiscal/orders/${o.id}/emit`, { method: 'POST', body: {} });
  assert.match(first.data.error, /não está vinculado a um produto da loja/);
  const item = (await api('/integrations/items')).data.find((x) => x.platform === 'ifood' && x.name === unlinked.name);
  await api(`/integrations/items/${item.id}`, { method: 'PUT', body: { variant_id: o.items.find((i) => i.variant_id).variant_id } });
  const r = await api(`/fiscal/orders/${o.id}/emit`, { method: 'POST', body: {} });
  assert.equal(r.data.doc.status, 'autorizado', r.data.error);
  const sent = emits().at(-1).body;
  assert.equal(sent.presenca_comprador, '4');
  assert.equal(sent.indicador_intermediario, '1');
  assert.equal(sent.cnpj_intermediario, '14380200000121');
  assert.equal(sent.id_intermediario, 'loja-ifood-123');
  assert.deepEqual(sent.formas_pagamento.map((f) => [f.forma_pagamento, f.descricao_pagamento]), [['99', 'Pago no iFood']]);
  const c = (v) => Math.round((v || 0) * 100);
  assert.equal(sent.items.reduce((s, i) => s + c(i.valor_bruto) - c(i.valor_desconto) + c(i.valor_outras_despesas), 0), o.total_cents);
  // entregador do iFood: a taxa de entrega é do app, não entra na nota da loja
  assert.equal(o.delivery_fee_cents, 0);
  assert.ok(sent.items.every((i) => !i.valor_outras_despesas));
});

test('cancelamento: motivo obrigatório, e cancelar o pedido cancela a nota', async () => {
  const v = variantOf(/^Cookie/);
  const order = await sale({ items: [{ variant_id: v.id, qty: 1 }], status: 'preparo', payments: [{ method: 'pix', amount_cents: v.price_cents }] });
  const doc = (await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} })).data.doc;
  const short = await api(`/fiscal/docs/${doc.id}/cancel`, { method: 'POST', body: { reason: 'erro' } });
  assert.match(short.data.error, /15 letras/);

  await api(`/orders/${order.id}/status`, { method: 'POST', body: { status: 'cancelado', reason: 'Cliente desistiu' } });
  const del = await waitFor(() => calls.find((c) => c.method === 'DELETE' && c.url.endsWith(doc.ref)));
  assert.match(del.body.justificativa, new RegExp(`Cancelamento do pedido #${order.id}: Cliente desistiu`));
  const after1 = await waitFor(async () => {
    const d = (await api(`/fiscal/docs/${doc.id}`)).data;
    return d.status === 'cancelado' && d;
  });
  assert.ok(after1.cancelled_at);
  await waitFor(async () => (await api(`/fiscal/docs/${doc.id}`)).data.has_cancel_xml);

  // SEFAZ recusa (prazo): o pedido fica cancelado e a nota ganha um alerta
  const order2 = await sale({ items: [{ variant_id: v.id, qty: 1 }], status: 'preparo', payments: [{ method: 'pix', amount_cents: v.price_cents }] });
  const doc2 = (await api(`/fiscal/orders/${order2.id}/emit`, { method: 'POST', body: {} })).data.doc;
  mode = 'cancelFail';
  const manual = await api(`/fiscal/docs/${doc2.id}/cancel`, { method: 'POST', body: { reason: 'Venda registrada em duplicidade' } });
  assert.match(manual.data.error, /Prazo de cancelamento/);
  await api(`/orders/${order2.id}/status`, { method: 'POST', body: { status: 'cancelado', reason: 'Pedido duplicado' } });
  const alerted = await waitFor(async () => (await api(`/fiscal/docs/${doc2.id}`)).data.alert);
  mode = 'ok';
  assert.match(alerted, /continua válida/);
  assert.equal((await api(`/orders/${order2.id}`)).data.fiscal_docs[0].alert, alerted);
});

test('emissão automática ao concluir a venda de balcão (e não para pedidos antigos)', async () => {
  await api('/fiscal/config', { method: 'PUT', body: { auto_emit: true, auto_channels: ['pdv'] } });
  const v = variantOf(/^Cookie/);
  const order = await sale({ items: [{ variant_id: v.id, qty: 1 }], payments: [{ method: 'dinheiro', amount_cents: v.price_cents }] });
  const doc = await waitFor(async () => (await api(`/orders/${order.id}`)).data.fiscal_docs.find((d) => d.status === 'autorizado'));
  assert.ok(doc.number);

  // entrega: emite quando sai para entrega (a nota acompanha o pedido)
  const ent = await sale({ items: [{ variant_id: v.id, qty: 1 }], type: 'entrega', status: 'pronto', fee: 1200, payments: [], extra: { payment_method: 'dinheiro', address: { street: 'Rua A', number: '1' } } });
  assert.equal((await api(`/orders/${ent.id}`)).data.fiscal_docs.length, 0);
  await api(`/orders/${ent.id}/status`, { method: 'POST', body: { status: 'entrega' } });
  await waitFor(async () => (await api(`/orders/${ent.id}`)).data.fiscal_docs.find((d) => d.status === 'autorizado'));
  const sent = emits().at(-1).body;
  assert.equal(sent.presenca_comprador, '4');
  assert.equal(sent.formas_pagamento[0].forma_pagamento, '01');
  // entregador da loja: a taxa de entrega entra como "outras despesas" nos itens
  assert.equal(Math.round(sent.items.reduce((s, i) => s + (i.valor_outras_despesas || 0), 0) * 100), 1200);
  await api('/fiscal/config', { method: 'PUT', body: { auto_emit: false } });
});

test('arquivo do contador: XMLs + resumo num .zip válido', async () => {
  const r = await api('/fiscal/export.zip?environment=homologacao');
  assert.equal(r.status, 200);
  assert.equal(r.type, 'application/zip');
  const zip = r.data;
  assert.equal(zip.readUInt32LE(0), 0x04034b50);
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = zip.readUInt16LE(eocd + 10);
  // nomes no diretório central e CRC de cada arquivo conferem
  const { crc32 } = await import('../fiscal/zip.js');
  let p = zip.readUInt32LE(eocd + 16);
  const names = [];
  for (let k = 0; k < count; k++) {
    const crc = zip.readUInt32LE(p + 16);
    const size = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const offset = zip.readUInt32LE(p + 42);
    const name = zip.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    const localNameLen = zip.readUInt16LE(offset + 26);
    const data = zip.subarray(offset + 30 + localNameLen, offset + 30 + localNameLen + size);
    assert.equal(crc32(data), crc, `CRC de ${name}`);
    names.push(name);
    p += 46 + nameLen;
  }
  assert.equal(names[0], 'resumo.csv');
  assert.ok(names.filter((n) => n.endsWith('-nfce.xml')).length >= 6, names.join(', '));
  assert.ok(names.some((n) => n.endsWith('-cancelamento.xml')));
  const empty = await api('/fiscal/export.zip?environment=producao');
  assert.equal(empty.status, 200);
});

test('modo treinamento e permissões do caixa', async () => {
  await api('/fiscal/config', { method: 'PUT', body: { provider: 'simulado' } });
  const v = variantOf(/^Cookie/);
  const order = await sale({ items: [{ variant_id: v.id, qty: 1 }], payments: [{ method: 'pix', amount_cents: v.price_cents }] });
  const before = calls.length;
  const doc = (await api(`/fiscal/orders/${order.id}/emit`, { method: 'POST', body: {} })).data.doc;
  assert.equal(doc.status, 'autorizado');
  assert.equal(doc.environment, 'simulado');
  assert.equal(doc.series, 'TREINO');
  assert.match(doc.message, /sem valor fiscal/);
  assert.equal(calls.length, before, 'treinamento não fala com o emissor');
  const full = (await api(`/fiscal/docs/${doc.id}`)).data;
  assert.equal(full.payload.items[0].codigo_ncm, '19053100');
  assert.equal(full.order.id, order.id);

  await api('/users', { method: 'POST', body: { name: 'Caixa', login: 'caixa1', password: 'caixa123', role: 'caixa' } });
  const caixa = (await api('/auth/login', { method: 'POST', body: { login: 'caixa1', password: 'caixa123' }, token: null })).data.token;
  const order2 = await sale({ items: [{ variant_id: v.id, qty: 1 }], payments: [{ method: 'pix', amount_cents: v.price_cents }] });
  const byCaixa = await api(`/fiscal/orders/${order2.id}/emit`, { method: 'POST', body: {}, token: caixa });
  assert.equal(byCaixa.data.doc.status, 'autorizado');
  assert.equal((await api('/fiscal/config', { token: caixa })).status, 403);
  assert.equal((await api(`/fiscal/docs/${byCaixa.data.doc.id}/cancel`, { method: 'POST', body: { reason: 'Teste de cancelamento pelo caixa' }, token: caixa })).status, 403);
  const cancel = await api(`/fiscal/docs/${byCaixa.data.doc.id}/cancel`, { method: 'POST', body: { reason: 'Cliente pediu para refazer a nota' } });
  assert.equal(cancel.data.status, 'cancelado');
  assert.equal((await api('/settings', { token: caixa })).data.fiscal.provider, 'simulado');
});
