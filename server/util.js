import { fail } from './auth.js';
import { today } from './db.js';

export const int = (v, def = null) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};
export const num = (v, def = null) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
export const cents = (v) => {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 0) fail(400, 'Valor inválido');
  return n;
};
export const bool = (v) => (v === true || v === 1 || v === '1' || v === 'true' ? 1 : 0);
export const str = (v, max = 500) => {
  const s = String(v ?? '').trim();
  return s ? s.slice(0, max) : null;
};
export const required = (v, label, max = 200) => {
  const s = str(v, max);
  if (!s) fail(400, `Informe ${label}`);
  return s;
};
const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const date = (v, def = null) => (DATE.test(String(v || '')) ? String(v) : def);

// Período padrão: últimos 30 dias
export function range(query, days = 30) {
  const to = date(query.to, today());
  const d = new Date(to + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() - (days - 1));
  const from = date(query.from, d.toISOString().slice(0, 10));
  return { from, to, fromTs: `${from} 00:00:00`, toTs: `${to} 23:59:59` };
}

export const addDays = (ymd, n) => {
  const d = new Date(ymd + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const addMonths = (ymd, n) => {
  const [y, m, d] = ymd.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0, 12)).getUTCDate();
  target.setUTCDate(Math.min(d, last));
  return target.toISOString().slice(0, 10);
};

export function toCsv(rows, columns) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(';');
  const body = rows.map((r) => columns.map((c) => esc(c.value(r))).join(';'));
  return '﻿' + [head, ...body].join('\n');
}

export const money = (c) => (c / 100).toFixed(2).replace('.', ',');
