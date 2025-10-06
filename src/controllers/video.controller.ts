import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { VideoService } from '@/services';
import {
  CreateVideoInput,
  UpdateVideoInput,
  VideoQuery,
  VideoParams,
} from '@/validators';

export class VideoController extends BaseController {
  private videoService: VideoService;

  constructor(prisma: PrismaClient) {
    super();
    this.videoService = new VideoService(prisma);
  }

  /**
   * GET /videos - Get all videos with pagination and filters
   */
  async getAllVideos(request: FastifyRequest<{ Querystring: VideoQuery }>, reply: FastifyReply) {
    try {
      const result = await this.videoService.getAllVideos(request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Videos retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /videos/published - Get published videos only
   */
  async getPublishedVideos(request: FastifyRequest<{ Querystring: Omit<VideoQuery, 'isPublished'> }>, reply: FastifyReply) {
    try {
      const result = await this.videoService.getPublishedVideos(request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Published videos retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /videos/:id - Get video by ID
   */
  async getVideoById(request: FastifyRequest<{ Params: VideoParams }>, reply: FastifyReply) {
    try {
      const video = await this.videoService.getVideoById(request.params.id);
      return this.sendSuccess(reply, video, 'Video retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /videos/customer/:customerId - Get videos by customer ID
   */
  async getVideosByCustomerId(
    request: FastifyRequest<{ Params: { customerId: string }; Querystring: Omit<VideoQuery, 'customerId'> }>,
    reply: FastifyReply
  ) {
    try {
      const result = await this.videoService.getVideosByCustomerId(request.params.customerId, request.query);
      return this.sendPaginated(reply, result.data, result.pagination, 'Customer videos retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /videos - Create a new video
   */
  async createVideo(request: FastifyRequest<{ Body: CreateVideoInput }>, reply: FastifyReply) {
    try {
      const video = await this.videoService.createVideo(request.body);
      return this.sendCreated(reply, video, 'Video created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /videos/:id - Update video by ID
   */
  async updateVideo(
    request: FastifyRequest<{ Params: VideoParams; Body: UpdateVideoInput }>,
    reply: FastifyReply
  ) {
    try {
      const video = await this.videoService.updateVideo(request.params.id, request.body);
      return this.sendSuccess(reply, video, 'Video updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /videos/:id - Delete video by ID (soft delete)
   */
  async deleteVideo(request: FastifyRequest<{ Params: VideoParams }>, reply: FastifyReply) {
    try {
      await this.videoService.deleteVideo(request.params.id);
      return this.sendNoContent(reply, 'Video deleted successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PATCH /videos/:id/publish - Toggle video publish status
   */
  async toggleVideoPublish(
    request: FastifyRequest<{ Params: VideoParams; Body: { isPublished: boolean } }>,
    reply: FastifyReply
  ) {
    try {
      const video = await this.videoService.toggleVideoPublish(request.params.id, request.body.isPublished);
      return this.sendSuccess(reply, video, 'Video publish status updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /videos/stats - Get video statistics
   */
  async getVideoStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.videoService.getVideoStats();
      return this.sendSuccess(reply, stats.data, 'Video statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}
