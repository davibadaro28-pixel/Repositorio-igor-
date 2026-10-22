// Emissor Focus NFe (https://doc.focusnfe.com.br): assina o XML com o certificado A1 da loja,
// conversa com a SEFAZ-SP e devolve o DANFE. NFC-e é síncrona: a resposta já vem autorizada ou rejeitada.
// Endereço configurável por FOCUS_API_URL (os testes usam um servidor simulado).
const BASES = { homologacao: 'https://homologacao.focusnfe.com.br', producao: 'https://api.focusnfe.com.br' };

export const baseUrl = (ambiente) => process.env.FOCUS_API_URL || BASES[ambiente] || BASES.homologacao;
const tokenFor = (cfg) => (cfg.ambiente === 'producao' ? cfg.token_producao : cfg.token_homologacao);

async function call(cfg, method, path, body, { timeout = 45e3 } = {}) {
  const token = tokenFor(cfg);
  if (!token) throw Object.assign(new Error(`Informe o token de ${cfg.ambiente === 'producao' ? 'produção' : 'homologação'} da Focus NFe`), { config: true });
  const res = await fetch(`${baseUrl(cfg.ambiente)}/v2${path}`, {
    method,
    headers: { authorization: `Basic ${btoa(`${token}:`)}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeout),
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { mensagem: text.slice(0, 200) };
  }
  return { status: res.status, data: data || {} };
}

const errorText = (d) => [d.mensagem, ...(d.erros || []).map((e) => e.mensagem)].filter(Boolean).join(' · ') || 'Erro desconhecido';

/** Converte a resposta da Focus no que o sistema guarda da nota */
function toDoc(d, base) {
  const out = { message: d.mensagem_sefaz ? `${d.status_sefaz ? `${d.status_sefaz} – ` : ''}${d.mensagem_sefaz}` : null };
  if (d.status === 'autorizado') out.status = 'autorizado';
  else if (d.status === 'cancelado') out.status = 'cancelado';
  else if (d.status === 'denegado') out.status = 'denegado';
  else if (d.status === 'erro_autorizacao') out.status = 'rejeitado';
  else out.status = 'processando';
  if (d.chave_nfe) out.access_key = String(d.chave_nfe).replace(/^NFe/, '');
  if (d.numero) out.number = String(d.numero);
  if (d.serie) out.series = String(d.serie);
  if (d.caminho_danfe) out.danfe_url = base + d.caminho_danfe;
  if (d.caminho_xml_nota_fiscal) out.xml_url = base + d.caminho_xml_nota_fiscal;
  if (d.caminho_xml_cancelamento) out.cancel_xml_url = base + d.caminho_xml_cancelamento;
  if (d.qrcode_url) out.qrcode_url = d.qrcode_url;
  if (d.url_consulta_nf) out.consult_url = d.url_consulta_nf;
  if (d.contingencia_offline) out.contingency = 1;
  return out;
}

export async function emit(cfg, ref, payload) {
  let r;
  try {
    r = await call(cfg, 'POST', `/nfce?ref=${encodeURIComponent(ref)}`, payload);
  } catch (e) {
    if (e.config) return { status: 'rejeitado', message: e.message };
    // sem resposta: a nota pode ter sido autorizada; a situação é confirmada pela consulta
    return { status: 'processando', message: `Sem resposta do emissor (${e.name === 'TimeoutError' ? 'tempo esgotado' : e.message}). Consultando…` };
  }
  const base = baseUrl(cfg.ambiente);
  if (r.status === 200 || r.status === 201) return toDoc(r.data, base);
  if (r.status === 401) return { status: 'rejeitado', message: 'Token da Focus NFe recusado. Confira o token na configuração fiscal.' };
  if (r.data.codigo === 'already_processed' || r.data.codigo === 'pending_operation') return consult(cfg, ref);
  if (r.status === 429) return { status: 'rejeitado', message: 'Muitas notas em pouco tempo. Aguarde 1 minuto e tente de novo.' };
  if (r.status >= 500) return { status: 'processando', message: `Emissor indisponível (HTTP ${r.status}). Consultando…` };
  return { status: 'rejeitado', message: errorText(r.data) };
}

export async function consult(cfg, ref) {
  const r = await call(cfg, 'GET', `/nfce/${encodeURIComponent(ref)}`);
  if (r.status === 404) return { status: 'rejeitado', message: 'A nota não chegou ao emissor. Pode emitir de novo.' };
  if (r.status === 401) throw new Error('Token da Focus NFe recusado');
  if (r.status !== 200) throw new Error(errorText(r.data));
  return toDoc(r.data, baseUrl(cfg.ambiente));
}

export async function cancel(cfg, ref, justificativa) {
  const r = await call(cfg, 'DELETE', `/nfce/${encodeURIComponent(ref)}`, { justificativa });
  if (r.status === 422 && r.data.codigo === 'already_processed') return consult(cfg, ref);
  if (r.status !== 200) throw new Error(errorText(r.data));
  if (r.data.status !== 'cancelado') throw new Error(r.data.mensagem_sefaz || 'A SEFAZ não aceitou o cancelamento');
  return { ...toDoc(r.data, baseUrl(cfg.ambiente)), status: 'cancelado' };
}

/** Baixa o XML (autorização ou cancelamento) para guardar a cópia do contador */
export async function download(cfg, url) {
  const token = tokenFor(cfg);
  const res = await fetch(url, { headers: token ? { authorization: `Basic ${btoa(`${token}:`)}` } : {}, signal: AbortSignal.timeout(30e3) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

/** Uma consulta a uma referência que não existe: 404 = token e empresa ok */
export async function testConnection(cfg) {
  const r = await call(cfg, 'GET', '/nfce/TESTECONEXAO0', null, { timeout: 15e3 });
  if (r.status === 404) return `Conectado à Focus NFe (${cfg.ambiente === 'producao' ? 'produção' : 'homologação'}).`;
  if (r.status === 401) throw new Error('Token recusado pela Focus NFe.');
  if (r.status === 403) throw new Error(errorText(r.data));
  if (r.status === 200) return 'Conectado à Focus NFe.';
  throw new Error(`A Focus NFe respondeu HTTP ${r.status}: ${errorText(r.data)}`);
}
