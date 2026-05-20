import { create } from 'zustand';
import * as db from './db';
import type { FluxAccount, Category, Transaction, RecurringItem, Budget } from './db/types';
import { occurrencesBetween, type RecurringItemInputT } from '@flux/shared';
import { makeId } from './utils';

interface FluxStore {
  bootstrapped: boolean;
  hasOnboarded: boolean;
  accounts: FluxAccount[];
  categories: Category[];
  transactions: Transaction[];
  recurring: RecurringItem[];
  budgets: Budget[];

  bootstrap: () => Promise<void>;
  reloadAll: () => Promise<void>;

  createAccount: (input: Omit<FluxAccount, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'archivedAt'> & { id?: string }) => Promise<FluxAccount>;
  updateAccount: (id: string, patch: Partial<FluxAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  createCategory: (input: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;

  createTransaction: (input: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  createRecurring: (input: Omit<RecurringItem, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'lastRunAt'> & { id?: string }) => Promise<RecurringItem>;
  updateRecurring: (id: string, patch: Partial<RecurringItem>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  materialiseDueRecurring: () => Promise<number>;

  createBudget: (input: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'> & { id?: string }) => Promise<Budget>;
  deleteBudget: (id: string) => Promise<void>;

  completeOnboarding: () => Promise<void>;
}

export const useFluxStore = create<FluxStore>((set, get) => ({
  bootstrapped: false,
  hasOnboarded: false,
  accounts: [],
  categories: [],
  transactions: [],
  recurring: [],
  budgets: [],

  bootstrap: async () => {
    await db.getDb();
    const onboarded = (await db.getMeta('hasOnboarded')) === 'true';
    await get().reloadAll();
    set({ bootstrapped: true, hasOnboarded: onboarded });
  },

  reloadAll: async () => {
    const [accounts, categories, transactions, recurring, budgets] = await Promise.all([
      db.listAccounts(),
      db.listCategories(),
      db.listTransactions({ limit: 500 }),
      db.listRecurring(true),
      db.listBudgets(),
    ]);
    set({ accounts, categories, transactions, recurring, budgets });
  },

  createAccount: async (input) => {
    const acc = await db.upsertAccount({
      id: input.id ?? makeId(),
      name: input.name,
      kind: input.kind,
      color: input.color,
      icon: input.icon,
      initialBalanceCents: input.initialBalanceCents,
      currency: input.currency,
      archivedAt: null,
      deletedAt: null,
    });
    await get().reloadAll();
    return acc;
  },
  updateAccount: async (id, patch) => {
    const existing = get().accounts.find((a) => a.id === id);
    if (!existing) return;
    await db.upsertAccount({ ...existing, ...patch });
    await get().reloadAll();
  },
  deleteAccount: async (id) => {
    await db.softDeleteAccount(id);
    await get().reloadAll();
  },

  createCategory: async (input) => {
    const c = await db.upsertCategory({
      id: input.id ?? makeId(),
      name: input.name,
      color: input.color,
      icon: input.icon,
      deletedAt: null,
    });
    await get().reloadAll();
    return c;
  },
  deleteCategory: async (id) => {
    await db.softDeleteCategory(id);
    await get().reloadAll();
  },

  createTransaction: async (input) => {
    const t = await db.upsertTransaction({
      id: input.id ?? makeId(),
      direction: input.direction,
      amountCents: input.amountCents,
      currency: input.currency,
      description: input.description,
      note: input.note ?? null,
      date: input.date,
      categoryId: input.categoryId ?? null,
      accountFromId: input.accountFromId ?? null,
      accountToId: input.accountToId ?? null,
      recurringItemId: input.recurringItemId ?? null,
      deletedAt: null,
    });
    await get().reloadAll();
    return t;
  },
  updateTransaction: async (id, patch) => {
    const t = get().transactions.find((x) => x.id === id);
    if (!t) return;
    await db.upsertTransaction({ ...t, ...patch });
    await get().reloadAll();
  },
  deleteTransaction: async (id) => {
    await db.softDeleteTransaction(id);
    await get().reloadAll();
  },

  createRecurring: async (input) => {
    const r = await db.upsertRecurring({
      id: input.id ?? makeId(),
      name: input.name,
      direction: input.direction,
      amountCents: input.amountCents,
      currency: input.currency,
      categoryId: input.categoryId ?? null,
      accountId: input.accountId,
      note: input.note ?? null,
      intervalUnit: input.intervalUnit,
      intervalCount: input.intervalCount,
      monthDay: input.monthDay ?? null,
      weekDay: input.weekDay ?? null,
      startDate: input.startDate,
      endDate: input.endDate ?? null,
      remainingCount: input.remainingCount ?? null,
      isPaused: input.isPaused,
      lastRunAt: null,
      deletedAt: null,
    });
    await get().reloadAll();
    await get().materialiseDueRecurring();
    return r;
  },
  updateRecurring: async (id, patch) => {
    const r = get().recurring.find((x) => x.id === id);
    if (!r) return;
    await db.upsertRecurring({ ...r, ...patch });
    await get().reloadAll();
  },
  deleteRecurring: async (id) => {
    await db.softDeleteRecurring(id);
    await get().reloadAll();
  },

  /**
   * For every active recurring rule, materialise every occurrence due between
   * the rule's `lastRunAt` (or one step before `startDate`) and *now*.
   * Idempotent: existing transactions referencing the same rule + date are
   * skipped because the recurring rule's lastRunAt is advanced.
   */
  materialiseDueRecurring: async () => {
    const rules = get().recurring.filter((r) => !r.isPaused && !r.deletedAt);
    const today = new Date();
    let created = 0;
    for (const rule of rules) {
      const from = rule.lastRunAt
        ? new Date(rule.lastRunAt)
        : new Date(new Date(rule.startDate).getTime() - 1);
      const ruleForLib: Pick<
        RecurringItemInputT,
        'startDate' | 'intervalUnit' | 'intervalCount' | 'monthDay' | 'weekDay' | 'endDate' | 'remainingCount' | 'isPaused'
      > = {
        startDate: rule.startDate,
        intervalUnit: rule.intervalUnit,
        intervalCount: rule.intervalCount,
        monthDay: rule.monthDay,
        weekDay: rule.weekDay,
        endDate: rule.endDate,
        remainingCount: rule.remainingCount,
        isPaused: rule.isPaused,
      };
      const occurrences = occurrencesBetween(ruleForLib, from, today);
      for (const occ of occurrences) {
        await db.upsertTransaction({
          id: makeId(),
          direction: rule.direction,
          amountCents: rule.amountCents,
          currency: rule.currency,
          description: rule.name,
          note: rule.note,
          date: occ.toISOString(),
          categoryId: rule.categoryId,
          accountFromId: rule.direction === 'EXPENSE' ? rule.accountId : null,
          accountToId: rule.direction === 'INCOME' ? rule.accountId : null,
          recurringItemId: rule.id,
          deletedAt: null,
        });
        created++;
      }
      if (occurrences.length > 0) {
        await db.upsertRecurring({
          ...rule,
          lastRunAt: today.toISOString(),
          remainingCount:
            rule.remainingCount != null
              ? Math.max(0, rule.remainingCount - occurrences.length)
              : null,
        });
      }
    }
    if (created > 0) await get().reloadAll();
    return created;
  },

  createBudget: async (input) => {
    const b = await db.upsertBudget({
      id: input.id ?? makeId(),
      name: input.name,
      categoryId: input.categoryId ?? null,
      monthlyCapCents: input.monthlyCapCents,
      currency: input.currency,
      deletedAt: null,
    });
    await get().reloadAll();
    return b;
  },
  deleteBudget: async (id) => {
    await db.softDeleteBudget(id);
    await get().reloadAll();
  },

  completeOnboarding: async () => {
    await db.setMeta('hasOnboarded', 'true');
    set({ hasOnboarded: true });
  },
}));
