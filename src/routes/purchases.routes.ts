import { FastifyInstance } from 'fastify';
import { PurchaseController } from '@/controllers/purchase.controller';
import { prisma } from '@/config';
import { requireAdmin, authenticate } from '@/middleware';

/**
 * Purchase routes
 */
export async function purchasesRoutes(fastify: FastifyInstance) {
  const purchaseController = new PurchaseController(prisma);

  // GET /purchases - Get all purchases with filters (Admin only)
  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all purchases with pagination and filters (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
          status: { type: 'string', enum: ['completed', 'pending', 'failed', 'refunded'] },
          customerId: { type: 'string' },
          customerEmail: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
        },
      },
    },
  }, async (request, reply) => {
    return purchaseController.getAllPurchases(request, reply);
  });

  // GET /purchases/:id - Get purchase by ID (Admin only)
  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get purchase by ID (Admin only)',
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
  }, async (request, reply) => {
    return purchaseController.getPurchaseById(request, reply);
  });

  // GET /purchases/my-purchases - Get own purchases (Customer + Admin)
  fastify.get('/my-purchases', {
    preHandler: [authenticate],
    schema: {
      description: 'Get your own purchases',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
    },
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const purchases = await prisma.purchase.findMany({
        where: {
          customerId: user.id,
          deactivatedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Purchases retrieved successfully',
        data: purchases,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get purchases',
      });
    }
  });

  // GET /purchases/customer/:customerId - Get purchases by customer ID (Admin only)
  fastify.get('/customer/:customerId', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get purchases by customer ID (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
        },
        required: ['customerId'],
      },
    },
  }, async (request, reply) => {
    return purchaseController.getPurchasesByCustomerId(request, reply);
  });

  // GET /purchases/email/:email - Get purchases by customer email (Admin only)
  fastify.get('/email/:email', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get purchases by customer email (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      },
    },
  }, async (request, reply) => {
    return purchaseController.getPurchasesByEmail(request, reply);
  });

  // GET /purchases/customer/:customerId/stats - Get customer purchase statistics (Admin only)
  fastify.get('/customer/:customerId/stats', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer purchase statistics (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
        },
        required: ['customerId'],
      },
    },
  }, async (request, reply) => {
    return purchaseController.getCustomerStats(request, reply);
  });

  // GET /purchases/customer/:customerId/video-access - Check if customer has video access (Admin only)
  fastify.get('/customer/:customerId/video-access', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Check if customer has video access based on purchase history (Admin only)',
      tags: ['purchases'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          customerId: { type: 'string' },
        },
        required: ['customerId'],
      },
    },
  }, async (request, reply) => {
    return purchaseController.checkVideoAccess(request, reply);
  });
}

