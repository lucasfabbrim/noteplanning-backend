import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { PurchaseService } from '@/services/purchase.service';

/**
 * Purchase controller
 */
export class PurchaseController extends BaseController {
  protected purchaseService: PurchaseService;

  constructor(prisma: PrismaClient) {
    super();
    this.purchaseService = new PurchaseService(prisma);
  }

  /**
   * GET /purchases - Get all purchases with pagination and filters (Admin only)
   */
  async getAllPurchases(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await this.purchaseService.getAllPurchases(query);
      
      return reply.status(200).send({
        success: true,
        message: 'Purchases retrieved successfully',
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/:id - Get purchase by ID (Admin only)
   */
  async getPurchaseById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      const purchase = await this.purchaseService.getPurchaseById(params.id);
      
      if (!purchase) {
        return reply.status(404).send({
          success: false,
          message: 'Purchase not found',
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Purchase found',
        data: purchase,
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/customer/:customerId - Get purchases by customer ID
   */
  async getPurchasesByCustomerId(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { customerId: string };
      const purchases = await this.purchaseService.getPurchasesByCustomerId(params.customerId);
      
      return reply.status(200).send({
        success: true,
        message: 'Purchases retrieved successfully',
        data: purchases,
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/email/:email - Get purchases by customer email
   */
  async getPurchasesByEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { email: string };
      const purchases = await this.purchaseService.getPurchasesByCustomerEmail(params.email);
      
      return reply.status(200).send({
        success: true,
        message: 'Purchases retrieved successfully',
        data: purchases,
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/customer/:customerId/stats - Get customer purchase statistics
   */
  async getCustomerStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { customerId: string };
      const stats = await this.purchaseService.getCustomerStats(params.customerId);
      
      return reply.status(200).send({
        success: true,
        message: 'Customer statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/customer/:customerId/video-access - Check if customer has video access
   */
  async checkVideoAccess(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { customerId: string };
      const hasAccess = await this.purchaseService.hasVideoAccess(params.customerId);
      
      return reply.status(200).send({
        success: true,
        message: hasAccess ? 'Customer has video access' : 'Customer does not have video access',
        data: {
          hasAccess,
        },
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}

