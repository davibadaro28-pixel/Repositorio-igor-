import { useState } from 'react';
import { Plus, Search, MessageCircle, Gift, Pencil, Download } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { IS_PREVIEW } from '../lib/env.js';
import { brl, dateBR, dateTimeBR, phone, maskPhone, waLink, TYPE } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, PageHeader, Spinner, StatusBadge, Table, Tabs, Textarea, useToast, ErrorBox, Empty } from '../components/ui.jsx';
import { useSettings } from './AdminApp.jsx';
import OrderDrawer from './OrderDrawer.jsx';

const SEGMENTS = [
  { value: '', label: 'Todos' },
  { value: 'top', label: 'Quem mais compra' },
  { value: 'fieis', label: 'Fiéis (5+ pedidos)' },
  { value: 'novos', label: 'Compraram 1 vez' },
  { value: 'inativos', label: 'Sumidos (30+ dias)' },
  { value: 'aniversariantes', label: 'Aniversariantes do mês' },
];

const CAMPAIGN = {
  inativos: (n, loja) => `Oi ${n}! Tá com saudade de um docinho? 🎀 Essa semana tem novidade na ${loja}. Peça pelo nosso cardápio: `,
  aniversariantes: (n, loja) => `Feliz aniversário, ${n}! 🎂 A ${loja} tem um presente pra você no seu mês. Peça pelo cardápio: `,
  novos: (n) => `Oi ${n}! Obrigada por comprar com a gente 💖 Que tal provar nossos bolos premium? `,
  '': (n) => `Oi ${n}! 🎀 `,
};

export default function Customers() {
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState('');
  const list = useApi(`/customers?q=${encodeURIComponent(query)}&segment=${segment}`);
  const [open, setOpen] = useState(null);
  const [edit, setEdit] = useState(null);
  const { settings } = useSettings();
  const toast = useToast();
  const menuUrl = window.location.origin;

  const exportCsv = () => {
    if (IS_PREVIEW) return toast('Na prévia não dá para baixar arquivos. No sistema instalado, a lista é baixada aqui.');
    const rows = (list.data || []).map((c) => [c.name, phone(c.phone), c.email || '', c.birthday || '', c.neighborhood || '', c.orders, (c.spent_cents / 100).toFixed(2).replace('.', ','), c.last_order_at || '', c.points]);
    const csv = '﻿' + [['Nome', 'Telefone', 'Email', 'Aniversário', 'Bairro', 'Pedidos', 'Total gasto', 'Última compra', 'Pontos'], ...rows].map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'clientes.csv';
    a.click();
  };

  return (
    <>
      <PageHeader title="Clientes" subtitle="Histórico, fidelidade e campanhas pelo WhatsApp">
        <Button variant="secondary" icon={Download} onClick={exportCsv}>Exportar</Button>
        <Button icon={Plus} onClick={() => setEdit({ name: '', phone: '' })}>Novo cliente</Button>
      </PageHeader>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); }} className="flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou telefone" />
          <Button type="submit" variant="secondary" icon={Search} />
        </form>
        <Tabs value={segment} onChange={setSegment} tabs={SEGMENTS} />
      </div>
      {segment && segment !== 'top' && segment !== 'fieis' && (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Dica: use o botão <MessageCircle className="inline size-4" /> para mandar uma mensagem pronta de campanha para cada cliente desta lista.</p>
      )}
      <Card>
        {!list.data ? <Spinner /> : !list.data.length ? <Empty title="Nenhum cliente encontrado">Clientes são cadastrados automaticamente a cada pedido com telefone.</Empty> : (
          <Table>
            <thead><tr><th>Cliente</th><th>Bairro</th><th className="text-right">Pedidos</th><th className="text-right">Total gasto</th><th>Última compra</th>{settings?.loyalty?.enabled && <th className="text-right">Pontos</th>}<th /></tr></thead>
            <tbody>
              {list.data.map((c) => (
                <tr key={c.id} className="cursor-pointer hover:bg-stone-50" onClick={() => setOpen(c.id)}>
                  <td className="font-medium">{c.name}<span className="block text-xs font-normal text-stone-500">{phone(c.phone)}{c.birthday && ` · 🎂 ${c.birthday.slice(-5).split('-').reverse().join('/')}`}</span></td>
                  <td className="text-stone-600">{c.neighborhood || '—'}</td>
                  <td className="text-right">{c.orders}</td>
                  <td className="text-right font-medium">{brl(c.spent_cents)}</td>
                  <td>{c.last_order_at ? dateBR(c.last_order_at) : '—'}</td>
                  {settings?.loyalty?.enabled && <td className="text-right">{c.points}</td>}
                  <td onClick={(e) => e.stopPropagation()}>
                    {c.phone && <a href={waLink(c.phone, CAMPAIGN[segment] ? CAMPAIGN[segment](c.name.split(' ')[0], settings?.store?.name || 'nossa loja') + menuUrl : `Oi ${c.name.split(' ')[0]}! 🎀 `)} target="_blank" rel="noreferrer" className="inline-flex rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="WhatsApp"><MessageCircle className="size-4" /></a>}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      {open && <CustomerModal id={open} onClose={() => setOpen(null)} onEdit={(c) => { setOpen(null); setEdit(c); }} />}
      {edit && <EditModal customer={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} />}
    </>
  );
}

function CustomerModal({ id, onClose, onEdit }) {
  const { data: c } = useApi(`/customers/${id}`);
  const [order, setOrder] = useState(null);
  return (
    <Modal open onClose={onClose} size="lg" title={c?.name || 'Cliente'} footer={c && <Button variant="secondary" icon={Pencil} onClick={() => onEdit(c)}>Editar</Button>}>
      {!c ? <Spinner /> : (
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Pedidos</p><p className="text-lg font-semibold">{c.orders}</p></div>
            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Total gasto</p><p className="text-lg font-semibold">{brl(c.spent_cents)}</p></div>
            <div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Ticket médio</p><p className="text-lg font-semibold">{brl(c.orders ? Math.round(c.spent_cents / c.orders) : 0)}</p></div>
            <div className="rounded-xl bg-brand-50 p-3"><p className="flex items-center gap-1 text-xs text-brand-700"><Gift className="size-3" /> Pontos</p><p className="text-lg font-semibold text-brand-800">{c.points}</p></div>
          </div>
          <p className="text-stone-600">{phone(c.phone)}{c.email && ` · ${c.email}`}{c.birthday && ` · aniversário ${c.birthday.slice(-5).split('-').reverse().join('/')}`}</p>
          {c.address && <p className="text-stone-600">{c.address}, {c.number} {c.complement} – {c.neighborhood}</p>}
          {c.notes && <p className="rounded-xl bg-amber-50 px-3 py-2 text-amber-900">{c.notes}</p>}
          {c.favorites.length > 0 && <p><b>Preferidos:</b> {c.favorites.map((f) => `${f.name} (${f.qty})`).join(', ')}</p>}
          <div>
            <p className="mb-2 font-semibold">Pedidos</p>
            <ul className="divide-y divide-stone-100 rounded-xl ring-1 ring-stone-200">
              {c.history.map((o) => (
                <li key={o.id} onClick={() => setOrder(o.id)} className="flex cursor-pointer items-center justify-between gap-2 px-3 py-2 hover:bg-stone-50">
                  <span>#{o.id} · {dateTimeBR(o.created_at)} · {TYPE[o.type]}</span>
                  <span className="flex items-center gap-2">{brl(o.total_cents)} <StatusBadge status={o.status} /></span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {order && <OrderDrawer id={order} onClose={() => setOrder(null)} />}
    </Modal>
  );
}

function EditModal({ customer, onClose, onSaved }) {
  const [f, setF] = useState({ ...customer, phone: maskPhone(customer.phone || ''), birthday: customer.birthday || '' });
  const [err, setErr] = useState('');
  const toast = useToast();
  const save = async () => {
    try {
      if (f.id) await api.put(`/customers/${f.id}`, f);
      else await api.post('/customers', f);
      toast('Cliente salvo');
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar cliente' : 'Novo cliente'} footer={<Button onClick={save}>Salvar</Button>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2"><Input value={f.name} onChange={set('name')} /></Field>
        <Field label="WhatsApp"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: maskPhone(e.target.value) })} inputMode="tel" /></Field>
        <Field label="Aniversário" hint="Dia e mês (ano opcional)"><Input type="date" value={f.birthday?.length === 5 ? `2000-${f.birthday}` : f.birthday} onChange={set('birthday')} /></Field>
        <Field label="E-mail" className="sm:col-span-2"><Input value={f.email || ''} onChange={set('email')} /></Field>
        <Field label="Rua" className="sm:col-span-2"><Input value={f.address || ''} onChange={set('address')} /></Field>
        <Field label="Número"><Input value={f.number || ''} onChange={set('number')} /></Field>
        <Field label="Complemento"><Input value={f.complement || ''} onChange={set('complement')} /></Field>
        <Field label="Bairro"><Input value={f.neighborhood || ''} onChange={set('neighborhood')} /></Field>
        <Field label="Referência"><Input value={f.reference || ''} onChange={set('reference')} /></Field>
        {f.id && <Field label="Pontos de fidelidade"><Input type="number" min="0" value={f.points ?? 0} onChange={set('points')} /></Field>}
        <Field label="Observações" className="sm:col-span-2" hint="Ex.: alergias, preferências"><Textarea value={f.notes || ''} onChange={set('notes')} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}
