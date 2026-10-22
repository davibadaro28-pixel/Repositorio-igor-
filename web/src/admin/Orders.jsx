import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Store, ShoppingBag, CalendarClock, Plus, Search, Clock, AlertTriangle } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, minutesSince, timeBR, dateTimeBR, dateBR, phone, todayISO, addDaysISO, TYPE, CHANNEL, STATUS } from '../lib/format.js';
import { Badge, Button, Card, Input, PageHeader, Select, Spinner, StatusBadge, Table, Tabs, cx, useToast, Empty } from '../components/ui.jsx';
import { useLive } from './AdminApp.jsx';
import OrderDrawer, { nextAction } from './OrderDrawer.jsx';
import PlatformBadge from './PlatformBadge.jsx';
import { FISCAL_STATUS } from './FiscalBox.jsx';

const COLUMNS = [
  { status: 'novo', title: 'Novos', tone: 'border-amber-400' },
  { status: 'confirmado', title: 'Confirmados (hoje e amanhã)', tone: 'border-sky-400' },
  { status: 'preparo', title: 'Em preparo', tone: 'border-violet-400' },
  { status: 'pronto', title: 'Prontos', tone: 'border-emerald-400' },
  { status: 'entrega', title: 'Em entrega', tone: 'border-blue-400' },
];

export const TypeIcon = ({ type, className = 'size-4' }) => (type === 'entrega' ? <Bike className={className} /> : type === 'retirada' ? <ShoppingBag className={className} /> : <Store className={className} />);

export function OrderCard({ o, onOpen, onAdvance, compact }) {
  const mins = minutesSince(o.created_at);
  const next = nextAction(o);
  const late = !o.scheduled_for && ['novo', 'preparo'].includes(o.status) && mins > 40;
  return (
    <div onClick={onOpen} className={cx('cursor-pointer rounded-xl bg-white p-3 shadow-sm ring-1 transition hover:shadow-md', o.status === 'novo' ? 'ring-amber-300' : 'ring-stone-200', late && 'ring-2 ring-red-300')}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-semibold text-stone-900"><TypeIcon type={o.type} /> #{o.id} <PlatformBadge order={o} /></p>
        <span className={cx('flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', late ? 'bg-red-100 text-red-700' : 'bg-stone-100 text-stone-600')}>
          <Clock className="size-3" /> {mins < 60 ? `${mins} min` : timeBR(o.created_at)}
        </span>
      </div>
      <p className="mt-0.5 truncate text-sm font-medium text-stone-800">{o.customer_name || 'Balcão'}</p>
      <p className="truncate text-xs text-stone-500">{CHANNEL[o.channel]}{o.address?.neighborhood ? ` · ${o.address.neighborhood}` : ''}</p>
      {o.external_sync_error && <p className="mt-1 flex items-start gap-1 rounded-md bg-red-50 px-1.5 py-1 text-[11px] font-medium text-red-700"><AlertTriangle className="mt-px size-3 shrink-0" /> {o.external_sync_error}</p>}
      {(o.fiscal_alert || ['rejeitado', 'denegado'].includes(o.fiscal_status)) && <p className="mt-1 flex items-start gap-1 rounded-md bg-red-50 px-1.5 py-1 text-[11px] font-medium text-red-700"><AlertTriangle className="mt-px size-3 shrink-0" /> {o.fiscal_alert ? 'NFC-e precisa de atenção' : 'NFC-e não emitida: veja o motivo'}</p>}
      {o.scheduled_for && (
        <p className="mt-2 flex items-center gap-1 rounded-lg bg-brand-50 px-2 py-1 text-xs font-medium text-brand-800">
          <CalendarClock className="size-3.5" /> {o.scheduled_for.slice(0, 10) === todayISO() ? 'Hoje' : dateBR(o.scheduled_for)} às {timeBR(o.scheduled_for)}
        </p>
      )}
      {!compact && (
        <ul className="mt-2 space-y-0.5 text-xs text-stone-700">
          {o.items.slice(0, 4).map((i) => <li key={i.id} className="truncate"><b>{i.qty}x</b> {i.name}{i.variant_name ? ` · ${i.variant_name}` : ''}</li>)}
          {o.items.length > 4 && <li className="text-stone-400">+ {o.items.length - 4} itens</li>}
        </ul>
      )}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{brl(o.total_cents)} {o.paid ? <span className="text-xs font-medium text-emerald-600">pago</span> : null} {o.fiscal_status === 'autorizado' ? <span className="text-xs font-medium text-emerald-600">· NFC-e</span> : null}</span>
        {next && onAdvance && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(o, next.status); }}
            className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700 cursor-pointer"
          >
            {next.label}
          </button>
        )}
      </div>
      {o.courier_name && <p className="mt-1 text-xs text-stone-500">🛵 {o.courier_name}</p>}
    </div>
  );
}

function Board() {
  const { tick } = useLive();
  const board = useApi('/orders/board', [tick]);
  const [open, setOpen] = useState(null);
  const toast = useToast();

  const advance = async (o, status) => {
    try {
      await api.post(`/orders/${o.id}/status`, { status });
      board.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  if (!board.data) return <Spinner />;
  const done = board.data.filter((o) => ['concluido', 'cancelado'].includes(o.status));
  // encomendas confirmadas para depois de amanhã ficam só na tela de Encomendas
  const horizon = addDaysISO(todayISO(), 1);
  const later = board.data.filter((o) => o.status === 'confirmado' && o.scheduled_for?.slice(0, 10) > horizon);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {COLUMNS.map((c) => {
          const list = board.data.filter((o) => o.status === c.status && !later.includes(o));
          return (
            <section key={c.status} className={cx('flex min-h-40 flex-col rounded-2xl border-t-4 bg-stone-100/70 p-2.5', c.tone)}>
              <h2 className="mb-2 flex items-center justify-between px-1 text-sm font-semibold text-stone-700">
                {c.title} <span className="rounded-full bg-white px-2 text-xs">{list.length}</span>
              </h2>
              <div className="space-y-2">
                {list.map((o) => <OrderCard key={o.id} o={o} onOpen={() => setOpen(o.id)} onAdvance={advance} />)}
                {!list.length && <p className="py-6 text-center text-xs text-stone-400">Nenhum pedido</p>}
                {c.status === 'confirmado' && later.length > 0 && (
                  <Link to="/admin/encomendas" className="block rounded-xl bg-white/70 px-3 py-2 text-center text-xs font-medium text-brand-700 hover:bg-white">
                    + {later.length} encomenda{later.length > 1 ? 's' : ''} para os próximos dias
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {done.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-stone-600">Finalizados hoje ({done.length})</summary>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {done.map((o) => (
              <div key={o.id} onClick={() => setOpen(o.id)} className="flex cursor-pointer items-center justify-between rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-stone-200">
                <span>#{o.id} {o.customer_name || 'Balcão'}</span>
                <span className="flex items-center gap-2">{brl(o.total_cents)} <StatusBadge status={o.status} /></span>
              </div>
            ))}
          </div>
        </details>
      )}
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChange={() => board.reload()} />}
    </>
  );
}

function History() {
  const [from, setFrom] = useState(addDaysISO(todayISO(), -6));
  const [to, setTo] = useState(todayISO());
  const [status, setStatus] = useState('');
  const [channel, setChannel] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const { tick } = useLive();
  const list = useApi(`/orders?from=${from}&to=${to}&status=${status}&channel=${channel}&q=${encodeURIComponent(query)}&limit=500`, [tick]);
  const [open, setOpen] = useState(null);
  const rows = list.data || [];
  const total = rows.filter((o) => o.status !== 'cancelado').reduce((s, o) => s + o.total_cents, 0);
  return (
    <>
      <Card className="mb-4 flex flex-wrap items-end gap-3 p-3">
        <label className="text-xs text-stone-500">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-stone-500">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <label className="text-xs text-stone-500">Status
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </label>
        <label className="text-xs text-stone-500">Canal
          <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="">Todos</option>
            {Object.entries(CHANNEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </label>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="flex flex-1 gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, telefone ou nº do pedido" />
          <Button type="submit" variant="secondary" icon={Search}>Buscar</Button>
        </form>
      </Card>
      <Card>
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 text-sm">
          <span>{rows.length} pedidos</span>
          <span className="font-semibold">{brl(total)}</span>
        </div>
        {!rows.length ? <Empty title="Nenhum pedido no período" /> : (
          <Table>
            <thead><tr><th>#</th><th>Data</th><th>Cliente</th><th>Canal</th><th>Tipo</th><th>Status</th><th>Nota</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="cursor-pointer hover:bg-brand-50/40" onClick={() => setOpen(o.id)}>
                  <td className="font-medium">{o.id}</td>
                  <td className="whitespace-nowrap">{dateTimeBR(o.created_at)}</td>
                  <td>{o.customer_name || '—'}<span className="block text-xs text-stone-500">{phone(o.customer_phone)}</span></td>
                  <td><span className="flex items-center gap-1.5">{o.external_platform ? <PlatformBadge order={o} /> : CHANNEL[o.channel]}</span></td>
                  <td>{TYPE[o.type]}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.fiscal_status ? <Badge className={FISCAL_STATUS[o.fiscal_status].color}>{FISCAL_STATUS[o.fiscal_status].label.replace('NFC-e ', '')}</Badge> : <span className="text-stone-300">—</span>}</td>
                  <td className="text-right font-medium">{brl(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChange={() => list.reload()} />}
    </>
  );
}

export default function Orders() {
  const [tab, setTab] = useState('board');
  return (
    <>
      <PageHeader title="Pedidos" subtitle="Acompanhe e avance os pedidos em tempo real">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'board', label: 'Quadro' }, { value: 'history', label: 'Histórico' }]} />
        <Link to="/admin/pdv"><Button icon={Plus}>Novo pedido</Button></Link>
      </PageHeader>
      {tab === 'board' ? <Board /> : <History />}
    </>
  );
}
