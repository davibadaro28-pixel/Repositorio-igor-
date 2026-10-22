import express from 'express';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
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

seedIfEmpty();

export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(express.json({ limit: '5mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/api/public', publicRoutes);
app.use('/api', authenticate);
for (const routes of [adminRoutes, catalogRoutes, orderRoutes, cashRoutes, financeRoutes, stockRoutes, customerRoutes, deliveryRoutes, couponRoutes, reportRoutes]) {
  app.use('/api', routes);
}
app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Rota não encontrada')));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true }));

// Front-end (build do Vite)
const dist = join(import.meta.dirname, '..', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => res.sendFile(join(dist, 'index.html')));
}

// Erros: mensagens claras para o usuário, sem vazar detalhes internos
app.use((err, _req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  const message = status >= 500 ? 'Erro interno. Tente novamente.' : err.type === 'entity.too.large' ? 'Arquivo muito grande' : err.message;
  res.status(status).json({ error: message });
});

export function start(port = Number(process.env.PORT) || 3000) {
  return app.listen(port, () => {
    console.log(`Laços de Mãe rodando em http://localhost:${port}`);
    console.log(`  Cardápio digital: http://localhost:${port}/`);
    console.log(`  Painel de gestão: http://localhost:${port}/admin`);
    console.log(`  App do entregador: http://localhost:${port}/entregador`);
  });
}

if (process.argv[1] === import.meta.filename) start();
