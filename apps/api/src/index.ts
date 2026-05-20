import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth.js';
import { env, trustedOrigins } from './env.js';
import sync from './routes/sync.js';

const app = new Hono();

app.use('*', logger());

app.use(
  '/api/auth/*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = trustedOrigins.some((o) => origin.startsWith(o));
      return allowed ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }),
);

app.use(
  '/sync/*',
  cors({
    origin: (origin) => {
      if (!origin) return null;
      const allowed = trustedOrigins.some((o) => origin.startsWith(o));
      return allowed ? origin : null;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'Cookie'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    credentials: true,
  }),
);

app.get('/', (c) =>
  c.json({
    name: 'flux-api',
    status: 'ok',
    docs: 'https://flux-api.kepler-industries.com',
  }),
);

app.get('/health', (c) => c.json({ status: 'ok' }));

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/sync', sync);

const port = env.PORT;

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`flux-api listening on http://localhost:${info.port}`);
});

export default app;
