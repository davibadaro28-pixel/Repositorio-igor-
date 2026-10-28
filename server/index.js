import express from 'express';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSetting } from './db.js';
import { LOJA, LOJA_PUBLIC } from './loja.js';
import { fontHref, themeColor, themeCss } from '../shared/theme.js';
import { authenticate, HttpError } from './auth.js';
import { seedIfEmpty } from './seed.js';
import publicRoutes from './routes/public.js';
import adminRoutes, { UPLOAD_DIR } from './routes/admin.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import cashRoutes from './routes/cash.js';
import financeRoutes from './routes/finance.js';
import stockRoutes from './routes/stock.js';
import customerRoutes from './routes/customers.js';
import deliveryRoutes from './routes/delivery.js';
import couponRoutes from './routes/coupons.js';
import reportRoutes from './routes/reports.js';
import { admin as integrationRoutes, hooks as integrationHooks, startIntegrations } from './integrations/index.js';
import fiscalRoutes from './fiscal/routes.js';

seedIfEmpty();

export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
// guarda o corpo original: os webhooks dos apps de delivery são assinados sobre ele
app.use(express.json({ limit: '5mb', verify: (req, _res, buf) => { req.rawBody = buf.toString('utf8'); } }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api/public', publicRoutes);
app.use('/api', integrationHooks);
app.use('/api', authenticate);
for (const routes of [adminRoutes, catalogRoutes, orderRoutes, cashRoutes, financeRoutes, stockRoutes, customerRoutes, deliveryRoutes, couponRoutes, reportRoutes, integrationRoutes, fiscalRoutes]) {
  app.use('/api', routes);
}
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Rota não encontrada')));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

// Logo, ícones e fotos do cardápio da loja (lojas/<loja>/public)
app.use(express.static(LOJA_PUBLIC, { maxAge: '1d', index: false }));
app.get('/manifest.webmanifest', (_req, res) => {
  const s = getSetting('store', {});
  res.type('application/manifest+json').json({
    name: [s.name, s.tagline].filter(Boolean).join(' – '),
    short_name: s.name,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: themeColor(s.theme),
    icons: [
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  });
});

const esc = (t) => String(t ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
/** index.html com nome, cores e fonte da loja (o cardápio já abre com a cara da loja) */
export function renderIndex(html) {
  const s = getSetting('store', {});
  const title = [s.name, s.tagline].filter(Boolean).join(' – ') || 'Cardápio digital';
  const font = fontHref(s.theme);
  const head = [
    `<meta name="description" content="${esc(`Peça online: cardápio digital da ${s.name || 'loja'}, com delivery e retirada.`)}" />`,
    `<meta name="theme-color" content="${esc(themeColor(s.theme))}" />`,
    font ? `<link href="${esc(font)}" rel="stylesheet" />` : '',
    `<style id="loja-theme">${themeCss(s.theme)}</style>`,
  ].join('\n    ');
  return html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace('<!--loja-->', head);
}

// Front-end (build do Vite)
const dist = join(import.meta.dirname, '..', 'dist');
if (existsSync(dist)) {
  const indexHtml = readFileSync(join(dist, 'index.html'), 'utf8');
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => res.type('html').set('Cache-Control', 'no-cache').send(renderIndex(indexHtml)));
}

// Erros: mensagens claras para o usuário, sem vazar detalhes internos
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 ? 'Erro interno. Tente novamente.' : err.type === 'entity.too.large' ? 'Arquivo muito grande' : err.message;
  res.status(status).json({ error: message });
});

export function start(port = Number(process.env.PORT) || 3000) {
  startIntegrations();
  return app.listen(port, () => {
    console.log(`${getSetting('store', {}).name || 'Sistema'} (loja: ${LOJA}) rodando em http://localhost:${port}`);
    console.log(`  Cardápio digital: http://localhost:${port}/`);
    console.log(`  Painel de gestão: http://localhost:${port}/admin`);
    console.log(`  App do entregador: http://localhost:${port}/entregador`);
  });
}

if (process.argv[1] === import.meta.filename) start();
