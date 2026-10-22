import { useState } from 'react';
import { Plus, Check, Undo2, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, dateBR, todayISO, addDaysISO, pct } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Select, Spinner, Stat, Table, Tabs, Textarea, cx, useToast, ErrorBox, Empty } from '../components/ui.jsx';
import { ColumnChart } from '../components/charts.jsx';

const monthStart = () => todayISO().slice(0, 8) + '01';
const monthEnd = () => {
  const d = new Date();
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
};

function Period({ from, to, setFrom, setTo }) {
  const presets = [
    ['Este mês', monthStart(), monthEnd()],
    ['Últimos 7 dias', addDaysISO(todayISO(), -6), todayISO()],
    ['Últimos 30 dias', addDaysISO(todayISO(), -29), todayISO()],
  ];
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-stone-500">De<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label className="text-xs text-stone-500">Até<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      {presets.map(([l, f, t]) => <Button key={l} size="sm" variant="ghost" onClick={() => { setFrom(f); setTo(t); }}>{l}</Button>)}
    </div>
  );
}

export default function Finance() {
  const [tab, setTab] = useState('contas');
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(monthEnd());
  return (
    <>
      <PageHeader title="Financeiro" subtitle="Contas a pagar e receber, fluxo de caixa e resultado (DRE)">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'contas', label: 'Contas' }, { value: 'fluxo', label: 'Fluxo de caixa' }, { value: 'dre', label: 'DRE' }]} />
      </PageHeader>
      <Card className="mb-4 p-3"><Period from={from} to={to} setFrom={setFrom} setTo={setTo} /></Card>
      {tab === 'contas' && <Entries from={from} to={to} />}
      {tab === 'fluxo' && <Cashflow from={from} to={to} />}
      {tab === 'dre' && <DRE from={from} to={to} />}
    </>
  );
}

function Entries({ from, to }) {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const list = useApi(`/finance/entries?from=${from}&to=${to}&type=${type}&status=${status}`);
  const cats = useApi('/finance/categories');
  const [edit, setEdit] = useState(null);
  const toast = useToast();
  const rows = list.data || [];
  const t = todayISO();
  const sum = (fn) => rows.filter(fn).reduce((s, e) => s + e.amount_cents, 0);

  const pay = async (e, paid) => {
    await api.post(`/finance/entries/${e.id}/pay`, { paid });
    list.reload();
    toast(paid ? 'Marcado como pago' : 'Pagamento desfeito');
  };

  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="A pagar (pendente)" value={brl(sum((e) => e.type === 'despesa' && e.status === 'pendente'))} icon={ArrowUpCircle} tone="red" />
        <Stat label="Vencidas" value={brl(sum((e) => e.status === 'pendente' && e.due_date < t && e.type === 'despesa'))} icon={AlertTriangle} tone="amber" />
        <Stat label="A receber (pendente)" value={brl(sum((e) => e.type === 'receita' && e.status === 'pendente'))} icon={ArrowDownCircle} tone="green" />
        <Stat label="Despesas pagas" value={brl(sum((e) => e.type === 'despesa' && e.status === 'pago'))} icon={Check} tone="blue" />
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Tabs value={type} onChange={setType} tabs={[{ value: '', label: 'Tudo' }, { value: 'despesa', label: 'A pagar' }, { value: 'receita', label: 'A receber' }]} />
        <Tabs value={status} onChange={setStatus} tabs={[{ value: '', label: 'Todas' }, { value: 'pendente', label: 'Pendentes' }, { value: 'vencido', label: 'Vencidas' }, { value: 'pago', label: 'Pagas' }]} />
        <div className="flex-1" />
        <Button icon={Plus} onClick={() => setEdit({ type: 'despesa', description: '', amount_cents: 0, due_date: todayISO(), status: 'pendente', category_id: '', repeat_months: 1 })}>Novo lançamento</Button>
      </div>
      <Card>
        {!list.data ? <Spinner /> : !rows.length ? <Empty title="Nenhum lançamento no período">Cadastre aluguel, energia, compras, salários… Para contas fixas use “repetir por X meses”.</Empty> : (
          <Table>
            <thead><tr><th>Vencimento</th><th>Descrição</th><th>Categoria</th><th className="text-right">Valor</th><th>Situação</th><th /></tr></thead>
            <tbody>
              {rows.map((e) => {
                const late = e.status === 'pendente' && e.due_date < t;
                return (
                  <tr key={e.id}>
                    <td className={cx('whitespace-nowrap', late && 'font-medium text-red-600')}>{dateBR(e.due_date)}</td>
                    <td>{e.description}{e.supplier && <span className="block text-xs text-stone-500">{e.supplier}</span>}</td>
                    <td className="text-stone-600">{e.category_name || '—'}</td>
                    <td className={cx('whitespace-nowrap text-right font-medium', e.type === 'despesa' ? 'text-red-700' : 'text-emerald-700')}>{e.type === 'despesa' ? '−' : '+'} {brl(e.amount_cents)}</td>
                    <td>{e.status === 'pago' ? <span className="text-emerald-700">Pago {e.paid_at && dateBR(e.paid_at)}</span> : late ? <span className="font-medium text-red-600">Vencida</span> : <span className="text-amber-700">Pendente</span>}</td>
                    <td>
                      <div className="flex justify-end gap-1">
                        {e.status === 'pendente' ? <Button size="sm" variant="success" icon={Check} onClick={() => pay(e, true)}>{e.type === 'despesa' ? 'Pagar' : 'Receber'}</Button> : <Button size="sm" variant="ghost" icon={Undo2} onClick={() => pay(e, false)} title="Desfazer" />}
                        <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(e)} title="Editar" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
      {edit && cats.data && <EntryModal entry={edit} cats={cats.data} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} onCats={cats.reload} />}
    </>
  );
}

function EntryModal({ entry, cats, onClose, onSaved, onCats }) {
  const [f, setF] = useState({ ...entry, category_id: entry.category_id || '' });
  const [err, setErr] = useState('');
  const [newCat, setNewCat] = useState('');
  const save = async () => {
    try {
      if (f.id) await api.put(`/finance/entries/${f.id}`, f);
      else await api.post('/finance/entries', f);
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const del = async () => {
    await api.del(`/finance/entries/${f.id}`);
    onSaved();
  };
  const addCat = async () => {
    const c = await api.post('/finance/categories', { name: newCat, type: f.type });
    setNewCat('');
    await onCats();
    setF({ ...f, category_id: c.id });
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar lançamento' : 'Novo lançamento'} footer={
      <>
        {f.id && <Button variant="ghost" className="mr-auto text-red-600" icon={Trash2} onClick={del}>Excluir</Button>}
        <Button onClick={save}>Salvar</Button>
      </>
    }>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Tabs value={f.type} onChange={(v) => setF({ ...f, type: v, category_id: '' })} tabs={[{ value: 'despesa', label: 'Despesa (a pagar)' }, { value: 'receita', label: 'Receita (a receber)' }]} /></div>
        <Field label="Descrição" className="sm:col-span-2"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} placeholder="Ex.: Aluguel da loja" /></Field>
        <Field label="Valor"><MoneyInput value={f.amount_cents} onChange={(v) => setF({ ...f, amount_cents: v })} /></Field>
        <Field label="Vencimento"><Input type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} /></Field>
        <Field label="Categoria">
          <Select value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
            <option value="">—</option>
            {cats.filter((c) => c.type === f.type).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Nova categoria"><div className="flex gap-1"><Input value={newCat} onChange={(e) => setNewCat(e.target.value)} /><Button variant="secondary" disabled={!newCat} onClick={addCat}>+</Button></div></Field>
        <Field label="Fornecedor / cliente"><Input value={f.supplier || ''} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></Field>
        <Field label="Situação">
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}><option value="pendente">Pendente</option><option value="pago">Pago</option></Select>
        </Field>
        {!f.id && <Field label="Repetir por quantos meses?" hint="1 = só este mês. Ex.: 12 para aluguel"><Input type="number" min="1" max="36" value={f.repeat_months} onChange={(e) => setF({ ...f, repeat_months: Number(e.target.value) })} /></Field>}
        <Field label="Observações" className="sm:col-span-2"><Textarea value={f.notes || ''} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function Cashflow({ from, to }) {
  const { data } = useApi(`/finance/cashflow?from=${from}&to=${to}`);
  if (!data) return <Spinner />;
  const ent = data.days.reduce((s, d) => s + d.entradas, 0);
  const sai = data.days.reduce((s, d) => s + d.saidas, 0);
  const pend = (type) => data.pending.find((p) => p.type === type) || { amount: 0, overdue: 0 };
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Entradas no período" value={brl(ent)} sub="vendas recebidas (já sem taxas) + receitas" icon={ArrowDownCircle} tone="green" />
        <Stat label="Saídas no período" value={brl(sai)} sub="despesas pagas" icon={ArrowUpCircle} tone="red" />
        <Stat label="Saldo do período" value={brl(ent - sai)} icon={Check} tone={ent - sai >= 0 ? 'green' : 'red'} />
        <Stat label="Contas a pagar em aberto" value={brl(pend('despesa').amount)} sub={pend('despesa').overdue ? `${brl(pend('despesa').overdue)} vencidas` : 'nada vencido'} icon={AlertTriangle} tone="amber" />
      </div>
      <Card className="mb-4 p-4">
        <h3 className="font-semibold">Saldo de cada dia</h3>
        <p className="mb-2 text-xs text-stone-500">Entradas menos saídas. Dias negativos ficam em zero no gráfico; veja a tabela.</p>
        <ColumnChart data={data.days.map((d) => ({ label: dateBR(d.day).slice(0, 5), value: Math.max(0, d.saldo_dia), tip: dateBR(d.day), extra: `entradas ${brl(d.entradas)} · saídas ${brl(d.saidas)}` }))} />
      </Card>
      <Card>
        <Table>
          <thead><tr><th>Dia</th><th className="text-right">Vendas</th><th className="text-right">Outras receitas</th><th className="text-right">Saídas</th><th className="text-right">Saldo do dia</th><th className="text-right">Acumulado</th></tr></thead>
          <tbody>
            {data.days.filter((d) => d.entradas || d.saidas).map((d) => (
              <tr key={d.day}>
                <td>{dateBR(d.day)}</td>
                <td className="text-right">{brl(d.vendas)}</td>
                <td className="text-right">{brl(d.outras_receitas)}</td>
                <td className="text-right text-red-700">{brl(d.saidas)}</td>
                <td className={cx('text-right font-medium', d.saldo_dia < 0 && 'text-red-600')}>{brl(d.saldo_dia)}</td>
                <td className={cx('text-right', d.saldo_acumulado < 0 && 'text-red-600')}>{brl(d.saldo_acumulado)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  );
}

function DRE({ from, to }) {
  const [mode, setMode] = useState('compras');
  const { data } = useApi(`/finance/dre?from=${from}&to=${to}&cmv=${mode}`);
  if (!data) return <Spinner />;
  const rl = data.receita_liquida || 1;
  const Row = ({ label, value, strong, neg, indent, note }) => (
    <tr className={cx(strong && 'bg-stone-50 font-semibold')}>
      <td className={cx(indent && 'pl-8 text-stone-600')}>{label}{note && <span className="block text-xs font-normal text-stone-400">{note}</span>}</td>
      <td className={cx('text-right', neg && 'text-red-700')}>{neg ? '− ' : ''}{brl(Math.abs(value))}</td>
      <td className="w-20 text-right text-xs text-stone-500">{pct((value / rl) * 100)}</td>
    </tr>
  );
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <Card>
        <Table>
          <thead><tr><th>Demonstrativo de resultado</th><th className="text-right">Valor</th><th className="text-right">% receita</th></tr></thead>
          <tbody>
            <Row label="Vendas de produtos" value={data.produtos} />
            <Row label="Taxas de entrega cobradas" value={data.entregas} />
            <Row label="(−) Descontos" value={data.descontos} neg indent />
            <Row label="Receita líquida" value={data.receita_liquida} strong note={`${data.pedidos} pedidos`} />
            <Row label={mode === 'ficha' ? '(−) CMV pela ficha técnica' : '(−) CMV: compras de insumos e embalagens'} value={data.cmv} neg indent />
            <Row label="(−) Taxas de cartão / apps" value={data.taxas} neg indent />
            <Row label="Lucro bruto" value={data.lucro_bruto} strong />
            {data.outras_receitas > 0 && <Row label="(+) Outras receitas" value={data.outras_receitas} indent />}
            {data.despesas.map((d) => <Row key={d.categoria} label={`(−) ${d.categoria}`} value={d.valor} neg indent />)}
            <Row label="Despesas operacionais" value={data.total_despesas} neg strong />
            <tr className={cx('text-base font-bold', data.resultado >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800')}>
              <td>Resultado do período</td><td className="text-right">{brl(data.resultado)}</td><td className="text-right text-xs">{pct((data.resultado / rl) * 100)}</td>
            </tr>
          </tbody>
        </Table>
      </Card>
      <Card className="h-fit space-y-3 p-4 text-sm">
        <p className="font-semibold">Como calcular o CMV?</p>
        <Tabs value={mode} onChange={setMode} tabs={[{ value: 'compras', label: 'Pelas compras' }, { value: 'ficha', label: 'Pela ficha técnica' }]} />
        <p className="text-stone-600"><b>Pelas compras:</b> usa as despesas lançadas em categorias de insumos/embalagens no período ({brl(data.compras_insumos)}).</p>
        <p className="text-stone-600"><b>Pela ficha técnica:</b> soma o custo teórico de cada item vendido ({brl(data.cmv_ficha)}). Fica preciso quando todos os produtos têm ficha.</p>
        <p className="text-xs text-stone-400">Competência pela data do pedido; despesas pela data de vencimento.</p>
      </Card>
    </div>
  );
}
