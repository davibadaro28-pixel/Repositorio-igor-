const brlFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const brl = (cents) => brlFmt.format((cents || 0) / 100);

/** "12,50" / "12.50" / "1.234,56" → centavos */
export function parseMoney(text) {
  const s = String(text ?? '').trim().replace(/[R$\s]/g, '');
  if (!s) return 0;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
export const moneyInput = (cents) => ((cents || 0) / 100).toFixed(2).replace('.', ',');

export const pct = (n) => `${(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
export const qty = (n) => (Math.round((n || 0) * 100) / 100).toLocaleString('pt-BR');

export function phone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return p || '';
}

export function maskPhone(v) {
  const d = String(v || '').replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Datas do servidor vêm em horário de São Paulo: 'YYYY-MM-DD HH:MM:SS' (UTC−3, sem horário de verão)
export const parseSP = (s) => (s ? new Date(s.replace(' ', 'T').slice(0, 19) + '-03:00') : null);
const spFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
/** Agora em São Paulo: 'YYYY-MM-DD HH:MM' */
export const nowSP = () => spFmt.format(new Date()).replace('T', ' ');
export const dateBR = (s) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '');
export const timeBR = (s) => (s ? s.slice(11, 16) : '');
export const dateTimeBR = (s) => (s ? `${dateBR(s)} ${timeBR(s)}` : '');
const WEEK = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
export const weekdayBR = (s) => WEEK[new Date(s.slice(0, 10) + 'T12:00:00Z').getUTCDay()];

export function minutesSince(s) {
  const d = parseSP(s);
  if (!d) return 0;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
}

export const todayISO = () => nowSP().slice(0, 10);
export const addDaysISO = (ymd, n) => {
  const d = new Date(ymd + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** 0 = domingo … 6 = sábado, para uma data 'YYYY-MM-DD' */
export const weekdayOf = (ymd) => new Date(ymd + 'T12:00:00Z').getUTCDay();

export const STATUS = {
  novo: { label: 'Novo', color: 'bg-amber-100 text-amber-800 ring-amber-200' },
  confirmado: { label: 'Confirmado', color: 'bg-sky-100 text-sky-800 ring-sky-200' },
  preparo: { label: 'Em preparo', color: 'bg-violet-100 text-violet-800 ring-violet-200' },
  pronto: { label: 'Pronto', color: 'bg-emerald-100 text-emerald-800 ring-emerald-200' },
  entrega: { label: 'Saiu p/ entrega', color: 'bg-blue-100 text-blue-800 ring-blue-200' },
  concluido: { label: 'Concluído', color: 'bg-stone-100 text-stone-700 ring-stone-200' },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-700 ring-red-200' },
};

export const TYPE = { entrega: 'Entrega', retirada: 'Retirada', balcao: 'Balcão' };
export const CHANNEL = { cardapio: 'Cardápio digital', pdv: 'PDV', whatsapp: 'WhatsApp', telefone: 'Telefone', ifood: 'iFood', '99food': '99Food', outro: 'Outro' };

export function methodLabel(methods, id) {
  return methods?.find((m) => m.id === id)?.label || id || '—';
}

export function waLink(phoneDigits, text) {
  let d = String(phoneDigits || '').replace(/\D/g, '');
  if (d && !d.startsWith('55')) d = '55' + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}

export function addressLine(a) {
  if (!a) return '';
  return [
    [a.street, a.number].filter(Boolean).join(', '),
    a.complement,
    a.neighborhood,
  ].filter(Boolean).join(' – ');
}

/** Escolhas de um item, juntando as repetidas: ["2x Bacon", "Ao Ponto"] */
export function optionsList(options) {
  const counts = new Map();
  for (const o of options || []) counts.set(o.name, (counts.get(o.name) || 0) + 1);
  return [...counts].map(([name, n]) => (n > 1 ? `${n}x ${name}` : name));
}
export const optionsText = (options) => optionsList(options).join(', ');

export const itemLine = (i) =>
  `${i.qty}x ${i.name}${i.variant_name ? ` (${i.variant_name})` : ''}${i.options?.length ? ` + ${optionsText(i.options)}` : ''}`;
