// Bootstrap SQL for the on-device store. SQLite is our source of truth on the
// device — sync to the server is opt-in (auth required).
export const BOOTSTRAP_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS flux_account (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'CHECKING',
  color TEXT NOT NULL DEFAULT '#5B8DEF',
  icon TEXT NOT NULL DEFAULT 'wallet',
  initial_balance_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_flux_account_updated ON flux_account(updated_at);

CREATE TABLE IF NOT EXISTS category (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#94A3B8',
  icon TEXT NOT NULL DEFAULT 'tag',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_category_updated ON category(updated_at);

CREATE TABLE IF NOT EXISTS transaction_log (
  id TEXT PRIMARY KEY,
  direction TEXT NOT NULL DEFAULT 'EXPENSE',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  description TEXT NOT NULL,
  note TEXT,
  date TEXT NOT NULL,
  category_id TEXT,
  account_from_id TEXT,
  account_to_id TEXT,
  recurring_item_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_transaction_date ON transaction_log(date);
CREATE INDEX IF NOT EXISTS idx_transaction_updated ON transaction_log(updated_at);
CREATE INDEX IF NOT EXISTS idx_transaction_account_from ON transaction_log(account_from_id);
CREATE INDEX IF NOT EXISTS idx_transaction_category ON transaction_log(category_id);

CREATE TABLE IF NOT EXISTS recurring_item (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'EXPENSE',
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  category_id TEXT,
  account_id TEXT NOT NULL,
  note TEXT,
  interval_unit TEXT NOT NULL,
  interval_count INTEGER NOT NULL DEFAULT 1,
  month_day INTEGER,
  week_day INTEGER,
  start_date TEXT NOT NULL,
  end_date TEXT,
  remaining_count INTEGER,
  is_paused INTEGER NOT NULL DEFAULT 0,
  last_run_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_recurring_updated ON recurring_item(updated_at);

CREATE TABLE IF NOT EXISTS budget (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT,
  monthly_cap_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_budget_updated ON budget(updated_at);

CREATE TABLE IF NOT EXISTS app_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;
