// O servidor da Laços de Mãe rodando dentro do navegador (prévia sem servidor).
// Usa as mesmas rotas e regras de server/, sobre um SQLite em memória (sql.js).
import { authenticate } from '../server/auth.js';
import { get, run } from '../server/db.js';
import { seedIfEmpty } from '../server/seed.js';
import { generateDemoData } from '../server/demo-data.js';
import publicRoutes from '../server/routes/public.js';
import adminRoutes from '../server/routes/admin.js';
import catalogRoutes from '../server/routes/catalog.js';
import orderRoutes from '../server/routes/orders.js';
import cashRoutes from '../server/routes/cash.js';
import financeRoutes from '../server/routes/finance.js';
import stockRoutes from '../server/routes/stock.js';
import customerRoutes from '../server/routes/customers.js';
import deliveryRoutes from '../server/routes/delivery.js';
import couponRoutes from '../server/routes/coupons.js';
import reportRoutes from '../server/routes/reports.js';
import { Router, dispatch } from './shims/express.js';
import { exportDatabase, resetDatabase } from './shims/sqlite.js';
import { Bytes } from './shims/node.js';
import schemaSql from '../server/schema.sql?raw';

globalThis.Buffer = Bytes;

function prepareData() {
  seedIfEmpty();
  if (!get('SELECT 1 FROM orders LIMIT 1')) generateDemoData();
  // fotos dos produtos ficam ao lado da página publicada
  run(`UPDATE products SET image = substr(image, 2) WHERE image LIKE '/img/%'`);
}
prepareData();

/** Volta aos dados de demonstração originais */
function reset() {
  resetDatabase();
  window.__lacosDB.exec(`PRAGMA foreign_keys = ON; ${schemaSql}`);
  prepareData();
  window.__lacosSave?.(exportDatabase());
}

// Diferenças da prévia: fotos enviadas ficam no próprio banco; backup só no sistema instalado
const preview = Router();
preview.post('/upload', (req, res) => {
  const url = String(req.body?.data_url || '');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(url)) return res.status(400).json({ error: 'Envie uma imagem JPG, PNG ou WEBP' });
  if (url.length > 600_000) return res.status(400).json({ error: 'Imagem muito grande para a prévia' });
  return res.status(201).json({ url });
});
preview.get('/backup', (_req, res) => res.status(501).json({ error: 'Backup disponível no sistema instalado' }));

const authLayer = Router().use(authenticate);
const PRIVATE = [authLayer, preview, adminRoutes, catalogRoutes, orderRoutes, cashRoutes, financeRoutes, stockRoutes,
  customerRoutes, deliveryRoutes, couponRoutes, reportRoutes].flatMap((r) => r.layers);

function makeReq(method, url, headers = {}, body) {
  const u = new URL(url, 'http://local');
  const isPublic = u.pathname.startsWith('/api/public/');
  const listeners = {};
  return {
    req: {
      method,
      path: u.pathname.slice(isPublic ? '/api/public'.length : '/api'.length) || '/',
      query: Object.fromEntries(u.searchParams),
      headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])),
      body: body ?? {},
      ip: '127.0.0.1',
      on: (ev, fn) => (listeners[ev] = fn),
    },
    listeners,
    layers: isPublic ? publicRoutes.layers : PRIVATE,
  };
}

function errorBody(err) {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  return { status, body: JSON.stringify({ error: status >= 500 ? 'Erro interno. Tente novamente.' : err.message }) };
}

let saveTimer;
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => window.__lacosSave?.(exportDatabase()), 600);
}

/** Atende uma requisição /api/... e devolve { status, headers, body } */
function request(method, url, headers, body) {
  return new Promise((resolve) => {
    const { req, layers } = makeReq(method, url, headers, body);
    const out = { status: 200, headers: { 'content-type': 'application/json; charset=utf-8' }, body: '' };
    const res = {
      finished: false,
      status(code) { out.status = code; return res; },
      setHeader(k, v) { out.headers[k.toLowerCase()] = v; return res; },
      json(obj) { out.body = JSON.stringify(obj); return res.end(); },
      send(text) {
        if (typeof text === 'object') return res.json(text);
        if (!out.headers['content-type']?.startsWith('text/')) out.headers['content-type'] = 'text/plain; charset=utf-8';
        out.body = String(text);
        return res.end();
      },
      end() {
        res.finished = true;
        if (method !== 'GET' && out.status < 400) scheduleSave();
        resolve(out);
        return res;
      },
    };
    dispatch(layers, req, res, (err) => {
      const e = errorBody(err);
      out.status = e.status;
      out.body = e.body;
      res.end();
    });
  });
}

/** Tempo real: abre o fluxo /api/stream e entrega cada evento ao callback */
function stream(url, onEvent) {
  const { req, listeners, layers } = makeReq('GET', url, {}, null);
  let buffer = '';
  const res = {
    finished: false,
    writeHead() {},
    status() { return res; },
    json() { res.finished = true; return res; },
    write(chunk) {
      buffer += chunk;
      let idx;
      while ((idx = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);
        const event = /^event: (.*)$/m.exec(block)?.[1];
        const data = /^data: (.*)$/m.exec(block)?.[1];
        if (event && data) setTimeout(() => onEvent(event, data), 0);
      }
    },
  };
  dispatch(layers, req, res, () => {});
  return () => listeners.close?.();
}

window.__lacosBackend = { request, stream, reset };
