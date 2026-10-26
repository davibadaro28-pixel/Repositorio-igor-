import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ChefHat, PackageCheck, Bike, Home, ClipboardCheck, MessageCircle, ArrowLeft, XCircle } from 'lucide-react';
import { useApi } from '../lib/api.js';
import { BrandLogo } from '../components/Brand.jsx';
import { brl, dateTimeBR, timeBR, addressLine, itemLine, waLink, TYPE } from '../lib/format.js';
import { Button, Card, Spinner, cx } from '../components/ui.jsx';

function steps(order) {
  const list = [
    { key: 'novo', label: 'Pedido recebido', icon: ClipboardCheck, at: order.created_at },
    { key: 'confirmado', label: 'Confirmado pela loja', icon: CheckCircle2, at: order.confirmed_at },
    { key: 'preparo', label: 'Em preparo', icon: ChefHat, at: null },
    { key: 'pronto', label: order.type === 'entrega' ? 'Pronto, aguardando entregador' : 'Pronto para retirada', icon: PackageCheck, at: order.ready_at },
  ];
  if (order.type === 'entrega') list.push({ key: 'entrega', label: 'Saiu para entrega', icon: Bike, at: order.dispatched_at });
  list.push({ key: 'concluido', label: order.type === 'entrega' ? 'Entregue' : 'Retirado', icon: Home, at: order.completed_at });
  return list;
}

const ORDER = ['novo', 'confirmado', 'preparo', 'pronto', 'entrega', 'concluido'];

export default function Track() {
  const { code } = useParams();
  const [params] = useSearchParams();
  const order = useApi(`/public/orders/${code}`);
  const store = useApi('/public/store');

  useEffect(() => {
    const t = setInterval(() => order.reload(), 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (order.loading && !order.data) return <Spinner className="min-h-dvh" />;
  if (order.error && !order.data) {
    return (
      <div className="p-8 text-center">
        <p className="text-stone-600">Pedido não encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-brand-700 underline">Voltar ao cardápio</Link>
      </div>
    );
  }
  const o = order.data;
  const s = store.data;
  const idx = ORDER.indexOf(o.status);
  const cancelled = o.status === 'cancelado';

  const message = [
    `Olá! Acabei de fazer o pedido *#${o.id}* pelo cardápio digital 🎀`,
    '',
    ...o.items.map((i) => `• ${itemLine(i)} — ${brl(i.total_cents)}`),
    '',
    `*Total: ${brl(o.total_cents)}*`,
    `${TYPE[o.type]}${o.scheduled_for ? ` agendada para ${dateTimeBR(o.scheduled_for)}` : ''}`,
    o.type === 'entrega' ? `Endereço: ${addressLine(o.address)}` : '',
    `Acompanhar: ${window.location.origin}/pedido/${o.code}`,
  ].filter((l) => l !== null).join('\n');

  return (
    <div className="min-h-dvh bg-cream pb-10">
      <header className="bg-gradient-to-b from-brand-700 to-brand-500 px-4 pb-16 pt-6 text-white">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <Link to="/" className="rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label="Voltar"><ArrowLeft className="size-5" /></Link>
          <BrandLogo store={s} className="size-10 text-sm ring-2 ring-white" />
          <div>
            <p className="font-script text-2xl leading-none">{s?.name}</p>
            <p className="text-xs text-white/80">Pedido #{o.id}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-12 max-w-xl space-y-4 px-4">
        {params.get('novo') && !cancelled && (
          <Card className="border-l-4 border-emerald-500 p-4">
            <p className="font-semibold text-emerald-800">Pedido enviado com sucesso! 🎉</p>
            <p className="mt-1 text-sm text-stone-600">A loja já recebeu seu pedido.{s?.whatsapp ? ' Se quiser, envie também uma mensagem no WhatsApp.' : ''}</p>
            {s?.whatsapp && (
              <a href={waLink(s.whatsapp, message)} target="_blank" rel="noreferrer">
                <Button variant="success" className="mt-3 w-full" icon={MessageCircle}>Enviar resumo no WhatsApp</Button>
              </a>
            )}
          </Card>
        )}

        <Card className="p-5">
          {cancelled ? (
            <div className="flex items-start gap-3 text-red-700">
              <XCircle className="size-6 shrink-0" />
              <div>
                <p className="font-semibold">Pedido cancelado</p>
                {o.cancel_reason && <p className="text-sm">{o.cancel_reason}</p>}
              </div>
            </div>
          ) : (
            <>
              {o.scheduled_for && (
                <p className="mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  Encomenda para <b>{dateTimeBR(o.scheduled_for)}</b>
                </p>
              )}
              <ol className="space-y-0">
                {steps(o).map((st, i, arr) => {
                  const done = ORDER.indexOf(st.key) <= idx;
                  const current = st.key === o.status || (o.status === 'confirmado' && st.key === 'confirmado');
                  const Icon = st.icon;
                  return (
                    <li key={st.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={cx('grid size-9 place-items-center rounded-full', done ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-400', current && 'animate-ring')}>
                          <Icon className="size-4" />
                        </span>
                        {i < arr.length - 1 && <span className={cx('my-1 h-6 w-0.5', ORDER.indexOf(arr[i + 1].key) <= idx ? 'bg-brand-400' : 'bg-stone-200')} />}
                      </div>
                      <div className="pt-1.5">
                        <p className={cx('text-sm font-medium', done ? 'text-stone-900' : 'text-stone-400')}>{st.label}</p>
                        {done && st.at && <p className="text-xs text-stone-500">{timeBR(st.at)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold text-stone-900">Resumo</h2>
          <ul className="space-y-2 text-sm">
            {o.items.map((i, k) => (
              <li key={k} className="flex justify-between gap-3">
                <span>{itemLine(i)}{i.notes && <span className="block text-xs italic text-stone-500">“{i.notes}”</span>}</span>
                <span className="shrink-0">{brl(i.total_cents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{brl(o.subtotal_cents)}</span></div>
            {o.delivery_fee_cents > 0 && <div className="flex justify-between"><span>Entrega</span><span>{brl(o.delivery_fee_cents)}</span></div>}
            {o.discount_cents > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto</span><span>− {brl(o.discount_cents)}</span></div>}
            <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{brl(o.total_cents)}</span></div>
          </div>
          <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-600">
            <p><b>{TYPE[o.type]}</b>{o.type === 'entrega' && `: ${addressLine(o.address)}`}</p>
            {o.type === 'retirada' && s && <p>{s.address}</p>}
            <p>Pagamento: {s?.payment_methods.find((m) => m.id === o.payment_method)?.label || o.payment_method}{o.change_for_cents ? ` · troco para ${brl(o.change_for_cents)}` : ''}</p>
            {o.notes && <p>Obs.: {o.notes}</p>}
          </div>
        </Card>

        {s?.whatsapp && (
          <a href={waLink(s.whatsapp, `Olá! Tenho uma dúvida sobre o pedido #${o.id}`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-sm font-medium text-brand-700">
            <MessageCircle className="size-4" /> Falar com a loja
          </a>
        )}
      </main>
    </div>
  );
}
