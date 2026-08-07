// ============================================================
// UrbanCore Gateway — Application Entry Point
// Fastify application bootstrap with all plugins and routes.
// ============================================================

import Fastify from 'fastify';
import { config } from '@config/index';

// Plugins
import { registerCors } from '@plugins/cors';
import { registerHelmet } from '@plugins/helmet';
import { registerJwt } from '@plugins/jwt';
import { registerRateLimit } from '@plugins/rateLimit';
import { registerSwagger } from '@plugins/swagger';
import { registerWebSocket } from '@plugins/websocket';
import { registerRedis } from '@plugins/redis';
import { registerDatabase } from '@plugins/database';

// Routes
import { registerAuthRoutes } from '@routes/auth';
import { registerUserRoutes } from '@routes/users';
import { registerProjectRoutes } from '@routes/projects';
import { registerJobRoutes } from '@routes/jobs';
import { registerWebSocketRoutes } from '@routes/websocket';

// Error handler
import { globalErrorHandler } from '@middleware/errorHandler';

async function buildApp() {
  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.APP_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    // Schema-based request validation — core Fastify feature
    ajv: {
      customOptions: {
        removeAdditional: true,
        useDefaults: true,
        coerceTypes: true,
      },
    },
  });

  // ─── Infrastructure Plugins ──────────────────────────────
  await app.register(registerDatabase);
  await app.register(registerRedis);

  // ─── Security Plugins ────────────────────────────────────
  await app.register(registerHelmet);
  await app.register(registerCors);
  await app.register(registerRateLimit);
  await app.register(registerJwt);

  // ─── Protocol Plugins ────────────────────────────────────
  await app.register(registerWebSocket);

  // ─── Documentation ───────────────────────────────────────
  if (config.APP_ENV !== 'production') {
    await app.register(registerSwagger);
  }

  // ─── Error Handler ───────────────────────────────────────
  app.setErrorHandler(globalErrorHandler);

  // ─── Health Check ────────────────────────────────────────
  app.get('/health', { schema: { hide: true } }, async () => ({
    status: 'ok',
    version: config.APP_VERSION,
    environment: config.APP_ENV,
    timestamp: new Date().toISOString(),
  }));

  // ─── API Routes (v1 prefix) ──────────────────────────────
  await app.register(
    async (api) => {
      await api.register(registerAuthRoutes, { prefix: '/auth' });
      await api.register(registerUserRoutes, { prefix: '/users' });
      await api.register(registerProjectRoutes, { prefix: '/projects' });
      await api.register(registerJobRoutes, { prefix: '/jobs' });
    },
    { prefix: '/api/v1' },
  );

  // ─── WebSocket Routes ────────────────────────────────────
  await app.register(registerWebSocketRoutes);

  return app;
}

async function main() {
  const app = await buildApp();

  try {
    await app.listen({ port: config.GATEWAY_PORT, host: config.GATEWAY_HOST });
    app.log.info(
      `🚀 UrbanCore Gateway listening on ${config.GATEWAY_HOST}:${config.GATEWAY_PORT}`,
    );
    app.log.info(`📖 API Docs available at http://localhost:${config.GATEWAY_PORT}/docs`);
  } catch (err) {
    app.log.error(err, 'Failed to start server');
    process.exit(1);
  }

  // ─── Graceful Shutdown ───────────────────────────────────
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main();
