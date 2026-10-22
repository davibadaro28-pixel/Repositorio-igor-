import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { newTab } from '../lib/env.js';
import { Search, Minus, Plus, Trash2, User, X, Printer, CheckCircle2, AlertTriangle, Gift } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, maskPhone, phone } from '../lib/format.js';
import { Button, Card, Field, Input, Modal, MoneyInput, Select, Spinner, Textarea, cx, useToast, ErrorBox } from '../components/ui.jsx';
import FiscalBox, { maskDoc } from './FiscalBox.jsx';
import { useSettings } from './AdminApp.jsx';

const emptySale = () => ({
  items: [], type: 'balcao', channel: 'pdv', customer: { name: '', phone: '' }, customerInfo: null,
  zone_id: '', address: { street: '', number: '', complement: '', reference: '' }, delivery_fee_cents: null,
  scheduled: false, day: '', time: '', notes: '', discount_cents: 0, coupon_code: '', redeem: false,
});

export default function PDV() {
  const products = useApi('/products');
  const categories = useApi('/categories');
  const zones = useApi('/zones');
  const cash = useApi('/cash/current');
  const { settings } = useSettings();
  const toast = useToast();
  const [cat, setCat] = useState('fav');
  const [q, setQ] = useState('');
  const [sale, setSale] = useState(emptySale);
  const [picking, setPicking] = useState(null);
  const [payOpen, setPayOpen] = useState(false);
  const [done, setDone] = useState(null);
  const [mobileCart, setMobileCart] = useState(false);

  const list = useMemo(() => {
    const all = (products.data || []).filter((p) => p.variants.length);
    const s = q.trim().toLowerCase();
    if (s) return all.filter((p) => p.name.toLowerCase().includes(s));
    if (cat === 'fav') return all.filter((p) => p.featured).concat(all.filter((p) => !p.featured)).slice(0, 24);
    return all.filter((p) => p.category_id === Number(cat));
  }, [products.data, q, cat]);

  const subtotal = sale.items.reduce((s, i) => s + i.unit_price_cents * i.qty, 0);
  const zone = zones.data?.find((z) => String(z.id) === String(sale.zone_id));
  const fee = sale.type === 'entrega' ? (sale.delivery_fee_cents ?? zone?.fee_cents ?? 0) : 0;
  const loyalty = settings?.loyalty;
  const redeemBlocks = sale.redeem && loyalty?.enabled && sale.customerInfo ? Math.floor(sale.customerInfo.points / loyalty.redeem_points) : 0;
  const redeemValue = redeemBlocks * (loyalty?.redeem_value_cents || 0);
  const total = Math.max(0, subtotal + fee - sale.discount_cents - redeemValue);
  const count = sale.items.reduce((s, i) => s + i.qty, 0);

  const add = (p, variant, options = [], notes = '') => {
    const extra = options.reduce((s, o) => s + o.price_cents, 0);
    setSale((s) => {
      const key = `${variant.id}|${options.map((o) => o.name).join(',')}|${notes}`;
      const found = s.items.find((i) => i.key === key);
      const items = found
        ? s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i))
        : [...s.items, { key, variant_id: variant.id, name: p.name, variant_name: variant.name, options, notes, qty: 1, unit_price_cents: variant.price_cents + extra }];
      return { ...s, items };
    });
  };

  const tap = (p) => {
    if (!p.available) return toast(`${p.name} está marcado como esgotado`, 'error');
    if (p.variants.length === 1 && !p.option_groups.length) add(p, p.variants[0]);
    else setPicking(p);
  };

  const qtyChange = (key, d) => setSale((s) => ({ ...s, items: s.items.map((i) => (i.key === key ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0) }));

  const lookup = async () => {
    const digits = sale.customer.phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    const c = await api.get(`/customers/by-phone/${digits}`).catch(() => null);
    if (c) {
      setSale((s) => ({
        ...s,
        customerInfo: c,
        customer: { ...s.customer, name: s.customer.name || c.name },
        address: s.address.street ? s.address : { street: c.address || '', number: c.number || '', complement: c.complement || '', reference: c.reference || '' },
        zone_id: s.zone_id || zones.data?.find((z) => z.name === c.neighborhood)?.id || '',
      }));
    } else setSale((s) => ({ ...s, customerInfo: null }));
  };

  const finish = async (payments, method, customerDoc) => {
    const scheduled = sale.scheduled && sale.day && sale.time ? `${sale.day} ${sale.time}` : null;
    const paidAll = payments.reduce((s, p) => s + p.amount_cents, 0) >= total;
    const status = sale.type === 'balcao' && paidAll && !scheduled ? 'concluido' : scheduled ? 'confirmado' : 'preparo';
    const body = {
      type: sale.type,
      channel: sale.channel,
      status,
      customer: sale.customer.phone || sale.customer.name ? sale.customer : {},
      zone_id: sale.type === 'entrega' ? sale.zone_id || null : null,
      address: sale.type === 'entrega' ? { ...sale.address, neighborhood: zone?.name || '' } : null,
      delivery_fee_cents: sale.type === 'entrega' ? fee : 0,
      scheduled_for: scheduled,
      notes: sale.notes,
      discount_cents: sale.discount_cents,
      coupon_code: sale.coupon_code || null,
      redeem_points: redeemBlocks ? redeemBlocks * loyalty.redeem_points : 0,
      payment_method: method || payments[0]?.method || null,
      payments,
      customer_doc: customerDoc || null,
      items: sale.items.map((i) => ({ variant_id: i.variant_id, qty: i.qty, options: i.options, notes: i.notes })),
    };
    const order = await api.post('/orders', body);
    setDone(order);
    setSale(emptySale());
    setPayOpen(false);
    setMobileCart(false);
    cash.reload();
  };

  if (!products.data || !categories.data) return <Spinner />;

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-stone-100 p-4">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-stone-100 p-1 text-sm">
          {[['balcao', 'Balcão'], ['retirada', 'Retirada'], ['entrega', 'Entrega']].map(([v, l]) => (
            <button key={v} onClick={() => setSale((s) => ({ ...s, type: v }))} className={cx('rounded-lg py-1.5 font-medium cursor-pointer', sale.type === v ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-600')}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Telefone" inputMode="tel" value={sale.customer.phone} onChange={(e) => setSale((s) => ({ ...s, customer: { ...s.customer, phone: maskPhone(e.target.value) } }))} onBlur={lookup} />
          <Input placeholder="Nome do cliente" value={sale.customer.name} onChange={(e) => setSale((s) => ({ ...s, customer: { ...s.customer, name: e.target.value } }))} />
        </div>
        {sale.customerInfo && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <span><User className="mr-1 inline size-3.5" />{sale.customerInfo.orders} pedidos · {brl(sale.customerInfo.spent_cents)} gastos</span>
            {loyalty?.enabled && <span className="font-medium"><Gift className="mr-1 inline size-3.5" />{sale.customerInfo.points} pts</span>}
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <Select value={sale.channel} onChange={(e) => setSale((s) => ({ ...s, channel: e.target.value }))} className="h-9">
            <option value="pdv">Venda no balcão</option>
            <option value="whatsapp">Pedido por WhatsApp</option>
            <option value="telefone">Pedido por telefone</option>
            <option value="ifood">iFood (lançado à mão)</option>
            <option value="99food">99Food (lançado à mão)</option>
            <option value="outro">Outro canal</option>
          </Select>
          <label className="flex shrink-0 items-center gap-1.5"><input type="checkbox" className="accent-brand-600" checked={sale.scheduled} onChange={(e) => setSale((s) => ({ ...s, scheduled: e.target.checked }))} /> Encomenda</label>
        </div>
        {sale.scheduled && (
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={sale.day} onChange={(e) => setSale((s) => ({ ...s, day: e.target.value }))} />
            <Input type="time" value={sale.time} onChange={(e) => setSale((s) => ({ ...s, time: e.target.value }))} />
          </div>
        )}
        {sale.type === 'entrega' && (
          <div className="grid grid-cols-6 gap-2">
            <Select className="col-span-4" value={sale.zone_id} onChange={(e) => setSale((s) => ({ ...s, zone_id: e.target.value, delivery_fee_cents: null }))}>
              <option value="">Bairro…</option>
              {(zones.data || []).filter((z) => z.active).map((z) => <option key={z.id} value={z.id}>{z.name} ({brl(z.fee_cents)})</option>)}
            </Select>
            <MoneyInput className="col-span-2" value={fee} onChange={(v) => setSale((s) => ({ ...s, delivery_fee_cents: v }))} title="Taxa de entrega" />
            <Input className="col-span-4" placeholder="Rua" value={sale.address.street} onChange={(e) => setSale((s) => ({ ...s, address: { ...s.address, street: e.target.value } }))} />
            <Input className="col-span-2" placeholder="Nº" value={sale.address.number} onChange={(e) => setSale((s) => ({ ...s, address: { ...s.address, number: e.target.value } }))} />
            <Input className="col-span-3" placeholder="Complemento" value={sale.address.complement} onChange={(e) => setSale((s) => ({ ...s, address: { ...s.address, complement: e.target.value } }))} />
            <Input className="col-span-3" placeholder="Referência" value={sale.address.reference} onChange={(e) => setSale((s) => ({ ...s, address: { ...s.address, reference: e.target.value } }))} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {!sale.items.length ? <p className="py-10 text-center text-sm text-stone-400">Toque nos produtos para adicionar</p> : (
          <ul className="space-y-1">
            {sale.items.map((i) => (
              <li key={i.key} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-stone-50">
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{i.name}</p>
                  <p className="truncate text-xs text-stone-500">{[i.variant_name, ...i.options.map((o) => o.name), i.notes && `“${i.notes}”`].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="flex items-center rounded-lg ring-1 ring-stone-200">
                  <button onClick={() => qtyChange(i.key, -1)} className="p-1.5 text-brand-600 cursor-pointer" aria-label="Menos">{i.qty === 1 ? <Trash2 className="size-3.5" /> : <Minus className="size-3.5" />}</button>
                  <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                  <button onClick={() => qtyChange(i.key, 1)} className="p-1.5 text-brand-600 cursor-pointer" aria-label="Mais"><Plus className="size-3.5" /></button>
                </div>
                <span className="w-20 text-right text-sm font-medium">{brl(i.unit_price_cents * i.qty)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2 border-t border-stone-100 p-4 text-sm">
        <Input placeholder="Observação do pedido" value={sale.notes} onChange={(e) => setSale((s) => ({ ...s, notes: e.target.value }))} className="h-9" />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Desconto"><MoneyInput value={sale.discount_cents} onChange={(v) => setSale((s) => ({ ...s, discount_cents: v }))} /></Field>
          <Field label="Cupom"><Input value={sale.coupon_code} onChange={(e) => setSale((s) => ({ ...s, coupon_code: e.target.value.toUpperCase() }))} /></Field>
        </div>
        {loyalty?.enabled && sale.customerInfo?.points >= loyalty.redeem_points && (
          <label className="flex items-center gap-2 text-brand-800"><input type="checkbox" className="accent-brand-600" checked={sale.redeem} onChange={(e) => setSale((s) => ({ ...s, redeem: e.target.checked }))} /> Usar pontos de fidelidade (− {brl(Math.floor(sale.customerInfo.points / loyalty.redeem_points) * loyalty.redeem_value_cents)})</label>
        )}
        <div className="flex justify-between text-stone-600"><span>Subtotal ({count} itens)</span><span>{brl(subtotal)}</span></div>
        {fee > 0 && <div className="flex justify-between text-stone-600"><span>Entrega</span><span>{brl(fee)}</span></div>}
        {(sale.discount_cents > 0 || redeemValue > 0) && <div className="flex justify-between text-emerald-700"><span>Descontos</span><span>− {brl(sale.discount_cents + redeemValue)}</span></div>}
        <div className="flex justify-between text-lg font-semibold"><span>Total</span><span>{brl(total)}</span></div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <Button variant="secondary" onClick={() => setSale(emptySale())} disabled={!sale.items.length}>Limpar</Button>
          <Button className="col-span-2" size="lg" disabled={!sale.items.length} onClick={() => setPayOpen(true)}>Finalizar</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="-m-4 flex h-[calc(100dvh-57px)] sm:-m-6">
      <div className="flex min-w-0 flex-1 flex-col">
        {!cash.loading && !cash.data && (
          <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            <AlertTriangle className="size-4" /> Caixa fechado. <Link to="/admin/caixa" className="font-medium underline">Abrir caixa</Link> para controlar dinheiro e fechamento.
          </div>
        )}
        <div className="space-y-2 border-b border-stone-200/70 bg-white p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar produto…" className="pl-9" />
          </div>
          <div className="no-scrollbar flex gap-1 overflow-x-auto">
            {[{ id: 'fav', name: '⭐ Mais vendidos' }, ...categories.data.filter((c) => c.active && c.products)].map((c) => (
              <button key={c.id} onClick={() => { setCat(String(c.id)); setQ(''); }} className={cx('whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium cursor-pointer', String(cat) === String(c.id) ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-700 hover:bg-brand-50')}>{c.name}</button>
            ))}
          </div>
        </div>
        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-2 overflow-y-auto p-3 pb-24 sm:grid-cols-3 lg:pb-3 xl:grid-cols-4 2xl:grid-cols-5">
          {list.map((p) => (
            <button key={p.id} onClick={() => tap(p)} className={cx('flex flex-col overflow-hidden rounded-xl bg-white text-left shadow-sm ring-1 ring-stone-200 transition hover:ring-brand-300 active:scale-[0.98] cursor-pointer', !p.available && 'opacity-50')}>
              <div className="aspect-[4/3] w-full bg-brand-50">{p.image && <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />}</div>
              <div className="p-2">
                <p className="line-clamp-2 text-sm font-medium leading-tight">{p.name}</p>
                <p className="mt-1 text-sm font-semibold text-brand-700">{p.variants.length > 1 ? `${brl(p.variants[0].price_cents)}+` : brl(p.variants[0].price_cents)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      <aside className="hidden w-[380px] shrink-0 border-l border-stone-200 bg-white lg:block xl:w-[420px]">{cartPanel}</aside>

      {/* celular/tablet em pé */}
      <button onClick={() => setMobileCart(true)} className="fixed inset-x-3 bottom-3 z-30 flex items-center justify-between rounded-2xl bg-brand-600 px-5 py-3 text-white shadow-xl lg:hidden cursor-pointer">
        <span>Venda · {count} itens</span><span className="font-semibold">{brl(total)}</span>
      </button>
      {mobileCart && (
        <div className="fixed inset-0 z-40 bg-white lg:hidden">
          <button onClick={() => setMobileCart(false)} className="absolute right-3 top-3 z-10 rounded-full bg-stone-100 p-2" aria-label="Fechar"><X className="size-5" /></button>
          {cartPanel}
        </div>
      )}

      <PickModal product={picking} onClose={() => setPicking(null)} onAdd={(v, o, n) => { add(picking, v, o, n); setPicking(null); }} />
      {payOpen && <PayModal total={total} type={sale.type} scheduled={sale.scheduled} fiscal={settings?.fiscal?.enabled} methods={(settings?.payment_methods || []).filter((m) => m.active)} onClose={() => setPayOpen(false)} onFinish={finish} />}
      <Modal open={!!done} onClose={() => setDone(null)} size="sm" title="Venda registrada" footer={
        <>
          {done && <Link to={`/admin/imprimir/${done.id}`} {...newTab}><Button variant="secondary" icon={Printer}>Imprimir</Button></Link>}
          <Button onClick={() => setDone(null)}>Nova venda</Button>
        </>
      }>
        {done && (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto size-12 text-emerald-500" />
            <p className="mt-2 text-lg font-semibold">Pedido #{done.id}</p>
            <p className="text-stone-600">{brl(done.total_cents)} {done.paid ? '· pago' : '· a receber'}</p>
            {done.customer_name && <p className="text-sm text-stone-500">{done.customer_name} {phone(done.customer_phone)}</p>}
            <div className="mt-4 text-left"><FiscalBox orderId={done.id} compact /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function PickModal({ product: p, onClose, onAdd }) {
  const [vid, setVid] = useState(null);
  const [opts, setOpts] = useState([]);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => { if (p) { setVid(p.variants[0].id); setOpts([]); setNotes(''); setErr(''); } }, [p]);
  if (!p) return null;
  const v = p.variants.find((x) => x.id === vid) || p.variants[0];
  const toggle = (g, o) => setOpts((cur) => {
    const has = cur.some((x) => x.group === g.name && x.name === o.name);
    if (has) return cur.filter((x) => !(x.group === g.name && x.name === o.name));
    const pick = { group: g.name, name: o.name, price_cents: o.price_cents };
    if (g.max === 1) return [...cur.filter((x) => x.group !== g.name), pick];
    if (g.max && cur.filter((x) => x.group === g.name).length >= g.max) return cur;
    return [...cur, pick];
  });
  const confirm = () => {
    for (const g of p.option_groups) if (opts.filter((o) => o.group === g.name).length < g.min) return setErr(`Escolha: ${g.name}`);
    onAdd(v, opts, notes);
  };
  return (
    <Modal open onClose={onClose} title={p.name} footer={<Button onClick={confirm}>Adicionar · {brl(v.price_cents + opts.reduce((s, o) => s + o.price_cents, 0))}</Button>}>
      <div className="space-y-4">
        {p.variants.length > 1 && (
          <div className="grid grid-cols-2 gap-2">
            {p.variants.map((x) => (
              <button key={x.id} onClick={() => setVid(x.id)} className={cx('rounded-xl p-3 text-left ring-1 cursor-pointer', x.id === v.id ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>
                <p className="text-sm font-medium">{x.name || 'Único'}</p>
                <p className="text-sm font-semibold text-brand-700">{brl(x.price_cents)}</p>
              </button>
            ))}
          </div>
        )}
        {p.option_groups.map((g) => (
          <div key={g.name}>
            <p className="mb-2 text-sm font-semibold">{g.name} {g.min > 0 && <span className="text-xs font-normal text-red-600">(obrigatório)</span>}</p>
            <div className="grid grid-cols-2 gap-2">
              {g.options.map((o) => {
                const on = opts.some((x) => x.group === g.name && x.name === o.name);
                return <button key={o.name} onClick={() => toggle(g, o)} className={cx('rounded-xl p-2.5 text-left text-sm ring-1 cursor-pointer', on ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>{o.name}{o.price_cents > 0 && ` (+${brl(o.price_cents)})`}</button>;
              })}
            </div>
          </div>
        ))}
        <Field label="Observação do item"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: escrever “Feliz aniversário”" /></Field>
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}

function PayModal({ total, type, scheduled, fiscal, methods, onClose, onFinish }) {
  const startLater = type !== 'balcao' || scheduled;
  const [lines, setLines] = useState([{ method: methods[0]?.id || 'dinheiro', amount_cents: startLater ? 0 : total }]);
  const [received, setReceived] = useState(0);
  const [later, setLater] = useState(startLater);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState('');
  const sum = lines.reduce((s, l) => s + l.amount_cents, 0);
  const cashLine = lines.find((l) => l.method === 'dinheiro');
  const change = cashLine && received > cashLine.amount_cents ? received - cashLine.amount_cents : 0;
  const setLine = (i, patch) => setLines((ls) => ls.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  const submit = async () => {
    setErr('');
    if (!later && sum < total) return setErr(`Faltam ${brl(total - sum)} para fechar a venda`);
    setLoading(true);
    try {
      await onFinish(lines.filter((l) => l.amount_cents > 0), lines[0].method, doc);
    } catch (e) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={`Pagamento · ${brl(total)}`} footer={<Button size="lg" loading={loading} onClick={submit}>{later ? 'Registrar pedido' : 'Concluir venda'}</Button>}>
      <div className="space-y-4">
        {type !== 'balcao' || scheduled ? (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 text-sm">
            <button onClick={() => { setLater(false); setLines([{ method: lines[0].method, amount_cents: total }]); }} className={cx('rounded-lg py-2 font-medium cursor-pointer', !later ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-600')}>Receber agora</button>
            <button onClick={() => { setLater(true); setLines([{ method: lines[0].method, amount_cents: 0 }]); }} className={cx('rounded-lg py-2 font-medium cursor-pointer', later ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-600')}>Na entrega / sinal</button>
          </div>
        ) : null}
        {later && <p className="text-sm text-stone-500">Informe a forma de pagamento combinada. Se o cliente deu um sinal, coloque o valor recebido agora.</p>}
        {lines.map((l, i) => (
          <div key={i} className="flex items-end gap-2">
            <Field label={i === 0 ? 'Forma' : undefined} className="flex-1">
              <Select value={l.method} onChange={(e) => setLine(i, { method: e.target.value })}>{methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</Select>
            </Field>
            <Field label={i === 0 ? (later ? 'Valor recebido agora' : 'Valor') : undefined} className="w-36"><MoneyInput value={l.amount_cents} onChange={(v) => setLine(i, { amount_cents: v })} /></Field>
            {lines.length > 1 && <button onClick={() => setLines((ls) => ls.filter((_, k) => k !== i))} className="mb-2 text-stone-400 hover:text-red-600" aria-label="Remover"><Trash2 className="size-4" /></button>}
          </div>
        ))}
        {!later && <Button variant="ghost" size="sm" icon={Plus} onClick={() => setLines((ls) => [...ls, { method: methods.find((m) => !ls.some((l) => l.method === m.id))?.id || methods[0].id, amount_cents: Math.max(0, total - sum) }])}>Dividir pagamento</Button>}
        {cashLine && !later && (
          <div className="grid grid-cols-2 items-end gap-3 rounded-xl bg-stone-50 p-3">
            <Field label="Dinheiro recebido"><MoneyInput value={received} onChange={setReceived} /></Field>
            <div className="pb-2 text-right"><p className="text-xs text-stone-500">Troco</p><p className="text-xl font-semibold text-emerald-700">{brl(change)}</p></div>
          </div>
        )}
        {!later && <div className={cx('flex justify-between rounded-xl px-3 py-2 text-sm font-medium', sum >= total ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800')}><span>Total informado</span><span>{brl(sum)}</span></div>}
        {fiscal && <Field label="CPF ou CNPJ na nota (opcional)"><Input value={doc} inputMode="numeric" placeholder="000.000.000-00" onChange={(e) => setDoc(maskDoc(e.target.value))} /></Field>}
        <ErrorBox>{err}</ErrorBox>
      </div>
    </Modal>
  );
}
