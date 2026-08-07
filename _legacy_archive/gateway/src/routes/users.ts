// User routes — basic CRUD for user management

import type { FastifyInstance } from 'fastify';
import { requireRole } from '@middleware/rbac';
import type { JwtPayload } from '@middleware/rbac';

export async function registerUserRoutes(app: FastifyInstance) {
  /**
   * GET /api/v1/users — List all users (admin only)
   */
  app.get(
    '/',
    {
      preHandler: [app.authenticate, requireRole('admin')],
      schema: {
        tags: ['users'],
        summary: 'List all users (admin only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', minimum: 1, default: 1 },
            pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
          },
        },
      },
    },
    async (request, reply) => {
      const { page = 1, pageSize = 20 } = request.query as any;

      const [users, total] = await Promise.all([
        app.prisma.user.findMany({
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: { id: true, email: true, fullName: true, role: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
        app.prisma.user.count(),
      ]);

      return reply.send({
        items: users,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    },
  );

  /**
   * PATCH /api/v1/users/:userId/role — Update user role (admin only)
   */
  app.patch(
    '/:userId/role',
    {
      preHandler: [app.authenticate, requireRole('admin')],
      schema: {
        tags: ['users'],
        summary: 'Update a user role (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          properties: { userId: { type: 'string', format: 'uuid' } },
          required: ['userId'],
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['citizen', 'owner', 'builder', 'municipal', 'admin'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { userId } = request.params as { userId: string };
      const { role } = request.body as { role: string };

      const user = await app.prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        select: { id: true, email: true, fullName: true, role: true },
      });

      return reply.send({ user });
    },
  );
}
