-- Valores monetários sempre em centavos (INTEGER).
-- Datas em horário de São Paulo, formato 'YYYY-MM-DD HH:MM:SS'.

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  login         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','gerente','caixa','cozinha','entregador')),
  phone         TEXT,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0, -- valor pago ao entregador por entrega
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id       INTEGER PRIMARY KEY,
  name     TEXT NOT NULL,
  section  TEXT,                                 -- agrupamento no cardápio (ex.: Bolos, Docinhos)
  position INTEGER NOT NULL DEFAULT 0,
  active   INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY,
  category_id     INTEGER NOT NULL REFERENCES categories(id),
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  image           TEXT,
  active          INTEGER NOT NULL DEFAULT 1,  -- aparece no sistema
  available       INTEGER NOT NULL DEFAULT 1,  -- 0 = esgotado hoje
  featured        INTEGER NOT NULL DEFAULT 0,  -- "mais vendidos" no cardápio
  online          INTEGER NOT NULL DEFAULT 1,  -- aparece no cardápio digital
  lead_time_hours INTEGER NOT NULL DEFAULT 0,  -- só por encomenda com X horas
  option_groups   TEXT NOT NULL DEFAULT '[]',  -- JSON: [{name,min,max,options:[{name,price_cents}]}]
  stock_control   INTEGER NOT NULL DEFAULT 0,  -- controla estoque de produto pronto
  stock_qty       REAL NOT NULL DEFAULT 0,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS product_variants (
  id          INTEGER PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name        TEXT,
  price_cents INTEGER NOT NULL,
  position    INTEGER NOT NULL DEFAULT 0,
  active      INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS ingredients (
  id          INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  unit        TEXT NOT NULL DEFAULT 'g',      -- g, ml, un
  unit_cost   REAL NOT NULL DEFAULT 0,        -- centavos por unidade (aceita fração)
  stock_qty   REAL NOT NULL DEFAULT 0,
  min_qty     REAL NOT NULL DEFAULT 0,
  supplier    TEXT,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL
);

-- Ficha técnica: quanto de cada insumo vai em cada tamanho do produto
CREATE TABLE IF NOT EXISTS recipe_items (
  id            INTEGER PRIMARY KEY,
  variant_id    INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  qty           REAL NOT NULL,
  UNIQUE (variant_id, ingredient_id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id            INTEGER PRIMARY KEY,
  ingredient_id INTEGER REFERENCES ingredients(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('entrada','saida','ajuste','venda','estorno','perda')),
  qty           REAL NOT NULL,                 -- positivo entra, negativo sai
  unit_cost     REAL,
  note          TEXT,
  order_id      INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id           INTEGER PRIMARY KEY,
  name         TEXT NOT NULL,
  phone        TEXT UNIQUE,                   -- só dígitos, com DDD
  email        TEXT,
  birthday     TEXT,                          -- 'MM-DD' ou 'YYYY-MM-DD'
  address      TEXT,
  number       TEXT,
  complement   TEXT,
  neighborhood TEXT,
  reference    TEXT,
  notes        TEXT,
  points       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS delivery_zones (
  id              INTEGER PRIMARY KEY,
  name            TEXT NOT NULL,
  fee_cents       INTEGER NOT NULL DEFAULT 0,
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  active          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS coupons (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  type            TEXT NOT NULL CHECK (type IN ('percent','fixed','frete')),
  value           INTEGER NOT NULL DEFAULT 0,   -- % inteiro ou centavos
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  starts_at       TEXT,
  ends_at         TEXT,
  max_uses        INTEGER,
  uses            INTEGER NOT NULL DEFAULT 0,
  first_order_only INTEGER NOT NULL DEFAULT 0,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_sessions (
  id                  INTEGER PRIMARY KEY,
  opened_by           INTEGER REFERENCES users(id),
  opened_at           TEXT NOT NULL,
  opening_cents       INTEGER NOT NULL DEFAULT 0,
  closed_by           INTEGER REFERENCES users(id),
  closed_at           TEXT,
  counted             TEXT,                      -- JSON {metodo: centavos} contado no fechamento
  expected            TEXT,                      -- JSON {metodo: centavos} calculado no fechamento
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','fechado'))
);

CREATE TABLE IF NOT EXISTS cash_movements (
  id          INTEGER PRIMARY KEY,
  session_id  INTEGER NOT NULL REFERENCES cash_sessions(id),
  type        TEXT NOT NULL CHECK (type IN ('sangria','suprimento')),
  amount_cents INTEGER NOT NULL,
  note        TEXT,
  user_id     INTEGER REFERENCES users(id),
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,          -- código público de acompanhamento
  channel         TEXT NOT NULL CHECK (channel IN ('cardapio','pdv','whatsapp','telefone','ifood','outro')),
  type            TEXT NOT NULL CHECK (type IN ('entrega','retirada','balcao')),
  status          TEXT NOT NULL CHECK (status IN ('novo','confirmado','preparo','pronto','entrega','concluido','cancelado')),
  customer_id     INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name   TEXT,
  customer_phone  TEXT,
  address         TEXT,                          -- JSON {street,number,complement,neighborhood,reference}
  zone_id         INTEGER REFERENCES delivery_zones(id) ON DELETE SET NULL,
  scheduled_for   TEXT,                          -- encomenda: data/hora de entrega ou retirada
  subtotal_cents  INTEGER NOT NULL,
  discount_cents  INTEGER NOT NULL DEFAULT 0,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  total_cents     INTEGER NOT NULL,
  cost_cents      INTEGER NOT NULL DEFAULT 0,    -- CMV teórico do pedido
  coupon_code     TEXT,
  payment_method  TEXT,                          -- forma informada pelo cliente
  change_for_cents INTEGER,                      -- troco para
  paid            INTEGER NOT NULL DEFAULT 0,
  paid_at         TEXT,
  notes           TEXT,
  courier_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  stock_applied   INTEGER NOT NULL DEFAULT 0,
  points_awarded  INTEGER NOT NULL DEFAULT 0,
  cancel_reason   TEXT,
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  confirmed_at    TEXT,
  ready_at        TEXT,
  dispatched_at   TEXT,
  completed_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled ON orders(scheduled_for);

CREATE TABLE IF NOT EXISTS order_items (
  id            INTEGER PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INTEGER REFERENCES products(id) ON DELETE SET NULL,
  variant_id    INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  name          TEXT NOT NULL,
  variant_name  TEXT,
  options       TEXT NOT NULL DEFAULT '[]',     -- JSON [{group,name,price_cents}]
  qty           INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,            -- já inclui adicionais
  unit_cost_cents  INTEGER NOT NULL DEFAULT 0,
  total_cents   INTEGER NOT NULL,
  notes         TEXT
);

CREATE TABLE IF NOT EXISTS order_payments (
  id            INTEGER PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method        TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL,
  fee_cents     INTEGER NOT NULL DEFAULT 0,     -- taxa da maquininha/app
  cash_session_id INTEGER REFERENCES cash_sessions(id),
  user_id       INTEGER REFERENCES users(id),
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id         INTEGER PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status     TEXT NOT NULL,
  note       TEXT,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS fin_categories (
  id     INTEGER PRIMARY KEY,
  name   TEXT NOT NULL,
  type   TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  is_cmv INTEGER NOT NULL DEFAULT 0,             -- compras de insumos/embalagens (custo da mercadoria)
  active INTEGER NOT NULL DEFAULT 1
);

-- Contas a pagar / receber e lançamentos avulsos
CREATE TABLE IF NOT EXISTS fin_entries (
  id            INTEGER PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('receita','despesa')),
  category_id   INTEGER REFERENCES fin_categories(id) ON DELETE SET NULL,
  description   TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL,
  due_date      TEXT NOT NULL,                  -- YYYY-MM-DD
  paid_at       TEXT,                           -- YYYY-MM-DD
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  method        TEXT,
  supplier      TEXT,
  notes         TEXT,
  user_id       INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_fin_due ON fin_entries(due_date);
