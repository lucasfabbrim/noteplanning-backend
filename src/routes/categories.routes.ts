import { FastifyInstance } from 'fastify';
import { prisma } from '@/config';

export async function categoriesRoutes(fastify: FastifyInstance) {
  // GET /categories - List all categories
  fastify.get('/', {
    schema: {
      description: 'List all categories',
      tags: ['categories'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          isActive: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const query = request.query as any;
      const page = parseInt(query.page) || 1;
      const limit = parseInt(query.limit) || 10;
      const skip = (page - 1) * limit;

      const where: any = {};
      if (query.isActive !== undefined) {
        where.isActive = query.isActive === 'true';
      }

      const [categories, total] = await Promise.all([
        prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { sortOrder: 'asc' },
        }),
        prisma.category.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /categories/:id - Get category by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get category by ID',
      tags: ['categories'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          videos: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              duration: true,
            },
          },
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /categories/slug/:slug - Get category by slug
  fastify.get('/slug/:slug', {
    schema: {
      description: 'Get category by slug',
      tags: ['categories'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
        },
        required: ['slug'],
      },
    },
  }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      
      const category = await prisma.category.findUnique({
        where: { slug },
        include: {
          videos: {
            where: { isPublished: true },
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              duration: true,
            },
          },
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
