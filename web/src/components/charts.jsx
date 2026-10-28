import { useEffect, useRef, useState } from 'react';
import { brl } from '../lib/format.js';

// Gráficos de uma série só (uma cor), seguindo a marca: colunas finas, topo arredondado, grade discreta.
// cores do tema da loja
const BAR = 'var(--color-brand-500)';
const BAR_HOVER = 'var(--color-brand-700)';
const GRID = '#ece7e4';
const MUTED = '#8a7f83';

const compactBRL = (cents) => {
  const v = cents / 100;
  if (v >= 1000) return `R$ ${(v / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return `R$ ${Math.round(v)}`;
};

function niceMax(v) {
  if (v <= 0) return 1;
  const exp = 10 ** Math.floor(Math.log10(v));
  const n = v / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
}

function useWidth() {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    if (!ref.current) return undefined;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/**
 * Colunas verticais. data: [{ label, value, tip? }]
 * format: formatação do valor (padrão: reais a partir de centavos)
 */
export function ColumnChart({ data, height = 220, format = brl, axisFormat = compactBRL, labelEvery }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);
  const pad = { l: 64, r: 8, t: 20, b: 28 };
  const innerW = Math.max(10, width - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const band = innerW / Math.max(data.length, 1);
  const bw = Math.min(24, Math.max(2, band - 2)); // ≤ 24px, sobra vira respiro
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * max);
  const every = labelEvery || Math.ceil(data.length / Math.max(1, Math.floor(innerW / 56)));
  const peak = data.reduce((best, d, i) => (d.value > (data[best]?.value ?? -1) ? i : best), 0);

  return (
    <div ref={ref} className="relative w-full select-none">
      <svg width={width} height={height} role="img" aria-label="Gráfico de colunas">
        {ticks.map((t) => {
          const y = pad.t + innerH - (t / max) * innerH;
          return (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y} y2={y} stroke={GRID} strokeWidth="1" />
              <text x={pad.l - 8} y={y} dy="0.32em" textAnchor="end" fontSize="11" fill={MUTED}>{axisFormat(t)}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const h = max ? (d.value / max) * innerH : 0;
          const x = pad.l + i * band + (band - bw) / 2;
          const y = pad.t + innerH - h;
          const r = Math.min(4, h, bw / 2);
          const path = h > 0
            ? `M${x},${pad.t + innerH} L${x},${y + r} Q${x},${y} ${x + r},${y} L${x + bw - r},${y} Q${x + bw},${y} ${x + bw},${y + r} L${x + bw},${pad.t + innerH} Z`
            : '';
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={pad.l + i * band} y={pad.t} width={band} height={innerH} fill="transparent" />
              {path && <path d={path} style={{ fill: hover === i ? BAR_HOVER : BAR }} />}
              {i === peak && d.value > 0 && hover == null && (
                <text x={x + bw / 2} y={y - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#44383c">{axisFormat(d.value)}</text>
              )}
              {i % every === 0 && (
                <text x={x + bw / 2} y={height - 8} textAnchor="middle" fontSize="11" fill={MUTED}>{d.label}</text>
              )}
            </g>
          );
        })}
      </svg>
      {hover != null && data[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: Math.min(Math.max(pad.l + hover * band + band / 2, 60), width - 60), top: 0 }}
        >
          <p className="font-medium">{data[hover].tip || data[hover].label}</p>
          <p>{format(data[hover].value)}{data[hover].extra ? ` · ${data[hover].extra}` : ''}</p>
        </div>
      )}
    </div>
  );
}

/** Barras horizontais com rótulo e valor na ponta. data: [{ label, value, sub? }] */
export function BarList({ data, format = brl, max: maxProp }) {
  const max = maxProp || Math.max(...data.map((d) => d.value), 1);
  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.label} title={`${d.label}: ${format(d.value)}${d.sub ? ` · ${d.sub}` : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-stone-700">{d.label}</span>
            <span className="shrink-0 font-medium text-stone-900">{format(d.value)}{d.sub && <span className="ml-1 text-xs font-normal text-stone-500">{d.sub}</span>}</span>
          </div>
          <div className="h-2 rounded-full bg-brand-50">
            <div className="h-2 rounded-full" style={{ width: `${Math.max(1, (d.value / max) * 100)}%`, background: BAR }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
