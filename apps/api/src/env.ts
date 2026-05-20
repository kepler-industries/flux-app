import { z } from 'zod';

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, 'BETTER_AUTH_SECRET must be at least 32 characters')
    .default('dev-secret-please-change-it-to-32+chars-now'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3000'),
  PUBLIC_APP_SCHEME: z.string().default('flux'),
  TRUSTED_ORIGINS: z.string().default('flux://,http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  GOOGLE_CLIENT_SECRET: z.string().default(''),
  APPLE_CLIENT_ID: z.string().default(''),
  APPLE_CLIENT_SECRET: z.string().default(''),
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = Env.parse(process.env);

export const trustedOrigins = env.TRUSTED_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
