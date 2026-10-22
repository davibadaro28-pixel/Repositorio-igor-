import { useState } from 'react';
import { Download, DollarSign, ShoppingBag, Receipt, Users, XCircle } from 'lucide-react';
import { useApi, getToken } from '../lib/api.js';
import { brl, dateBR, todayISO, addDaysISO, pct, qty, methodLabel, CHANNEL, TYPE } from '../lib/format.js';
import { Button, Card, Input, PageHeader, Spinner, Stat, Table } from '../components/ui.jsx';
import { ColumnChart, BarList } from '../components/charts.jsx';
import { useSettings } from './AdminApp.jsx';

const WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Reports() {
  const [from, setFrom] = useState(addDaysISO(todayISO(), -29));
  const [to, setTo] = useState(todayISO());
  const { data } = useApi(`/reports/summary?from=${from}&to=${to}`);
  const { settings } = useSettings();
  const methods = settings?.payment_methods || [];
  const presets = [['Hoje', todayISO(), todayISO()], ['7 dias', addDaysISO(todayISO(), -6), todayISO()], ['30 dias', addDaysISO(todayISO(), -29), todayISO()], ['90 dias', addDaysISO(todayISO(), -89), todayISO()]];

  return (
    <>
      <PageHeader title="Relatórios" subtitle="Vendas, produtos, horários, pagamentos e bairros">
        <a href={`/api/reports/orders.csv?from=${from}&to=${to}&token=${encodeURIComponent(getToken() || '')}`}><Button variant="secondary" icon={Download}>Exportar pedidos (Excel)</Button></a>
      </PageHeader>
      <Card className="mb-4 flex flex-wrap items-end gap-2 p-3">
        <label className="text-xs text-stone-500">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-stone-500">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        {presets.map(([l, f, t]) => <Button key={l} size="sm" variant="ghost" onClick={() => { setFrom(f); setTo(t); }}>{l}</Button>)}
      </Card>
      {!data ? <Spinner /> : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
            <Stat label="Faturamento" value={brl(data.revenue_cents)} sub={`descontos ${brl(data.discount_cents)}`} icon={DollarSign} />
            <Stat label="Pedidos" value={data.orders} icon={ShoppingBag} tone="blue" />
            <Stat label="Ticket médio" value={brl(data.avg_ticket_cents)} icon={Receipt} tone="green" />
            <Stat label="Clientes únicos" value={data.unique_customers} icon={Users} tone="amber" />
            <Stat label="Cancelados" value={data.cancelled.n} sub={brl(data.cancelled.v)} icon={XCircle} tone="red" />
          </div>

          <Card className="p-4">
            <h3 className="mb-2 font-semibold">Faturamento por dia</h3>
            <ColumnChart data={data.byDay.map((d) => ({ label: dateBR(d.day).slice(0, 5), value: d.revenue_cents, tip: dateBR(d.day), extra: `${d.orders} pedidos` }))} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="font-semibold">Pedidos por horário</h3>
              <p className="mb-2 text-xs text-stone-500">Ajuda a escalar equipe e produção</p>
              <ColumnChart
                height={200}
                data={Array.from({ length: 24 }, (_, h) => h).filter((h) => h >= 8 && h <= 22).map((h) => {
                  const r = data.byHour.find((x) => x.hour === h);
                  return { label: `${h}h`, value: r?.orders || 0, extra: brl(r?.revenue_cents || 0) };
                })}
                format={(v) => `${v} pedidos`}
                axisFormat={(v) => String(Math.round(v))}
                labelEvery={2}
              />
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">Faturamento por dia da semana</h3>
              <p className="mb-2 text-xs text-stone-500">Soma do período</p>
              <ColumnChart height={200} data={WEEK.map((w, i) => ({ label: w, value: data.byWeekday.find((x) => x.weekday === i)?.revenue_cents || 0 }))} labelEvery={1} />
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4"><h3 className="mb-3 font-semibold">Por categoria</h3><BarList data={data.categories.map((c) => ({ label: c.name, value: c.revenue_cents, sub: `${qty(c.qty)} un` }))} /></Card>
            <Card className="p-4"><h3 className="mb-3 font-semibold">Por forma de pagamento</h3><BarList data={data.byPayment.map((p) => ({ label: methodLabel(methods, p.method), value: p.amount_cents, sub: p.fee_cents ? `taxa ${brl(p.fee_cents)}` : '' }))} /></Card>
            <Card className="p-4 space-y-5">
              <div><h3 className="mb-3 font-semibold">Por canal</h3><BarList data={data.byChannel.map((c) => ({ label: CHANNEL[c.channel], value: c.revenue_cents, sub: `${c.orders} ped.` }))} /></div>
              <div><h3 className="mb-3 font-semibold">Por tipo</h3><BarList data={data.byType.map((c) => ({ label: TYPE[c.type], value: c.revenue_cents, sub: `${c.orders} ped.` }))} /></div>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
            <Card>
              <h3 className="border-b border-stone-100 px-4 py-3 font-semibold">Produtos vendidos</h3>
              <Table>
                <thead><tr><th>Produto</th><th className="text-right">Qtd</th><th className="text-right">Faturamento</th><th className="text-right">Custo</th><th className="text-right">Margem</th></tr></thead>
                <tbody>
                  {data.products.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td>
                      <td className="text-right">{qty(p.qty)}</td>
                      <td className="text-right font-medium">{brl(p.revenue_cents)}</td>
                      <td className="text-right text-stone-500">{p.cost_cents ? brl(p.cost_cents) : '—'}</td>
                      <td className="text-right">{p.cost_cents ? pct(((p.revenue_cents - p.cost_cents) / p.revenue_cents) * 100) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
            <Card className="h-fit p-4">
              <h3 className="mb-3 font-semibold">Entregas por bairro</h3>
              {data.neighborhoods.length ? <BarList data={data.neighborhoods.map((n) => ({ label: n.name, value: n.orders, sub: brl(n.revenue_cents) }))} format={(v) => `${v} ped.`} /> : <p className="text-sm text-stone-400">Sem entregas no período.</p>}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
