import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';

export class PurchaseController extends BaseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * GET /purchases - Get all purchases
   */
  async getAllPurchases(request: FastifyRequest, reply: FastifyReply) {
    try {
      const purchases = await this.prisma.purchase.findMany({
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

      return this.sendSuccess(reply, purchases, 'Purchases retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/:id - Get purchase by ID
   */
  async getPurchaseById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      
      const purchase = await this.prisma.purchase.findFirst({
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

      if (!purchase) {
        return this.sendError(reply, 'Purchase not found', 404);
      }

      return this.sendSuccess(reply, purchase, 'Purchase retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /purchases/my-purchases - Get user's own purchases
   */
  async getMyPurchases(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = this.getUserFromRequest(request);
      
      const purchases = await this.prisma.purchase.findMany({
        where: {
          customerId: user.id,
          deactivatedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      });

      return this.sendSuccess(reply, purchases, 'Your purchases retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /purchases - Create a new purchase
   */
  async createPurchase(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      const purchase = await this.prisma.purchase.create({
        data: {
          customerId: body.customerId,
          amount: body.amount,
          paymentAmount: body.paymentAmount || body.amount,
          event: body.event || 'payment.completed',
          status: body.status || 'completed',
          customerName: body.customerName,
          customerEmail: body.customerEmail,
          customerPhone: body.customerPhone,
          customerTaxId: body.customerTaxId,
          products: body.products,
          paymentMethod: body.paymentMethod || 'manual',
          transactionId: body.transactionId || `manual_${Date.now()}`,
          webhookData: body.webhookData,
          devMode: body.devMode || false,
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

      return this.sendCreated(reply, purchase, 'Purchase created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}