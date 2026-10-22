import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X, Loader2, Inbox } from 'lucide-react';
import { STATUS, moneyInput, parseMoney } from '../lib/format.js';

export const cx = (...c) => c.filter(Boolean).join(' ');

const VARIANTS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50',
  ghost: 'text-stone-600 hover:bg-stone-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  dark: 'bg-stone-800 text-white hover:bg-stone-900',
};
const SIZES = { sm: 'h-8 px-3 text-sm', md: 'h-10 px-4 text-sm', lg: 'h-12 px-5 text-base' };

export function Button({ variant = 'primary', size = 'md', className, loading, children, icon: Icon, ...props }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50 disabled:pointer-events-none cursor-pointer whitespace-nowrap',
        VARIANTS[variant], SIZES[size], className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4" /> : null}
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cx('block', className)}>
      {label && <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

const inputCls = 'w-full rounded-xl border border-stone-200 bg-white px-3 h-10 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:bg-stone-50';

export const Input = ({ className, ...props }) => <input className={cx(inputCls, className)} {...props} />;
export const Textarea = ({ className, ...props }) => <textarea className={cx(inputCls, 'h-auto py-2 min-h-20', className)} {...props} />;
export function Select({ className, children, ...props }) {
  return <select className={cx(inputCls, 'pr-8', className)} {...props}>{children}</select>;
}

/** Campo de dinheiro: o valor é sempre em centavos */
export function MoneyInput({ value, onChange, className, ...props }) {
  const [text, setText] = useState(moneyInput(value));
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(moneyInput(value));
  }, [value, focused]);
  return (
    <div className={cx('relative', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">R$</span>
      <input
        inputMode="decimal"
        className={cx(inputCls, 'pl-9')}
        value={text}
        onFocus={(e) => { setFocused(true); e.target.select(); }}
        onBlur={() => { setFocused(false); setText(moneyInput(parseMoney(text))); }}
        onChange={(e) => { setText(e.target.value); onChange(parseMoney(e.target.value)); }}
        {...props}
      />
    </div>
  );
}

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={cx('inline-flex items-center gap-2 select-none', disabled ? 'opacity-50' : 'cursor-pointer')}>
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-stone-300')}
      >
        <span className={cx('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
      {label && <span className="text-sm text-stone-700">{label}</span>}
    </label>
  );
}

export function Badge({ className, children }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', className)}>{children}</span>;
}
export const StatusBadge = ({ status }) => <Badge className={STATUS[status]?.color}>{STATUS[status]?.label || status}</Badge>;

export function Card({ className, children, ...props }) {
  return <div className={cx('rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70', className)} {...props}>{children}</div>;
}

export function Stat({ label, value, sub, icon: Icon, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-50 text-brand-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600', blue: 'bg-sky-50 text-sky-600', red: 'bg-red-50 text-red-600' };
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-1 text-xl font-semibold text-stone-900 sm:text-2xl">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
        </div>
        {Icon && <span className={cx('rounded-xl p-2', tones[tone])}><Icon className="size-5" /></span>}
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-stone-900 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Spinner({ className }) {
  return (
    <div className={cx('flex items-center justify-center py-16 text-brand-600', className)}>
      <Loader2 className="size-6 animate-spin" />
    </div>
  );
}

export function Empty({ icon: Icon = Inbox, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <span className="mb-3 rounded-2xl bg-brand-50 p-3 text-brand-500"><Icon className="size-6" /></span>
      <p className="font-medium text-stone-800">{title}</p>
      {children && <div className="mt-1 max-w-sm text-sm text-stone-500">{children}</div>}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{children}</div>;
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/40 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cx('flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl', widths[size])}>
        <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700" aria-label="Fechar"><X className="size-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Tabs({ tabs, value, onChange, className }) {
  return (
    <div className={cx('no-scrollbar flex gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1', className)}>
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cx('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition cursor-pointer', value === t.value ? 'bg-white text-brand-700 shadow-sm' : 'text-stone-600 hover:text-stone-900')}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-xs text-brand-700">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Table({ children, className }) {
  return (
    <div className={cx('overflow-x-auto', className)}>
      <table className="w-full text-left text-sm [&_td]:px-3 [&_td]:py-2.5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-stone-500 [&_tbody_tr]:border-t [&_tbody_tr]:border-stone-100">
        {children}
      </table>
    </div>
  );
}

// ---------- Avisos (toast) ----------

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((message, tone = 'success') => {
    const id = Math.random();
    setItems((l) => [...l, { id, message, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div key={t.id} className={cx('pointer-events-auto rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg', t.tone === 'error' ? 'bg-red-600' : 'bg-stone-800')}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
