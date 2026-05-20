import { z } from 'zod';

export const FluxAccountKind = z.enum(['CHECKING', 'SAVINGS', 'CASH', 'POT', 'OTHER']);
export type FluxAccountKindT = z.infer<typeof FluxAccountKind>;

export const TransactionDirection = z.enum(['EXPENSE', 'INCOME', 'TRANSFER']);
export type TransactionDirectionT = z.infer<typeof TransactionDirection>;

export const RecurrenceUnit = z.enum(['DAY', 'WEEK', 'MONTH', 'YEAR']);
export type RecurrenceUnitT = z.infer<typeof RecurrenceUnit>;

const id = z.string().min(1).max(64);
const isoDate = z.string().datetime({ offset: true });
const colorHex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Expected hex color');

export const FluxAccountInput = z.object({
  id,
  name: z.string().min(1).max(60),
  kind: FluxAccountKind.default('CHECKING'),
  color: colorHex.default('#5B8DEF'),
  icon: z.string().default('wallet'),
  initialBalanceCents: z.number().int().default(0),
  currency: z.string().length(3).default('EUR'),
  archivedAt: isoDate.nullable().optional(),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});
export type FluxAccountInputT = z.infer<typeof FluxAccountInput>;

export const CategoryInput = z.object({
  id,
  name: z.string().min(1).max(40),
  color: colorHex.default('#94A3B8'),
  icon: z.string().default('tag'),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});
export type CategoryInputT = z.infer<typeof CategoryInput>;

export const TransactionInput = z.object({
  id,
  direction: TransactionDirection.default('EXPENSE'),
  amountCents: z.number().int(),
  currency: z.string().length(3).default('EUR'),
  description: z.string().min(1).max(120),
  note: z.string().max(500).nullable().optional(),
  date: isoDate,
  categoryId: id.nullable().optional(),
  accountFromId: id.nullable().optional(),
  accountToId: id.nullable().optional(),
  recurringItemId: id.nullable().optional(),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});
export type TransactionInputT = z.infer<typeof TransactionInput>;

export const RecurringItemInput = z
  .object({
    id,
    name: z.string().min(1).max(80),
    direction: TransactionDirection.default('EXPENSE'),
    amountCents: z.number().int(),
    currency: z.string().length(3).default('EUR'),
    categoryId: id.nullable().optional(),
    accountId: id,
    note: z.string().max(500).nullable().optional(),
    intervalUnit: RecurrenceUnit,
    intervalCount: z.number().int().min(1).max(366).default(1),
    monthDay: z.number().int().min(1).max(31).nullable().optional(),
    weekDay: z.number().int().min(0).max(6).nullable().optional(),
    startDate: isoDate,
    endDate: isoDate.nullable().optional(),
    remainingCount: z.number().int().min(0).nullable().optional(),
    isPaused: z.boolean().default(false),
    lastRunAt: isoDate.nullable().optional(),
    createdAt: isoDate.optional(),
    updatedAt: isoDate.optional(),
    deletedAt: isoDate.nullable().optional(),
  })
  .refine((v) => !(v.endDate && v.remainingCount !== null && v.remainingCount !== undefined), {
    message: 'Use either endDate or remainingCount, not both',
    path: ['endDate'],
  });
export type RecurringItemInputT = z.infer<typeof RecurringItemInput>;

export const BudgetInput = z.object({
  id,
  name: z.string().min(1).max(60),
  categoryId: id.nullable().optional(),
  monthlyCapCents: z.number().int().min(0),
  currency: z.string().length(3).default('EUR'),
  createdAt: isoDate.optional(),
  updatedAt: isoDate.optional(),
  deletedAt: isoDate.nullable().optional(),
});
export type BudgetInputT = z.infer<typeof BudgetInput>;

// Sync payload: client pushes new/updated entities and asks for the diff since
// the cursor. The server returns its own deltas and an updated cursor.
export const SyncPushPayload = z.object({
  deviceId: z.string().min(1).max(80),
  cursor: isoDate.nullable(),
  accounts: z.array(FluxAccountInput).default([]),
  categories: z.array(CategoryInput).default([]),
  transactions: z.array(TransactionInput).default([]),
  recurringItems: z.array(RecurringItemInput).default([]),
  budgets: z.array(BudgetInput).default([]),
});
export type SyncPushPayloadT = z.infer<typeof SyncPushPayload>;

export const SyncPullResponse = z.object({
  cursor: isoDate,
  accounts: z.array(FluxAccountInput),
  categories: z.array(CategoryInput),
  transactions: z.array(TransactionInput),
  recurringItems: z.array(RecurringItemInput),
  budgets: z.array(BudgetInput),
});
export type SyncPullResponseT = z.infer<typeof SyncPullResponse>;
