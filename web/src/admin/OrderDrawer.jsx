import { useEffect, useState } from 'react';
import { Printer, MessageCircle, XCircle, Phone, MapPin, CreditCard, Bike, CalendarClock } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, dateTimeBR, phone, addressLine, itemLine, waLink, methodLabel, TYPE, CHANNEL, STATUS } from '../lib/format.js';
import { Button, Field, Modal, Select, StatusBadge, Textarea, MoneyInput, useToast, ErrorBox } from '../components/ui.jsx';
import { useAuth, useSettings, canAccess } from './AdminApp.jsx';

/** Próxima ação principal de acordo com o status */
export function nextAction(o) {
  switch (o.status) {
    case 'novo': return o.scheduled_for ? { status: 'confirmado', label: 'Confirmar encomenda' } : { status: 'preparo', label: 'Aceitar e preparar' };
    case 'confirmado': return { status: 'preparo', label: 'Iniciar preparo' };
    case 'preparo': return { status: 'pronto', label: 'Marcar como pronto' };
    case 'pronto': return o.type === 'entrega' ? { status: 'entrega', label: 'Saiu para entrega' } : { status: 'concluido', label: o.type === 'retirada' ? 'Cliente retirou' : 'Concluir' };
    case 'entrega': return { status: 'concluido', label: 'Entregue' };
    default: return null;
  }
}

export function customerMessage(o, storeName = 'Laços de Mãe') {
  const first = (o.customer_name || '').split(' ')[0] || '';
  const link = `${window.location.origin}/pedido/${o.code}`;
  const msgs = {
    novo: `Olá ${first}! Recebemos seu pedido #${o.id} 🎀`,
    confirmado: `Olá ${first}! Sua encomenda #${o.id} está confirmada para ${dateTimeBR(o.scheduled_for)} 🎂`,
    preparo: `Olá ${first}! Seu pedido #${o.id} foi aceito e já está sendo preparado com muito carinho 🎀`,
    pronto: o.type === 'entrega' ? `Olá ${first}! Seu pedido #${o.id} está pronto e logo sai para entrega 🛵` : `Olá ${first}! Seu pedido #${o.id} está pronto para retirada 🎀`,
    entrega: `Olá ${first}! Seu pedido #${o.id} saiu para entrega 🛵`,
    concluido: `Obrigada pela preferência, ${first}! Esperamos que goste 💖 — ${storeName}`,
    cancelado: `Olá ${first}, infelizmente seu pedido #${o.id} foi cancelado.${o.cancel_reason ? ` Motivo: ${o.cancel_reason}` : ''}`,
  };
  return `${msgs[o.status] || ''}\nAcompanhe: ${link}`;
}

export default function OrderDrawer({ id, onClose, onChange }) {
  const { data: o, reload, setData } = useApi(id ? `/orders/${id}` : null, [id]);
  const { settings } = useSettings();
  const { user } = useAuth();
  const toast = useToast();
  const couriers = useApi(canAccess(user, 'pedidos') ? '/couriers' : null);
  const [busy, setBusy] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => setErr(''), [id]);
  if (!id) return null;
  const methods = settings?.payment_methods || [];

  const change = async (status, extra = {}) => {
    setBusy(true);
    setErr('');
    try {
      const r = await api.post(`/orders/${id}/status`, { status, ...extra });
      setData(r);
      onChange?.(r);
      toast(`Pedido #${id}: ${STATUS[status].label}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const patch = async (body) => {
    try {
      const r = await api.patch(`/orders/${id}`, body);
      setData(r);
      onChange?.(r);
    } catch (e) {
      setErr(e.message);
    }
  };

  const next = o && nextAction(o);
  const paid = o?.payments.reduce((s, p) => s + p.amount_cents, 0) || 0;

  return (
    <Modal open onClose={onClose} size="lg" title={o ? <span className="flex items-center gap-2">Pedido #{o.id} <StatusBadge status={o.status} /></span> : 'Pedido'}
      footer={o && (
        <>
          <a href={`/admin/imprimir/${o.id}`} target="_blank" rel="noreferrer"><Button variant="secondary" icon={Printer}>Imprimir</Button></a>
          {o.customer_phone && (
            <a href={waLink(o.customer_phone, customerMessage(o, settings?.store?.name))} target="_blank" rel="noreferrer">
              <Button variant="secondary" icon={MessageCircle}>WhatsApp</Button>
            </a>
          )}
          {!['cancelado'].includes(o.status) && (o.status !== 'concluido' || ['admin', 'gerente'].includes(user.role)) && user.role !== 'cozinha' && (
            <Button variant="ghost" className="text-red-600" icon={XCircle} onClick={() => setCancelOpen(true)}>Cancelar</Button>
          )}
          {next && (user.role !== 'cozinha' || ['confirmado', 'preparo', 'pronto'].includes(next.status)) && (
            <Button loading={busy} onClick={() => change(next.status)}>{next.label}</Button>
          )}
        </>
      )}
    >
      {!o ? <p className="py-10 text-center text-stone-400">Carregando…</p> : (
        <div className="space-y-4 text-sm">
          <ErrorBox>{err}</ErrorBox>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-base font-semibold">{o.customer_name || 'Cliente balcão'}</p>
              {o.customer_phone && <p className="flex items-center gap-1.5 text-stone-600"><Phone className="size-4" /> {phone(o.customer_phone)}</p>}
              <p className="text-stone-500">{CHANNEL[o.channel]} · {TYPE[o.type]} · {dateTimeBR(o.created_at)}</p>
            </div>
            <div className="space-y-1">
              {o.scheduled_for && <p className="flex items-center gap-1.5 rounded-lg bg-brand-50 px-2 py-1 font-medium text-brand-800"><CalendarClock className="size-4" /> Encomenda: {dateTimeBR(o.scheduled_for)}</p>}
              {o.type === 'entrega' && (
                <a className="flex items-start gap-1.5 text-stone-700 hover:text-brand-700" target="_blank" rel="noreferrer" href={`https://maps.google.com/?q=${encodeURIComponent(addressLine(o.address) + ', São Paulo - SP')}`}>
                  <MapPin className="mt-0.5 size-4 shrink-0" /> <span>{addressLine(o.address)}{o.address?.reference && <span className="block text-xs text-stone-500">Ref.: {o.address.reference}</span>}</span>
                </a>
              )}
              <p className="flex items-center gap-1.5 text-stone-700"><CreditCard className="size-4" /> {methodLabel(methods, o.payment_method)}{o.change_for_cents ? ` · troco p/ ${brl(o.change_for_cents)} (levar ${brl(o.change_for_cents - o.total_cents)})` : ''}</p>
              <p className={o.paid ? 'font-medium text-emerald-700' : 'font-medium text-amber-700'}>{o.paid ? 'Pago' : paid > 0 ? `Pago parcial: ${brl(paid)}` : 'A receber'}</p>
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-stone-200">
            <ul className="divide-y divide-stone-100">
              {o.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-3 px-3 py-2">
                  <span>
                    <b>{i.qty}x</b> {i.name}{i.variant_name && <span className="text-stone-500"> · {i.variant_name}</span>}
                    {i.options?.length > 0 && <span className="block text-xs text-stone-500">{i.options.map((x) => x.name).join(', ')}</span>}
                    {i.notes && <span className="block text-xs font-medium text-brand-700">Obs.: {i.notes}</span>}
                  </span>
                  <span className="shrink-0">{brl(i.total_cents)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-0.5 border-t border-stone-100 px-3 py-2">
              <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{brl(o.subtotal_cents)}</span></div>
              {o.delivery_fee_cents > 0 && <div className="flex justify-between text-stone-600"><span>Entrega</span><span>{brl(o.delivery_fee_cents)}</span></div>}
              {o.discount_cents > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto{o.coupon_code ? ` (${o.coupon_code})` : ''}</span><span>− {brl(o.discount_cents)}</span></div>}
              <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{brl(o.total_cents)}</span></div>
              {canAccess(user, 'financeiro') && o.cost_cents > 0 && <div className="flex justify-between text-xs text-stone-400"><span>Custo estimado (CMV)</span><span>{brl(o.cost_cents)}</span></div>}
            </div>
          </div>

          {o.notes && <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900"><b>Obs. do pedido:</b> {o.notes}</p>}
          {o.cancel_reason && <p className="rounded-xl bg-red-50 px-3 py-2 text-red-800"><b>Cancelado:</b> {o.cancel_reason}</p>}

          {user.role !== 'cozinha' && o.status !== 'cancelado' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {o.type === 'entrega' && (
                <Field label={<span className="flex items-center gap-1"><Bike className="size-4" /> Entregador</span>}>
                  <Select value={o.courier_id || ''} onChange={(e) => patch({ courier_id: e.target.value || null })}>
                    <option value="">— sem entregador —</option>
                    {(couriers.data || []).map((c) => <option key={c.id} value={c.id}>{c.name}{c.on_route ? ` (${c.on_route} em rota)` : ''}</option>)}
                  </Select>
                </Field>
              )}
              {!o.paid && (
                <div className="flex items-end">
                  <Button variant="secondary" className="w-full" icon={CreditCard} onClick={() => setPayOpen(true)}>Registrar pagamento</Button>
                </div>
              )}
            </div>
          )}

          {o.payments.length > 0 && (
            <div>
              <p className="mb-1 font-medium text-stone-700">Pagamentos</p>
              {o.payments.map((p) => (
                <p key={p.id} className="flex justify-between text-stone-600"><span>{methodLabel(methods, p.method)} · {dateTimeBR(p.created_at)}</span><span>{brl(p.amount_cents)}</span></p>
              ))}
            </div>
          )}

          <details className="text-stone-500">
            <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide">Histórico</summary>
            <ul className="mt-2 space-y-1 text-xs">
              {o.events.map((e) => <li key={e.id}>{dateTimeBR(e.created_at)} — {STATUS[e.status]?.label}{e.user_name ? ` por ${e.user_name}` : ''}{e.note ? ` (${e.note})` : ''}</li>)}
            </ul>
          </details>
        </div>
      )}

      <CancelModal open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={async (reason) => { setCancelOpen(false); await change('cancelado', { reason }); }} />
      {o && <PaymentModal open={payOpen} order={o} methods={methods} onClose={() => setPayOpen(false)} onDone={(r) => { setData(r); onChange?.(r); reload(); setPayOpen(false); }} />}
    </Modal>
  );
}

function CancelModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Cancelar pedido" footer={
      <>
        <Button variant="ghost" onClick={onClose}>Voltar</Button>
        <Button variant="danger" onClick={() => onConfirm(reason)}>Cancelar pedido</Button>
      </>
    }>
      <p className="mb-3 text-sm text-stone-600">O estoque usado volta automaticamente. Informe o motivo (o cliente verá na página do pedido).</p>
      <Select value={reason} onChange={(e) => setReason(e.target.value)} className="mb-2">
        <option value="">Selecione…</option>
        <option>Cliente desistiu</option>
        <option>Produto em falta</option>
        <option>Fora da área de entrega</option>
        <option>Não conseguimos contato com o cliente</option>
        <option>Pedido duplicado</option>
      </Select>
      <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ou escreva o motivo" />
    </Modal>
  );
}

export function PaymentModal({ open, order, methods, onClose, onDone }) {
  const remaining = order.total_cents - order.payments.reduce((s, p) => s + p.amount_cents, 0);
  const [method, setMethod] = useState(order.payment_method || 'pix');
  const [amount, setAmount] = useState(remaining);
  const [err, setErr] = useState('');
  useEffect(() => setAmount(remaining), [remaining, open]);
  const save = async () => {
    try {
      onDone(await api.post(`/orders/${order.id}/payments`, { payments: [{ method, amount_cents: amount }] }));
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open={open} onClose={onClose} size="sm" title="Registrar pagamento" footer={<Button onClick={save}>Confirmar</Button>}>
      <div className="space-y-3">
        <Field label="Forma"><Select value={method} onChange={(e) => setMethod(e.target.value)}>{methods.filter((m) => m.active).map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</Select></Field>
        <Field label="Valor" hint={`Falta receber ${brl(remaining)}`}><MoneyInput value={amount} onChange={setAmount} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

