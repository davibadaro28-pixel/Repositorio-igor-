import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Minus, Plus, MapPin, Clock, Instagram, MessageCircle, Star, X, Trash2, CalendarClock, Bike, Store, ChevronRight } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { brl, maskPhone, todayISO, addDaysISO, weekdayOf, parseSP } from '../lib/format.js';
import { Button, Field, Input, Modal, Select, Spinner, Textarea, cx, ErrorBox } from '../components/ui.jsx';

const CART_KEY = 'lacos_cart';
const ME_KEY = 'lacos_cliente';
const load = (k, def) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? def;
  } catch {
    return def;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* sem armazenamento */
  }
};

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function Logo({ className }) {
  return <img src="/img/logo.jpg" alt="Laços de Mãe" className={cx('rounded-full bg-white object-cover ring-4 ring-white shadow-md', className)} />;
}

export default function Menu() {
  const store = useApi('/public/store');
  const menu = useApi('/public/menu');
  const [cart, setCart] = useState(() => load(CART_KEY, []));
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(null);
  const sectionRefs = useRef({});

  useEffect(() => save(CART_KEY, cart), [cart]);

  const categories = useMemo(() => menu.data?.categories || [], [menu.data]);
  const featured = useMemo(() => categories.flatMap((c) => c.products).filter((p) => p.featured), [categories]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((c) => ({ ...c, products: c.products.filter((p) => `${p.name} ${p.description}`.toLowerCase().includes(q)) }))
      .filter((c) => c.products.length);
  }, [categories, query]);

  // marca a categoria visível na barra de navegação
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActiveCat(Number(e.target.dataset.cat))),
      { rootMargin: '-120px 0px -70% 0px' },
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [filtered]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.unit_price_cents * i.qty, 0);

  if (store.loading || menu.loading) return <Spinner className="min-h-dvh" />;
  if (store.error || menu.error) {
    return <div className="p-8 text-center text-stone-600">Não foi possível carregar o cardápio. Tente novamente em instantes.</div>;
  }
  const s = store.data;
  const today = s.hours?.[DAY_KEYS[weekdayOf(todayISO())]];

  return (
    <div className="min-h-dvh pb-28">
      {/* Topo */}
      <header className="relative overflow-hidden bg-gradient-to-b from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-10 size-56 rounded-full bg-white/5" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 pb-8 pt-8 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
          <Logo className="size-24 sm:size-28" />
          <div className="mt-3 sm:mt-0">
            <h1 className="font-script text-5xl leading-none drop-shadow-sm">{s.name}</h1>
            <p className="mt-1 text-sm font-medium uppercase tracking-[0.2em] text-brand-100">{s.tagline}</p>
            <p className="mt-2 text-sm text-white/90">🎀 {s.slogan}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs sm:justify-start">
              <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold', s.status.open ? 'bg-emerald-400/90 text-emerald-950' : 'bg-white/20')}>
                <span className={cx('size-2 rounded-full', s.status.open ? 'bg-emerald-900' : 'bg-white')} />
                {s.status.open ? `Aberto · até ${s.status.closes_at}` : s.status.reason}
              </span>
              {today?.active && <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1"><Clock className="size-3.5" /> Hoje: {today.open} às {today.close}</span>}
            </div>
          </div>
        </div>
        <div className="relative mx-auto flex max-w-5xl flex-wrap justify-center gap-2 px-4 pb-5 text-xs sm:justify-start">
          <a href={`https://maps.google.com/?q=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25"><MapPin className="size-3.5" /> {s.address.split(',').slice(0, 2).join(',')}</a>
          <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25"><MessageCircle className="size-3.5" /> WhatsApp</a>
          <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 hover:bg-white/25"><Instagram className="size-3.5" /> @{s.instagram}</a>
        </div>
      </header>

      {s.notice && <div className="bg-gold/20 px-4 py-2 text-center text-sm font-medium text-brand-900">{s.notice}</div>}
      {!s.status.open && s.scheduling_enabled && (
        <div className="bg-brand-50 px-4 py-2 text-center text-sm text-brand-800">
          Estamos fechados agora, mas você já pode <b>agendar sua encomenda</b> 🎂
        </div>
      )}

      {/* Navegação */}
      <nav className="sticky top-0 z-30 border-b border-brand-100 bg-cream/95 backdrop-blur">
        <div className="mx-auto max-w-5xl px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar bolo, brownie, pudim…" className="rounded-full pl-9" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" aria-label="Limpar"><X className="size-4" /></button>}
          </div>
          <div className="no-scrollbar -mx-4 mt-2 flex gap-1 overflow-x-auto px-4 pb-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => sectionRefs.current[c.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className={cx('whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition cursor-pointer', activeCat === c.id ? 'bg-brand-600 text-white' : 'text-stone-600 hover:bg-brand-50')}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4">
        {!query && featured.length > 0 && (
          <section className="pt-6">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-brand-800"><Star className="size-5 fill-gold text-gold" /> Os mais pedidos</h2>
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {featured.map((p) => (
                <button key={p.id} onClick={() => setProduct(p)} className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-md cursor-pointer">
                  <div className="aspect-square bg-brand-50">{p.image && <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />}</div>
                  <div className="p-2.5">
                    <p className="line-clamp-2 text-sm font-medium leading-tight text-stone-800">{p.name}</p>
                    <p className="mt-1 text-sm font-semibold text-brand-700">{p.variants.length > 1 ? 'a partir de ' : ''}{brl(Math.min(...p.variants.map((v) => v.price_cents)))}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {filtered.length === 0 && <p className="py-16 text-center text-stone-500">Nada encontrado para “{query}”.</p>}

        {filtered.map((c) => (
          <section key={c.id} data-cat={c.id} ref={(el) => (sectionRefs.current[c.id] = el)} className="scroll-mt-32 pt-7">
            <h2 className="mb-3 text-lg font-semibold text-brand-800">{c.name}</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {c.products.map((p) => (
                <ProductCard key={p.id} p={p} onOpen={() => setProduct(p)} />
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-12 border-t border-brand-100 py-6 text-center text-xs text-stone-500">
          <p className="font-script text-2xl text-brand-600">{s.name}</p>
          <p className="mt-1">{s.address}</p>
          <p className="mt-1">{s.phone} · @{s.instagram}</p>
        </footer>
      </main>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={() => setCartOpen(true)} className="animate-ring mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-brand-600 px-5 py-3.5 text-white shadow-xl cursor-pointer">
            <span className="flex items-center gap-2">
              <span className="relative"><ShoppingBag className="size-5" /><span className="absolute -right-2 -top-2 grid size-4 place-items-center rounded-full bg-gold text-[10px] font-bold text-brand-900">{count}</span></span>
              <span className="font-medium">Ver sacola</span>
            </span>
            <span className="font-semibold">{brl(subtotal)}</span>
          </button>
        </div>
      )}

      <ProductModal
        product={product}
        onClose={() => setProduct(null)}
        onAdd={(line) => {
          setCart((c) => [...c, { ...line, key: Math.random().toString(36).slice(2) }]);
          setProduct(null);
        }}
      />
      <Checkout open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} store={s} />
    </div>
  );
}

function ProductCard({ p, onOpen }) {
  const min = Math.min(...p.variants.map((v) => v.price_cents));
  return (
    <button onClick={onOpen} disabled={!p.available} className={cx('flex w-full gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-200/70 transition hover:shadow-md cursor-pointer', !p.available && 'opacity-60')}>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-stone-900">{p.name}</p>
        {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-stone-500">{p.description}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-brand-700">{p.variants.length > 1 && <span className="text-xs font-normal text-stone-500">a partir de </span>}{brl(min)}</span>
          {!p.available && <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-600">Esgotado</span>}
          {p.lead_time_hours > 0 && <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">Encomenda {p.lead_time_hours}h</span>}
        </div>
      </div>
      <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-brand-50">
        {p.image && <img src={p.image} alt="" loading="lazy" className="size-full object-cover" />}
        {p.available ? <span className="absolute bottom-1 right-1 grid size-7 place-items-center rounded-lg bg-brand-500 text-white shadow"><Plus className="size-4" /></span> : null}
      </div>
    </button>
  );
}

function Stepper({ value, onChange, min = 1 }) {
  return (
    <div className="inline-flex items-center rounded-xl ring-1 ring-stone-200">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="grid size-10 place-items-center text-brand-600 cursor-pointer" aria-label="Menos">
        {value <= 1 && min === 0 ? <Trash2 className="size-4" /> : <Minus className="size-4" />}
      </button>
      <span className="w-8 text-center font-semibold">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} className="grid size-10 place-items-center text-brand-600 cursor-pointer" aria-label="Mais"><Plus className="size-4" /></button>
    </div>
  );
}

function ProductModal({ product: p, onClose, onAdd }) {
  const [variantId, setVariantId] = useState(null);
  const [opts, setOpts] = useState([]);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (p) {
      setVariantId(p.variants[0]?.id);
      setOpts([]);
      setQty(1);
      setNotes('');
      setErr('');
    }
  }, [p]);
  if (!p) return null;
  const variant = p.variants.find((v) => v.id === variantId) || p.variants[0];
  const extra = opts.reduce((s, o) => s + (o.price_cents || 0), 0);
  const unit = variant.price_cents + extra;

  const toggleOpt = (g, o) => {
    setOpts((cur) => {
      const has = cur.some((x) => x.group === g.name && x.name === o.name);
      if (has) return cur.filter((x) => !(x.group === g.name && x.name === o.name));
      const pick = { group: g.name, name: o.name, price_cents: o.price_cents };
      if (g.max === 1) return [...cur.filter((x) => x.group !== g.name), pick];
      if (g.max && cur.filter((x) => x.group === g.name).length >= g.max) return cur;
      return [...cur, pick];
    });
  };

  const add = () => {
    for (const g of p.option_groups) {
      if (opts.filter((o) => o.group === g.name).length < g.min) return setErr(`Escolha: ${g.name}`);
    }
    onAdd({
      product_id: p.id, variant_id: variant.id, name: p.name, variant_name: variant.name, image: p.image,
      options: opts, qty, notes, unit_price_cents: unit, lead_time_hours: p.lead_time_hours,
    });
  };

  return (
    <Modal open onClose={onClose} title={p.name} footer={
      <div className="flex w-full items-center gap-3">
        <Stepper value={qty} onChange={setQty} />
        <Button className="flex-1" size="lg" onClick={add}>Adicionar · {brl(unit * qty)}</Button>
      </div>
    }>
      {p.image && <img src={p.image} alt="" className="-mt-1 mb-4 aspect-[4/3] w-full rounded-2xl object-cover" />}
      {p.description && <p className="whitespace-pre-line text-sm text-stone-600">{p.description}</p>}
      {p.lead_time_hours > 0 && <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800"><CalendarClock className="mr-1 inline size-4" /> Somente por encomenda com {p.lead_time_hours}h de antecedência.</p>}

      {p.variants.length > 1 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold text-stone-800">Tamanho</p>
          <div className="grid gap-2">
            {p.variants.map((v) => (
              <label key={v.id} className={cx('flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 ring-1 transition', v.id === variant.id ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>
                <span className="flex items-center gap-2 text-sm"><input type="radio" className="accent-brand-600" checked={v.id === variant.id} onChange={() => setVariantId(v.id)} /> {v.name}</span>
                <span className="text-sm font-semibold text-brand-700">{brl(v.price_cents)}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {p.option_groups.map((g) => (
        <div key={g.name} className="mt-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-800">
            {g.name}
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-normal text-stone-500">{g.min > 0 ? 'Obrigatório' : 'Opcional'}{g.max > 1 ? ` · até ${g.max}` : ''}</span>
          </p>
          <div className="grid gap-2">
            {g.options.map((o) => {
              const on = opts.some((x) => x.group === g.name && x.name === o.name);
              return (
                <label key={o.name} className={cx('flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 ring-1 transition', on ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>
                  <span className="flex items-center gap-2 text-sm"><input type={g.max === 1 ? 'radio' : 'checkbox'} className="accent-brand-600" checked={on} onChange={() => toggleOpt(g, o)} /> {o.name}</span>
                  {o.price_cents > 0 && <span className="text-sm text-stone-600">+ {brl(o.price_cents)}</span>}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <Field label="Alguma observação?" className="mt-4">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: escrever “Parabéns Ana” no bolo" maxLength={300} />
      </Field>
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}

// ---------------- Sacola / finalização ----------------

function slotsFor(store, ymd, minDate) {
  const day = store.hours?.[DAY_KEYS[weekdayOf(ymd)]];
  if (!day?.active) return [];
  const out = [];
  const [oh, om] = day.open.split(':').map(Number);
  const [ch, cm] = day.close.split(':').map(Number);
  for (let m = oh * 60 + om; m < ch * 60 + cm; m += 30) {
    const hhmm = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const at = parseSP(`${ymd} ${hhmm}:00`);
    if (at >= minDate) out.push(hhmm);
  }
  return out;
}

function Checkout({ open, onClose, cart, setCart, store }) {
  const navigate = useNavigate();
  const me = load(ME_KEY, {});
  const [type, setType] = useState(store.delivery_enabled ? 'entrega' : 'retirada');
  const [when, setWhen] = useState(store.status.open ? 'agora' : 'agendar');
  const [day, setDay] = useState(todayISO());
  const [time, setTime] = useState('');
  const [name, setName] = useState(me.name || '');
  const [phoneTxt, setPhoneTxt] = useState(me.phone || '');
  const [zoneId, setZoneId] = useState(me.zone_id || '');
  const [addr, setAddr] = useState(me.address || { street: '', number: '', complement: '', reference: '' });
  const [payment, setPayment] = useState('pix');
  const [changeFor, setChangeFor] = useState('');
  const [notes, setNotes] = useState('');
  const [couponTxt, setCouponTxt] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [err, setErr] = useState('');
  const [sending, setSending] = useState(false);

  const subtotal = cart.reduce((s, i) => s + i.unit_price_cents * i.qty, 0);
  const zone = store.zones.find((z) => String(z.id) === String(zoneId));
  const fee = type === 'entrega' ? zone?.fee_cents || 0 : 0;
  const discount = coupon ? (coupon.type === 'frete' ? fee : coupon.discount_cents) : 0;
  const total = Math.max(0, subtotal + fee - discount);
  const lead = Math.max(0, ...cart.map((i) => i.lead_time_hours || 0));
  const mustSchedule = !store.status.open || lead > 0;
  const minDate = new Date(Date.now() + Math.max(lead * 60, store.prep_time_min || 30) * 60000);
  const days = Array.from({ length: 14 }, (_, i) => addDaysISO(todayISO(), i)).filter((d) => slotsFor(store, d, minDate).length);
  const slots = slotsFor(store, day, minDate);

  useEffect(() => {
    if (mustSchedule) setWhen('agendar');
  }, [mustSchedule]);
  useEffect(() => {
    if (when === 'agendar' && days.length && !days.includes(day)) setDay(days[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when, days.join()]);
  useEffect(() => {
    if (!slots.includes(time)) setTime(slots[0] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots.join()]);
  useEffect(() => setCoupon(null), [subtotal]);

  const update = (key, q) => setCart((c) => (q <= 0 ? c.filter((i) => i.key !== key) : c.map((i) => (i.key === key ? { ...i, qty: q } : i))));

  const applyCoupon = async () => {
    setErr('');
    try {
      const r = await api.post('/public/coupon', { code: couponTxt, subtotal_cents: subtotal, delivery_fee_cents: fee, phone: phoneTxt });
      setCoupon(r);
    } catch (e) {
      setCoupon(null);
      setErr(e.message);
    }
  };

  const submit = async () => {
    setErr('');
    setSending(true);
    try {
      const body = {
        type,
        customer: { name, phone: phoneTxt },
        zone_id: type === 'entrega' ? zoneId || null : null,
        address: type === 'entrega' ? { ...addr, neighborhood: zone?.name || addr.neighborhood } : null,
        scheduled_for: when === 'agendar' && time ? `${day} ${time}` : null,
        payment_method: payment,
        change_for_cents: payment === 'dinheiro' && changeFor ? Math.round(Number(changeFor.replace(',', '.')) * 100) : null,
        coupon_code: coupon?.code || null,
        notes,
        items: cart.map((i) => ({ variant_id: i.variant_id, qty: i.qty, options: i.options, notes: i.notes })),
      };
      const r = await api.post('/public/orders', body);
      save(ME_KEY, { name, phone: phoneTxt, zone_id: zoneId, address: addr });
      setCart([]);
      onClose();
      navigate(`/pedido/${r.code}?novo=1`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;
  if (!cart.length) {
    return (
      <Modal open onClose={onClose} title="Sua sacola">
        <p className="py-8 text-center text-stone-500">Sua sacola está vazia.</p>
      </Modal>
    );
  }

  const pill = (active) => cx('flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ring-1 transition cursor-pointer', active ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-stone-700 ring-stone-200');

  return (
    <Modal open onClose={onClose} title="Finalizar pedido" size="lg" footer={
      <Button size="lg" className="w-full" loading={sending} onClick={submit}>Enviar pedido · {brl(total)}</Button>
    }>
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">Itens</h3>
          <ul className="divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
            {cart.map((i) => (
              <li key={i.key} className="flex items-center gap-3 p-3">
                {i.image && <img src={i.image} alt="" className="size-12 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{i.name}{i.variant_name && <span className="text-stone-500"> · {i.variant_name}</span>}</p>
                  {i.options?.length > 0 && <p className="text-xs text-stone-500">{i.options.map((o) => o.name).join(', ')}</p>}
                  {i.notes && <p className="text-xs italic text-stone-500">“{i.notes}”</p>}
                  <p className="text-sm font-semibold text-brand-700">{brl(i.unit_price_cents * i.qty)}</p>
                </div>
                <Stepper value={i.qty} min={0} onChange={(q) => update(i.key, q)} />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">Como você quer receber?</h3>
          <div className="flex gap-2">
            {store.delivery_enabled && <button className={pill(type === 'entrega')} onClick={() => setType('entrega')}><Bike className="size-4" /> Entrega</button>}
            {store.pickup_enabled && <button className={pill(type === 'retirada')} onClick={() => setType('retirada')}><Store className="size-4" /> Retirar na loja</button>}
          </div>
          {type === 'retirada' && <p className="mt-2 text-xs text-stone-500">Retirada em: {store.address}</p>}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">Quando?</h3>
          <div className="flex gap-2">
            <button className={pill(when === 'agora')} disabled={mustSchedule} onClick={() => setWhen('agora')}>
              <Clock className="size-4" /> {store.status.open ? `Agora (~${type === 'entrega' ? store.delivery_time_min : store.prep_time_min} min)` : 'Fechado agora'}
            </button>
            {store.scheduling_enabled && <button className={pill(when === 'agendar')} onClick={() => setWhen('agendar')}><CalendarClock className="size-4" /> Agendar encomenda</button>}
          </div>
          {lead > 0 && <p className="mt-2 text-xs text-brand-700">Sua sacola tem item feito sob encomenda ({lead}h de antecedência).</p>}
          {when === 'agendar' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Field label="Data">
                <Select value={day} onChange={(e) => setDay(e.target.value)}>
                  {days.map((d) => <option key={d} value={d}>{new Date(d + 'T12:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short', day: '2-digit', month: '2-digit' })}</option>)}
                </Select>
              </Field>
              <Field label="Horário">
                <Select value={time} onChange={(e) => setTime(e.target.value)}>
                  {slots.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Field label="Seu nome"><Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" /></Field>
          <Field label="WhatsApp"><Input value={phoneTxt} onChange={(e) => setPhoneTxt(maskPhone(e.target.value))} inputMode="tel" placeholder="(11) 90000-0000" autoComplete="tel" /></Field>
        </section>

        {type === 'entrega' && (
          <section className="grid gap-3 sm:grid-cols-2">
            <Field label="Bairro" className="sm:col-span-2" hint={zone ? `Taxa de entrega: ${brl(zone.fee_cents)}` : store.allow_out_of_zone ? 'Não achou seu bairro? Deixe em branco e combinamos a taxa' : ''}>
              <Select value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                <option value="">Selecione o bairro…</option>
                {store.zones.map((z) => <option key={z.id} value={z.id}>{z.name} — {brl(z.fee_cents)}</option>)}
              </Select>
            </Field>
            <Field label="Rua / Avenida" className="sm:col-span-2"><Input value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} autoComplete="address-line1" /></Field>
            <Field label="Número"><Input value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} /></Field>
            <Field label="Complemento"><Input value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} placeholder="Apto, bloco…" /></Field>
            <Field label="Ponto de referência" className="sm:col-span-2"><Input value={addr.reference} onChange={(e) => setAddr({ ...addr, reference: e.target.value })} /></Field>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-semibold text-stone-800">Pagamento {type === 'entrega' ? 'na entrega' : 'na retirada'}</h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {store.payment_methods.map((m) => (
              <label key={m.id} className={cx('flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm ring-1', payment === m.id ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>
                <input type="radio" className="accent-brand-600" checked={payment === m.id} onChange={() => setPayment(m.id)} /> {m.label}
              </label>
            ))}
          </div>
          {payment === 'pix' && store.pix_key && (
            <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Chave Pix: <b className="select-all">{store.pix_key}</b>{store.pix_name ? ` (${store.pix_name})` : ''}. Envie o comprovante no WhatsApp.</p>
          )}
          {payment === 'dinheiro' && (
            <Field label="Troco para quanto?" className="mt-2" hint="Deixe em branco se não precisar de troco">
              <Input value={changeFor} onChange={(e) => setChangeFor(e.target.value.replace(/[^\d,]/g, ''))} inputMode="decimal" placeholder="Ex.: 100" />
            </Field>
          )}
        </section>

        <section className="flex gap-2">
          <Input value={couponTxt} onChange={(e) => setCouponTxt(e.target.value.toUpperCase())} placeholder="Cupom de desconto" />
          <Button variant="secondary" onClick={applyCoupon} disabled={!couponTxt}>Aplicar</Button>
        </section>

        <Field label="Observações do pedido"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} placeholder="Ex.: tocar o interfone 12" /></Field>

        <section className="space-y-1 rounded-2xl bg-brand-50/60 p-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          {type === 'entrega' && <div className="flex justify-between"><span>Entrega</span><span>{zone ? brl(fee) : 'a combinar'}</span></div>}
          {discount > 0 && <div className="flex justify-between text-emerald-700"><span>Desconto ({coupon.code})</span><span>− {brl(discount)}</span></div>}
          <div className="flex justify-between border-t border-brand-100 pt-2 text-base font-semibold"><span>Total</span><span>{brl(total)}</span></div>
        </section>
        <ErrorBox>{err}</ErrorBox>
        <p className="flex items-center gap-1 text-xs text-stone-500"><ChevronRight className="size-3" /> Você acompanha o status do pedido em tempo real na próxima tela.</p>
      </div>
    </Modal>
  );
}
