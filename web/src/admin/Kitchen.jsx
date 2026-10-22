import { useEffect, useState } from 'react';
import { Maximize2, Minimize2, CalendarClock } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { minutesSince, timeBR, dateBR, todayISO } from '../lib/format.js';
import { Button, PageHeader, Spinner, cx, useToast } from '../components/ui.jsx';
import { useLive } from './AdminApp.jsx';
import { TypeIcon } from './Orders.jsx';

function Ticket({ o, onMove }) {
  const mins = minutesSince(o.confirmed_at || o.created_at);
  const late = o.status === 'preparo' && mins > 30;
  return (
    <div className={cx('flex flex-col rounded-2xl bg-white shadow ring-2', late ? 'ring-red-400' : o.status === 'pronto' ? 'ring-emerald-400' : 'ring-transparent')}>
      <div className={cx('flex items-center justify-between rounded-t-2xl px-4 py-2 text-white', o.status === 'pronto' ? 'bg-emerald-600' : o.status === 'preparo' ? 'bg-brand-600' : 'bg-sky-600')}>
        <span className="flex items-center gap-2 text-lg font-bold"><TypeIcon type={o.type} className="size-5" /> #{o.id}</span>
        <span className="text-sm font-medium">{o.scheduled_for ? `para ${timeBR(o.scheduled_for)}` : `${mins} min`}</span>
      </div>
      <div className="flex-1 px-4 py-3">
        <p className="mb-2 truncate text-sm text-stone-500">{o.customer_name || 'Balcão'}</p>
        <ul className="space-y-1.5">
          {o.items.map((i) => (
            <li key={i.id} className="text-base leading-snug">
              <b className="text-brand-700">{i.qty}x</b> {i.name}
              {i.variant_name && <span className="text-stone-500"> · {i.variant_name}</span>}
              {i.options?.length > 0 && <span className="block text-sm text-stone-600">↳ {i.options.map((x) => x.name).join(', ')}</span>}
              {i.notes && <span className="mt-0.5 block rounded bg-amber-100 px-1.5 py-0.5 text-sm font-medium text-amber-900">⚠ {i.notes}</span>}
            </li>
          ))}
        </ul>
        {o.notes && <p className="mt-2 rounded bg-amber-50 px-2 py-1 text-sm text-amber-900">{o.notes}</p>}
      </div>
      <div className="p-3 pt-0">
        {o.status === 'confirmado' && <Button className="w-full" size="lg" onClick={() => onMove(o, 'preparo')}>Iniciar preparo</Button>}
        {o.status === 'preparo' && <Button className="w-full" size="lg" variant="success" onClick={() => onMove(o, 'pronto')}>Pronto ✓</Button>}
        {o.status === 'pronto' && <p className="text-center text-sm font-medium text-emerald-700">Aguardando {o.type === 'entrega' ? 'entregador' : 'retirada'}</p>}
      </div>
    </div>
  );
}

export default function Kitchen() {
  const { tick } = useLive();
  const board = useApi('/orders/board', [tick]);
  const toast = useToast();
  const [full, setFull] = useState(false);
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((x) => x + 1), 30000); // atualiza os cronômetros
    return () => clearInterval(t);
  }, []);

  const move = async (o, status) => {
    try {
      await api.post(`/orders/${o.id}/status`, { status });
      board.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!board.data) return <Spinner />;
  const t = todayISO();
  const queue = board.data.filter((o) => o.status === 'preparo' || (o.status === 'confirmado' && (!o.scheduled_for || o.scheduled_for.slice(0, 10) <= t)));
  const ready = board.data.filter((o) => o.status === 'pronto');
  const upcoming = board.data.filter((o) => o.status === 'confirmado' && o.scheduled_for?.slice(0, 10) > t);

  // Produção: soma de itens a produzir agora
  const production = {};
  for (const o of queue) for (const i of o.items) {
    const k = `${i.name}${i.variant_name ? ` · ${i.variant_name}` : ''}`;
    production[k] = (production[k] || 0) + i.qty;
  }

  const content = (
    <div className={cx(full && 'min-h-dvh bg-stone-900 p-4')}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        {full ? <h1 className="text-xl font-semibold text-white">Cozinha · {queue.length} em produção</h1> : <div />}
        <Button variant={full ? 'secondary' : 'secondary'} icon={full ? Minimize2 : Maximize2} onClick={() => {
          setFull(!full);
          if (!full) document.documentElement.requestFullscreen?.().catch(() => {});
          else document.exitFullscreen?.().catch(() => {});
        }}>{full ? 'Sair da tela cheia' : 'Tela cheia'}</Button>
      </div>
      {Object.keys(production).length > 0 && (
        <div className={cx('mb-4 rounded-2xl p-3', full ? 'bg-stone-800 text-white' : 'bg-white ring-1 ring-stone-200')}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">Total a produzir</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(production).sort((a, b) => b[1] - a[1]).map(([k, n]) => (
              <span key={k} className={cx('rounded-full px-3 py-1 text-sm', full ? 'bg-stone-700' : 'bg-brand-50 text-brand-800')}><b>{n}x</b> {k}</span>
            ))}
          </div>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {queue.map((o) => <Ticket key={o.id} o={o} onMove={move} />)}
        {ready.map((o) => <Ticket key={o.id} o={o} onMove={move} />)}
      </div>
      {!queue.length && !ready.length && <p className={cx('py-16 text-center text-lg', full ? 'text-stone-400' : 'text-stone-400')}>Nada na fila agora 🎀</p>}
      {upcoming.length > 0 && (
        <div className={cx('mt-6 rounded-2xl p-4', full ? 'bg-stone-800 text-white' : 'bg-white ring-1 ring-stone-200')}>
          <p className="mb-2 flex items-center gap-2 font-semibold"><CalendarClock className="size-4" /> Próximas encomendas</p>
          <ul className="space-y-1 text-sm">
            {upcoming.slice(0, 12).map((o) => (
              <li key={o.id}>{dateBR(o.scheduled_for)} {timeBR(o.scheduled_for)} — #{o.id} {o.items.map((i) => `${i.qty}x ${i.name}${i.variant_name ? ` (${i.variant_name})` : ''}`).join(', ')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (full) return <div className="fixed inset-0 z-50 overflow-y-auto">{content}</div>;
  return (
    <>
      <PageHeader title="Cozinha (KDS)" subtitle="Fila de produção em tempo real. Deixe aberta num tablet na cozinha." />
      {content}
    </>
  );
}
