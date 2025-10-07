import { FastifyInstance } from 'fastify';
import { AbacatePayController } from '@/controllers';
import { prisma } from '@/config';

export async function abacatePayRoutes(fastify: FastifyInstance) {
  const abacatePayController = new AbacatePayController(prisma);

  fastify.get('/abacatepay', async (request, reply) => {
    return abacatePayController.handleGetRequest(request, reply);
  });

  fastify.post('/abacatepay', async (request, reply) => {
    return abacatePayController.handleWebhook(request, reply);
  });
}
