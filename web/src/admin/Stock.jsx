import { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, PackagePlus, PackageMinus, ClipboardCheck, Trash2, FlaskConical, Info, AlertTriangle } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, qty, pct, dateTimeBR } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Select, Spinner, Table, Tabs, Toggle, cx, useToast, ErrorBox, Badge, Empty } from '../components/ui.jsx';

const UNITS = { g: 'grama (g)', ml: 'mililitro (ml)', un: 'unidade (un)', kg: 'quilo (kg)', l: 'litro (l)' };
const costLabel = (i) => `${brl(i.unit_cost)}/${i.unit}`; // unit_cost é em centavos por unidade

export default function Stock() {
  const [tab, setTab] = useState('insumos');
  return (
    <>
      <PageHeader title="Estoque e CMV" subtitle="Insumos, compras, ficha técnica e custo de cada produto">
        <Tabs value={tab} onChange={setTab} tabs={[{ value: 'insumos', label: 'Insumos' }, { value: 'cmv', label: 'Custo dos produtos (CMV)' }, { value: 'mov', label: 'Movimentações' }]} />
      </PageHeader>
      {tab === 'insumos' && <Ingredients />}
      {tab === 'cmv' && <CMV />}
      {tab === 'mov' && <Movements />}
    </>
  );
}

function Ingredients() {
  const list = useApi('/ingredients');
  const [edit, setEdit] = useState(null);
  const [move, setMove] = useState(null);
  const [q, setQ] = useState('');
  if (!list.data) return <Spinner />;
  const rows = list.data.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));
  const low = list.data.filter((i) => i.active && i.min_qty > 0 && i.stock_qty <= i.min_qty).length;
  const value = list.data.reduce((s, i) => s + Math.max(0, i.stock_qty) * i.unit_cost, 0);
  return (
    <>
      <div className="mb-4 flex items-start gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-100">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>Os custos iniciais dos insumos são <b>estimativas</b>. Ao lançar uma <b>entrada (compra)</b> com o valor pago, o sistema recalcula o custo médio automaticamente. O estoque baixa sozinho a cada venda conforme a ficha técnica de cada produto.</p>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar insumo" className="max-w-xs" />
        <span className="text-sm text-stone-500">Valor em estoque: <b>{brl(value)}</b></span>
        {low > 0 && <Badge className="bg-red-50 text-red-700 ring-red-200"><AlertTriangle className="size-3" /> {low} abaixo do mínimo</Badge>}
        <div className="flex-1" />
        <Button icon={Plus} onClick={() => setEdit({ name: '', unit: 'g', unit_cost: 0, min_qty: 0, supplier: '', active: 1 })}>Novo insumo</Button>
      </div>
      <Card>
        <Table>
          <thead><tr><th>Insumo</th><th className="text-right">Estoque</th><th className="text-right">Mínimo</th><th className="text-right">Custo</th><th>Usado em</th><th /></tr></thead>
          <tbody>
            {rows.map((i) => {
              const isLow = i.min_qty > 0 && i.stock_qty <= i.min_qty;
              return (
                <tr key={i.id} className={cx(!i.active && 'opacity-50')}>
                  <td className="font-medium">{i.name}{i.supplier && <span className="block text-xs font-normal text-stone-500">{i.supplier}</span>}</td>
                  <td className={cx('whitespace-nowrap text-right font-medium', i.stock_qty < 0 ? 'text-red-600' : isLow ? 'text-amber-600' : '')}>{qty(i.stock_qty)} {i.unit}</td>
                  <td className="whitespace-nowrap text-right text-stone-500">{i.min_qty ? `${qty(i.min_qty)} ${i.unit}` : '—'}</td>
                  <td className="whitespace-nowrap text-right">{costLabel(i)}</td>
                  <td className="text-stone-500">{i.used_in ? `${i.used_in} fichas` : '—'}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" icon={PackagePlus} onClick={() => setMove({ ing: i, type: 'entrada' })}>Entrada</Button>
                      <Button size="sm" variant="ghost" icon={PackageMinus} onClick={() => setMove({ ing: i, type: 'perda' })} title="Saída / perda" />
                      <Button size="sm" variant="ghost" icon={ClipboardCheck} onClick={() => setMove({ ing: i, type: 'ajuste' })} title="Inventário (ajustar saldo)" />
                      <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setEdit(i)} title="Editar" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      {edit && <IngredientModal ing={edit} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); list.reload(); }} />}
      {move && <MoveModal {...move} onClose={() => setMove(null)} onSaved={() => { setMove(null); list.reload(); }} />}
    </>
  );
}

function IngredientModal({ ing, onClose, onSaved }) {
  const [f, setF] = useState(ing);
  const [pack, setPack] = useState({ price: 0, size: '' });
  const [err, setErr] = useState('');
  const setPackCost = (p) => {
    setPack(p);
    const size = Number(String(p.size).replace(',', '.'));
    if (p.price > 0 && size > 0) setF((x) => ({ ...x, unit_cost: Math.round((p.price / size) * 10000) / 10000 }));
  };
  const save = async () => {
    try {
      if (f.id) await api.put(`/ingredients/${f.id}`, f);
      else await api.post('/ingredients', f);
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const del = async () => {
    await api.del(`/ingredients/${f.id}`);
    onSaved();
  };
  return (
    <Modal open onClose={onClose} title={f.id ? 'Editar insumo' : 'Novo insumo'} footer={
      <>
        {f.id && <Button variant="ghost" className="mr-auto text-red-600" icon={Trash2} onClick={del}>Excluir</Button>}
        <Button onClick={save}>Salvar</Button>
      </>
    }>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome" className="sm:col-span-2"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Unidade de controle"><Select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>{Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <div className="rounded-xl bg-stone-50 p-3 sm:col-span-2">
          <p className="mb-2 text-sm font-medium text-stone-700">Custo: quanto custa a embalagem?</p>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Preço pago"><MoneyInput value={pack.price} onChange={(v) => setPackCost({ ...pack, price: v })} /></Field>
            <Field label={`Conteúdo (${f.unit})`}><Input inputMode="decimal" value={pack.size} onChange={(e) => setPackCost({ ...pack, size: e.target.value })} placeholder={f.unit === 'g' ? 'Ex.: 395' : ''} /></Field>
          </div>
          <p className="mt-2 text-xs text-stone-500">Custo por {f.unit}: <b>R$ {(f.unit_cost / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</b></p>
        </div>
        <Field label={`Estoque mínimo (${f.unit})`} hint="Avisa no painel quando chegar neste nível"><Input type="number" min="0" value={f.min_qty} onChange={(e) => setF({ ...f, min_qty: Number(e.target.value) })} /></Field>
        <Field label="Fornecedor"><Input value={f.supplier || ''} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></Field>
        <Toggle checked={!!f.active} onChange={(v) => setF({ ...f, active: v ? 1 : 0 })} label="Ativo" />
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function MoveModal({ ing, type: initialType, onClose, onSaved }) {
  const [type, setType] = useState(initialType);
  const [amount, setAmount] = useState('');
  const [total, setTotal] = useState(0);
  const [toFinance, setToFinance] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const save = async () => {
    try {
      await api.post(`/ingredients/${ing.id}/movement`, { type, qty: Number(String(amount).replace(',', '.')), total_cents: total, to_finance: toFinance, note });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={ing.name} footer={<Button onClick={save}>Confirmar</Button>}>
      <div className="space-y-3">
        <Tabs value={type} onChange={setType} tabs={[{ value: 'entrada', label: 'Compra' }, { value: 'perda', label: 'Perda' }, { value: 'saida', label: 'Saída' }, { value: 'ajuste', label: 'Inventário' }]} />
        <p className="text-sm text-stone-500">Saldo atual: <b>{qty(ing.stock_qty)} {ing.unit}</b></p>
        <Field label={type === 'ajuste' ? `Quantidade contada (${ing.unit})` : `Quantidade (${ing.unit})`} hint={ing.unit === 'g' ? 'Ex.: 1 caixa de 395 g = 395' : undefined}>
          <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
        </Field>
        {type === 'entrada' && (
          <>
            <Field label="Valor total pago" hint="Atualiza o custo médio do insumo"><MoneyInput value={total} onChange={setTotal} /></Field>
            <Toggle checked={toFinance} onChange={setToFinance} label="Lançar como despesa paga no financeiro" />
          </>
        )}
        <Field label="Observação"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={type === 'perda' ? 'Ex.: venceu, caiu' : ''} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function CMV() {
  const { data, reload } = useApi('/stock/cmv');
  const [recipe, setRecipe] = useState(null);
  const [only, setOnly] = useState('all');
  if (!data) return <Spinner />;
  const rows = data.filter((r) => (only === 'missing' ? !r.recipe_items : only === 'done' ? r.recipe_items : true));
  const withRecipe = data.filter((r) => r.recipe_items).length;
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Tabs value={only} onChange={setOnly} tabs={[{ value: 'all', label: 'Todos' }, { value: 'done', label: 'Com ficha', count: withRecipe }, { value: 'missing', label: 'Sem ficha', count: data.length - withRecipe }]} />
        <p className="text-sm text-stone-500">CMV ideal em confeitaria: até ~35% do preço.</p>
      </div>
      <Card>
        <Table>
          <thead><tr><th>Produto</th><th className="text-right">Preço</th><th className="text-right">Custo</th><th className="text-right">CMV</th><th className="text-right">Lucro bruto</th><th /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.variant_id}>
                <td>{r.name}{r.variant_name && <span className="text-stone-500"> · {r.variant_name}</span>}<span className="block text-xs text-stone-400">{r.category_name}</span></td>
                <td className="text-right">{brl(r.price_cents)}</td>
                <td className="text-right">{r.recipe_items ? brl(r.cost_cents) : <span className="text-stone-400">sem ficha</span>}</td>
                <td className={cx('text-right font-medium', !r.recipe_items ? 'text-stone-300' : r.cmv_pct > 40 ? 'text-red-600' : r.cmv_pct > 30 ? 'text-amber-600' : 'text-emerald-600')}>{r.recipe_items ? pct(r.cmv_pct) : '—'}</td>
                <td className="text-right">{r.recipe_items ? brl(r.profit_cents) : '—'}</td>
                <td className="text-right"><Button size="sm" variant="ghost" icon={FlaskConical} onClick={() => setRecipe({ id: r.product_id, name: r.name })}>Ficha</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
      {recipe && <RecipeModal product={recipe} onClose={() => { setRecipe(null); reload(); }} />}
    </>
  );
}

function Movements() {
  const { data } = useApi('/stock/movements?limit=300');
  if (!data) return <Spinner />;
  if (!data.length) return <Card><Empty title="Nenhuma movimentação ainda" /></Card>;
  const labels = { entrada: 'Compra', saida: 'Saída', perda: 'Perda', ajuste: 'Inventário', venda: 'Venda', estorno: 'Estorno' };
  return (
    <Card>
      <Table>
        <thead><tr><th>Data</th><th>Item</th><th>Tipo</th><th className="text-right">Qtd</th><th>Obs.</th><th>Usuário</th></tr></thead>
        <tbody>
          {data.map((m) => (
            <tr key={m.id}>
              <td className="whitespace-nowrap">{dateTimeBR(m.created_at)}</td>
              <td>{m.ingredient_name || m.product_name}</td>
              <td>{labels[m.type] || m.type}</td>
              <td className={cx('whitespace-nowrap text-right font-medium', m.qty < 0 ? 'text-red-600' : 'text-emerald-600')}>{m.qty > 0 ? '+' : ''}{qty(m.qty)} {m.unit || 'un'}</td>
              <td className="text-stone-500">{m.note}</td>
              <td className="text-stone-500">{m.user_name}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

/** Ficha técnica: insumos por tamanho do produto */
export function RecipeModal({ product, onClose }) {
  const variants = useApi(`/recipes/${product.id}`);
  const ingredients = useApi('/ingredients');
  const toast = useToast();
  const [vid, setVid] = useState(null);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState('');
  const current = variants.data?.find((v) => v.id === vid);

  useEffect(() => {
    if (variants.data?.length && !vid) setVid(variants.data[0].id);
  }, [variants.data, vid]);
  useEffect(() => {
    if (current) setItems(current.items.map((i) => ({ ingredient_id: i.ingredient_id, qty: i.qty })));
  }, [current]);

  const ingMap = useMemo(() => Object.fromEntries((ingredients.data || []).map((i) => [i.id, i])), [ingredients.data]);
  const cost = items.reduce((s, i) => s + (Number(i.qty) || 0) * (ingMap[i.ingredient_id]?.unit_cost || 0), 0);

  const save = async () => {
    try {
      await api.put(`/recipes/variant/${vid}`, { items: items.filter((i) => i.ingredient_id && Number(i.qty) > 0) });
      toast('Ficha técnica salva');
      variants.reload();
    } catch (e) {
      setErr(e.message);
    }
  };
  const copyFrom = (fromId, factor) => {
    const src = variants.data.find((v) => v.id === Number(fromId));
    if (src) setItems(src.items.map((i) => ({ ingredient_id: i.ingredient_id, qty: Math.round(i.qty * factor * 100) / 100 })));
  };

  return (
    <Modal open onClose={onClose} size="lg" title={<span className="flex items-center gap-2"><FlaskConical className="size-5 text-brand-500" /> Ficha técnica · {product.name}</span>} footer={<Button onClick={save} disabled={!vid}>Salvar ficha</Button>}>
      {!variants.data || !ingredients.data ? <Spinner /> : (
        <div className="space-y-4">
          {variants.data.length > 1 && (
            <Tabs value={vid} onChange={setVid} tabs={variants.data.map((v) => ({ value: v.id, label: v.name || 'Único' }))} />
          )}
          {current && (
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-3 text-center text-sm">
              <div><p className="text-xs text-stone-500">Preço</p><p className="font-semibold">{brl(current.price_cents)}</p></div>
              <div><p className="text-xs text-stone-500">Custo</p><p className="font-semibold">{brl(Math.round(cost))}</p></div>
              <div><p className="text-xs text-stone-500">CMV</p><p className={cx('font-semibold', cost / current.price_cents > 0.4 ? 'text-red-600' : 'text-emerald-600')}>{pct((cost / current.price_cents) * 100)}</p></div>
            </div>
          )}
          <div className="space-y-2">
            {items.map((it, k) => {
              const ing = ingMap[it.ingredient_id];
              return (
                <div key={k} className="flex items-center gap-2">
                  <Select value={it.ingredient_id || ''} onChange={(e) => setItems(items.map((x, j) => (j === k ? { ...x, ingredient_id: Number(e.target.value) } : x)))}>
                    <option value="">Insumo…</option>
                    {ingredients.data.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </Select>
                  <Input className="w-24 shrink-0" inputMode="decimal" value={it.qty} onChange={(e) => setItems(items.map((x, j) => (j === k ? { ...x, qty: e.target.value.replace(',', '.') } : x)))} />
                  <span className="w-8 text-sm text-stone-500">{ing?.unit}</span>
                  <span className="w-20 text-right text-sm text-stone-600">{brl(Math.round((Number(it.qty) || 0) * (ing?.unit_cost || 0)))}</span>
                  <button onClick={() => setItems(items.filter((_, j) => j !== k))} className="text-stone-400 hover:text-red-600" aria-label="Remover"><Trash2 className="size-4" /></button>
                </div>
              );
            })}
            <Button variant="ghost" size="sm" icon={Plus} onClick={() => setItems([...items, { ingredient_id: '', qty: '' }])}>Adicionar insumo</Button>
          </div>
          {variants.data.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3 text-sm text-stone-600">
              Copiar de outro tamanho:
              {variants.data.filter((v) => v.id !== vid && v.items.length).map((v) => (
                <span key={v.id} className="flex items-center gap-1">
                  <Button size="sm" variant="secondary" onClick={() => copyFrom(v.id, 1)}>{v.name}</Button>
                  <Button size="sm" variant="ghost" onClick={() => copyFrom(v.id, current && v.price_cents ? current.price_cents / v.price_cents : 1)} title="Proporcional ao preço">×{current && v.price_cents ? (current.price_cents / v.price_cents).toFixed(2) : 1}</Button>
                </span>
              ))}
            </div>
          )}
          <ErrorBox>{err}</ErrorBox>
        </div>
      )}
    </Modal>
  );
}
