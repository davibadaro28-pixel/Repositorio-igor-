import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { asset } from '../lib/env.js';
import { cx } from './ui.jsx';

// Nome e logo da loja vêm das configurações; assim o mesmo sistema serve para qualquer doceria.
let cache = null;
let pending = null;

/** Dados públicos da loja (nome, logo, WhatsApp…) para telas sem login */
export function useStoreBrand() {
  const [store, setStore] = useState(cache);
  useEffect(() => {
    if (cache) return undefined;
    let alive = true;
    pending ||= api.get('/public/store').then((s) => (cache = s)).catch(() => (pending = null));
    pending.then((s) => alive && s && setStore(s));
    return () => { alive = false; };
  }, []);
  return store;
}

/** Logo cadastrado; sem logo, as iniciais do nome. Lojas antigas (sem o campo) usam o arquivo padrão. */
export function BrandLogo({ store, className }) {
  if (!store) return <span aria-hidden="true" className={cx('block rounded-full bg-white/30', className)} />;
  const logo = store?.logo === undefined ? '/img/logo.jpg' : store.logo;
  if (logo) return <img src={asset(logo)} alt="" className={cx('rounded-full bg-white object-cover', className)} />;
  const initials = String(store?.name || '')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '🎂';
  return (
    <span aria-hidden="true" className={cx('grid place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-semibold leading-none text-white', className)}>
      {initials}
    </span>
  );
}
