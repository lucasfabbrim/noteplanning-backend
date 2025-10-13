import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '@/errors';
import * as admin from 'firebase-admin';
import { LoggerHelper } from '@/utils/logger.helper';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedError('Unauthorized');
    }
    
    // Verificar ID token do Firebase Auth
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Buscar dados do usuário no Prisma usando o UID do Firebase
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.customer.findFirst({
      where: { 
        // Assumindo que você vai adicionar um campo firebaseUid na tabela customers
        // Por enquanto, vamos usar o email do token
        email: decodedToken.email 
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    // Adicionar dados do usuário e do Firebase token ao request
    (request as any).user = {
      ...user,
      firebaseUid: decodedToken.uid,
      firebaseToken: decodedToken
    };
    
    await prisma.$disconnect();
  } catch (error) {
    LoggerHelper.warn('AuthMiddleware', 'authenticate', 'Invalid Firebase token', {
      ip: request.ip,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
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
      // Verificar ID token do Firebase Auth
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Buscar dados do usuário no Prisma
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const user = await prisma.customer.findFirst({
        where: { 
          email: decodedToken.email 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true
        }
      });
      
      if (user && user.isActive) {
        (request as any).user = {
          ...user,
          firebaseUid: decodedToken.uid,
          firebaseToken: decodedToken
        };
      }
      
      await prisma.$disconnect();
    }
  } catch (error) {
    // Silently ignore errors for optional auth
  }
}
