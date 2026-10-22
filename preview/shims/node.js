// Versões mínimas dos módulos do Node usados pelo servidor, suficientes para a prévia no navegador.
import schemaSql from '../../server/schema.sql?raw';
import catalog from '../../server/seed/catalog.json';

// ---------- Bytes (substitui Buffer) ----------
export class Bytes extends Uint8Array {
  toString(enc = 'utf8') {
    if (enc === 'hex') return Array.from(this, (b) => b.toString(16).padStart(2, '0')).join('');
    if (enc === 'base64' || enc === 'base64url') {
      let bin = '';
      for (const b of this) bin += String.fromCharCode(b);
      const b64 = btoa(bin);
      return enc === 'base64' ? b64 : b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }
    return new TextDecoder().decode(this);
  }
}
Bytes.from = (value, enc) => {
  if (typeof value !== 'string') return new Bytes(value);
  if (enc === 'hex') return new Bytes((value.match(/../g) || []).map((h) => parseInt(h, 16)));
  if (enc === 'base64') return new Bytes(Array.from(atob(value), (c) => c.charCodeAt(0)));
  return new Bytes(new TextEncoder().encode(value));
};

// ---------- node:crypto ----------
export function randomBytes(n) {
  const b = new Bytes(n);
  globalThis.crypto.getRandomValues(b);
  return b;
}
// Derivação simples só para a demonstração (o sistema real usa scrypt do Node)
export function scryptSync(password, salt, len) {
  let h = 2166136261;
  const input = `${password}:${salt}`;
  for (let i = 0; i < input.length; i++) h = Math.imul(h ^ input.charCodeAt(i), 16777619);
  const out = new Bytes(len);
  for (let i = 0; i < len; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    out[i] = h & 255;
  }
  return out;
}
const unavailable = () => {
  throw new Error('Indisponível na prévia');
};
export const createHash = () => ({ update: () => ({ digest: unavailable }) });
export const createHmac = () => ({ update: () => ({ digest: unavailable }) });
export function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}

// ---------- node:fs ----------
export function readFileSync(path) {
  if (String(path).endsWith('schema.sql')) return schemaSql;
  if (String(path).endsWith('catalog.json')) return JSON.stringify(catalog);
  throw new Error(`Arquivo indisponível na prévia: ${path}`);
}
export const writeFileSync = () => {};
export const mkdirSync = () => {};
export const rmSync = () => {};
export const existsSync = () => false;

// ---------- node:path / node:url / node:os ----------
export function join(...parts) {
  const out = [];
  for (const seg of parts.filter((p) => typeof p === 'string').join('/').split('/')) {
    if (seg === '..') out.pop();
    else if (seg && seg !== '.') out.push(seg);
  }
  return '/' + out.join('/');
}
export const dirname = (p) => String(p).replace(/\/[^/]*$/, '') || '/';
export const basename = (p) => String(p).split('/').pop();
export const fileURLToPath = () => '/server/db.js';
export const tmpdir = () => '/tmp';

export default { randomBytes, scryptSync, timingSafeEqual, createHash, createHmac, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, join, dirname, basename, fileURLToPath, tmpdir };
