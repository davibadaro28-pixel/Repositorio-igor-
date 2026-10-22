// Emissão de NFC-e dos pedidos: monta a nota, envia ao emissor, guarda o retorno e reage às mudanças do pedido
// (emissão automática ao sair para entrega/concluir e cancelamento da nota quando o pedido é cancelado).
import { randomBytes } from 'node:crypto';
import { all, get, run, now, getSetting, setSetting } from '../db.js';
import { fail } from '../auth.js';
import { broadcast } from '../realtime.js';
import { getOrder, onOrderCreated, onStatusChange, paymentMethods } from '../services/orders.js';
import { DEFAULT_FISCAL } from '../seed.js';
import { buildNfce, cleanDoc } from './nfce.js';
import * as focusnfe from './focusnfe.js';
import * as simulado from './simulado.js';

export const PROVIDERS = { focusnfe, simulado };
const SYSTEM_USER = { id: null, role: 'admin', name: 'Sistema' };

export function fiscalConfig() {
  const saved = getSetting('fiscal', {}) || {};
  return {
    ...DEFAULT_FISCAL,
    ...saved,
    payment_codes: { ...DEFAULT_FISCAL.payment_codes, ...(saved.payment_codes || {}) },
    intermediarios: {
      ifood: { ...DEFAULT_FISCAL.intermediarios.ifood, ...(saved.intermediarios?.ifood || {}) },
      '99food': { ...DEFAULT_FISCAL.intermediarios['99food'], ...(saved.intermediarios?.['99food'] || {}) },
    },
  };
}

export const environmentOf = (cfg) => (cfg.provider === 'simulado' ? 'simulado' : cfg.ambiente === 'producao' ? 'producao' : 'homologacao');

/** Configuração usada para falar de uma nota já emitida (pode ser de outro ambiente que o atual) */
function cfgForDoc(doc) {
  const cfg = fiscalConfig();
  if (doc.provider === 'simulado') return { ...cfg, provider: 'simulado' };
  return { ...cfg, provider: doc.provider, ambiente: doc.environment };
}

// prefixo único desta instalação: evita repetir referências se o banco for recriado com o mesmo token
function refPrefix() {
  let p = getSetting('fiscal_ref_prefix');
  if (!p) {
    p = 'L' + randomBytes(3).toString('hex').toUpperCase();
    setSetting('fiscal_ref_prefix', p);
  }
  return p;
}

export const getDoc = (id) => get(
  `SELECT f.*, o.customer_name, o.channel, o.type, o.external_code, o.status AS order_status FROM fiscal_docs f
   JOIN orders o ON o.id = f.order_id WHERE f.id = ?`, id,
);

const DOC_FIELDS = ['status', 'number', 'series', 'access_key', 'message', 'alert', 'danfe_url', 'xml_url', 'qrcode_url', 'consult_url',
  'contingency', 'xml', 'cancel_xml_url', 'cancel_xml', 'cancel_reason', 'cancelled_at'];

function saveResult(docId, result) {
  const doc = get('SELECT * FROM fiscal_docs WHERE id = ?', docId);
  const t = now();
  const sets = [];
  const vals = [];
  for (const f of DOC_FIELDS) {
    if (result[f] === undefined) continue;
    sets.push(`${f} = ?`);
    vals.push(result[f]);
  }
  if (result.status === 'autorizado' && !doc.issued_at) { sets.push('issued_at = ?'); vals.push(t); }
  sets.push('updated_at = ?');
  vals.push(t, docId);
  run(`UPDATE fiscal_docs SET ${sets.join(', ')} WHERE id = ?`, ...vals);
  const fresh = get('SELECT * FROM fiscal_docs WHERE id = ?', docId);
  broadcast('order', { id: fresh.order_id, fiscal: fresh.status });
  if (fresh.status === 'autorizado' && fresh.xml_url && !fresh.xml) fetchXml(fresh);
  if (fresh.status === 'cancelado' && fresh.cancel_xml_url && !fresh.cancel_xml) fetchXml(fresh, true);
  return fresh;
}

// cópia do XML para o contador (sem pressa: se falhar, tenta de novo na exportação)
async function fetchXml(doc, cancel = false) {
  const p = PROVIDERS[doc.provider];
  if (!p.download) return;
  try {
    const xml = await p.download(cfgForDoc(doc), cancel ? doc.cancel_xml_url : doc.xml_url);
    run(`UPDATE fiscal_docs SET ${cancel ? 'cancel_xml' : 'xml'} = ? WHERE id = ?`, xml, doc.id);
  } catch (e) {
    console.error(`[NFC-e] XML da nota ${doc.id}:`, e.message);
  }
}

// nota sem resposta definitiva: consulta de novo em 15 s, 1 min e 3 min
const syncTimers = new Map();
function scheduleSync(docId, attempt = 0) {
  const delays = [15e3, 60e3, 180e3];
  if (attempt >= delays.length || syncTimers.has(docId)) return;
  const timer = setTimeout(async () => {
    syncTimers.delete(docId);
    const doc = await syncDoc(docId).catch(() => null);
    if (doc?.status === 'processando') scheduleSync(docId, attempt + 1);
  }, delays[attempt]);
  timer.unref?.();
  syncTimers.set(docId, timer);
}

/**
 * Emite a NFC-e do pedido. Problemas de cadastro (NCM, pagamento…) ficam registrados na nota como "rejeitada"
 * para aparecerem no painel; o erro só é lançado quando a emissão nem pode começar.
 */
export async function emitForOrder(orderId, { user = SYSTEM_USER, customerDoc } = {}) {
  const cfg = fiscalConfig();
  if (!cfg.enabled) fail(400, 'Ative a emissão de NFC-e em Notas fiscais → Configuração');
  const order = getOrder(orderId);
  if (!order) fail(404, 'Pedido não encontrado');
  if (order.status === 'cancelado') fail(400, 'Pedido cancelado não pode ter nota fiscal');
  if (customerDoc !== undefined) {
    order.customer_doc = cleanDoc(customerDoc);
    run('UPDATE orders SET customer_doc = ? WHERE id = ?', order.customer_doc, orderId);
  }
  const env = environmentOf(cfg);
  const docs = all('SELECT * FROM fiscal_docs WHERE order_id = ? AND environment = ? ORDER BY id DESC', orderId, env);
  const active = docs.find((d) => d.status === 'autorizado' || d.status === 'processando');
  if (active) fail(400, active.status === 'autorizado' ? 'Este pedido já tem NFC-e autorizada' : 'A nota deste pedido ainda está sendo processada');

  const { payload, problems } = buildNfce(order, cfg, { methods: paymentMethods(), integrations: getSetting('integrations', {}) });
  const t = now();
  // nota rejeitada antes é reenviada com a mesma referência (a Focus permite depois de corrigir os dados)
  let doc = docs.find((d) => d.status === 'rejeitado');
  if (!doc) {
    const n = get('SELECT COUNT(*) AS n FROM fiscal_docs WHERE order_id = ?', orderId).n + 1;
    const x = run(
      `INSERT INTO fiscal_docs (order_id, provider, environment, ref, status, total_cents, user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'processando', ?, ?, ?, ?)`,
      orderId, cfg.provider, env, `${refPrefix()}P${orderId}N${n}`, order.total_cents, user?.id || null, t, t,
    );
    doc = get('SELECT * FROM fiscal_docs WHERE id = ?', x.lastInsertRowid);
  }
  run(`UPDATE fiscal_docs SET status = 'processando', provider = ?, payload = ?, total_cents = ?, customer_doc = ?, message = NULL, user_id = ?, updated_at = ? WHERE id = ?`,
    cfg.provider, JSON.stringify(payload), order.total_cents, order.customer_doc || null, user?.id || null, t, doc.id);

  if (problems.length) return saveResult(doc.id, { status: 'rejeitado', message: `Não enviada: ${problems.join(' ')}` });

  broadcast('order', { id: orderId, fiscal: 'processando' });
  let result;
  try {
    result = await PROVIDERS[cfg.provider].emit(cfg, doc.ref, payload);
  } catch (e) {
    result = { status: 'processando', message: `Falha ao enviar: ${e.message}` };
  }
  const saved = saveResult(doc.id, result);
  if (saved.status === 'processando') scheduleSync(saved.id);
  return saved;
}

/** Consulta a situação da nota no emissor */
export async function syncDoc(docId) {
  const doc = get('SELECT * FROM fiscal_docs WHERE id = ?', docId);
  if (!doc) fail(404, 'Nota não encontrada');
  const result = await PROVIDERS[doc.provider].consult(cfgForDoc(doc), doc.ref);
  return saveResult(doc.id, result);
}

export async function cancelDoc(docId, reason) {
  const doc = get('SELECT * FROM fiscal_docs WHERE id = ?', docId);
  if (!doc) fail(404, 'Nota não encontrada');
  if (doc.status !== 'autorizado') fail(400, 'Só é possível cancelar nota autorizada');
  const justificativa = String(reason || '').trim().replace(/\s+/g, ' ').slice(0, 255);
  if (justificativa.length < 15) fail(400, 'Explique o motivo do cancelamento com pelo menos 15 letras');
  // a NFC-e pode ser cancelada em até 30 minutos (a SEFAZ confere; no modo treinamento a regra é a mesma)
  if (doc.provider === 'simulado' && doc.issued_at && Date.parse(now().replace(' ', 'T')) - Date.parse(doc.issued_at.replace(' ', 'T')) > 30 * 60e3) {
    fail(400, 'Prazo de cancelamento encerrado: a NFC-e só pode ser cancelada até 30 minutos depois de emitida.');
  }
  let result;
  try {
    result = await PROVIDERS[doc.provider].cancel(cfgForDoc(doc), doc.ref, justificativa);
  } catch (e) {
    fail(400, `A SEFAZ não aceitou o cancelamento: ${e.message}`);
  }
  return saveResult(doc.id, { ...result, alert: null, cancel_reason: justificativa, cancelled_at: now() });
}

// ---------- Emissão e cancelamento automáticos ----------

const minutesAgo = (ts) => (Date.parse(now().replace(' ', 'T')) - Date.parse(String(ts).replace(' ', 'T'))) / 60e3;

async function onOrderChange(snapshot, status) {
  const cfg = fiscalConfig();
  if (!cfg.enabled) return;
  // o aviso chega depois da mudança: vale o pedido como está agora (pode ter mudado de novo)
  const order = get('SELECT * FROM orders WHERE id = ?', snapshot.id);
  if (!order || order.status !== status) return;
  if (status === 'cancelado') {
    const doc = get(`SELECT * FROM fiscal_docs WHERE order_id = ? AND status = 'autorizado' ORDER BY id DESC LIMIT 1`, order.id);
    if (!doc) return;
    try {
      await cancelDoc(doc.id, `Cancelamento do pedido #${order.id}: ${order.cancel_reason || 'venda desfeita a pedido do cliente'}`);
    } catch (e) {
      saveResult(doc.id, { alert: `Pedido cancelado, mas a NFC-e continua válida (${e.message}). Fale com o contador sobre a nota de devolução.` });
    }
    return;
  }
  if (!cfg.auto_emit || !(cfg.auto_channels || []).includes(order.channel)) return;
  // entrega: a nota acompanha o pedido; balcão/retirada: na conclusão
  if (status !== 'concluido' && !(status === 'entrega' && order.type === 'entrega')) return;
  const at = status === 'entrega' ? order.dispatched_at : order.completed_at;
  if (!at || minutesAgo(at) > 15) return; // só eventos de agora (importações e dados antigos não emitem)
  if (get('SELECT 1 FROM fiscal_docs WHERE order_id = ? AND environment = ? LIMIT 1', order.id, environmentOf(cfg))) return;
  await emitForOrder(order.id);
}

const safely = (fn) => (...args) => fn(...args).catch((e) => console.error('[NFC-e] automática:', e.message));
onStatusChange(safely((order, status) => onOrderChange(order, status)));
onOrderCreated(safely((order) => onOrderChange(order, order.status)));
