import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { EssayService } from '@/services/essay.service';

export class EssayController extends BaseController {
  private essayService: EssayService;

  constructor(prisma: PrismaClient) {
    super();
    this.essayService = new EssayService(prisma);
  }

  async createEssay(request: FastifyRequest, reply: FastifyReply) {
    try {
      const data = request.body as any;
      
      const essay = await this.essayService.createEssay(data);
      
      return this.sendCreated(reply, essay, 'Essay created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getEssayById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      const essay = await this.essayService.getEssayById(id);
      
      if (!essay) {
        return this.sendError(reply, 'Essay not found', 404);
      }
      
      return this.sendSuccess(reply, essay, 'Essay retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getEssaysByCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { customerId } = request.params as { customerId: string };
      const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
      
      const essays = await this.essayService.getEssaysByCustomer(customerId, page, limit);
      const total = await this.essayService.getCustomerEssayCount(customerId);
      
      return this.sendSuccess(reply, {
        essays,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }, 'Customer essays retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getEssaysByStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { status } = request.params as { status: string };
      const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
      
      const essays = await this.essayService.getEssaysByStatus(status as any, page, limit);
      
      return this.sendSuccess(reply, {
        essays,
        pagination: {
          page,
          limit,
          total: essays.length,
        },
      }, 'Essays retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async updateEssayStatus(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const { status } = request.body as { status: string };
      
      const essay = await this.essayService.updateEssayStatus(id, status as any);
      
      return this.sendSuccess(reply, essay, 'Essay status updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async updateEssayScores(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const scores = request.body as any;
      
      const essay = await this.essayService.updateEssayScores(id, scores);
      
      return this.sendSuccess(reply, essay, 'Essay scores updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async updateEssayAnalysis(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const analysis = request.body as any;
      
      const essay = await this.essayService.updateEssayAnalysis(id, analysis);
      
      return this.sendSuccess(reply, essay, 'Essay analysis updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async deleteEssay(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      
      await this.essayService.deleteEssay(id);
      
      return this.sendSuccess(reply, null, 'Essay deleted successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getEssayStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.essayService.getEssayStats();
      
      return this.sendSuccess(reply, stats, 'Essay statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getMyEssays(request: FastifyRequest, reply: FastifyReply) {
    try {
      const customerId = (request as any).user?.id;
      const { page = 1, limit = 10 } = request.query as { page?: number; limit?: number };
      
      if (!customerId) {
        return this.sendError(reply, 'Customer ID not found', 401);
      }
      
      const essays = await this.essayService.getEssaysByCustomer(customerId, page, limit);
      const total = await this.essayService.getCustomerEssayCount(customerId);
      
      return this.sendSuccess(reply, {
        essays,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }, 'My essays retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}