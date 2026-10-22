import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { db, all, get, run, now, getSetting, setSetting } from '../db.js';
import {
  createSession, fail, hashPassword, PERMISSIONS, requireAuth, requireModule, verifyPassword,
} from '../auth.js';
import { subscribe } from '../realtime.js';
import { fiscalConfig } from '../fiscal/service.js';
import { rateLimit } from './public.js';
import { bool, cents, int, required, str } from '../util.js';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || join(import.meta.dirname, '..', 'data', 'uploads');

const r = Router();

// ---------- Login ----------

r.post('/auth/login', rateLimit(10, 10 * 60e3), (req, res) => {
  const u = get('SELECT * FROM users WHERE login = ? AND active = 1', String(req.body.login || '').trim());
  if (!u || !verifyPassword(String(req.body.password || ''), u.password_hash)) fail(401, 'Login ou senha incorretos');
  const token = createSession(u.id);
  res.json({ token, user: { id: u.id, name: u.name, login: u.login, role: u.role, permissions: PERMISSIONS[u.role] } });
});

r.post('/auth/logout', (req, res) => {
  if (req.token) run('DELETE FROM sessions WHERE token = ?', req.token);
  res.json({ ok: true });
});

r.get('/auth/me', requireAuth, (req, res) => res.json({ ...req.user, permissions: PERMISSIONS[req.user.role] }));

r.post('/auth/password', requireAuth, (req, res) => {
  const u = get('SELECT * FROM users WHERE id = ?', req.user.id);
  if (!verifyPassword(String(req.body.current || ''), u.password_hash)) fail(400, 'Senha atual incorreta');
  const next = String(req.body.password || '');
  if (next.length < 6) fail(400, 'A nova senha precisa ter pelo menos 6 caracteres');
  run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(next), u.id);
  run('DELETE FROM sessions WHERE user_id = ? AND token != ?', u.id, req.token);
  res.json({ ok: true });
});

// Tempo real (painel, cozinha, entregador)
r.get('/stream', requireAuth, subscribe);

// ---------- Configurações ----------

const SETTING_KEYS = ['store', 'payment_methods', 'loyalty'];

r.get('/settings', requireAuth, (_req, res) => {
  const out = {};
  for (const k of SETTING_KEYS) out[k] = getSetting(k);
  // só o resumo da nota fiscal (sem tokens): o painel decide se mostra "Emitir NFC-e"; o resto fica em /fiscal/config
  const { enabled, provider, ambiente, auto_emit: autoEmit, razao_social: razaoSocial } = fiscalConfig();
  out.fiscal = { enabled, provider, ambiente, auto_emit: autoEmit, razao_social: razaoSocial };
  res.json(out);
});

r.put('/settings/:key', requireModule('configuracoes'), (req, res) => {
  const key = req.params.key;
  if (!SETTING_KEYS.includes(key)) fail(404, 'Configuração desconhecida');
  let value = req.body;
  if (key === 'store') {
    const cur = getSetting('store');
    value = {
      ...cur,
      ...value,
      name: required(value.name ?? cur.name, 'o nome da loja', 80),
      whatsapp: String(value.whatsapp ?? cur.whatsapp).replace(/\D/g, ''),
      min_order_cents: cents(value.min_order_cents ?? cur.min_order_cents),
      prep_time_min: Math.max(0, int(value.prep_time_min ?? cur.prep_time_min, 30)),
      delivery_time_min: Math.max(0, int(value.delivery_time_min ?? cur.delivery_time_min, 60)),
      accepting_orders: !!(value.accepting_orders ?? cur.accepting_orders),
    };
  }
  if (key === 'payment_methods') {
    if (!Array.isArray(value) || !value.length) fail(400, 'Lista inválida');
    value = value.map((m) => ({
      id: required(m.id, 'o código', 30).toLowerCase().replace(/[^a-z0-9_]/g, ''),
      label: required(m.label, 'o nome', 80),
      fee_pct: Math.max(0, Math.min(Number(m.fee_pct) || 0, 50)),
      active: !!m.active,
      online: !!m.online,
    }));
  }
  if (key === 'loyalty') {
    value = {
      enabled: !!value.enabled,
      points_per_real: Math.max(0, Number(value.points_per_real) || 0),
      redeem_points: Math.max(1, int(value.redeem_points, 100)),
      redeem_value_cents: cents(value.redeem_value_cents || 0),
    };
  }
  setSetting(key, value);
  res.json(getSetting(key));
});

// ---------- Usuários ----------

r.get('/users', requireModule('usuarios'), (_req, res) => {
  res.json(all('SELECT id, name, login, role, phone, delivery_fee_cents, active, created_at FROM users ORDER BY active DESC, name'));
});

function userFields(b) {
  if (!PERMISSIONS[b.role]) fail(400, 'Perfil inválido');
  return [required(b.name, 'o nome', 80), required(b.login, 'o login', 40).toLowerCase(), b.role, str(b.phone, 20), cents(b.delivery_fee_cents || 0), bool(b.active ?? 1)];
}

r.post('/users', requireModule('usuarios'), (req, res) => {
  const f = userFields(req.body);
  if (get('SELECT 1 FROM users WHERE login = ?', f[1])) fail(400, 'Login já usado');
  const pass = String(req.body.password || '');
  if (pass.length < 6) fail(400, 'A senha precisa ter pelo menos 6 caracteres');
  const x = run(
    'INSERT INTO users (name, login, role, phone, delivery_fee_cents, active, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ...f, hashPassword(pass), now(),
  );
  res.status(201).json(get('SELECT id, name, login, role, phone, delivery_fee_cents, active FROM users WHERE id = ?', x.lastInsertRowid));
});

r.put('/users/:id', requireModule('usuarios'), (req, res) => {
  const id = int(req.params.id);
  const f = userFields(req.body);
  if (get('SELECT 1 FROM users WHERE login = ? AND id != ?', f[1], id)) fail(400, 'Login já usado');
  if (id === req.user.id && (f[2] !== 'admin' || !f[5])) fail(400, 'Você não pode remover seu próprio acesso de administrador');
  run('UPDATE users SET name = ?, login = ?, role = ?, phone = ?, delivery_fee_cents = ?, active = ? WHERE id = ?', ...f, id);
  if (req.body.password) {
    if (String(req.body.password).length < 6) fail(400, 'A senha precisa ter pelo menos 6 caracteres');
    run('UPDATE users SET password_hash = ? WHERE id = ?', hashPassword(String(req.body.password)), id);
    run('DELETE FROM sessions WHERE user_id = ?', id);
  }
  if (!f[5]) run('DELETE FROM sessions WHERE user_id = ?', id);
  res.json(get('SELECT id, name, login, role, phone, delivery_fee_cents, active FROM users WHERE id = ?', id));
});

// ---------- Backup do banco (cópia consistente, só administrador) ----------

r.get('/backup', requireModule('usuarios'), (_req, res) => {
  const file = join(tmpdir(), `lacos-backup-${randomBytes(6).toString('hex')}.db`);
  db.exec(`VACUUM INTO '${file}'`);
  res.download(file, `lacos-de-mae-backup-${now().slice(0, 10)}.db`, () => rmSync(file, { force: true }));
});

// ---------- Upload de imagens (fotos de produtos) ----------

const MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

r.post('/upload', requireModule('produtos', 'configuracoes'), (req, res) => {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(req.body.data_url || ''));
  if (!m) fail(400, 'Envie uma imagem JPG, PNG ou WEBP');
  const buf = Buffer.from(m[2], 'base64');
  if (buf.length > 3 * 1024 * 1024) fail(400, 'Imagem muito grande (máx. 3 MB)');
  mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${Date.now()}-${randomBytes(4).toString('hex')}.${MIME[m[1]]}`;
  writeFileSync(join(UPLOAD_DIR, name), buf);
  res.status(201).json({ url: `/uploads/${name}` });
});

export default r;
