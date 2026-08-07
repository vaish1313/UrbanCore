// ─── Plugin: WebSocket ────────────────────────────────────────
import fp from 'fastify-plugin';
import websocket from '@fastify/websocket';
import type { FastifyInstance } from 'fastify';

export const registerWebSocket = fp(async (app: FastifyInstance) => {
  await app.register(websocket, {
    options: {
      maxPayload: 1048576, // 1 MB
      clientTracking: true,
    },
  });
});
