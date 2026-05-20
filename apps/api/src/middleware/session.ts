import type { MiddlewareHandler } from 'hono';
import { auth } from '../auth.js';

export type AuthContext = {
  Variables: {
    userId: string;
    sessionId: string;
  };
};

export const requireSession: MiddlewareHandler<AuthContext> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  c.set('userId', session.user.id);
  c.set('sessionId', session.session.id);
  await next();
};
