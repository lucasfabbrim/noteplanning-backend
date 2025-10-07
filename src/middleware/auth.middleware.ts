import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '@/errors';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { LoggerHelper } from '@/utils/logger.helper';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('Unauthorized');
    }
    
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    (request as any).user = decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      LoggerHelper.warn('AuthMiddleware', 'authenticate', 'Invalid token', {
        ip: request.ip,
      });
    }
    throw new UnauthorizedError('Unauthorized');
  }
}

export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  const user = (request as any).user;
  if (user.role !== 'ADMIN') {
    throw new ForbiddenError('Forbidden');
  }
}

export async function requireMemberOrAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  
  const user = (request as any).user;
  if (!['MEMBER', 'ADMIN'].includes(user.role)) {
    throw new ForbiddenError('Forbidden');
  }
}

export async function optionalAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      (request as any).user = decoded;
    }
  } catch (error) {
  }
}
