import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@flux/db';
import { SyncPushPayload } from '@flux/shared';
import { requireSession, type AuthContext } from '../middleware/session.js';

const sync = new Hono<AuthContext>();

sync.use('*', requireSession);

const PullQuery = z.object({
  since: z.string().datetime({ offset: true }).optional(),
});

/**
 * GET /sync/pull?since=ISO
 * Returns every entity owned by the user that was modified strictly after
 * `since`. When `since` is omitted, returns the full snapshot.
 */
sync.get('/pull', zValidator('query', PullQuery), async (c) => {
  const userId = c.get('userId');
  const { since } = c.req.valid('query');
  const after = since ? new Date(since) : null;
  const filter = after ? { userId, updatedAt: { gt: after } } : { userId };

  const [accounts, categories, transactions, recurringItems, budgets] = await Promise.all([
    prisma.fluxAccount.findMany({ where: filter, orderBy: { updatedAt: 'asc' } }),
    prisma.category.findMany({ where: filter, orderBy: { updatedAt: 'asc' } }),
    prisma.transaction.findMany({ where: filter, orderBy: { updatedAt: 'asc' } }),
    prisma.recurringItem.findMany({ where: filter, orderBy: { updatedAt: 'asc' } }),
    prisma.budget.findMany({ where: filter, orderBy: { updatedAt: 'asc' } }),
  ]);

  return c.json({
    cursor: new Date().toISOString(),
    accounts,
    categories,
    transactions,
    recurringItems,
    budgets,
  });
});

/**
 * POST /sync/push
 * Last-write-wins upsert by id+userId. Soft-deletes are honoured via deletedAt.
 * Returns the server-side cursor so the client can persist it.
 */
sync.post('/push', zValidator('json', SyncPushPayload), async (c) => {
  const userId = c.get('userId');
  const payload = c.req.valid('json');

  await prisma.$transaction(async (tx) => {
    await tx.syncState.upsert({
      where: { userId_deviceId: { userId, deviceId: payload.deviceId } },
      create: { userId, deviceId: payload.deviceId, lastPulled: new Date() },
      update: { lastPulled: new Date() },
    });

    for (const a of payload.accounts) {
      await tx.fluxAccount.upsert({
        where: { id: a.id },
        update: {
          name: a.name,
          kind: a.kind,
          color: a.color,
          icon: a.icon,
          initialBalanceCents: a.initialBalanceCents,
          currency: a.currency,
          archivedAt: a.archivedAt ? new Date(a.archivedAt) : null,
          deletedAt: a.deletedAt ? new Date(a.deletedAt) : null,
        },
        create: {
          id: a.id,
          userId,
          name: a.name,
          kind: a.kind,
          color: a.color,
          icon: a.icon,
          initialBalanceCents: a.initialBalanceCents,
          currency: a.currency,
          archivedAt: a.archivedAt ? new Date(a.archivedAt) : null,
          deletedAt: a.deletedAt ? new Date(a.deletedAt) : null,
        },
      });
    }

    for (const cat of payload.categories) {
      await tx.category.upsert({
        where: { id: cat.id },
        update: {
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          deletedAt: cat.deletedAt ? new Date(cat.deletedAt) : null,
        },
        create: {
          id: cat.id,
          userId,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
          deletedAt: cat.deletedAt ? new Date(cat.deletedAt) : null,
        },
      });
    }

    for (const t of payload.transactions) {
      await tx.transaction.upsert({
        where: { id: t.id },
        update: {
          direction: t.direction,
          amountCents: t.amountCents,
          currency: t.currency,
          description: t.description,
          note: t.note ?? null,
          date: new Date(t.date),
          categoryId: t.categoryId ?? null,
          accountFromId: t.accountFromId ?? null,
          accountToId: t.accountToId ?? null,
          recurringItemId: t.recurringItemId ?? null,
          deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
        },
        create: {
          id: t.id,
          userId,
          direction: t.direction,
          amountCents: t.amountCents,
          currency: t.currency,
          description: t.description,
          note: t.note ?? null,
          date: new Date(t.date),
          categoryId: t.categoryId ?? null,
          accountFromId: t.accountFromId ?? null,
          accountToId: t.accountToId ?? null,
          recurringItemId: t.recurringItemId ?? null,
          deletedAt: t.deletedAt ? new Date(t.deletedAt) : null,
        },
      });
    }

    for (const r of payload.recurringItems) {
      await tx.recurringItem.upsert({
        where: { id: r.id },
        update: {
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
          startDate: new Date(r.startDate),
          endDate: r.endDate ? new Date(r.endDate) : null,
          remainingCount: r.remainingCount ?? null,
          isPaused: r.isPaused,
          lastRunAt: r.lastRunAt ? new Date(r.lastRunAt) : null,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        },
        create: {
          id: r.id,
          userId,
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
          startDate: new Date(r.startDate),
          endDate: r.endDate ? new Date(r.endDate) : null,
          remainingCount: r.remainingCount ?? null,
          isPaused: r.isPaused,
          lastRunAt: r.lastRunAt ? new Date(r.lastRunAt) : null,
          deletedAt: r.deletedAt ? new Date(r.deletedAt) : null,
        },
      });
    }

    for (const b of payload.budgets) {
      await tx.budget.upsert({
        where: { id: b.id },
        update: {
          name: b.name,
          categoryId: b.categoryId ?? null,
          monthlyCapCents: b.monthlyCapCents,
          currency: b.currency,
          deletedAt: b.deletedAt ? new Date(b.deletedAt) : null,
        },
        create: {
          id: b.id,
          userId,
          name: b.name,
          categoryId: b.categoryId ?? null,
          monthlyCapCents: b.monthlyCapCents,
          currency: b.currency,
          deletedAt: b.deletedAt ? new Date(b.deletedAt) : null,
        },
      });
    }
  });

  return c.json({ ok: true, cursor: new Date().toISOString() });
});

export default sync;
