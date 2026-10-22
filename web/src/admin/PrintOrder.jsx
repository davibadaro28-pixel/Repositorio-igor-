import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IS_PREVIEW } from '../lib/env.js';
import { useApi } from '../lib/api.js';
import { brl, dateTimeBR, phone, addressLine, methodLabel, TYPE, CHANNEL } from '../lib/format.js';
import { useSettings } from './AdminApp.jsx';

/** Comanda / cupom não fiscal para impressora térmica 80 mm */
export default function PrintOrder() {
  const { id } = useParams();
  const { data: o } = useApi(`/orders/${id}`);
  const { settings } = useSettings();
  const navigate = useNavigate();
  const store = settings?.store;

  useEffect(() => {
    if (o && store && !IS_PREVIEW) setTimeout(() => window.print(), 300);
  }, [o, store]);

  if (!o || !store) return <p className="p-4 text-sm">Preparando impressão…</p>;
  const methods = settings.payment_methods;
  const line = <div className="my-1.5 border-t border-dashed border-black" />;

  return (
    <div className="min-h-dvh bg-stone-200 py-6 print:bg-white print:py-0">
      <div className="print-area mx-auto w-[76mm] bg-white p-2 font-mono text-[12px] leading-tight text-black shadow print:shadow-none">
        <div className="text-center">
          <p className="text-[15px] font-bold">{store.name.toUpperCase()}</p>
          <p>{store.tagline}</p>
          <p className="text-[10px]">{store.address}</p>
          <p className="text-[10px]">{store.phone}</p>
        </div>
        {line}
        <p className="text-center text-[18px] font-bold">PEDIDO #{o.id}</p>
        <p className="text-center font-bold">{TYPE[o.type].toUpperCase()} · {CHANNEL[o.channel]}{o.external_code ? ` #${o.external_code}` : ''}</p>
        {o.external_platform && o.external_delivered_by === 'platform' && o.type === 'entrega' && <p className="text-center">Entrega pelo {CHANNEL[o.external_platform]}</p>}
        <p className="text-center">{dateTimeBR(o.created_at)}</p>
        {o.scheduled_for && <p className="mt-1 border border-black p-1 text-center font-bold">ENCOMENDA PARA {dateTimeBR(o.scheduled_for)}</p>}
        {line}
        {o.customer_name && <p><b>Cliente:</b> {o.customer_name}</p>}
        {o.customer_phone && <p><b>Tel:</b> {phone(o.customer_phone)}</p>}
        {o.type === 'entrega' && (
          <>
            <p><b>End.:</b> {addressLine(o.address)}</p>
            {o.address?.reference && <p><b>Ref.:</b> {o.address.reference}</p>}
          </>
        )}
        {line}
        {o.items.map((i) => (
          <div key={i.id} className="mb-1">
            <div className="flex justify-between gap-2">
              <span><b>{i.qty}x</b> {i.name}{i.variant_name ? ` (${i.variant_name})` : ''}</span>
              <span className="shrink-0">{brl(i.total_cents)}</span>
            </div>
            {i.options?.map((x) => <p key={x.name} className="pl-3">+ {x.name}</p>)}
            {i.notes && <p className="pl-3 font-bold">OBS: {i.notes}</p>}
          </div>
        ))}
        {line}
        <div className="flex justify-between"><span>Subtotal</span><span>{brl(o.subtotal_cents)}</span></div>
        {o.delivery_fee_cents > 0 && <div className="flex justify-between"><span>Entrega</span><span>{brl(o.delivery_fee_cents)}</span></div>}
        {o.discount_cents > 0 && <div className="flex justify-between"><span>Desconto</span><span>-{brl(o.discount_cents)}</span></div>}
        <div className="flex justify-between text-[15px] font-bold"><span>TOTAL</span><span>{brl(o.total_cents)}</span></div>
        {line}
        <p><b>Pagamento:</b> {o.payments.length ? o.payments.map((p) => `${methodLabel(methods, p.method)} ${brl(p.amount_cents)}`).join(' + ') : methodLabel(methods, o.payment_method)}</p>
        <p className="font-bold">{o.paid ? 'PAGO' : 'A RECEBER'}</p>
        {o.change_for_cents ? <p><b>Troco para:</b> {brl(o.change_for_cents)} (levar {brl(o.change_for_cents - o.total_cents)})</p> : null}
        {o.notes && <p className="mt-1 font-bold">OBS: {o.notes}</p>}
        {line}
        <p className="text-center text-[10px]">Documento sem valor fiscal</p>
        <p className="text-center">Obrigada pela preferência! 🎀</p>
        <p className="text-center text-[10px]">@{store.instagram}</p>
      </div>
      {IS_PREVIEW ? (
        <div className="mt-4 text-center print:hidden">
          <p className="mb-2 text-sm text-stone-500">No sistema instalado esta comanda vai direto para a impressora térmica.</p>
          <button onClick={() => navigate(-1)} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white">Voltar</button>
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-stone-500 print:hidden">Se a impressão não abriu, use Ctrl+P.</p>
      )}
    </div>
  );
}
