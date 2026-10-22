import { useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, ArrowUp, ArrowDown, ImagePlus, Star, Globe, FlaskConical, FolderPlus } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, pct } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, PageHeader, Select, Spinner, Textarea, Toggle, cx, useToast, ErrorBox, Badge } from '../components/ui.jsx';
import { RecipeModal } from './Stock.jsx';

/** Reduz a foto no navegador antes de enviar (máx. 900px, JPEG) */
export async function uploadImage(file) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = URL.createObjectURL(file);
  });
  const scale = Math.min(1, 900 / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
  const r = await api.post('/upload', { data_url: dataUrl });
  return r.url;
}

const blank = (categoryId) => ({
  name: '', description: '', category_id: categoryId, image: '', active: 1, available: 1, featured: 0, online: 1,
  lead_time_hours: 0, option_groups: [], stock_control: 0, variants: [{ name: '', price_cents: 0 }],
});

export default function Products() {
  const products = useApi('/products?all=1');
  const categories = useApi('/categories');
  const toast = useToast();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null);
  const [recipe, setRecipe] = useState(null);
  const [catModal, setCatModal] = useState(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (products.data || []).filter((p) => (!cat || p.category_id === Number(cat)) && (!s || p.name.toLowerCase().includes(s)));
  }, [products.data, q, cat]);

  const quick = async (p, field) => {
    try {
      const r = await api.patch(`/products/${p.id}`, { [field]: p[field] ? 0 : 1 });
      products.setData((l) => l.map((x) => (x.id === p.id ? r : x)));
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const moveCat = async (idx, d) => {
    const ids = categories.data.map((c) => c.id);
    const j = idx + d;
    if (j < 0 || j >= ids.length) return;
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    await api.post('/categories/reorder', { ids });
    categories.reload();
    products.reload();
  };

  if (!products.data || !categories.data) return <Spinner />;

  return (
    <>
      <PageHeader title="Cardápio e produtos" subtitle={`${products.data.filter((p) => p.active).length} produtos ativos em ${categories.data.length} categorias`}>
        <Button variant="secondary" icon={FolderPlus} onClick={() => setCatModal({ name: '' })}>Categoria</Button>
        <Button icon={Plus} onClick={() => setEditing(blank(Number(cat) || categories.data[0]?.id))}>Novo produto</Button>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <Card className="h-fit p-2">
          <button onClick={() => setCat('')} className={cx('w-full rounded-lg px-3 py-2 text-left text-sm font-medium cursor-pointer', !cat ? 'bg-brand-50 text-brand-700' : 'hover:bg-stone-50')}>Todas</button>
          {categories.data.map((c, i) => (
            <div key={c.id} className={cx('group flex items-center rounded-lg', String(cat) === String(c.id) ? 'bg-brand-50 text-brand-700' : 'hover:bg-stone-50')}>
              <button onClick={() => setCat(String(c.id))} className={cx('flex-1 px-3 py-2 text-left text-sm cursor-pointer', !c.active && 'text-stone-400 line-through')}>{c.name} <span className="text-xs text-stone-400">{c.products}</span></button>
              <div className="flex opacity-0 transition group-hover:opacity-100">
                <button onClick={() => moveCat(i, -1)} className="p-1 text-stone-400 hover:text-stone-700" aria-label="Subir"><ArrowUp className="size-3.5" /></button>
                <button onClick={() => moveCat(i, 1)} className="p-1 text-stone-400 hover:text-stone-700" aria-label="Descer"><ArrowDown className="size-3.5" /></button>
                <button onClick={() => setCatModal(c)} className="p-1 text-stone-400 hover:text-stone-700" aria-label="Editar"><Pencil className="size-3.5" /></button>
              </div>
            </div>
          ))}
        </Card>

        <div>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto" className="pl-9" />
          </div>
          <Card className="divide-y divide-stone-100">
            {list.map((p) => (
              <div key={p.id} className={cx('flex flex-wrap items-center gap-3 p-3', !p.active && 'opacity-50')}>
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">{p.image && <img src={p.image} alt="" className="size-full object-cover" loading="lazy" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 font-medium">
                    {p.name}
                    {p.featured ? <Star className="size-3.5 fill-gold text-gold" /> : null}
                    {!p.online && <Badge className="bg-stone-100 text-stone-600 ring-stone-200">só no balcão</Badge>}
                    {p.lead_time_hours > 0 && <Badge className="bg-brand-50 text-brand-700 ring-brand-100">encomenda {p.lead_time_hours}h</Badge>}
                    {!p.active && <Badge className="bg-stone-100 text-stone-600 ring-stone-200">arquivado</Badge>}
                  </p>
                  <p className="text-xs text-stone-500">{p.category_name}</p>
                  <p className="mt-0.5 text-sm">
                    {p.variants.map((v) => (
                      <span key={v.id} className="mr-3 whitespace-nowrap">
                        {v.name && <span className="text-stone-500">{v.name}: </span>}<b>{brl(v.price_cents)}</b>
                        {v.cost_cents > 0 && <span className={cx('ml-1 text-xs', v.margin_pct < 60 ? 'text-amber-600' : 'text-emerald-600')}>margem {pct(v.margin_pct)}</span>}
                      </span>
                    ))}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Toggle checked={!!p.available} onChange={() => quick(p, 'available')} label={p.available ? 'Disponível' : 'Esgotado'} />
                  <button title="Aparece no cardápio online" onClick={() => quick(p, 'online')} className={cx('rounded-lg p-1.5', p.online ? 'text-sky-600' : 'text-stone-300')}><Globe className="size-4" /></button>
                  <button title="Destaque (mais vendidos)" onClick={() => quick(p, 'featured')} className={cx('rounded-lg p-1.5', p.featured ? 'text-gold' : 'text-stone-300')}><Star className="size-4" /></button>
                  <button title="Ficha técnica (custo)" onClick={() => setRecipe(p)} className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"><FlaskConical className="size-4" /></button>
                  <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditing(p)}>Editar</Button>
                </div>
              </div>
            ))}
            {!list.length && <p className="p-8 text-center text-sm text-stone-400">Nenhum produto encontrado.</p>}
          </Card>
        </div>
      </div>

      {editing && <ProductModal product={editing} categories={categories.data} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); products.reload(); categories.reload(); toast('Produto salvo'); }} />}
      {recipe && <RecipeModal product={recipe} onClose={() => { setRecipe(null); products.reload(); }} />}
      {catModal && <CategoryModal cat={catModal} onClose={() => setCatModal(null)} onSaved={() => { setCatModal(null); categories.reload(); }} />}
    </>
  );
}

function CategoryModal({ cat, onClose, onSaved }) {
  const [name, setName] = useState(cat.name);
  const [active, setActive] = useState(cat.active ?? 1);
  const [err, setErr] = useState('');
  const save = async () => {
    try {
      if (cat.id) await api.put(`/categories/${cat.id}`, { name, active });
      else await api.post('/categories', { name });
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  const del = async () => {
    try {
      await api.del(`/categories/${cat.id}`);
      onSaved();
    } catch (e) {
      setErr(e.message);
    }
  };
  return (
    <Modal open onClose={onClose} size="sm" title={cat.id ? 'Editar categoria' : 'Nova categoria'} footer={
      <>
        {cat.id && <Button variant="ghost" className="mr-auto text-red-600" onClick={del}>Excluir</Button>}
        <Button onClick={save}>Salvar</Button>
      </>
    }>
      <div className="space-y-3">
        <Field label="Nome"><Input value={name} onChange={(e) => setName(e.target.value)} autoFocus /></Field>
        {cat.id && <Toggle checked={!!active} onChange={(v) => setActive(v ? 1 : 0)} label="Categoria visível" />}
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function ProductModal({ product, categories, onClose, onSaved }) {
  const [p, setP] = useState(() => ({ ...product, variants: product.variants.map((v) => ({ ...v })), option_groups: JSON.parse(JSON.stringify(product.option_groups || [])) }));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (patch) => setP((x) => ({ ...x, ...patch }));
  const setVariant = (i, patch) => set({ variants: p.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)) });
  const setGroup = (i, patch) => set({ option_groups: p.option_groups.map((g, k) => (k === i ? { ...g, ...patch } : g)) });

  const save = async () => {
    setErr('');
    setSaving(true);
    try {
      if (p.id) await api.put(`/products/${p.id}`, p);
      else await api.post('/products', p);
      onSaved();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!confirm('Excluir este produto? Se ele já teve vendas, será apenas arquivado.')) return;
    await api.del(`/products/${p.id}`);
    onSaved();
  };
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      set({ image: await uploadImage(f) });
    } catch (e2) {
      setErr(e2.message || 'Não foi possível enviar a imagem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="xl" title={p.id ? 'Editar produto' : 'Novo produto'} footer={
      <>
        {p.id && <Button variant="ghost" className="mr-auto text-red-600" icon={Trash2} onClick={remove}>Excluir</Button>}
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button loading={saving} onClick={save}>Salvar</Button>
      </>
    }>
      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          <label className="relative block aspect-square cursor-pointer overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
            {p.image ? <img src={p.image} alt="" className="size-full object-cover" /> : <span className="flex size-full flex-col items-center justify-center text-sm text-brand-500"><ImagePlus className="mb-1 size-8" /> Adicionar foto</span>}
            {uploading && <span className="absolute inset-0 grid place-items-center bg-white/70 text-sm">Enviando…</span>}
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
          {p.image && <button className="mt-2 text-xs text-stone-500 hover:text-red-600" onClick={() => set({ image: '' })}>Remover foto</button>}
          <div className="mt-4 space-y-2">
            <Toggle checked={!!p.available} onChange={(v) => set({ available: v ? 1 : 0 })} label="Disponível hoje" />
            <Toggle checked={!!p.online} onChange={(v) => set({ online: v ? 1 : 0 })} label="No cardápio online" />
            <Toggle checked={!!p.featured} onChange={(v) => set({ featured: v ? 1 : 0 })} label="Destaque" />
            <Toggle checked={!!p.active} onChange={(v) => set({ active: v ? 1 : 0 })} label="Ativo" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome"><Input value={p.name} onChange={(e) => set({ name: e.target.value })} /></Field>
            <Field label="Categoria">
              <Select value={p.category_id} onChange={(e) => set({ category_id: Number(e.target.value) })}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Descrição"><Textarea value={p.description} onChange={(e) => set({ description: e.target.value })} rows={3} /></Field>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">Tamanhos e preços</p>
            <div className="space-y-2">
              {p.variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder={p.variants.length > 1 ? 'Ex.: Médio, 1 kg' : 'Tamanho (opcional)'} value={v.name || ''} onChange={(e) => setVariant(i, { name: e.target.value })} />
                  <MoneyInput className="w-40 shrink-0" value={v.price_cents} onChange={(val) => setVariant(i, { price_cents: val })} />
                  {p.variants.length > 1 && <button className="text-stone-400 hover:text-red-600" onClick={() => set({ variants: p.variants.filter((_, k) => k !== i) })} aria-label="Remover"><Trash2 className="size-4" /></button>}
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon={Plus} className="mt-1" onClick={() => set({ variants: [...p.variants, { name: '', price_cents: 0 }] })}>Adicionar tamanho</Button>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-stone-700">Adicionais e escolhas</p>
            <p className="mb-2 text-xs text-stone-500">Ex.: “Sabor do bolo gelado” (obrigatório, escolher 1) ou “Cobertura extra” (opcional, com preço).</p>
            {p.option_groups.map((g, i) => (
              <div key={i} className="mb-3 rounded-xl p-3 ring-1 ring-stone-200">
                <div className="flex flex-wrap gap-2">
                  <Input className="min-w-40 flex-1" placeholder="Nome do grupo" value={g.name} onChange={(e) => setGroup(i, { name: e.target.value })} />
                  <label className="flex items-center gap-1 text-xs text-stone-600">mín <Input type="number" min="0" className="w-16" value={g.min} onChange={(e) => setGroup(i, { min: Number(e.target.value) })} /></label>
                  <label className="flex items-center gap-1 text-xs text-stone-600">máx <Input type="number" min="1" className="w-16" value={g.max} onChange={(e) => setGroup(i, { max: Number(e.target.value) })} /></label>
                  <button className="text-stone-400 hover:text-red-600" onClick={() => set({ option_groups: p.option_groups.filter((_, k) => k !== i) })} aria-label="Remover grupo"><Trash2 className="size-4" /></button>
                </div>
                <div className="mt-2 space-y-1.5">
                  {g.options.map((o, k) => (
                    <div key={k} className="flex gap-2">
                      <Input placeholder="Opção" value={o.name} onChange={(e) => setGroup(i, { options: g.options.map((x, j) => (j === k ? { ...x, name: e.target.value } : x)) })} />
                      <MoneyInput className="w-36 shrink-0" value={o.price_cents} onChange={(val) => setGroup(i, { options: g.options.map((x, j) => (j === k ? { ...x, price_cents: val } : x)) })} />
                      <button className="text-stone-400 hover:text-red-600" onClick={() => setGroup(i, { options: g.options.filter((_, j) => j !== k) })} aria-label="Remover opção"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" icon={Plus} onClick={() => setGroup(i, { options: [...g.options, { name: '', price_cents: 0 }] })}>Opção</Button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => set({ option_groups: [...p.option_groups, { name: '', min: 0, max: 1, options: [{ name: '', price_cents: 0 }] }] })}>Grupo de adicionais</Button>
          </div>

          <Field label="Só por encomenda com antecedência de (horas)" hint="0 = pode pedir para agora. Ex.: 24 para bolos que precisam ser feitos no dia anterior.">
            <Input type="number" min="0" className="w-32" value={p.lead_time_hours} onChange={(e) => set({ lead_time_hours: Number(e.target.value) })} />
          </Field>
          <ErrorBox>{err}</ErrorBox>
        </div>
      </div>
    </Modal>
  );
}
