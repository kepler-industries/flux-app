import * as SQLite from 'expo-sqlite';
import { BOOTSTRAP_SQL } from './schema.sql';
import type {
  FluxAccount,
  Category,
  Transaction,
  RecurringItem,
  Budget,
} from './types';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  const db = await SQLite.openDatabaseAsync('flux.db');
  await db.execAsync(BOOTSTRAP_SQL);
  _db = db;
  return db;
}

// ---------- helpers ----------
const now = () => new Date().toISOString();

const camel = <T>(row: any): T => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(row)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    let v = row[k];
    if (camelKey === 'isPaused') v = !!v;
    out[camelKey] = v ?? null;
  }
  return out as T;
};

// ---------- meta ----------
export async function getMeta(key: string): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    [key],
  );
  return row?.value ?? null;
}

export async function setMeta(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'INSERT INTO app_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value],
  );
}

// ---------- flux accounts ----------
export async function listAccounts(includeArchived = false): Promise<FluxAccount[]> {
  const db = await getDb();
  const where = includeArchived
    ? 'WHERE deleted_at IS NULL'
    : 'WHERE deleted_at IS NULL AND archived_at IS NULL';
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM flux_account ${where} ORDER BY created_at ASC`,
  );
  return rows.map((r) => camel<FluxAccount>(r));
}

export async function getAccount(id: string): Promise<FluxAccount | null> {
  const db = await getDb();
  const r = await db.getFirstAsync<any>('SELECT * FROM flux_account WHERE id = ?', [id]);
  return r ? camel<FluxAccount>(r) : null;
}

export async function upsertAccount(input: Omit<FluxAccount, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
  updatedAt?: string;
}): Promise<FluxAccount> {
  const db = await getDb();
  const existing = await getAccount(input.id);
  const createdAt = existing?.createdAt ?? input.createdAt ?? now();
  const updatedAt = now();
  await db.runAsync(
    `INSERT INTO flux_account (id, name, kind, color, icon, initial_balance_cents, currency, archived_at, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       kind = excluded.kind,
       color = excluded.color,
       icon = excluded.icon,
       initial_balance_cents = excluded.initial_balance_cents,
       currency = excluded.currency,
       archived_at = excluded.archived_at,
       updated_at = excluded.updated_at,
       deleted_at = excluded.deleted_at`,
    [
      input.id,
      input.name,
      input.kind,
      input.color,
      input.icon,
      input.initialBalanceCents,
      input.currency,
      input.archivedAt,
      createdAt,
      updatedAt,
      input.deletedAt,
    ],
  );
  return (await getAccount(input.id))!;
}

export async function softDeleteAccount(id: string) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE flux_account SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now(), now(), id],
  );
}

// ---------- categories ----------
export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM category WHERE deleted_at IS NULL ORDER BY name ASC',
  );
  return rows.map((r) => camel<Category>(r));
}

export async function upsertCategory(input: Omit<Category, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
}): Promise<Category> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>('SELECT created_at FROM category WHERE id = ?', [
    input.id,
  ]);
  const createdAt = existing?.created_at ?? input.createdAt ?? now();
  await db.runAsync(
    `INSERT INTO category (id, name, color, icon, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET name=excluded.name, color=excluded.color, icon=excluded.icon, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
    [input.id, input.name, input.color, input.icon, createdAt, now(), input.deletedAt],
  );
  const r = await db.getFirstAsync<any>('SELECT * FROM category WHERE id = ?', [input.id]);
  return camel<Category>(r);
}

export async function softDeleteCategory(id: string) {
  const db = await getDb();
  await db.runAsync('UPDATE category SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    now(),
    now(),
    id,
  ]);
}

// ---------- transactions ----------
export async function listTransactions(opts?: {
  fromDate?: string;
  toDate?: string;
  accountId?: string;
  categoryId?: string;
  limit?: number;
}): Promise<Transaction[]> {
  const db = await getDb();
  const where: string[] = ['deleted_at IS NULL'];
  const args: any[] = [];
  if (opts?.fromDate) {
    where.push('date >= ?');
    args.push(opts.fromDate);
  }
  if (opts?.toDate) {
    where.push('date <= ?');
    args.push(opts.toDate);
  }
  if (opts?.accountId) {
    where.push('(account_from_id = ? OR account_to_id = ?)');
    args.push(opts.accountId, opts.accountId);
  }
  if (opts?.categoryId) {
    where.push('category_id = ?');
    args.push(opts.categoryId);
  }
  const limit = opts?.limit ?? 1000;
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM transaction_log WHERE ${where.join(' AND ')} ORDER BY date DESC, created_at DESC LIMIT ?`,
    [...args, limit],
  );
  return rows.map((r) => camel<Transaction>(r));
}

export async function upsertTransaction(t: Omit<Transaction, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
}): Promise<Transaction> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    'SELECT created_at FROM transaction_log WHERE id = ?',
    [t.id],
  );
  const createdAt = existing?.created_at ?? t.createdAt ?? now();
  await db.runAsync(
    `INSERT INTO transaction_log (id, direction, amount_cents, currency, description, note, date, category_id, account_from_id, account_to_id, recurring_item_id, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       direction=excluded.direction,
       amount_cents=excluded.amount_cents,
       currency=excluded.currency,
       description=excluded.description,
       note=excluded.note,
       date=excluded.date,
       category_id=excluded.category_id,
       account_from_id=excluded.account_from_id,
       account_to_id=excluded.account_to_id,
       recurring_item_id=excluded.recurring_item_id,
       updated_at=excluded.updated_at,
       deleted_at=excluded.deleted_at`,
    [
      t.id,
      t.direction,
      t.amountCents,
      t.currency,
      t.description,
      t.note,
      t.date,
      t.categoryId,
      t.accountFromId,
      t.accountToId,
      t.recurringItemId,
      createdAt,
      now(),
      t.deletedAt,
    ],
  );
  const r = await db.getFirstAsync<any>('SELECT * FROM transaction_log WHERE id = ?', [t.id]);
  return camel<Transaction>(r);
}

export async function softDeleteTransaction(id: string) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE transaction_log SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now(), now(), id],
  );
}

// ---------- recurring ----------
export async function listRecurring(includePaused = true): Promise<RecurringItem[]> {
  const db = await getDb();
  const where = includePaused
    ? 'WHERE deleted_at IS NULL'
    : 'WHERE deleted_at IS NULL AND is_paused = 0';
  const rows = await db.getAllAsync<any>(
    `SELECT * FROM recurring_item ${where} ORDER BY name ASC`,
  );
  return rows.map((r) => camel<RecurringItem>(r));
}

export async function upsertRecurring(r: Omit<RecurringItem, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
}): Promise<RecurringItem> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>(
    'SELECT created_at FROM recurring_item WHERE id = ?',
    [r.id],
  );
  const createdAt = existing?.created_at ?? r.createdAt ?? now();
  await db.runAsync(
    `INSERT INTO recurring_item (id, name, direction, amount_cents, currency, category_id, account_id, note, interval_unit, interval_count, month_day, week_day, start_date, end_date, remaining_count, is_paused, last_run_at, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       direction=excluded.direction,
       amount_cents=excluded.amount_cents,
       currency=excluded.currency,
       category_id=excluded.category_id,
       account_id=excluded.account_id,
       note=excluded.note,
       interval_unit=excluded.interval_unit,
       interval_count=excluded.interval_count,
       month_day=excluded.month_day,
       week_day=excluded.week_day,
       start_date=excluded.start_date,
       end_date=excluded.end_date,
       remaining_count=excluded.remaining_count,
       is_paused=excluded.is_paused,
       last_run_at=excluded.last_run_at,
       updated_at=excluded.updated_at,
       deleted_at=excluded.deleted_at`,
    [
      r.id,
      r.name,
      r.direction,
      r.amountCents,
      r.currency,
      r.categoryId,
      r.accountId,
      r.note,
      r.intervalUnit,
      r.intervalCount,
      r.monthDay,
      r.weekDay,
      r.startDate,
      r.endDate,
      r.remainingCount,
      r.isPaused ? 1 : 0,
      r.lastRunAt,
      createdAt,
      now(),
      r.deletedAt,
    ],
  );
  const row = await db.getFirstAsync<any>('SELECT * FROM recurring_item WHERE id = ?', [r.id]);
  return camel<RecurringItem>(row);
}

export async function softDeleteRecurring(id: string) {
  const db = await getDb();
  await db.runAsync(
    'UPDATE recurring_item SET deleted_at = ?, updated_at = ? WHERE id = ?',
    [now(), now(), id],
  );
}

// ---------- budgets ----------
export async function listBudgets(): Promise<Budget[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM budget WHERE deleted_at IS NULL ORDER BY name ASC',
  );
  return rows.map((r) => camel<Budget>(r));
}

export async function upsertBudget(b: Omit<Budget, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
}): Promise<Budget> {
  const db = await getDb();
  const existing = await db.getFirstAsync<any>('SELECT created_at FROM budget WHERE id = ?', [
    b.id,
  ]);
  const createdAt = existing?.created_at ?? b.createdAt ?? now();
  await db.runAsync(
    `INSERT INTO budget (id, name, category_id, monthly_cap_cents, currency, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name,
       category_id=excluded.category_id,
       monthly_cap_cents=excluded.monthly_cap_cents,
       currency=excluded.currency,
       updated_at=excluded.updated_at,
       deleted_at=excluded.deleted_at`,
    [b.id, b.name, b.categoryId, b.monthlyCapCents, b.currency, createdAt, now(), b.deletedAt],
  );
  const r = await db.getFirstAsync<any>('SELECT * FROM budget WHERE id = ?', [b.id]);
  return camel<Budget>(r);
}

export async function softDeleteBudget(id: string) {
  const db = await getDb();
  await db.runAsync('UPDATE budget SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    now(),
    now(),
    id,
  ]);
}

// ---------- aggregations ----------
export async function accountBalance(accountId: string): Promise<number> {
  const db = await getDb();
  const acc = await getAccount(accountId);
  if (!acc) return 0;
  const inRow = await db.getFirstAsync<{ total: number | null }>(
    "SELECT COALESCE(SUM(amount_cents),0) AS total FROM transaction_log WHERE deleted_at IS NULL AND account_to_id = ? AND direction IN ('INCOME','TRANSFER')",
    [accountId],
  );
  const outRow = await db.getFirstAsync<{ total: number | null }>(
    "SELECT COALESCE(SUM(amount_cents),0) AS total FROM transaction_log WHERE deleted_at IS NULL AND account_from_id = ? AND direction IN ('EXPENSE','TRANSFER')",
    [accountId],
  );
  return acc.initialBalanceCents + (inRow?.total ?? 0) - (outRow?.total ?? 0);
}

export async function monthlySpendByCategory(month: Date): Promise<Record<string, number>> {
  const db = await getDb();
  const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
  const rows = await db.getAllAsync<{ category_id: string | null; total: number }>(
    `SELECT category_id, COALESCE(SUM(amount_cents),0) AS total
     FROM transaction_log
     WHERE deleted_at IS NULL AND direction = 'EXPENSE' AND date >= ? AND date < ?
     GROUP BY category_id`,
    [start, end],
  );
  const out: Record<string, number> = {};
  for (const r of rows) out[r.category_id ?? '__uncategorized__'] = r.total;
  return out;
}

export async function totalsForMonth(
  month: Date,
): Promise<{ income: number; expense: number }> {
  const db = await getDb();
  const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString();
  const row = await db.getFirstAsync<{ income: number; expense: number }>(
    `SELECT
       COALESCE(SUM(CASE WHEN direction='INCOME' THEN amount_cents ELSE 0 END),0) AS income,
       COALESCE(SUM(CASE WHEN direction='EXPENSE' THEN amount_cents ELSE 0 END),0) AS expense
     FROM transaction_log
     WHERE deleted_at IS NULL AND date >= ? AND date < ?`,
    [start, end],
  );
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
}
