import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '@/errors';
import { PurchaseService } from '@/services/purchase.service';
import { prisma } from '@/config';

/**
 * Middleware to check if customer has purchased products with video access
 */
export async function requireVideoAccess(request: FastifyRequest, reply: FastifyReply) {
  try {
    const user = (request as any).user;
    
    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    // Admin sempre tem acesso
    if (user.role === 'ADMIN') {
      return;
    }

    // Verificar se o customer comprou produto com acesso a vídeos
    const purchaseService = new PurchaseService(prisma);
    const hasAccess = await purchaseService.hasVideoAccess(user.id);

    if (!hasAccess) {
      throw new ForbiddenError('Você precisa comprar o template+videos para acessar os vídeos');
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error;
    }
    throw new ForbiddenError('Acesso negado aos vídeos');
  }
}

