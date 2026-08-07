// ─── Plugin: Helmet (Security Headers) ───────────────────────
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export const registerHelmet = fp(async (app: FastifyInstance) => {
  await app.register(helmet, {
    contentSecurityPolicy: false, // Managed by Nginx
  });
});
