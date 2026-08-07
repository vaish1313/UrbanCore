// Project routes — AOI project management

import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { JwtPayload } from '@middleware/rbac';

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  location: z.string().optional(), // e.g. 'Bangalore, India'
});

export async function registerProjectRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/projects
   */
  app.post(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Create a new project',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const body = CreateProjectSchema.parse(request.body);

      const project = await app.prisma.project.create({
        data: { ...body, userId: user.sub },
      });

      return reply.status(201).send({ project });
    },
  );

  /**
   * GET /api/v1/projects
   */
  app.get(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['projects'],
        summary: 'List user projects',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;

      const projects = await app.prisma.project.findMany({
        where: { userId: user.sub },
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { jobs: true } } },
      });

      return reply.send({ projects });
    },
  );

  /**
   * DELETE /api/v1/projects/:projectId
   */
  app.delete(
    '/:projectId',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['projects'],
        summary: 'Delete a project',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { projectId: { type: 'string', format: 'uuid' } },
          required: ['projectId'],
        },
      },
    },
    async (request, reply) => {
      const user = request.user as JwtPayload;
      const { projectId } = request.params as { projectId: string };

      const project = await app.prisma.project.findFirst({
        where: { id: projectId, userId: user.sub },
      });

      if (!project) {
        return reply.status(404).send({ error: 'ERR_NOT_FOUND', message: 'Project not found.' });
      }

      await app.prisma.project.delete({ where: { id: projectId } });
      return reply.send({ message: 'Project deleted.' });
    },
  );
}
