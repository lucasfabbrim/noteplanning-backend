import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';

export class VideoController extends BaseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * GET /videos - Get all videos
   */
  async getAllVideos(request: FastifyRequest, reply: FastifyReply) {
    try {
      const videos = await this.prisma.video.findMany({
        where: { deactivatedAt: null },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return this.sendSuccess(reply, videos, 'Videos retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /videos - Create a new video
   */
  async createVideo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      const video = await this.prisma.video.create({
        data: {
          title: body.title,
          description: body.description,
          url: body.url,
          thumbnail: body.thumbnail,
          duration: body.duration,
          isPublished: body.isPublished,
          customerId: body.customerId,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.sendCreated(reply, video, 'Video created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /videos/:id - Get video by ID
   */
  async getVideoById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      
      const video = await this.prisma.video.findFirst({
        where: {
          id: params.id,
          deactivatedAt: null,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (!video) {
        return this.sendError(reply, 'Video not found', 404);
      }

      return this.sendSuccess(reply, video, 'Video retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /videos/:id - Update video
   */
  async updateVideo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      const body = request.body as any;

      const video = await this.prisma.video.update({
        where: { id: params.id },
        data: {
          title: body.title,
          description: body.description,
          url: body.url,
          thumbnail: body.thumbnail,
          duration: body.duration,
          isPublished: body.isPublished,
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return this.sendSuccess(reply, video, 'Video updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /videos/:id - Delete video
   */
  async deleteVideo(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };

      await this.prisma.video.update({
        where: { id: params.id },
        data: { deactivatedAt: new Date() },
      });

      reply.code(204);
      return {};
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}