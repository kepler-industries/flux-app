import type {
  FluxAccountKindT,
  TransactionDirectionT,
  RecurrenceUnitT,
} from '@flux/shared';

export interface FluxAccount {
  id: string;
  name: string;
  kind: FluxAccountKindT;
  color: string;
  icon: string;
  initialBalanceCents: number;
  currency: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Transaction {
  id: string;
  direction: TransactionDirectionT;
  amountCents: number;
  currency: string;
  description: string;
  note: string | null;
  date: string;
  categoryId: string | null;
  accountFromId: string | null;
  accountToId: string | null;
  recurringItemId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RecurringItem {
  id: string;
  name: string;
  direction: TransactionDirectionT;
  amountCents: number;
  currency: string;
  categoryId: string | null;
  accountId: string;
  note: string | null;
  intervalUnit: RecurrenceUnitT;
  intervalCount: number;
  monthDay: number | null;
  weekDay: number | null;
  startDate: string;
  endDate: string | null;
  remainingCount: number | null;
  isPaused: boolean;
  lastRunAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Budget {
  id: string;
  name: string;
  categoryId: string | null;
  monthlyCapCents: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
