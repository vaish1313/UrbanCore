// ============================================================
// WebSocket Routes — Real-time Job Progress Updates
// Clients subscribe to a job channel and receive progress events.
// Gateway subscribes to Redis pub/sub and fans out to WebSocket clients.
// ============================================================

import type { FastifyInstance } from 'fastify';

// Map of jobId → Set of connected WebSocket clients
const jobSubscribers = new Map<string, Set<any>>();

export async function registerWebSocketRoutes(app: FastifyInstance) {
  /**
   * WS /ws/jobs/:jobId
   * Subscribe to real-time updates for a specific job.
   * Auth: JWT provided as query param ?token=<jwt>
   */
  app.get('/ws/jobs/:jobId', { websocket: true }, async (socket, request) => {
    const { jobId } = request.params as { jobId: string };

    // Verify JWT from query param
    const token = (request.query as any)?.token;
    if (!token) {
      socket.close(4001, 'Authentication required');
      return;
    }

    let user: any;
    try {
      user = app.jwt.verify(token);
    } catch {
      socket.close(4001, 'Invalid or expired token');
      return;
    }

    // Track subscriber
    if (!jobSubscribers.has(jobId)) {
      jobSubscribers.set(jobId, new Set());
    }
    jobSubscribers.get(jobId)!.add(socket);
    app.log.info({ jobId, userId: user.sub }, 'WebSocket client subscribed');

    // Subscribe to Redis channel for this job
    const redisSubscriber = app.redis.duplicate();
    await redisSubscriber.subscribe(`urbancore:events:${jobId}`);

    redisSubscriber.on('message', (_channel, message) => {
      if (socket.readyState === 1) { // OPEN
        socket.send(message);
      }
    });

    // Send initial connection ack
    socket.send(JSON.stringify({
      event_type: 'connection.established',
      job_id: jobId,
      timestamp: new Date().toISOString(),
    }));

    // Cleanup on disconnect
    socket.on('close', async () => {
      jobSubscribers.get(jobId)?.delete(socket);
      if (jobSubscribers.get(jobId)?.size === 0) {
        jobSubscribers.delete(jobId);
      }
      await redisSubscriber.unsubscribe();
      await redisSubscriber.quit();
      app.log.info({ jobId, userId: user.sub }, 'WebSocket client disconnected');
    });

    socket.on('error', (err) => {
      app.log.error({ err, jobId }, 'WebSocket error');
    });
  });
}
