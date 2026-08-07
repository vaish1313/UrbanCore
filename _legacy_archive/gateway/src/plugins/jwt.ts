// ─── Plugin: Fastify JWT ─────────────────────────────────────
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';
import type { FastifyInstance } from 'fastify';
import { config } from '@config/index';

export const registerJwt = fp(async (app: FastifyInstance) => {
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_EXPIRES_IN },
  });

  // Decorate authenticate hook for route preHandlers
  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({ error: 'ERR_UNAUTHORIZED', message: 'Invalid or expired token.' });
    }
  });
});
