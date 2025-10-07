import { FastifyInstance } from 'fastify';
import { prisma } from '@/config';
import { sanitizeCategories, sanitizeCategory, sanitizeVideos, sanitizeVideo } from '@/utils/response-sanitizer';

export async function categoriesRoutes(fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      description: 'List all categories',
      tags: ['Categories'],
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
        data: sanitizeCategories(categories),
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

  fastify.get('/:id', {
    schema: {
      description: 'Get category by ID',
      tags: ['Categories'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
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
          slug: true,
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
        data: sanitizeCategory(category),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.get('/slug/:slug', {
    schema: {
      description: 'Get category by slug',
      tags: ['Categories'],
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
          slug: true,
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
        data: category.slug,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.get('/:slug/videos', {
    schema: {
      description: 'Get videos by category slug',
      tags: ['Videos by Category'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
        },
        required: ['slug'],
      },
      querystring: {
        type: 'object',
        properties: {
          isPublished: { 
            type: 'string',
            enum: ['true', 'false'],
            description: 'Filter only published videos'
          },
          page: { 
            type: 'string',
            description: 'Page number for pagination'
          },
          limit: { 
            type: 'string',
            description: 'Number of videos per page'
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const query = request.query as { 
        isPublished?: string;
        page?: string;
        limit?: string;
      };

      const category = await prisma.category.findFirst({
        where: { 
          slug,
          deactivatedAt: null,
          isActive: true 
        },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      const where: any = {
        categoryId: category.id,
        deactivatedAt: null,
      };

      if (query.isPublished === 'true') {
        where.isPublished = true;
      }

      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const skip = (page - 1) * limit;

      const [videos, total] = await Promise.all([
        prisma.video.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
          slug: true,
            title: true,
            description: true,
            url: true,
            thumbnail: true,
            duration: true,
            isPublished: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.video.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        message: 'Videos retrieved successfully',
        data: {
          category: sanitizeCategory(category),
          videos: sanitizeVideos(videos),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get videos',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.get('/:slug/video/:videoSlug', {
    schema: {
      description: 'Get specific video by category slug and video slug',
      tags: ['Videos by Category'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          videoSlug: { type: 'string' },
        },
        required: ['slug', 'videoSlug'],
      },
    },
  }, async (request, reply) => {
    try {
      const { slug, videoSlug } = request.params as { slug: string; videoSlug: string };

      const category = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
          isActive: true
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      const video = await prisma.video.findFirst({
        where: {
          slug: videoSlug,
          categoryId: category.id,
          deactivatedAt: null,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          url: true,
          thumbnail: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!video) {
        return reply.status(404).send({
          success: false,
          message: 'Video not found in this category',
        });
      }

      return reply.status(200).send({
        success: true,
        message: 'Video retrieved successfully',
        data: {
          category: sanitizeCategory(category),
          video: sanitizeVideo(video),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.post('/:slug/videos', {
    schema: {
      description: 'Create new video in category',
      tags: ['Videos by Category'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
        },
        required: ['slug'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          url: { type: 'string' },
          thumbnail: { type: 'string' },
          duration: { type: 'number' },
          isPublished: { type: 'boolean', default: false },
        },
        required: ['title', 'slug', 'url'],
      },
    },
  }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const body = request.body as {
        title: string;
        slug: string;
        description?: string;
        url: string;
        thumbnail?: string;
        duration?: number;
        isPublished?: boolean;
      };

      const category = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
          isActive: true
        },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      const video = await prisma.video.create({
        data: {
          title: body.title,
          slug: body.slug,
          description: body.description,
          url: body.url,
          thumbnail: body.thumbnail,
          duration: body.duration,
          isPublished: body.isPublished || false,
          categoryId: category.id,
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          url: true,
          thumbnail: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.status(201).send({
        success: true,
        message: 'Video created successfully',
        data: {
          category: sanitizeCategory(category),
          video: sanitizeVideo(video),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to create video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.put('/:slug/video/:videoSlug', {
    schema: {
      description: 'Update video in category',
      tags: ['Videos by Category'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          videoSlug: { type: 'string' },
        },
        required: ['slug', 'videoSlug'],
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          url: { type: 'string' },
          thumbnail: { type: 'string' },
          duration: { type: 'number' },
          isPublished: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { slug, videoSlug } = request.params as { slug: string; videoSlug: string };
      const body = request.body as {
        title?: string;
        slug?: string;
        description?: string;
        url?: string;
        thumbnail?: string;
        duration?: number;
        isPublished?: boolean;
      };

      const category = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
          isActive: true
        },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      const existingVideo = await prisma.video.findFirst({
        where: {
          slug: videoSlug,
          categoryId: category.id,
          deactivatedAt: null,
        },
      });

      if (!existingVideo) {
        return reply.status(404).send({
          success: false,
          message: 'Video not found in this category',
        });
      }

      const video = await prisma.video.update({
        where: { slug: videoSlug },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.slug && { slug: body.slug }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.url && { url: body.url }),
          ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
          ...(body.duration !== undefined && { duration: body.duration }),
          ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        },
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          url: true,
          thumbnail: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Video updated successfully',
        data: {
          category: sanitizeCategory(category),
          video: sanitizeVideo(video),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to update video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.delete('/:slug/video/:videoSlug', {
    schema: {
      description: 'Delete video from category (soft delete)',
      tags: ['Videos by Category'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          videoSlug: { type: 'string' },
        },
        required: ['slug', 'videoSlug'],
      },
    },
  }, async (request, reply) => {
    try {
      const { slug, videoSlug } = request.params as { slug: string; videoSlug: string };

      const category = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
          isActive: true
        },
        select: {
          id: true,
          slug: true,
          name: true,
        },
      });

      if (!category) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      const existingVideo = await prisma.video.findFirst({
        where: {
          slug: videoSlug,
          categoryId: category.id,
          deactivatedAt: null,
        },
      });

      if (!existingVideo) {
        return reply.status(404).send({
          success: false,
          message: 'Video not found in this category',
        });
      }

      await prisma.video.update({
        where: { slug: videoSlug },
        data: {
          deactivatedAt: new Date(),
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Video deleted successfully',
        data: {
          category: sanitizeCategory(category),
        },
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete video',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.put('/:slug', {
    schema: {
      description: 'Update category by slug',
      tags: ['Categories'],
      params: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
        },
        required: ['slug'],
      },
      body: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          slug: { type: 'string' },
          isActive: { type: 'boolean' },
          sortOrder: { type: 'number' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { slug } = request.params as { slug: string };
      const body = request.body as {
        name?: string;
        description?: string;
        slug?: string;
        isActive?: boolean;
        sortOrder?: number;
      };

      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
        },
      });

      if (!existingCategory) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      // Verificar se o slug já existe em outra categoria
      if (body.slug && body.slug !== existingCategory.slug) {
        const slugExists = await prisma.category.findFirst({
          where: {
            slug: body.slug,
            id: { not: existingCategory.id },
            deactivatedAt: null,
          },
        });

        if (slugExists) {
          return reply.status(409).send({
            success: false,
            message: 'Slug already exists',
          });
        }
      }

      const category = await prisma.category.update({
        where: { slug },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.slug && { slug: body.slug }),
          ...(body.isActive !== undefined && { isActive: body.isActive }),
          ...(body.sortOrder !== undefined && { sortOrder: body.sortOrder }),
        },
        include: {
          videos: {
            where: { isPublished: true },
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              thumbnail: true,
              duration: true,
            },
          },
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Category updated successfully',
        data: sanitizeCategory(category),
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to update category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.delete('/:slug', {
    schema: {
      description: 'Delete category by slug (soft delete)',
      tags: ['Categories'],
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

      const existingCategory = await prisma.category.findFirst({
        where: {
          slug,
          deactivatedAt: null,
        },
      });

      if (!existingCategory) {
        return reply.status(404).send({
          success: false,
          message: 'Category not found',
        });
      }

      await prisma.category.update({
        where: { slug },
        data: {
          deactivatedAt: new Date(),
        },
      });

      return reply.status(200).send({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
