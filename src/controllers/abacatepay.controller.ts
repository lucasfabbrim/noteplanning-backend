import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { AbacatePayService } from '@/services/abacatepay.service';
import { 
  abacatePayWebhookBodySchema, 
  abacatePayWebhookQuerySchema,
  AbacatePayWebhookBody,
  AbacatePayWebhookQuery
} from '@/validators/abacatepay.validator';
import { env } from '@/config';
import { LoggerHelper } from '@/utils/logger.helper';

/**
 * AbacatePay webhook controller
 */
export class AbacatePayController extends BaseController {
  protected abacatePayService: AbacatePayService;

  constructor(prisma: PrismaClient) {
    super();
    this.abacatePayService = new AbacatePayService(prisma);
  }

  /**
   * POST /webhook/abacatepay - Receive webhook from AbacatePay
   */
  async handleWebhook(request: FastifyRequest, reply: FastifyReply) {
    try {
      // Validate query params
      const queryValidation = abacatePayWebhookQuerySchema.safeParse(request.query);
      
      if (!queryValidation.success) {
        const zodError = queryValidation.error as any;
        return reply.status(400).send({
          success: false,
          message: 'Invalid query parameters',
          errors: zodError.errors,
        });
      }

      const query = queryValidation.data as AbacatePayWebhookQuery;

      // Validate webhook secret
      const isValidSecret = this.abacatePayService.validateWebhookSecret(
        query.webhookSecret,
        env.ABACATEPAY_TOKEN_SECRET
      );

      if (!isValidSecret) {
        LoggerHelper.warn('AbacatePayController', 'handleWebhook', 'Unauthorized attempt', {
          ip: request.ip,
        });

        return reply.status(401).send({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Validate webhook body
      const bodyValidation = abacatePayWebhookBodySchema.safeParse(request.body);

      if (!bodyValidation.success) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid request',
        });
      }

      const webhookData = bodyValidation.data as AbacatePayWebhookBody;

      // Process webhook
      const result = await this.abacatePayService.handleWebhookEvent(webhookData);

      if (!result) {
        return reply.status(200).send({
          success: true,
          message: 'Webhook received but no action taken',
        });
      }

      const { customer, purchase } = result;

      return reply.status(201).send({
        success: true,
        message: 'Customer e compra registrados com sucesso',
        data: {
          customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            role: customer.role,
            createdAt: customer.createdAt,
          },
          purchase: {
            id: purchase.id,
            amount: purchase.amount,
            paymentAmount: purchase.paymentAmount,
            status: purchase.status,
            products: purchase.products,
            createdAt: purchase.createdAt,
          },
        },
      });
    } catch (error) {
      LoggerHelper.error('AbacatePayController', 'handleWebhook', 'Failed to process webhook', error);

      return reply.status(500).send({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /webhook/abacatepay - Not supported
   */
  async handleGetRequest(request: FastifyRequest, reply: FastifyReply) {
    return reply.status(405).send({
      success: false,
      message: 'Method GET not supported. Use POST.',
    });
  }
}

