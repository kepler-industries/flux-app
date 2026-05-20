import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __fluxPrisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__fluxPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__fluxPrisma = prisma;
}

export * from '@prisma/client';
