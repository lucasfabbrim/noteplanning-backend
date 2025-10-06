import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PurchaseController } from '@/controllers';
import { requireAdmin } from '@/middleware';

export async function purchasesRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const purchaseController = new PurchaseController(prisma);

  // GET /purchases - Get all purchases (Admin only)
  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all purchases (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
    },
  }, purchaseController.getAllPurchases.bind(purchaseController));

  // GET /purchases/my-purchases - Get user's own purchases
  fastify.get('/my-purchases', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get user\'s own purchases',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
    },
  }, purchaseController.getMyPurchases.bind(purchaseController));

  // GET /purchases/:id - Get purchase by ID
  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get purchase by ID',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, purchaseController.getPurchaseById.bind(purchaseController));

  // POST /purchases - Create a new purchase (Admin only)
  fastify.post('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Create a new purchase (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
          amount: { type: 'number' },
          paymentAmount: { type: 'number' },
          event: { type: 'string' },
          status: { type: 'string' },
          customerName: { type: 'string' },
          customerEmail: { type: 'string' },
          customerPhone: { type: 'string' },
          customerTaxId: { type: 'string' },
          products: { type: 'array' },
          webhookData: { type: 'object' },
          devMode: { type: 'boolean' },
        },
        required: ['customerId', 'amount'],
      },
    },
  }, purchaseController.createPurchase.bind(purchaseController));
}