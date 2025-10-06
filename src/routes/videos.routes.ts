import { FastifyInstance } from 'fastify';
import { VideoController } from '@/controllers';
import { prisma } from '@/config';
import { requireAdmin, authenticate } from '@/middleware';

export async function videosRoutes(fastify: FastifyInstance) {
  const videoController = new VideoController(prisma);

  // GET /videos - List all videos
  fastify.get('/', {
    schema: {
      description: 'List all videos',
      tags: ['videos'],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          customerId: { type: 'string' },
          minDuration: { type: 'string' },
          maxDuration: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    return videoController.getAllVideos(request as any, reply);
  });

  // GET /videos/:id - Get video by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get video by ID',
      tags: ['videos'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
    },
  }, async (request, reply) => {
    return videoController.getVideoById(request as any, reply);
  });

  // POST /videos - Create new video (TEMPORARILY WITHOUT AUTH)
  fastify.post('/', {
    schema: {
      description: 'Create new video (TEMPORARILY WITHOUT AUTH)',
      tags: ['videos'],
      body: {
        type: 'object',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          thumbnail: { type: 'string', format: 'uri' },
          duration: { type: 'integer', minimum: 1 },
          isPublished: { type: 'boolean', default: false },
          customerId: { type: 'string' },
        },
        required: ['title', 'url', 'customerId'],
      },
    },
  }, async (request, reply) => {
    return videoController.createVideo(request as any, reply);
  });

  // PUT /videos/:id - Update video (Admin only)
  fastify.put('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Update video',
      tags: ['videos'],
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
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          url: { type: 'string', format: 'uri' },
          thumbnail: { type: 'string', format: 'uri' },
          duration: { type: 'integer', minimum: 1 },
          isPublished: { type: 'boolean' },
        },
      },
    },
  }, async (request, reply) => {
    return videoController.updateVideo(request as any, reply);
  });

  // DELETE /videos/:id - Delete video (Admin only)
  fastify.delete('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete video',
      tags: ['videos'],
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
    return videoController.deleteVideo(request as any, reply);
  });
}
