import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Minus, Plus, MapPin, Clock, Instagram, MessageCircle, Star, X, Trash2, CalendarClock, Bike, Store, ChevronRight, Info, Cake } from 'lucide-react';
import { api, useApi } from '../lib/api.js';
import { BrandLogo } from '../components/Brand.jsx';
import { brl, maskPhone, phone, todayISO, addDaysISO, weekdayOf, parseSP } from '../lib/format.js';
import { Button, Field, Input, Modal, Select, Spinner, Textarea, cx, ErrorBox } from '../components/ui.jsx';
import { cleanDesc, displayName, norm, shortName, splitTitle } from '../lib/menuText.js';

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
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const minPrice = (p) => Math.min(...p.variants.map((v) => v.price_cents));

const Logo = ({ store, className }) => <BrandLogo store={store} className={className} />;

// borda rendada no fim do topo (lembra o papel rendado das confeitarias)
const LACE = {
  backgroundImage: 'radial-gradient(circle at 10px 12px, var(--color-cream) 8.5px, transparent 9px)',
  backgroundSize: '20px 12px',
  backgroundRepeat: 'repeat-x',
};

const maskCpf = (v) => String(v || '').replace(/\D/g, '').slice(0, 11)
  .replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');

export default function Menu() {
  const store = useApi('/public/store');
  const menu = useApi('/public/menu');
  const [cart, setCart] = useState(() => load(CART_KEY, []));
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [active, setActive] = useState('destaques');
  const tabsRef = useRef(null);
  const tabRefs = useRef({});

  useEffect(() => save(CART_KEY, cart), [cart]);
  useEffect(() => {
    if (store.data?.name) document.title = `${store.data.name}${store.data.tagline ? ` – ${store.data.tagline}` : ''}`;
  }, [store.data?.name, store.data?.tagline]);

  // categorias agrupadas em seções (Bolos, Docinhos…), na ordem definida no painel
  const sections = useMemo(() => {
    const list = [];
    for (const c of menu.data?.categories || []) {
      const key = c.section || c.name;
      let sec = list.find((x) => x.key === key);
      if (!sec) list.push((sec = { key, id: `sec-${norm(key).replace(/ /g, '-')}`, categories: [] }));
      const t = splitTitle(c.name);
      sec.categories.push({ ...c, ...t, products: c.products.map((p) => ({ ...p, short: shortName(p.name, t.title) })) });
    }
    return list;
  }, [menu.data]);
  const featured = useMemo(() => sections.flatMap((s) => s.categories.flatMap((c) => c.products)).filter((p) => p.featured), [sections]);
  const results = useMemo(() => {
    const q = norm(query);
    if (!q) return [];
    return sections.flatMap((s) => s.categories.flatMap((c) => c.products))
      .filter((p) => norm(`${p.name} ${p.description}`).includes(q));
  }, [sections, query]);

  // marca na barra a seção que está na tela
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.sec)),
      { rootMargin: '-90px 0px -65% 0px' },
    );
    document.querySelectorAll('[data-sec]').forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections, searching]);
  useEffect(() => {
    const tab = tabRefs.current[active];
    const bar = tabsRef.current;
    if (tab && bar) bar.scrollTo({ left: tab.offsetLeft - bar.clientWidth / 2 + tab.clientWidth / 2, behavior: 'smooth' });
  }, [active]);

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const subtotal = cart.reduce((s, i) => s + i.unit_price_cents * i.qty, 0);

  if (store.loading || menu.loading) return <Spinner className="min-h-dvh" />;
  if (store.error || menu.error) {
    return <div className="p-8 text-center text-stone-600">Não foi possível carregar o cardápio. Tente novamente em instantes.</div>;
  }
  const s = store.data;
  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const tabs = [...(featured.length ? [{ id: 'destaques', label: 'Mais pedidos' }] : []), ...sections.map((x) => ({ id: x.id, label: x.key }))];
  const modes = [s.delivery_enabled && 'Entrega', s.pickup_enabled && 'Retirada', s.scheduling_enabled && 'Encomendas'].filter(Boolean);

  return (
    <div className="min-h-dvh bg-cream pb-28">
      {/* Topo compacto: marca, status e acesso às informações */}
      <header className="relative bg-brand-700 text-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 pb-4 pt-5 sm:pt-7">
          <Logo store={s} className="size-16 shrink-0 text-2xl ring-2 ring-white/80 sm:size-20 sm:text-3xl" />
          <div className="min-w-0 flex-1">
            <h1 className="font-script text-[2.15rem] leading-none sm:text-5xl">{s.name}</h1>
            <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.25em] text-brand-200">{s.tagline}</p>
            <p className="mt-1 hidden text-sm text-white/85 sm:block">{s.slogan}</p>
          </div>
          <div className="flex shrink-0 gap-2">
            {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" aria-label="Instagram" className="grid size-10 place-items-center rounded-full bg-white/12 hover:bg-white/20"><Instagram className="size-5" /></a>}
            {s.whatsapp && <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="grid size-10 place-items-center rounded-full bg-white/12 hover:bg-white/20"><MessageCircle className="size-5" /></a>}
          </div>
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 pb-7 text-xs">
          <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold', s.status.open ? 'bg-emerald-400 text-emerald-950' : 'bg-white/15 text-white')}>
            <span className={cx('size-1.5 rounded-full', s.status.open ? 'bg-emerald-900' : 'bg-white')} />
            {s.status.open ? `Aberto até ${s.status.closes_at}` : s.status.reason}
          </span>
          {modes.length > 0 && <span className="hidden rounded-full bg-white/12 px-3 py-1.5 sm:inline">{modes.join(' · ')}</span>}
          <button onClick={() => setInfoOpen(true)} className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 font-medium text-brand-700 hover:bg-brand-50 cursor-pointer">
            <Info className="size-3.5" /> Horários e entrega
          </button>
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 -bottom-px h-3" style={LACE} />
      </header>

      {s.notice && <div className="mx-auto mt-3 max-w-5xl px-4"><p className="rounded-2xl bg-gold/15 px-4 py-2.5 text-center text-sm font-medium text-brand-900">{s.notice}</p></div>}
      {!s.status.open && s.scheduling_enabled && (
        <div className="mx-auto mt-3 max-w-5xl px-4">
          <p className="flex items-center justify-center gap-2 rounded-2xl bg-brand-50 px-4 py-2.5 text-center text-sm text-brand-800">
            <CalendarClock className="size-4 shrink-0" /> Estamos fechados agora, mas você já pode agendar sua encomenda.
          </p>
        </div>
      )}

      {/* Navegação por seções */}
      <nav className="sticky top-0 z-30 mt-2 border-b border-brand-100/80 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          {searching ? (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar bolo, brownie, pudim…" className="rounded-full pl-9 pr-9" />
              <button onClick={() => { setSearching(false); setQuery(''); }} className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-stone-500 hover:bg-stone-100" aria-label="Fechar busca"><X className="size-4" /></button>
            </div>
          ) : (
            <>
              <button onClick={() => setSearching(true)} className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-stone-600 ring-1 ring-stone-200 hover:text-brand-700 cursor-pointer" aria-label="Buscar no cardápio"><Search className="size-4" /></button>
              <div ref={tabsRef} className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
                {tabs.map((t) => (
                  <button
                    key={t.id}
                    ref={(el) => (tabRefs.current[t.id] = el)}
                    onClick={() => go(t.id)}
                    className={cx('whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition cursor-pointer', active === t.id ? 'bg-brand-700 text-white' : 'text-stone-600 hover:bg-white hover:text-brand-700')}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4">
        {searching && query ? (
          <section className="pt-5">
            <p className="mb-4 text-sm text-stone-500">{results.length ? `${results.length} resultado${results.length > 1 ? 's' : ''} para “${query}”` : `Nada encontrado para “${query}”.`}</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => <ProductTile key={p.id} p={p} title={p.name} onOpen={() => setProduct(p)} />)}
            </div>
          </section>
        ) : (
          <>
            {featured.length > 0 && (
              <section id="destaques" data-sec="destaques" className="scroll-mt-16 pt-6">
                <h2 className="flex items-center gap-2 text-xl font-semibold text-brand-900"><Star className="size-5 fill-gold text-gold" /> Os mais pedidos</h2>
                <div className="no-scrollbar -mx-4 mt-3 flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:scroll-px-0 sm:px-0">
                  {featured.map((p) => (
                    <div key={p.id} className="w-40 shrink-0 snap-start sm:w-48">
                      <ProductTile p={p} title={p.name} onOpen={() => setProduct(p)} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {sections.map((sec) => {
              const single = sec.categories.length === 1 ? sec.categories[0] : null;
              const total = sec.categories.reduce((n, c) => n + c.products.length, 0);
              return (
                <section key={sec.id} id={sec.id} data-sec={sec.id} className="scroll-mt-16 pt-9">
                  <div className="flex items-baseline justify-between gap-3 border-b border-brand-100 pb-2">
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-brand-900">
                      {sec.key}
                      {single?.badge && <NewBadge>{single.badge}</NewBadge>}
                    </h2>
                    <span className="text-xs text-stone-500">{total} {total === 1 ? 'opção' : 'opções'}</span>
                  </div>
                  {sec.categories.map((c) => (
                    <div key={c.id} className="pt-5">
                      {!single && (
                        <h3 className="mb-3 flex flex-wrap items-center gap-2 text-[15px] font-semibold text-stone-800">
                          {c.title}
                          {c.note && <span className="text-sm font-normal text-stone-500">{c.note}</span>}
                          {c.badge && <NewBadge>{c.badge}</NewBadge>}
                        </h3>
                      )}
                      <div className={cx('grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-4', single && 'pt-1')}>
                        {c.products.map((p) => <ProductTile key={p.id} p={p} title={single ? p.name : p.short} onOpen={() => setProduct(p)} />)}
                      </div>
                    </div>
                  ))}
                </section>
              );
            })}
          </>
        )}

        <footer className="mt-14 flex flex-col items-center gap-2 border-t border-brand-100 py-8 text-center text-sm text-stone-500">
          <Logo store={s} className="size-12 text-lg ring-1 ring-brand-100" />
          <p className="font-script text-2xl text-brand-700">{s.name}</p>
          <p>{s.slogan}</p>
          <p className="text-xs">{s.address}</p>
          <button onClick={() => setInfoOpen(true)} className="mt-1 text-sm font-medium text-brand-700 underline-offset-4 hover:underline cursor-pointer">Horários, bairros atendidos e pagamento</button>
        </footer>
      </main>

      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button onClick={() => setCartOpen(true)} className="mx-auto flex w-full max-w-lg items-center justify-between rounded-2xl bg-brand-700 px-5 py-3.5 text-white shadow-xl shadow-brand-900/20 cursor-pointer">
            <span className="flex items-center gap-2.5">
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
      <StoreInfo open={infoOpen} onClose={() => setInfoOpen(false)} store={s} />
      <Checkout open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} store={s} />
    </div>
  );
}

function NewBadge({ children }) {
  return <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-800">{children}</span>;
}

function ProductTile({ p, title, onOpen }) {
  const multi = p.variants.length > 1;
  return (
    <button onClick={onOpen} disabled={!p.available} className="group flex w-full flex-col text-left cursor-pointer disabled:cursor-default">
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-900/5">
        {p.image
          ? <img src={p.image} alt="" loading="lazy" className={cx('size-full object-cover transition duration-300 group-hover:scale-[1.03]', !p.available && 'grayscale')} />
          : <span className="grid size-full place-items-center text-brand-200"><Cake className="size-1/3" strokeWidth={1.25} /></span>}
        {p.lead_time_hours > 0 && <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-medium text-brand-800 shadow-sm">Encomenda {p.lead_time_hours}h</span>}
        {p.available ? (
          <span className="absolute bottom-2 right-2 grid size-9 place-items-center rounded-full bg-white text-brand-700 shadow-md transition group-hover:bg-brand-700 group-hover:text-white"><Plus className="size-5" /></span>
        ) : (
          <span className="absolute inset-x-2 bottom-2 rounded-full bg-stone-900/75 py-1 text-center text-xs font-medium text-white">Esgotado hoje</span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[15px] font-medium leading-snug text-stone-900">{displayName(title)}</p>
      <p className="mt-0.5 text-sm">
        {multi && <span className="text-xs text-stone-500">a partir de </span>}
        <span className="font-semibold text-brand-700">{brl(minPrice(p))}</span>
      </p>
    </button>
  );
}

function StoreInfo({ open, onClose, store: s }) {
  if (!open) return null;
  const todayIdx = weekdayOf(todayISO());
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <Modal open onClose={onClose} title="Informações da loja">
      <div className="space-y-6 text-sm">
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><ShoppingBag className="size-4 text-brand-600" /> Como pedir</h3>
          <p className="text-stone-700">{[s.delivery_enabled && 'Entrega em casa', s.pickup_enabled && 'retirada na loja', s.scheduling_enabled && 'encomendas com data marcada'].filter(Boolean).join(', ')}.</p>
          {s.min_order_cents > 0 && <p className="mt-1 text-stone-500">Pedido mínimo de {brl(s.min_order_cents)}.</p>}
        </section>
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><MapPin className="size-4 text-brand-600" /> Endereço</h3>
          <p className="text-stone-700">{s.address}</p>
          <a href={`https://maps.google.com/?q=${encodeURIComponent(s.address)}`} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium text-brand-700 hover:underline">Ver no mapa</a>
        </section>
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><Clock className="size-4 text-brand-600" /> Horário de funcionamento</h3>
          <dl className="divide-y divide-stone-100 rounded-2xl ring-1 ring-stone-200">
            {order.map((d) => {
              const h = s.hours?.[DAY_KEYS[d]];
              return (
                <div key={d} className={cx('flex justify-between px-3 py-2', d === todayIdx && 'bg-brand-50 font-medium text-brand-800')}>
                  <dt>{DAY_NAMES[d]}{d === todayIdx && ' (hoje)'}</dt>
                  <dd className="tabular-nums">{h?.active ? `${h.open} às ${h.close}` : 'Fechado'}</dd>
                </div>
              );
            })}
          </dl>
        </section>
        {s.delivery_enabled && s.zones.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><Bike className="size-4 text-brand-600" /> Bairros atendidos</h3>
            <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {s.zones.map((z) => (
                <li key={z.id} className="flex justify-between border-b border-stone-100 py-1.5">
                  <span>{z.name}</span><span className="tabular-nums text-stone-600">{brl(z.fee_cents)}</span>
                </li>
              ))}
            </ul>
            {s.pickup_enabled && <p className="mt-2 text-xs text-stone-500">Prefere buscar? A retirada na loja não tem taxa.</p>}
          </section>
        )}
        <section>
          <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><Store className="size-4 text-brand-600" /> Pagamento</h3>
          <p className="text-stone-700">{s.payment_methods.map((m) => m.label).join(' · ')}</p>
        </section>
        {(s.whatsapp || s.instagram) && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-semibold text-stone-900"><MessageCircle className="size-4 text-brand-600" /> Contato</h3>
            {s.whatsapp && <p className="text-stone-700">WhatsApp <span className="select-all font-medium">{s.phone || phone(s.whatsapp.slice(2))}</span></p>}
            {s.instagram && <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">@{s.instagram}</a>}
          </section>
        )}
      </div>
    </Modal>
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
    <Modal open onClose={onClose} title={displayName(p.name)} footer={
      <div className="flex w-full items-center gap-3">
        <Stepper value={qty} onChange={setQty} />
        <Button className="flex-1" size="lg" onClick={add}>Adicionar · {brl(unit * qty)}</Button>
      </div>
    }>
      {p.image && <img src={p.image} alt="" className="-mt-1 mb-4 aspect-[4/3] w-full rounded-2xl object-cover" />}
      {cleanDesc(p.description, p.name) && <p className="text-sm leading-relaxed text-stone-600">{cleanDesc(p.description, p.name)}</p>}
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
  const [doc, setDoc] = useState(me.doc || '');
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
        customer_doc: store.cpf_na_nota ? doc : null,
        items: cart.map((i) => ({ variant_id: i.variant_id, qty: i.qty, options: i.options, notes: i.notes })),
      };
      const r = await api.post('/public/orders', body);
      save(ME_KEY, { name, phone: phoneTxt, zone_id: zoneId, address: addr, doc });
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

        {store.cpf_na_nota && (
          <Field label="CPF na nota (opcional)">
            <Input value={doc} onChange={(e) => setDoc(maskCpf(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" autoComplete="off" />
          </Field>
        )}

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
