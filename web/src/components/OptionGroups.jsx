import { Minus, Plus } from 'lucide-react';
import { brl } from '../lib/format.js';
import { cx } from './ui.jsx';

const countIn = (picks, g, o) => picks.filter((x) => x.group === g.name && (!o || x.name === o.name)).length;

/** Primeiro grupo obrigatório sem escolhas suficientes (ou null) */
export function missingGroup(groups, picks) {
  return groups.find((g) => countIn(picks, g) < (g.min || 0)) || null;
}

const groupHint = (g) => {
  if (g.min > 0 && g.min === g.max) return g.max > 1 ? `Escolha ${g.max}` : 'Obrigatório';
  const req = g.min > 0 ? `Obrigatório${g.min > 1 ? ` · mín. ${g.min}` : ''}` : 'Opcional';
  return g.max > 1 ? `${req} · até ${g.max}` : req;
};

/**
 * Escolhas e adicionais de um produto (cardápio e PDV).
 * Grupos com "repeat" aceitam a mesma opção mais de uma vez (2x bacon, 4 lanches no combo família).
 */
export default function OptionGroups({ groups, value, onChange, compact = false }) {
  const add = (g, o) => {
    const pick = { group: g.name, name: o.name, price_cents: o.price_cents };
    if (g.max === 1 && !g.repeat) return onChange([...value.filter((x) => x.group !== g.name), pick]);
    if (g.max && countIn(value, g) >= g.max) return undefined;
    return onChange([...value, pick]);
  };
  const remove = (g, o) => {
    const i = value.findLastIndex((x) => x.group === g.name && x.name === o.name);
    if (i >= 0) onChange(value.filter((_, k) => k !== i));
  };
  const toggle = (g, o) => (countIn(value, g, o) ? remove(g, o) : add(g, o));

  return groups.map((g) => {
    const total = countIn(value, g);
    const full = g.max > 0 && total >= g.max;
    return (
      <div key={g.name} className="mt-4 first:mt-0">
        <p className="mb-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-800">
          {g.name}
          <span className={cx('rounded-full px-2 py-0.5 text-xs font-normal', g.min > 0 && total < g.min ? 'bg-brand-50 text-brand-800' : 'bg-stone-100 text-stone-500')}>{groupHint(g)}</span>
          {g.repeat && g.max > 1 && <span className="text-xs font-normal text-stone-500">{total}/{g.max}</span>}
        </p>
        <div className={cx('grid gap-2', compact && 'grid-cols-2')}>
          {g.options.map((o) => {
            const n = countIn(value, g, o);
            const price = o.price_cents > 0 && <span className="text-sm text-stone-600">+ {brl(o.price_cents)}</span>;
            if (g.repeat) {
              return (
                <div key={o.name} className={cx('flex items-center justify-between gap-2 rounded-xl py-1.5 pl-3 pr-1.5 ring-1 transition', n ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>
                  <span className="min-w-0 text-sm">{o.name}{compact && o.price_cents > 0 && <span className="block text-xs text-stone-500">+ {brl(o.price_cents)}</span>}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {!compact && price}
                    {n > 0 && (
                      <>
                        <button type="button" onClick={() => remove(g, o)} className="grid size-8 place-items-center rounded-lg text-brand-600 ring-1 ring-brand-200 cursor-pointer" aria-label={`Tirar ${o.name}`}><Minus className="size-4" /></button>
                        <span className="w-5 text-center text-sm font-semibold">{n}</span>
                      </>
                    )}
                    <button type="button" disabled={full} onClick={() => add(g, o)} className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed" aria-label={`Adicionar ${o.name}`}><Plus className="size-4" /></button>
                  </span>
                </div>
              );
            }
            const on = n > 0;
            if (compact) {
              return <button type="button" key={o.name} onClick={() => toggle(g, o)} className={cx('rounded-xl p-2.5 text-left text-sm ring-1 cursor-pointer', on ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200')}>{o.name}{o.price_cents > 0 && ` (+${brl(o.price_cents)})`}</button>;
            }
            return (
              <label key={o.name} className={cx('flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 ring-1 transition', on ? 'bg-brand-50 ring-brand-400' : 'ring-stone-200', !on && full && g.max > 1 && 'opacity-50')}>
                <span className="flex items-center gap-2 text-sm"><input type={g.max === 1 ? 'radio' : 'checkbox'} className="accent-brand-600" checked={on} onChange={() => toggle(g, o)} /> {o.name}</span>
                {price}
              </label>
            );
          })}
        </div>
      </div>
    );
  });
}
