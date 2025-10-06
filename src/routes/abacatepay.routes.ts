import { FastifyInstance } from 'fastify';
import { AbacatePayController } from '@/controllers/abacatepay.controller';
import { prisma } from '@/config';

/**
 * AbacatePay webhook routes
 */
export async function abacatePayRoutes(fastify: FastifyInstance) {
  const abacatePayController = new AbacatePayController(prisma);

  // GET /webhook/abacatepay - Not supported (returns 405)
  fastify.get('/abacatepay', {
    schema: {
      description: 'Webhook endpoint - GET not supported',
      tags: ['webhooks'],
      response: {
        405: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return abacatePayController.handleGetRequest(request, reply);
  });

  // POST /webhook/abacatepay - Receive webhook
  fastify.post('/abacatepay', {
    schema: {
      description: 'Receive webhook from AbacatePay and create customer',
      tags: ['webhooks'],
      querystring: {
        type: 'object',
        properties: {
          webhookSecret: { 
            type: 'string',
            description: 'Webhook secret token for validation',
          },
        },
        required: ['webhookSecret'],
      },
      body: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              billing: {
                type: 'object',
                properties: {
                  customer: {
                    type: 'object',
                    properties: {
                      metadata: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          email: { type: 'string', format: 'email' },
                          cellphone: { type: 'string' },
                          taxId: { type: 'string' },
                        },
                        required: ['name', 'email', 'cellphone'],
                      },
                    },
                  },
                  amount: { type: 'number' },
                },
              },
              payment: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                },
              },
            },
          },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                quantity: { type: 'number' },
                price: { type: 'number' },
              },
            },
          },
          event: { type: 'string' },
          devMode: { type: 'boolean' },
        },
        required: ['data', 'event'],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            errors: { type: 'array' },
          },
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    return abacatePayController.handleWebhook(request, reply);
  });
}

