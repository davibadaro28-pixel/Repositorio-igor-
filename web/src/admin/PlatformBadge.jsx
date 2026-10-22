import { cx } from '../components/ui.jsx';

// cores das marcas para reconhecer o app de onde veio o pedido de relance
const STYLE = {
  ifood: { label: 'iFood', className: 'bg-[#ea1d2c] text-white' },
  '99food': { label: '99Food', className: 'bg-[#ffdd00] text-stone-900' },
};

export default function PlatformBadge({ order, className }) {
  const s = STYLE[order.external_platform || order.channel];
  if (!s) return null;
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-none', s.className, className)}>
      {s.label}{order.external_code ? ` #${order.external_code}` : ''}
    </span>
  );
}
