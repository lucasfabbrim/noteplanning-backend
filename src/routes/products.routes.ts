import { FastifyInstance } from 'fastify';
import { ProductController } from '@/controllers';
import { prisma } from '@/config';
import { requireAdmin } from '@/middleware';

export async function productsRoutes(fastify: FastifyInstance) {
  const productController = new ProductController(prisma);

  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all products (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          isActive: { type: 'string' },
          categoryId: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    return productController.getAllProducts(request, reply);
  });

  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get product by ID (Admin only)',
      tags: ['Products'],
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
    return productController.getProductById(request, reply);
  });

  fastify.get('/external/:externalId', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get product by external ID (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          externalId: { type: 'string' },
        },
        required: ['externalId'],
      },
    },
  }, async (request, reply) => {
    return productController.getProductByExternalId(request, reply);
  });

  fastify.post('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Create new product (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          externalId: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          categoryId: { type: 'string' },
          isActive: { type: 'boolean', default: true },
        },
        required: ['externalId', 'name', 'price'],
      },
    },
  }, async (request, reply) => {
    return productController.createProduct(request, reply);
  });

  fastify.put('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Update product (Admin only)',
      tags: ['Products'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number', minimum: 0 },
          categoryId: { type: 'string' },
          isActive: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    return productController.updateProduct(request, reply);
  });

  fastify.delete('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete product (Admin only)',
      tags: ['Products'],
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
    return productController.deleteProduct(request, reply);
  });
}
