import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import authPlugin from './plugins/auth.js';
import authRoutes from './routes/auth.js';
import meRoutes from './routes/me.js';
import sessionsRoutes from './routes/sessions.js';
import memoryRoutes from './routes/memory.js';
import { env } from './env.js';

export const buildApp = () => {
  const app = Fastify({
    logger:
      env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' }
            }
          }
        : true
  });

  app.decorate('config', env);

  app.register(cors, { origin: env.CORS_ORIGIN, credentials: true });
  app.register(cookie);
  app.register(sensible);
  app.register(jwt, { secret: env.JWT_SECRET, cookie: { cookieName: 'token' } });
  app.register(authPlugin);

  app.get('/health', async () => ({ ok: true }));
  app.register(authRoutes);
  app.register(meRoutes);
  app.register(sessionsRoutes);
  app.register(memoryRoutes);

  return app;
};

declare module 'fastify' {
  interface FastifyInstance {
    config: typeof env;
  }
}
