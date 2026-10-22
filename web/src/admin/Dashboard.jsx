import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Receipt, Clock, CalendarClock, AlertTriangle, Cake, PackageX, Wallet, Gift, TrendingUp, TrendingDown } from 'lucide-react';
import { useApi } from '../lib/api.js';
import { brl, dateBR, timeBR, waLink, CHANNEL, TYPE, qty } from '../lib/format.js';
import { Card, PageHeader, Spinner, Stat, cx } from '../components/ui.jsx';
import { ColumnChart, BarList } from '../components/charts.jsx';
import { useAuth, useLive, canAccess } from './AdminApp.jsx';

function Delta({ now, before }) {
  if (!before) return null;
  const d = ((now - before) / before) * 100;
  const up = d >= 0;
  return (
    <span className={cx('inline-flex items-center gap-0.5 font-medium', up ? 'text-emerald-600' : 'text-red-600')}>
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{up ? '+' : ''}{d.toFixed(0)}%
    </span>
  );
}

function Panel({ title, icon: Icon, to, children, empty }) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold text-stone-800"><Icon className="size-4 text-brand-500" /> {title}</h3>
        {to && <Link to={to} className="text-xs font-medium text-brand-700 hover:underline">ver tudo</Link>}
      </div>
      {empty ? <p className="text-sm text-stone-400">{empty}</p> : children}
    </Card>
  );
}

export default function Dashboard() {
  const { tick } = useLive();
  const { user } = useAuth();
  const { data } = useApi('/reports/dashboard', [tick]);
  if (!data) return <Spinner />;
  const t = data.today;
  const y = data.yesterday_same_time;
  const open = data.statusCount.reduce((s, x) => s + x.n, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <>
      <PageHeader title={`${greeting}, ${user.name.split(' ')[0]}!`} subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} />

      {!data.cash_open && canAccess(user, 'caixa') && (
        <Link to="/admin/caixa" className="mb-4 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <Wallet className="size-4" /> O caixa ainda não foi aberto hoje. <b className="underline">Abrir caixa</b>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Vendas hoje" value={brl(t.revenue_cents)} sub={<>vs. ontem até agora: {brl(y.revenue_cents)} <Delta now={t.revenue_cents} before={y.revenue_cents} /></>} icon={DollarSign} />
        <Stat label="Pedidos hoje" value={t.orders} sub={<>ontem até agora: {y.orders}</>} icon={ShoppingBag} tone="blue" />
        <Stat label="Ticket médio" value={brl(t.orders ? Math.round(t.revenue_cents / t.orders) : 0)} sub={`ontem: ${brl(y.orders ? Math.round(y.revenue_cents / y.orders) : 0)}`} icon={Receipt} tone="green" />
        <Link to="/admin/pedidos"><Stat label="Pedidos em aberto" value={open} sub={data.statusCount.map((s) => `${s.n} ${s.status}`).join(' · ') || 'nenhum'} icon={Clock} tone="amber" /></Link>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-4 xl:col-span-2">
          <h3 className="font-semibold text-stone-800">Faturamento dos últimos 30 dias</h3>
          <p className="mb-2 text-xs text-stone-500">Total {brl(data.last30.reduce((s, d) => s + d.revenue_cents, 0))} · {data.last30.reduce((s, d) => s + d.orders, 0)} pedidos</p>
          <ColumnChart data={data.last30.map((d) => ({ label: dateBR(d.day).slice(0, 5), value: d.revenue_cents, tip: `${dateBR(d.day)}`, extra: `${d.orders} pedidos` }))} />
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-stone-800">Mais vendidos (7 dias)</h3>
          {data.top.length ? <BarList data={data.top.map((p) => ({ label: p.name, value: p.qty, sub: brl(p.revenue_cents) }))} format={(v) => `${qty(v)} un`} /> : <p className="text-sm text-stone-400">Sem vendas ainda.</p>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="Encomendas (próximos 3 dias)" icon={CalendarClock} to="/admin/encomendas" empty={!data.upcoming.length && 'Nenhuma encomenda agendada.'}>
          <ul className="space-y-2 text-sm">
            {data.upcoming.map((o) => (
              <li key={o.id} className="flex justify-between gap-2">
                <span><b>{dateBR(o.scheduled_for).slice(0, 5)} {timeBR(o.scheduled_for)}</b> · #{o.id} {o.customer_name}</span>
                <span className="text-stone-500">{TYPE[o.type]}</span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Vendas de hoje por canal" icon={ShoppingBag} empty={!data.channels.length && 'Nenhuma venda hoje.'}>
          <BarList data={data.channels.map((c) => ({ label: `${CHANNEL[c.channel]} · ${TYPE[c.type]}`, value: c.revenue_cents, sub: `${c.orders} ped.` }))} />
        </Panel>
        {canAccess(user, 'estoque') && (
          <Panel title="Estoque baixo" icon={AlertTriangle} to="/admin/estoque" empty={!data.lowStock.length && 'Tudo certo com o estoque mínimo.'}>
            <ul className="space-y-1 text-sm">
              {data.lowStock.map((i) => <li key={i.id} className="flex justify-between"><span>{i.name}</span><span className="font-medium text-red-600">{qty(i.stock_qty)} {i.unit} <span className="font-normal text-stone-400">/ mín. {qty(i.min_qty)}</span></span></li>)}
            </ul>
          </Panel>
        )}
        {canAccess(user, 'financeiro') && (
          <Panel title="Contas a pagar (vencidas e próximos 3 dias)" icon={Receipt} to="/admin/financeiro" empty={!data.bills.length && 'Nenhuma conta vencendo.'}>
            <ul className="space-y-1 text-sm">
              {data.bills.map((b) => <li key={b.id} className="flex justify-between gap-2"><span className="truncate">{dateBR(b.due_date).slice(0, 5)} · {b.description}</span><span className="font-medium">{brl(b.amount_cents)}</span></li>)}
            </ul>
          </Panel>
        )}
        <Panel title="Aniversariantes da semana" icon={Gift} to="/admin/clientes" empty={!data.birthdays.length && 'Nenhum aniversariante nos próximos 7 dias.'}>
          <ul className="space-y-1 text-sm">
            {data.birthdays.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2">
                <span>{c.birthday.slice(-5).split('-').reverse().join('/')} · {c.name}</span>
                {c.phone && <a className="text-xs font-medium text-emerald-700 hover:underline" target="_blank" rel="noreferrer" href={waLink(c.phone, `Feliz aniversário, ${c.name.split(' ')[0]}! 🎂🎀 A Laços de Mãe preparou um mimo especial pra você!`)}>parabenizar</a>}
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Produtos esgotados" icon={PackageX} to="/admin/produtos" empty={!data.soldOut.length && 'Nenhum produto marcado como esgotado.'}>
          <p className="text-sm text-stone-700">{data.soldOut.map((p) => p.name).join(', ')}</p>
        </Panel>
      </div>
      <p className="mt-6 flex items-center gap-1 text-xs text-stone-400"><Cake className="size-3" /> Os números se atualizam sozinhos quando chegam pedidos.</p>
    </>
  );
}
