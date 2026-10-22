import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DB_PATH || join(here, 'data', 'lacos.db');
if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });

export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
const schemaSql = readFileSync(join(here, 'schema.sql'), 'utf8');
db.exec(schemaSql);

const cache = new Map();
function stmt(sql) {
  let s = cache.get(sql);
  if (!s) {
    s = db.prepare(sql);
    cache.set(sql, s);
  }
  return s;
}

// node:sqlite devolve objetos sem protótipo; convertemos para objetos comuns
const plain = (row) => (row ? { ...row } : row);

export const all = (sql, ...params) => stmt(sql).all(...params).map(plain);
export const get = (sql, ...params) => plain(stmt(sql).get(...params));
export const run = (sql, ...params) => stmt(sql).run(...params);

let depth = 0;
export function tx(fn) {
  if (depth > 0) return fn();
  depth++;
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    depth--;
  }
}

// Horário de São Paulo (sem horário de verão desde 2019)
const fmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hour12: false,
});
export const now = (date = new Date()) => fmt.format(date).replace('T', ' ');
export const today = () => now().slice(0, 10);

// Migrações simples para bancos criados por versões anteriores
const hasColumn = (table, column) => all(`PRAGMA table_info(${table})`).some((c) => c.name === column);
if (!hasColumn('categories', 'section')) db.exec('ALTER TABLE categories ADD COLUMN section TEXT');

// Pedidos de apps de delivery: o SQLite não altera CHECK, então a tabela é recriada mantendo os dados
const ordersSql = get(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'orders'`)?.sql || '';
if (!ordersSql.includes("'99food'")) {
  const create = /CREATE TABLE IF NOT EXISTS orders \([\s\S]*?\n\);/.exec(schemaSql)[0].replace('IF NOT EXISTS orders', 'orders_new');
  const oldCols = all('PRAGMA table_info(orders)').map((c) => c.name);
  db.exec('PRAGMA foreign_keys = OFF');
  tx(() => {
    db.exec(create);
    const cols = all('PRAGMA table_info(orders_new)').map((c) => c.name).filter((c) => oldCols.includes(c)).join(', ');
    db.exec(`INSERT INTO orders_new (${cols}) SELECT ${cols} FROM orders; DROP TABLE orders; ALTER TABLE orders_new RENAME TO orders;`);
  });
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(schemaSql); // recria os índices
}
db.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_external ON orders(external_platform, external_id) WHERE external_id IS NOT NULL');

export function getSetting(key, fallback = null) {
  const row = get('SELECT value FROM settings WHERE key = ?', key);
  return row ? JSON.parse(row.value) : fallback;
}
export function setSetting(key, value) {
  run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', key, JSON.stringify(value));
}
