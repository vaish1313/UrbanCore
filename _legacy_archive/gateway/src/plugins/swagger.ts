// ─── Plugin: Swagger / OpenAPI Docs ──────────────────────────
import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export const registerSwagger = fp(async (app: FastifyInstance) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'UrbanCore API',
        description: 'AI-powered geospatial decision support platform API',
        version: '1.0.0',
      },
      tags: [
        { name: 'auth', description: 'Authentication & authorization' },
        { name: 'users', description: 'User management' },
        { name: 'projects', description: 'Project & AOI management' },
        { name: 'jobs', description: 'Analysis job management' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });
});
