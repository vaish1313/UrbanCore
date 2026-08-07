// ─── Plugin: Rate Limiting ────────────────────────────────────
import fp from 'fastify-plugin';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { config } from '@config/index';

export const registerRateLimit = fp(async (app: FastifyInstance) => {
  await app.register(rateLimit, {
    global: true,
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
    redis: app.redis,
    keyGenerator: (request) => {
      // Use user ID if authenticated, fall back to IP
      const user = (request as any).user;
      return user?.sub ?? request.ip;
    },
    errorResponseBuilder: () => ({
      error: 'ERR_RATE_LIMIT',
      message: 'Too many requests. Please slow down.',
    }),
  });
});
