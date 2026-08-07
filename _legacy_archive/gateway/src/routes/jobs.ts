// ============================================================
// Jobs Routes — Create, List, Get, Cancel Analysis Jobs
// Orchestrates AI + GIS + Intelligence services via HTTP
// ============================================================

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { JwtPayload } from '@middleware/rbac';
import { requireRole } from '@middleware/rbac';
import { config } from '@config/index';
import axios from 'axios';

const CreateJobSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  aoi: z.object({
    type: z.literal('Polygon'),
    coordinates: z.array(z.array(z.array(z.number()))),
  }),
  epochs: z.array(z.string().regex(/^\d{4}-(Q[1-4]|\d{2})$/)).min(1).max(5),
  generateReport: z.boolean().default(true),
});

export async function registerJobRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/jobs
   * Create a new analysis job
   * Requires: owner, builder, municipal, or admin
   */
  app.post(
    '/',
    {
      preHandler: [app.authenticate, requireRole('owner')],
      schema: {
        tags: ['jobs'],
        summary: 'Submit a new analysis job',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = CreateJobSchema.parse(request.body);

      // Create job record in gateway DB
      const job = await app.prisma.analysisJob.create({
        data: {
          userId: user.sub,
          name: body.name,
          description: body.description,
          aoiGeoJson: body.aoi as any,
          epochs: body.epochs,
          status: 'pending',
          progress: 0,
        },
      });

      // Dispatch to AI service asynchronously
      try {
        await axios.post(
          `${config.AI_SERVICE_URL}/internal/jobs/start`,
          {
            jobId: job.id,
            userId: user.sub,
            userRole: user.role,
            aoi: body.aoi,
            epochs: body.epochs,
            generateReport: body.generateReport,
          },
          {
            headers: { 'X-Internal-Secret': config.AI_SERVICE_INTERNAL_SECRET },
            timeout: 5000,
          },
        );
      } catch (err) {
        // Update job status to failed if we couldn't dispatch
        await app.prisma.analysisJob.update({
          where: { id: job.id },
          data: { status: 'failed', errorMessage: 'Failed to dispatch job to AI service.' },
        });
        app.log.error({ err, jobId: job.id }, 'Failed to dispatch job');
        return reply.status(503).send({
          error: 'ERR_SERVICE_UNAVAILABLE',
          message: 'AI service is currently unavailable. Please try again.',
        });
      }

      return reply.status(202).send({
        job: {
          id: job.id,
          name: job.name,
          status: job.status,
          progress: job.progress,
          createdAt: job.createdAt,
        },
        websocketUrl: `/ws/jobs/${job.id}`,
      });
    },
  );

  /**
   * GET /api/v1/jobs
   * List current user's jobs (paginated)
   */
  app.get(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['jobs'],
        summary: 'List analysis jobs for current user',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
            status: { type: 'string', enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'] },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const { page = 1, pageSize = 20, status } = request.query as any;

      const where: any = { userId: user.sub };
      if (status) where.status = status;

      const [jobs, total] = await Promise.all([
        app.prisma.analysisJob.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true, name: true, status: true, progress: true,
            epochs: true, createdAt: true, completedAt: true,
          },
        }),
        app.prisma.analysisJob.count({ where }),
      ]);

      return reply.send({
        items: jobs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );

  /**
   * GET /api/v1/jobs/:jobId
   * Get full job details with results
   */
  app.get(
    '/:jobId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['jobs'],
        summary: 'Get job details and results',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { jobId: { type: 'string', format: 'uuid' } },
          required: ['jobId'],
        },
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const { jobId } = request.params as { jobId: string };

      const job = await app.prisma.analysisJob.findFirst({
        where: {
          id: jobId,
          // Municipal and admin can see all jobs
          ...(user.role === 'citizen' || user.role === 'owner' || user.role === 'builder'
            ? { userId: user.sub }
            : {}),
        },
      });

      if (!job) {
        return reply.status(404).send({ error: 'ERR_NOT_FOUND', message: 'Job not found.' });
      }

      return reply.send({ job });
    },
  );

  /**
   * DELETE /api/v1/jobs/:jobId
   * Cancel a pending/processing job
   */
  app.delete(
    '/:jobId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['jobs'],
        summary: 'Cancel an analysis job',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { jobId: { type: 'string', format: 'uuid' } },
          required: ['jobId'],
        },
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const { jobId } = request.params as { jobId: string };

      const job = await app.prisma.analysisJob.findFirst({
        where: { id: jobId, userId: user.sub },
      });

      if (!job) {
        return reply.status(404).send({ error: 'ERR_NOT_FOUND', message: 'Job not found.' });
      }

      if (!['pending', 'processing'].includes(job.status)) {
        return reply.status(409).send({
          error: 'ERR_CONFLICT',
          message: `Cannot cancel job in status '${job.status}'.`,
        });
      }

      await app.prisma.analysisJob.update({
        where: { id: jobId },
        data: { status: 'cancelled' },
      });

      return reply.send({ message: 'Job cancelled successfully.' });
    },
  );
}
