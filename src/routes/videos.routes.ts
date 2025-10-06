import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { VideoController } from '@/controllers';
import { requireAdmin } from '@/middleware';

export async function videosRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const videoController = new VideoController(prisma);

  // GET /videos - List all videos (Admin only)
  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all videos with pagination (Admin only)',
      tags: ['videos'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          search: { type: 'string' },
          isPublished: { type: 'string' },
          customerId: { type: 'string' },
          minDuration: { type: 'string' },
          maxDuration: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const videos = await prisma.video.findMany({
        where: {
          isPublished: true,
          deactivatedAt: null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.status(200).send({
        success: true,
        message: 'Videos retrieved successfully',
        data: videos,
        total: videos.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get videos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /videos/published - Get published videos only
  fastify.get('/published', {
    schema: {
      description: 'Get published videos only',
      tags: ['videos'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          search: { type: 'string' },
          customerId: { type: 'string' },
          minDuration: { type: 'string' },
          maxDuration: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const videos = await prisma.video.findMany({
        where: {
          isPublished: true,
          deactivatedAt: null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return reply.status(200).send({
        success: true,
        message: 'Videos retrieved successfully',
        data: videos,
        total: videos.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get published videos' 
      });
    }
  });

  // GET /videos/:id - Get video by ID (Admin only)
  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get video by ID (Admin only)',
      tags: ['videos'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const prisma = new PrismaClient();
      const video = await prisma.video.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        },
        select: {
          id: true,
          title: true,
          description: true,
          url: true,
          thumbnail: true,
          duration: true,
          isPublished: true,
          createdAt: true,
          updatedAt: true,
          customerId: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      if (!video) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Video not found' 
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Video found',
        data: video
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get video',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /videos/customer/:customerId - Get videos by customer ID
  fastify.get('/customer/:customerId', {
    schema: {
      description: 'Get videos by customer ID',
      tags: ['videos'],
      params: {
        type: 'object',
        properties: {
          customerId: { type: 'string' }
        },
        required: ['customerId']
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { customerId: string };
      const videos = await prisma.video.findMany({
        where: {
          customerId: params.customerId,
          deactivatedAt: null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return reply.status(200).send({
        success: true,
        message: 'Videos retrieved successfully',
        data: videos,
        total: videos.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customer videos' 
      });
    }
  });

  // POST /videos - Create new video (Admin only)
  fastify.post('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Create a new video (Admin only)',
      tags: ['videos'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          url: { type: 'string', format: 'uri' },
          thumbnail: { type: 'string', format: 'uri' },
          duration: { type: 'number', minimum: 1 },
          isPublished: { type: 'boolean', default: false },
          customerId: { type: 'string' }
        },
        required: ['title', 'url', 'customerId']
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as any;
      const video = await prisma.video.create({
        data: {
          title: body.title,
          description: body.description,
          url: body.url,
          thumbnail: body.thumbnail,
          duration: body.duration,
          isPublished: body.isPublished || false,
          customerId: body.customerId
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return reply.status(201).send({ 
        success: true, 
        message: 'Video created successfully', 
        data: video 
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create video' 
      });
    }
  });

  // PUT /videos/:id - Update video
  fastify.put('/:id', {
    schema: {
      description: 'Update video by ID',
      tags: ['videos'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 200 },
          description: { type: 'string', maxLength: 1000 },
          url: { type: 'string', format: 'uri' },
          thumbnail: { type: 'string', format: 'uri' },
          duration: { type: 'number', minimum: 1 },
          isPublished: { type: 'boolean' },
          customerId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as any;
      
      const video = await prisma.video.update({
        where: { id: params.id },
        data: {
          ...(body.title && { title: body.title }),
          ...(body.description !== undefined && { description: body.description }),
          ...(body.url && { url: body.url }),
          ...(body.thumbnail !== undefined && { thumbnail: body.thumbnail }),
          ...(body.duration !== undefined && { duration: body.duration }),
          ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
          ...(body.customerId && { customerId: body.customerId })
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return reply.status(200).send({ 
        success: true, 
        message: 'Video updated successfully', 
        data: video 
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update video' 
      });
    }
  });

  // DELETE /videos/:id - Delete video (soft delete)
  fastify.delete('/:id', {
    schema: {
      description: 'Delete video by ID (soft delete)',
      tags: ['videos'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      await prisma.video.update({
        where: { id: params.id },
        data: {
          deactivatedAt: new Date()
        }
      });
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete video' 
      });
    }
  });

  // PATCH /videos/:id/publish - Toggle video publish status
  fastify.patch('/:id/publish', {
    schema: {
      description: 'Toggle video publish status',
      tags: ['videos'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        },
        required: ['id']
      },
      body: {
        type: 'object',
        properties: {
          isPublished: { type: 'boolean' }
        },
        required: ['isPublished']
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as { isPublished: boolean };
      
      const video = await prisma.video.update({
        where: { id: params.id },
        data: {
          isPublished: body.isPublished
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      return reply.status(200).send({ 
        success: true, 
        message: 'Video publish status updated', 
        data: video 
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update video status' 
      });
    }
  });

  // GET /videos/stats - Get video statistics
  fastify.get('/stats', {
    schema: {
      description: 'Get video statistics',
      tags: ['videos']
    }
  }, async (request, reply) => {
    try {
      const stats = await videoController.getVideoStats(request, reply);
      return stats;
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get video statistics' 
      });
    }
  });
}
