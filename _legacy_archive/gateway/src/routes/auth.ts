// ============================================================
// Auth Routes — Register, Login, Refresh, Profile
// ============================================================

import type { FastifyInstance, FastifyRequest } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2).max(100),
  role: z.enum(['citizen', 'owner', 'builder', 'municipal']).default('citizen'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAuthRoutes(app: FastifyInstance) {
  /**
   * POST /api/v1/auth/register
   * Create a new user account
   */
  app.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'Register a new user',
        body: {
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            fullName: { type: 'string', minLength: 2 },
            role: { type: 'string', enum: ['citizen', 'owner', 'builder', 'municipal'] },
          },
        },
      },
    },
    async (request, reply) => {
      const body = RegisterSchema.parse(request.body);

      // Check for existing user
      const existing = await app.prisma.user.findUnique({ where: { email: body.email } });
      if (existing) {
        return reply.status(409).send({ error: 'ERR_CONFLICT', message: 'Email already registered.' });
      }

      const passwordHash = await bcrypt.hash(body.password, 12);

      const user = await app.prisma.user.create({
        data: {
          email: body.email,
          passwordHash,
          fullName: body.fullName,
          role: body.role,
        },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      });

      const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

      return reply.status(201).send({ user, token });
    },
  );

  /**
   * POST /api/v1/auth/login
   * Authenticate with email + password
   */
  app.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'Login with email and password',
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const body = LoginSchema.parse(request.body);

      const user = await app.prisma.user.findUnique({ where: { email: body.email } });
      if (!user) {
        return reply.status(401).send({ error: 'ERR_INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const valid = await bcrypt.compare(body.password, user.passwordHash);
      if (!valid) {
        return reply.status(401).send({ error: 'ERR_INVALID_CREDENTIALS', message: 'Invalid email or password.' });
      }

      const token = app.jwt.sign({ sub: user.id, email: user.email, role: user.role });

      return reply.send({
        user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
        token,
      });
    },
  );

  /**
   * GET /api/v1/auth/me
   * Get current user profile
   */
  app.get(
    '/me',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Get current user profile',
        security: [{ bearerAuth: [] }],
      },
    },
    async (request, reply) => {
      const { sub } = request.user as any;

      const user = await app.prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, email: true, fullName: true, role: true, createdAt: true },
      });

      if (!user) {
        return reply.status(404).send({ error: 'ERR_NOT_FOUND', message: 'User not found.' });
      }

      return reply.send({ user });
    },
  );
}
