import * as db from './db';
import { authClient } from './auth-client';
import { useFluxStore } from './store';
import type { SyncPullResponseT, SyncPushPayloadT } from '@flux/shared';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://flux-api.kepler-industries.com';

async function authedFetch(path: string, init?: RequestInit) {
  const cookie = authClient.getCookie?.() ?? '';
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
      ...(init?.headers ?? {}),
    },
  });
}

async function getDeviceId(): Promise<string> {
  const existing = await db.getMeta('deviceId');
  if (existing) return existing;
  const id = `dev-${Math.random().toString(36).slice(2, 12)}`;
  await db.setMeta('deviceId', id);
  return id;
}

export async function pushLocal(): Promise<{ cursor: string } | null> {
  const session = await authClient.getSession();
  if (!session?.data?.user) return null;
  const deviceId = await getDeviceId();
  const cursor = await db.getMeta('syncCursor');
  const [accounts, categories, transactions, recurring, budgets] = await Promise.all([
    db.listAccounts(true),
    db.listCategories(),
    db.listTransactions({ limit: 5000 }),
    db.listRecurring(true),
    db.listBudgets(),
  ]);
  const payload: SyncPushPayloadT = {
    deviceId,
    cursor: cursor ?? null,
    accounts: accounts.map(toIso),
    categories: categories.map(toIso),
    transactions: transactions.map(toIso),
    recurringItems: recurring.map(toIso),
    budgets: budgets.map(toIso),
  };
  const res = await authedFetch('/sync/push', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`push failed: ${res.status}`);
  const data = (await res.json()) as { cursor: string };
  await db.setMeta('syncCursor', data.cursor);
  return data;
}

export async function pullRemote(): Promise<SyncPullResponseT | null> {
  const session = await authClient.getSession();
  if (!session?.data?.user) return null;
  const cursor = await db.getMeta('syncCursor');
  const url = cursor ? `/sync/pull?since=${encodeURIComponent(cursor)}` : '/sync/pull';
  const res = await authedFetch(url, { method: 'GET' });
  if (!res.ok) throw new Error(`pull failed: ${res.status}`);
  const data = (await res.json()) as SyncPullResponseT;
  for (const a of data.accounts)
    await db.upsertAccount({
      id: a.id,
      name: a.name,
      kind: a.kind,
      color: a.color,
      icon: a.icon,
      initialBalanceCents: a.initialBalanceCents,
      currency: a.currency,
      archivedAt: a.archivedAt ?? null,
      deletedAt: a.deletedAt ?? null,
    });
  for (const c of data.categories)
    await db.upsertCategory({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      deletedAt: c.deletedAt ?? null,
    });
  for (const t of data.transactions)
    await db.upsertTransaction({
      id: t.id,
      direction: t.direction,
      amountCents: t.amountCents,
      currency: t.currency,
      description: t.description,
      note: t.note ?? null,
      date: t.date,
      categoryId: t.categoryId ?? null,
      accountFromId: t.accountFromId ?? null,
      accountToId: t.accountToId ?? null,
      recurringItemId: t.recurringItemId ?? null,
      deletedAt: t.deletedAt ?? null,
    });
  for (const r of data.recurringItems)
    await db.upsertRecurring({
      id: r.id,
      name: r.name,
      direction: r.direction,
      amountCents: r.amountCents,
      currency: r.currency,
      categoryId: r.categoryId ?? null,
      accountId: r.accountId,
      note: r.note ?? null,
      intervalUnit: r.intervalUnit,
      intervalCount: r.intervalCount,
      monthDay: r.monthDay ?? null,
      weekDay: r.weekDay ?? null,
      startDate: r.startDate,
      endDate: r.endDate ?? null,
      remainingCount: r.remainingCount ?? null,
      isPaused: r.isPaused,
      lastRunAt: r.lastRunAt ?? null,
      deletedAt: r.deletedAt ?? null,
    });
  for (const b of data.budgets)
    await db.upsertBudget({
      id: b.id,
      name: b.name,
      categoryId: b.categoryId ?? null,
      monthlyCapCents: b.monthlyCapCents,
      currency: b.currency,
      deletedAt: b.deletedAt ?? null,
    });
  await db.setMeta('syncCursor', data.cursor);
  await useFluxStore.getState().reloadAll();
  return data;
}

export async function syncBoth(): Promise<void> {
  try {
    await pullRemote();
    await pushLocal();
  } catch (e) {
    console.warn('sync failed', e);
  }
}

function toIso<T extends { createdAt?: string; updatedAt?: string }>(row: T): T {
  // SQLite returns strings already; nothing to do.
  return row;
}
