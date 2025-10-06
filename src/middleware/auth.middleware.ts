import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '@/errors';
import jwt from 'jsonwebtoken';
import { env } from '@/config';

/**
 * JWT authentication middleware
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('Missing token');
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (request as any).user = decoded;
  } catch (error) {
    throw new UnauthorizedError('Invalid or missing token');
  }
}

/**
 * Admin role middleware
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  const user = (request as any).user;
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Admin access required');
  }
}

/**
 * Member or Admin role middleware
 */
export async function requireMemberOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  const user = (request as any).user;
  if (!['MEMBER', 'ADMIN'].includes(user.role)) {
    throw new ForbiddenError('Member or Admin access required');
  }
}

/**
 * Optional authentication middleware (doesn't throw if no token)
 */
export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (request as any).user = decoded;
    }
  } catch (error) {
    // Do nothing - authentication is optional
  }
}
