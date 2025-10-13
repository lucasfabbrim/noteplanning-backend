import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { EssayController } from '@/controllers/essay.controller';
import { authenticate, requireAdmin } from '@/middleware/auth.middleware';

export async function essayRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const essayController = new EssayController(prisma);

  // Test route
  fastify.get('/test', async (request, reply) => {
    return { message: 'Essay routes working!' };
  });

  // Create essay
  fastify.post('/', {
    preHandler: [authenticate],
  }, essayController.createEssay.bind(essayController));

  // Get my essays
  fastify.get('/my', {
    preHandler: [authenticate],
  }, essayController.getMyEssays.bind(essayController));

  // Get essay by ID
  fastify.get('/:id', {
    preHandler: [authenticate],
  }, essayController.getEssayById.bind(essayController));

  // Get essays by customer (admin only)
  fastify.get('/customer/:customerId', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.getEssaysByCustomer.bind(essayController));

  // Get essays by status (admin only)
  fastify.get('/status/:status', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.getEssaysByStatus.bind(essayController));

  // Update essay status (admin only)
  fastify.patch('/:id/status', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.updateEssayStatus.bind(essayController));

  // Update essay scores (admin only)
  fastify.patch('/:id/scores', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.updateEssayScores.bind(essayController));

  // Update essay analysis (admin only)
  fastify.patch('/:id/analysis', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.updateEssayAnalysis.bind(essayController));

  // Delete essay (admin only)
  fastify.delete('/:id', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.deleteEssay.bind(essayController));

  // Get essay statistics (admin only)
  fastify.get('/stats', {
    preHandler: [authenticate, requireAdmin],
  }, essayController.getEssayStats.bind(essayController));
}