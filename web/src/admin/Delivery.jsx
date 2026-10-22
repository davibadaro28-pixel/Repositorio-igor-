import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Save, Bike, Smartphone } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, phone, todayISO, addDaysISO } from '../lib/format.js';
import { Button, Card, Input, MoneyInput, PageHeader, Spinner, Table, Tabs, Toggle, useToast, Empty } from '../components/ui.jsx';
import { useAuth, useLive, canAccess } from './AdminApp.jsx';
import { OrderCard } from './Orders.jsx';
import OrderDrawer from './OrderDrawer.jsx';

export default function Delivery() {
  const [tab, setTab] = useState('rota');
  return (
    <>
      <PageHeader title="Entregas" subtitle="Bairros atendidos, taxas, entregadores e acerto">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'rota', label: 'Em andamento' }, { value: 'zonas', label: 'Bairros e taxas' }, { value: 'acerto', label: 'Acerto com entregadores' }]} />
      </PageHeader>
      {tab === 'rota' && <OnRoute />}
      {tab === 'zonas' && <Zones />}
      {tab === 'acerto' && <Settlement />}
    </>
  );
}

function OnRoute() {
  const { tick } = useLive();
  const board = useApi('/orders/board', [tick]);
  const couriers = useApi('/couriers', [tick]);
  const [open, setOpen] = useState(null);
  const { user } = useAuth();
  if (!board.data || !couriers.data) return <Spinner />;
  const deliveries = board.data.filter((o) => o.type === 'entrega' && ['pronto', 'entrega', 'preparo', 'confirmado', 'novo'].includes(o.status));
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        {!deliveries.length ? <Card><Empty icon={Bike} title="Nenhuma entrega em andamento" /></Card> : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {deliveries.map((o) => <OrderCard key={o.id} o={o} onOpen={() => setOpen(o.id)} />)}
          </div>
        )}
      </div>
      <Card className="h-fit p-4">
        <h3 className="mb-3 font-semibold">Entregadores ativos</h3>
        {!couriers.data.length ? (
          <p className="text-sm text-stone-500">Nenhum entregador cadastrado. {canAccess(user, 'usuarios') && <Link to="/admin/usuarios" className="text-brand-700 underline">Cadastre em Usuários</Link>} com o perfil “Entregador”.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {couriers.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <span>{c.name}<span className="block text-xs text-stone-500">{phone(c.phone)}</span></span>
                <span className={c.on_route ? 'font-medium text-blue-700' : 'text-stone-400'}>{c.on_route ? `${c.on_route} em rota` : 'livre'}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs text-stone-600">
          <Smartphone className="size-4 shrink-0" /> O entregador acessa <b>{window.location.origin}/entregador</b> no celular com o login dele, vê as entregas atribuídas, abre a rota no Google Maps e confirma a entrega.
        </p>
      </Card>
      {open && <OrderDrawer id={open} onClose={() => setOpen(null)} onChange={() => board.reload()} />}
    </div>
  );
}

function Zones() {
  const list = useApi('/zones');
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const data = rows || list.data;
  if (!data) return <Spinner />;
  const set = (i, patch) => setRows(data.map((z, k) => (k === i ? { ...z, ...patch, dirty: true } : z)));
  const save = async () => {
    try {
      for (const z of data.filter((x) => x.dirty)) {
        if (z.id) await api.put(`/zones/${z.id}`, z);
        else await api.post('/zones', z);
      }
      setRows(null);
      list.reload();
      toast('Bairros salvos');
    } catch (e) {
      toast(e.message, 'error');
    }
  };
  const del = async (z, i) => {
    if (z.id) await api.del(`/zones/${z.id}`);
    setRows(data.filter((_, k) => k !== i));
  };
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 p-3">
        <p className="text-sm text-stone-500">O cliente escolhe o bairro no cardápio e a taxa entra automaticamente.</p>
        <div className="flex gap-2">
          <Button variant="secondary" icon={Plus} onClick={() => setRows([...data, { name: '', fee_cents: 1200, min_order_cents: 0, active: 1, dirty: true }])}>Bairro</Button>
          <Button icon={Save} onClick={save} disabled={!data.some((z) => z.dirty)}>Salvar alterações</Button>
        </div>
      </div>
      <Table>
        <thead><tr><th>Bairro</th><th>Taxa</th><th>Pedido mínimo</th><th>Ativo</th><th /></tr></thead>
        <tbody>
          {data.map((z, i) => (
            <tr key={z.id || `n${i}`}>
              <td><Input value={z.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
              <td className="w-40"><MoneyInput value={z.fee_cents} onChange={(v) => set(i, { fee_cents: v })} /></td>
              <td className="w-40"><MoneyInput value={z.min_order_cents} onChange={(v) => set(i, { min_order_cents: v })} /></td>
              <td><Toggle checked={!!z.active} onChange={(v) => set(i, { active: v ? 1 : 0 })} /></td>
              <td><button onClick={() => del(z, i)} className="text-stone-400 hover:text-red-600" aria-label="Excluir"><Trash2 className="size-4" /></button></td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

function Settlement() {
  const [from, setFrom] = useState(addDaysISO(todayISO(), -6));
  const [to, setTo] = useState(todayISO());
  const { data } = useApi(`/couriers/report?from=${from}&to=${to}`);
  return (
    <>
      <Card className="mb-4 flex flex-wrap items-end gap-2 p-3">
        <label className="text-xs text-stone-500">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="text-xs text-stone-500">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </Card>
      <Card>
        {!data ? <Spinner /> : !data.couriers.length ? <Empty title="Nenhum entregador cadastrado" /> : (
          <Table>
            <thead><tr><th>Entregador</th><th className="text-right">Entregas</th><th className="text-right">Taxas cobradas dos clientes</th><th className="text-right">Dinheiro recebido pelo entregador</th><th className="text-right">A pagar ao entregador</th></tr></thead>
            <tbody>
              {data.couriers.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.name}<span className="block text-xs font-normal text-stone-500">{brl(c.delivery_fee_cents)} por entrega</span></td>
                  <td className="text-right">{c.deliveries}</td>
                  <td className="text-right">{brl(c.fees_charged_cents)}</td>
                  <td className="text-right">{brl(c.cash_collected_cents)}</td>
                  <td className="text-right font-semibold">{brl(c.to_pay_cents)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
