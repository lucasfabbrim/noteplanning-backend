import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { AbacatePayService } from '@/services';

export class AbacatePayController extends BaseController {
  private abacatePayService: AbacatePayService;

  constructor(prisma: PrismaClient) {
    super();
    this.abacatePayService = new AbacatePayService(prisma);
  }

  async handleGetRequest(request: FastifyRequest, reply: FastifyReply) {
    return this.sendError(reply, 'GET method not supported for webhook', 405);
  }

  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      const result = await this.abacatePayService.processWebhook(request);
      return this.sendSuccess(reply, result, 'Webhook processed successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}
