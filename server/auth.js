import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { get, run, now } from './db.js';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (status, message) => { throw new HttpError(status, message); };

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = String(stored).split(':');
  if (!salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(password, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

const SESSION_DAYS = 30;

export function createSession(userId) {
  const token = randomBytes(32).toString('hex');
  const expires = now(new Date(Date.now() + SESSION_DAYS * 86400e3));
  run('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)', token, userId, expires);
  return token;
}

export function userFromToken(token) {
  if (!token) return null;
  const row = get(
    `SELECT u.id, u.name, u.login, u.role, u.phone FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ? AND u.active = 1`,
    token, now(),
  );
  return row || null;
}

// Módulos que cada perfil pode acessar (o painel usa a mesma tabela para montar o menu)
export const PERMISSIONS = {
  admin: ['*'],
  gerente: ['dashboard', 'pedidos', 'pdv', 'cozinha', 'encomendas', 'caixa', 'financeiro', 'fiscal', 'estoque', 'produtos', 'clientes', 'entregas', 'cupons', 'relatorios', 'configuracoes'],
  caixa: ['dashboard', 'pedidos', 'pdv', 'cozinha', 'encomendas', 'caixa', 'clientes', 'entregas'],
  cozinha: ['pedidos', 'cozinha', 'encomendas'],
  entregador: ['entregador'],
};

export const can = (user, module) => {
  const list = PERMISSIONS[user?.role] || [];
  return list.includes('*') || list.includes(module);
};

export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.query.token;
  req.user = userFromToken(token);
  req.token = token;
  next();
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'Faça login para continuar'));
  next();
}

export const requireModule = (...modules) => (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Faça login para continuar'));
  if (!modules.some((m) => can(req.user, m))) return next(new HttpError(403, 'Seu perfil não tem acesso a esta área'));
  next();
};
