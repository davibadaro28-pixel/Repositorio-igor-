import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, FileText, RefreshCw, XCircle, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { newTab } from '../lib/env.js';
import { brl, dateTimeBR, parseSP } from '../lib/format.js';
import { Button, Field, Input, Modal, Textarea, ErrorBox, cx, useToast } from '../components/ui.jsx';
import { useAuth, useLive, useSettings, canAccess } from './AdminApp.jsx';

export const FISCAL_STATUS = {
  autorizado: { label: 'NFC-e autorizada', color: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  processando: { label: 'NFC-e enviando…', color: 'bg-sky-50 text-sky-800 ring-sky-200' },
  rejeitado: { label: 'NFC-e com erro', color: 'bg-red-50 text-red-700 ring-red-200' },
  cancelado: { label: 'NFC-e cancelada', color: 'bg-stone-100 text-stone-600 ring-stone-200' },
  denegado: { label: 'NFC-e denegada', color: 'bg-red-50 text-red-700 ring-red-200' },
};

export const ENV_LABEL = { simulado: 'Treinamento – sem valor fiscal', homologacao: 'Homologação – sem valor fiscal', producao: 'Produção' };
export const currentEnv = (f) => (!f ? null : f.provider === 'simulado' ? 'simulado' : f.ambiente === 'producao' ? 'producao' : 'homologacao');

export function formatDoc(d) {
  const s = String(d || '').replace(/\D/g, '');
  if (s.length === 11) return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9)}`;
  if (s.length === 14) return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}/${s.slice(8, 12)}-${s.slice(12)}`;
  return d || '';
}

/** Máscara de CPF (até 11 dígitos) ou CNPJ (12 a 14) enquanto digita */
export function maskDoc(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) return d.replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})(\d{0,2})$/, (_, a, b, c, e, f) => `${a}.${b}.${c}/${e}${f ? `-${f}` : ''}`);
}

/** Botão do DANFE: a Focus NFe hospeda o DANFE oficial; no treinamento o sistema mostra uma simulação */
export function DanfeButton({ doc, size = 'sm' }) {
  if (doc.provider === 'focusnfe' && doc.danfe_url) {
    return <a href={doc.danfe_url} target="_blank" rel="noreferrer"><Button size={size} variant="secondary" icon={FileText}>DANFE</Button></a>;
  }
  return <Link to={`/admin/nota/${doc.id}`} {...newTab}><Button size={size} variant="secondary" icon={FileText}>DANFE</Button></Link>;
}

const minutesSinceIssue = (doc) => (doc.issued_at ? (Date.now() - parseSP(doc.issued_at).getTime()) / 60e3 : 0);
/** A SEFAZ aceita cancelar a NFC-e até 30 minutos depois da emissão */
export const canCancelNow = (doc) => minutesSinceIssue(doc) <= 30;

/** Nota fiscal do pedido: emitir, imprimir, consultar e cancelar (no pedido e no PDV) */
export default function FiscalBox({ orderId, compact }) {
  const { tick } = useLive();
  const { settings } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const { data: o, reload } = useApi(`/orders/${orderId}`, [orderId, tick]);
  const [emitOpen, setEmitOpen] = useState(false);
  const [cancelDoc, setCancelDoc] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fiscal = settings?.fiscal;
  const env = currentEnv(fiscal);
  const docs = (o?.fiscal_docs || []).filter((d) => d.environment === env);
  const doc = docs[0];

  // enquanto a SEFAZ não responde, confere de novo a cada 3 s
  useEffect(() => {
    if (doc?.status !== 'processando') return undefined;
    const t = setInterval(reload, 3000);
    return () => clearInterval(t);
  }, [doc?.status, reload]);

  if (!fiscal?.enabled) {
    if (compact || !canAccess(user, 'fiscal')) return null;
    return <p className="text-xs text-stone-400">Nota fiscal desligada. <Link to="/admin/fiscal" className="underline">Ativar NFC-e</Link></p>;
  }
  if (!o) return null;
  const canEmit = o.status !== 'cancelado' && user.role !== 'cozinha' && user.role !== 'entregador';

  const sync = async () => {
    setBusy(true);
    setErr('');
    try {
      await api.post(`/fiscal/docs/${doc.id}/sync`);
      reload();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const tone = !doc ? 'bg-stone-50 ring-stone-200' : FISCAL_STATUS[doc.status].color;
  return (
    <div className={cx('space-y-2 rounded-2xl px-3 py-2.5 text-sm ring-1', tone)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 font-medium">
          {!doc ? <Receipt className="size-4" /> : doc.status === 'processando' ? <Loader2 className="size-4 animate-spin" /> : doc.status === 'autorizado' ? <CheckCircle2 className="size-4" /> : doc.status === 'cancelado' ? <XCircle className="size-4" /> : <AlertTriangle className="size-4" />}
          {!doc ? 'Nota fiscal (NFC-e)' : `${FISCAL_STATUS[doc.status].label}${doc.number ? ` nº ${doc.number}` : ''}${doc.series ? ` · série ${doc.series}` : ''}`}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {!doc && canEmit && <Button size="sm" icon={Receipt} onClick={() => setEmitOpen(true)}>Emitir NFC-e</Button>}
          {doc?.status === 'autorizado' && <DanfeButton doc={doc} />}
          {doc?.status === 'processando' && <Button size="sm" variant="secondary" icon={RefreshCw} loading={busy} onClick={sync}>Consultar</Button>}
          {['rejeitado', 'cancelado', 'denegado'].includes(doc?.status) && canEmit && doc.status !== 'denegado' && (
            <Button size="sm" variant={doc.status === 'rejeitado' ? 'primary' : 'secondary'} icon={Receipt} onClick={() => setEmitOpen(true)}>{doc.status === 'rejeitado' ? 'Emitir de novo' : 'Emitir nova nota'}</Button>
          )}
          {doc?.status === 'autorizado' && canAccess(user, 'fiscal') && canCancelNow(doc) && (
            <Button size="sm" variant="ghost" className="text-red-600" icon={XCircle} onClick={() => setCancelDoc(doc)}>Cancelar nota</Button>
          )}
        </div>
      </div>
      {env !== 'producao' && <p className="text-xs font-medium text-amber-800">{ENV_LABEL[env]}</p>}
      {doc?.status === 'autorizado' && (
        <p className="text-xs opacity-90">
          {dateTimeBR(doc.issued_at)} · {brl(doc.total_cents)}{doc.customer_doc ? ` · CPF/CNPJ ${formatDoc(doc.customer_doc)}` : ''}
          {doc.contingency ? ' · emitida em contingência (será transmitida quando a SEFAZ voltar)' : ''}
          {doc.access_key && <span className="mt-0.5 block break-all font-mono text-[11px] opacity-80">{doc.access_key.replace(/(\d{4})/g, '$1 ').trim()}</span>}
        </p>
      )}
      {doc?.status === 'cancelado' && <p className="text-xs">Cancelada em {dateTimeBR(doc.cancelled_at)}{doc.cancel_reason ? `: ${doc.cancel_reason}` : ''}</p>}
      {['rejeitado', 'denegado', 'processando'].includes(doc?.status) && doc.message && <p className="text-xs">{doc.message}</p>}
      {doc?.alert && <p className="flex items-start gap-1.5 rounded-lg bg-red-100 px-2 py-1.5 text-xs font-medium text-red-800"><AlertTriangle className="mt-px size-3.5 shrink-0" /> {doc.alert}</p>}
      {!doc && !compact && fiscal.auto_emit && o.status !== 'cancelado' && <p className="text-xs text-stone-500">Emissão automática ligada: a nota sai quando o pedido for concluído{o.type === 'entrega' ? ' ou sair para entrega' : ''}.</p>}
      <ErrorBox>{err}</ErrorBox>

      {emitOpen && <EmitModal order={o} onClose={() => setEmitOpen(false)} onDone={(d) => { setEmitOpen(false); reload(); if (d?.status === 'autorizado') toast(`NFC-e nº ${d.number} autorizada`); }} />}
      {cancelDoc && <CancelNoteModal doc={cancelDoc} onClose={() => setCancelDoc(null)} onDone={() => { setCancelDoc(null); reload(); toast('NFC-e cancelada'); }} />}
    </div>
  );
}

function EmitModal({ order, onClose, onDone }) {
  const [doc, setDoc] = useState(formatDoc(order.customer_doc));
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setLoading(true);
    setErr('');
    try {
      const r = await api.post(`/fiscal/orders/${order.id}/emit`, { customer_doc: doc });
      onDone(r.doc);
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={`NFC-e do pedido #${order.id}`} footer={<Button loading={loading} icon={Receipt} onClick={submit}>Emitir {brl(order.total_cents)}</Button>}>
      <div className="space-y-3">
        <Field label="CPF ou CNPJ na nota (opcional)" hint="Deixe em branco se o cliente não quiser.">
          <Input value={doc} inputMode="numeric" placeholder="000.000.000-00" onChange={(e) => setDoc(maskDoc(e.target.value))} autoFocus />
        </Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

export function CancelNoteModal({ doc, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const submit = async () => {
    setLoading(true);
    setErr('');
    try {
      await api.post(`/fiscal/docs/${doc.id}/cancel`, { reason });
      onDone();
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={`Cancelar NFC-e${doc.number ? ` nº ${doc.number}` : ''}`} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Voltar</Button>
        <Button variant="danger" loading={loading} disabled={reason.trim().length < 15} onClick={submit}>Cancelar nota</Button>
      </>
    }>
      <div className="space-y-3 text-sm">
        <p className="text-stone-600">A NFC-e pode ser cancelada em até <b>30 minutos</b> depois de emitida. Depois disso, fale com o contador (pode ser preciso uma nota de devolução).</p>
        <Field label="Motivo (mínimo 15 letras)" hint={`${reason.trim().length}/15`}>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: Cliente desistiu da compra antes de receber" />
        </Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}
