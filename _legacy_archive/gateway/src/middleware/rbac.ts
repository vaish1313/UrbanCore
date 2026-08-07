// ============================================================
// RBAC — Role-Based Access Control Types & Middleware
// Single point of policy enforcement for all routes.
// ============================================================

import type { FastifyRequest, FastifyReply } from 'fastify';

export type UserRole = 'citizen' | 'owner' | 'builder' | 'municipal' | 'admin';

/**
 * Role hierarchy — higher index = more permissions.
 * Admin inherits all roles implicitly.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  citizen: 0,
  owner: 1,
  builder: 2,
  municipal: 3,
  admin: 4,
};

export interface JwtPayload {
  sub: string;         // user ID (UUID)
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

/**
 * Require a specific minimum role level.
 * Usage in route: preHandler: [app.authenticate, requireRole('municipal')]
 */
export function requireRole(minimumRole: UserRole) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as JwtPayload;

    if (!user) {
      return reply.status(401).send({ error: 'ERR_UNAUTHORIZED', message: 'Authentication required.' });
    }

    const userLevel = ROLE_HIERARCHY[user.role] ?? -1;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      return reply.status(403).send({
        error: 'ERR_FORBIDDEN',
        message: `This action requires '${minimumRole}' role or higher. Your role: '${user.role}'.`,
      });
    }
  };
}

/**
 * Require one of a specific set of roles (non-hierarchical check).
 * Use when roles don't follow the hierarchy (e.g. only 'builder' and 'municipal').
 */
export function requireAnyRole(...roles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as JwtPayload;

    if (!user) {
      return reply.status(401).send({ error: 'ERR_UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!roles.includes(user.role)) {
      return reply.status(403).send({
        error: 'ERR_FORBIDDEN',
        message: `This action requires one of: [${roles.join(', ')}]. Your role: '${user.role}'.`,
      });
    }
  };
}
