// ─── Plugin: Redis ────────────────────────────────────────────
import fp from 'fastify-plugin';
import Redis from 'ioredis';
import type { FastifyInstance } from 'fastify';
import { config } from '@config/index';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export const registerRedis = fp(async (app: FastifyInstance) => {
  const redis = new Redis(config.REDIS_URL, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  redis.on('connect', () => app.log.info('Redis connected'));
  redis.on('error', (err) => app.log.error({ err }, 'Redis error'));

  app.decorate('redis', redis);

  app.addHook('onClose', async () => {
    await redis.quit();
    app.log.info('Redis connection closed');
  });
});
