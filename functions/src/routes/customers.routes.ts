import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { requireAdmin, authenticate } from '@/middleware';
import { sanitizeCustomers, sanitizeCustomer, sanitizePurchases } from '@/utils/response-sanitizer';

export async function customersRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all customers with pagination (Admin only)',
      tags: ['Customers'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const customers = await prisma.customer.findMany({
        where: { deactivatedAt: null },
        take: 10,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Customers retrieved successfully',
        data: sanitizeCustomers(customers),
        total: customers.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer by ID (Admin only)',
      tags: ['Customers by ID'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const customer = await prisma.customer.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          purchases: {
            where: { deactivatedAt: null },
            select: {
              id: true,
              price: true,
              paidAt: true,
              createdAt: true
            }
          }
        }
      });
      
      if (!customer) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Customer not found' 
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Customer found',
        data: sanitizeCustomer(customer)
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  fastify.get('/email/:email', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer by email (Admin only)',
      tags: ['Customers by E-mail'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { email: string };
      const customer = await prisma.customer.findFirst({
        where: { 
          email: params.email,
          deactivatedAt: null 
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (!customer) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Customer not found' 
        });
      }
      
      return reply.status(200).send({ success: true, message: 'Customer found', data: sanitizeCustomer(customer) });
    } catch (error) {
      return reply.status(404).send({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
  });

  fastify.put('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Update customer by ID (Admin only)',
      tags: ['Customers by ID'],
      security: [{ bearerAuth: [] }],
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
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          password: { type: 'string', minLength: 6, maxLength: 100 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const body = request.body as any;
      const customer = await prisma.customer.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        }
      });
      
      if (!customer) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Customer not found' 
        });
      }
      
      const updateData: any = {};
      if (body.email) updateData.email = body.email;
      if (body.name) updateData.name = body.name;
      if (body.password) {
        updateData.password = await bcrypt.hash(body.password, 10);
      }
      
      const updatedCustomer = await prisma.customer.update({
        where: { id: params.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return reply.status(200).send({ success: true, message: 'Customer updated successfully', data: updatedCustomer });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to update customer' 
      });
    }
  });

  fastify.delete('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete customer by ID (soft delete) (Admin only)',
      tags: ['Customers by ID'],
      security: [{ bearerAuth: [] }],
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
      const customer = await prisma.customer.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        }
      });
      
      if (!customer) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Customer not found' 
        });
      }
      
      await prisma.customer.update({
        where: { id: params.id },
        data: { deactivatedAt: new Date() }
      });
      
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete customer' 
      });
    }
  });

  fastify.post('/forgot-password', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Request password reset token (Admin only)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' }
        },
        required: ['email']
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as { email: string };
      
      const customer = await prisma.customer.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (!customer) {
        return reply.status(200).send({
          success: true,
          message: 'If the email exists, a reset token has been generated'
        });
      }
      
      const resetToken = jwt.sign({ id: customer.id }, env.JWT_SECRET, {
        expiresIn: '1h'
      } as jwt.SignOptions);
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
        }
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Reset token generated',
        resetToken: env.NODE_ENV === 'development' ? resetToken : undefined
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to process password reset request' 
      });
    }
  });

  fastify.post('/reset-password', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Reset password using reset token (Admin only)',
      tags: ['Authentication'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 }
        },
        required: ['token', 'newPassword']
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as { token: string; newPassword: string };
      
      let decoded: any;
      try {
        decoded = jwt.verify(body.token, env.JWT_SECRET);
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid token'
        });
      }
      
      const customer = await prisma.customer.findFirst({
        where: {
          id: decoded.id,
          resetPasswordToken: body.token,
          resetPasswordExpires: {
            gte: new Date()
          },
          deactivatedAt: null
        }
      });
      
      if (!customer) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid token'
        });
      }
      
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          password: hashedPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null
        }
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
  });

  fastify.get('/purchases', {
    preHandler: [authenticate],
    schema: {
      description: 'Get current user\'s purchases',
      tags: ['Purchases by Customer'],
      security: [{ bearerAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const query = request.query as { 
        page?: string;
        limit?: string;
        status?: string;
      };

      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const skip = (page - 1) * limit;

      const where: any = {
        customerId: user.id,
        deactivatedAt: null,
      };

      if (query.status) {
        where.status = query.status;
      }

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.purchase.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        message: 'Your purchases retrieved successfully',
        data: sanitizePurchases(purchases),
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
        message: 'Failed to get purchases',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.get('/:id/purchases', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer purchases (Admin only)',
      tags: ['Purchases by Customer'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'string', default: '1' },
          limit: { type: 'string', default: '10' },
          status: { type: 'string' },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as { 
        page?: string;
        limit?: string;
        status?: string;
      };

      const customer = await prisma.customer.findFirst({
        where: { 
          id,
          deactivatedAt: null 
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: 'Customer not found',
        });
      }

      const page = parseInt(query.page || '1');
      const limit = parseInt(query.limit || '10');
      const skip = (page - 1) * limit;

      const where: any = {
        customerId: id,
        deactivatedAt: null,
      };

      if (query.status) {
        where.status = query.status;
      }

      const [purchases, total] = await Promise.all([
        prisma.purchase.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
        prisma.purchase.count({ where }),
      ]);

      return reply.status(200).send({
        success: true,
        message: 'Customer purchases retrieved successfully',
        data: {
          customer,
          purchases,
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
        message: 'Failed to get customer purchases',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.post('/:id/purchases', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Create purchase for customer (Admin only)',
      tags: ['Purchases by Customer'],
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
          amount: { type: 'number', minimum: 0 },
          paymentAmount: { type: 'number', minimum: 0 },
          event: { type: 'string', default: 'payment.completed' },
          status: { type: 'string', default: 'completed' },
          customerName: { type: 'string' },
          customerEmail: { type: 'string', format: 'email' },
          customerPhone: { type: 'string' },
          customerTaxId: { type: 'string' },
          products: { type: 'array' },
          paymentMethod: { type: 'string', default: 'manual' },
          transactionId: { type: 'string' },
          webhookData: { type: 'object' },
          devMode: { type: 'boolean', default: false },
        },
        required: ['amount', 'customerName', 'customerEmail'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const body = request.body as any;

      const customer = await prisma.customer.findFirst({
        where: { 
          id,
          deactivatedAt: null 
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: 'Customer not found',
        });
      }

      const purchase = await prisma.purchase.create({
        data: {
          customerId: id,
          externalId: body.externalId || `purchase_${Date.now()}`,
          price: body.amount,
          method: body.method || 'unknown',
          paidAt: body.status === 'completed' ? new Date() : null,
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

      return reply.status(201).send({
        success: true,
        message: 'Purchase created successfully',
        data: purchase,
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to create purchase',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  fastify.delete('/:id/purchases/:purchaseId', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete purchase (Admin only)',
      tags: ['Purchases by Customer'],
      security: [{ bearerAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          purchaseId: { type: 'string' },
        },
        required: ['id', 'purchaseId'],
      },
    },
  }, async (request, reply) => {
    try {
      const { id, purchaseId } = request.params as { id: string; purchaseId: string };

      const customer = await prisma.customer.findFirst({
        where: { 
          id,
          deactivatedAt: null 
        },
      });

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: 'Customer not found',
        });
      }

      const purchase = await prisma.purchase.findFirst({
        where: {
          id: purchaseId,
          customerId: id,
          deactivatedAt: null,
        },
      });

      if (!purchase) {
        return reply.status(404).send({
          success: false,
          message: 'Purchase not found',
        });
      }

      await prisma.purchase.update({
        where: { id: purchaseId },
        data: { deactivatedAt: new Date() },
      });

      return reply.status(200).send({
        success: true,
        message: 'Purchase deleted successfully',
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to delete purchase',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // ===== CREDITS ROUTES =====

  // GET /v1/customers/credits - Get all credits (Admin only)
  fastify.get('/credits', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all credits (Admin only)',
      tags: ['Credits'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const credits = await prisma.credits.findMany({
        where: { deactivatedAt: null },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.status(200).send({
        success: true,
        message: 'Credits retrieved successfully',
        data: credits,
        count: credits.length
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get credits',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /v1/customers/credits-history - Get all credits history (Admin only)
  fastify.get('/credits-history', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all credits history (Admin only)',
      tags: ['Credits History'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const creditsHistory = await prisma.creditsHistory.findMany({
        where: { deactivatedAt: null },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              name: true
            }
          },
          credits: {
            select: {
              id: true,
              credits: true,
              credits_remaining: true
            }
          },
          Essay: {
            select: {
              id: true,
              essayTitle: true
            }
          }
        },
        orderBy: { dateUsedCredit: 'desc' }
      });

      return reply.status(200).send({
        success: true,
        message: 'Credits history retrieved successfully',
        data: creditsHistory,
        count: creditsHistory.length
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get credits history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // GET /v1/customers/my-credits - Get my credits (Authenticated)
  fastify.get('/my-credits', {
    preHandler: [authenticate],
    schema: {
      description: 'Get my credits',
      tags: ['Credits'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const user = (request as any).user;
      const customerId = user.id;

      const credits = await prisma.credits.findMany({
        where: { 
          customerId,
          deactivatedAt: null 
        },
        orderBy: { createdAt: 'desc' }
      });

      return reply.status(200).send({
        success: true,
        message: 'My credits retrieved successfully',
        data: credits,
        count: credits.length
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to get my credits',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // POST /v1/customers/:id/credits - Add credits to customer (Admin only)
  fastify.post('/:id/credits', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Add credits to customer (Admin only)',
      tags: ['Credits'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          credits: { type: 'number', minimum: 1 }
        },
        required: ['credits']
      }
    }
  }, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const { credits } = request.body as { credits: number };

      // Verificar se o customer existe
      const customer = await prisma.customer.findUnique({
        where: { id }
      });

      if (!customer) {
        return reply.status(404).send({
          success: false,
          message: 'Customer not found'
        });
      }

      // Criar ou atualizar créditos
      const existingCredits = await prisma.credits.findFirst({
        where: { 
          customerId: id,
          deactivatedAt: null 
        }
      });

      let creditsRecord;
      if (existingCredits) {
        creditsRecord = await prisma.credits.update({
          where: { id: existingCredits.id },
          data: {
            credits: existingCredits.credits + credits,
            credits_remaining: existingCredits.credits_remaining + credits
          }
        });
      } else {
        creditsRecord = await prisma.credits.create({
          data: {
            customerId: id,
            credits: credits,
            credits_used: 0,
            credits_remaining: credits
          }
        });
      }

      return reply.status(201).send({
        success: true,
        message: 'Credits added successfully',
        data: creditsRecord
      });
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: 'Failed to add credits',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}