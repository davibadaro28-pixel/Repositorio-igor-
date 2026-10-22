import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react';
import { useApi } from '../lib/api.js';
import { brl, timeBR, todayISO, addDaysISO, TYPE } from '../lib/format.js';
import { Button, Card, PageHeader, Spinner, StatusBadge, Empty, cx } from '../components/ui.jsx';
import { useLive } from './AdminApp.jsx';
import OrderDrawer from './OrderDrawer.jsx';
import { TypeIcon } from './Orders.jsx';

export default function Encomendas() {
  const [start, setStart] = useState(todayISO());
  const end = addDaysISO(start, 6);
  const { tick } = useLive();
  const list = useApi(`/orders?scheduled=1&by=scheduled&from=${start}&to=${end}&limit=1000`, [tick]);
  const [open, setOpen] = useState(null);
  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(start, i));
  const orders = (list.data || []).filter((o) => o.status !== 'cancelado');

  return (
    <>
      <PageHeader title="Encomendas" subtitle="Bolos e pedidos agendados por dia de entrega/retirada">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="sm" onClick={() => setStart(addDaysISO(start, -7))} aria-label="Semana anterior"><ChevronLeft className="size-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setStart(todayISO())}>Hoje</Button>
          <Button variant="secondary" size="sm" onClick={() => setStart(addDaysISO(start, 7))} aria-label="Próxima semana"><ChevronRight className="size-4" /></Button>
        </div>
        <Link to="/admin/pdv"><Button icon={Plus}>Nova encomenda</Button></Link>
      </PageHeader>
      {!list.data ? <Spinner /> : !orders.length ? (
        <Card><Empty icon={CalendarDays} title="Nenhuma encomenda nesta semana">Encomendas feitas pelo cardápio digital (opção “Agendar”) ou no PDV (marcando “Encomenda”) aparecem aqui.</Empty></Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {days.map((d) => {
            const dayOrders = orders.filter((o) => o.scheduled_for.slice(0, 10) === d);
            if (!dayOrders.length) return null;
            const totals = {};
            for (const o of dayOrders) for (const i of o.items) {
              const k = `${i.name}${i.variant_name ? ` · ${i.variant_name}` : ''}`;
              totals[k] = (totals[k] || 0) + i.qty;
            }
            const raw = new Date(d + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long' });
            const label = raw.charAt(0).toUpperCase() + raw.slice(1);
            return (
              <Card key={d} className={cx('overflow-hidden', d === todayISO() && 'ring-2 ring-brand-300')}>
                <div className="flex items-center justify-between bg-brand-50 px-4 py-2.5">
                  <p className="font-semibold text-brand-800">{d === todayISO() ? 'Hoje · ' : ''}{label}</p>
                  <span className="text-sm text-brand-700">{dayOrders.length} · {brl(dayOrders.reduce((s, o) => s + o.total_cents, 0))}</span>
                </div>
                <div className="border-b border-stone-100 px-4 py-2 text-xs text-stone-600">
                  <span className="font-medium">Produzir:</span> {Object.entries(totals).map(([k, n]) => `${n}x ${k}`).join(' · ')}
                </div>
                <ul className="divide-y divide-stone-100">
                  {dayOrders.map((o) => (
                    <li key={o.id} onClick={() => setOpen(o.id)} className="flex cursor-pointer items-start gap-3 px-4 py-2.5 hover:bg-stone-50">
                      <span className="w-12 pt-0.5 text-sm font-semibold text-brand-700">{timeBR(o.scheduled_for)}</span>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="flex items-center gap-1.5 font-medium"><TypeIcon type={o.type} /> #{o.id} {o.customer_name}</p>
                        <p className="truncate text-xs text-stone-500">{o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</p>
                        <p className="text-xs text-stone-500">{TYPE[o.type]} · {brl(o.total_cents)} {o.paid ? '· pago' : '· a receber'}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChange={() => list.reload()} />}
    </>
  );
}
