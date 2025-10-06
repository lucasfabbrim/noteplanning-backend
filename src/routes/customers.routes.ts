import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config';
import { requireAdmin } from '@/middleware';

export async function customersRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // GET /customers - List all customers (Admin only)
  fastify.get('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get all customers with pagination (Admin only)',
      tags: ['customers'],
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
        data: customers,
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

  // GET /customers/:id - Get customer by ID (Admin only)
  fastify.get('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer by ID (Admin only)',
      tags: ['customers'],
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
          memberships: {
            where: { deactivatedAt: null },
            select: {
              id: true,
              startDate: true,
              endDate: true,
              isActive: true,
              planType: true
            }
          },
          purchases: {
            where: { deactivatedAt: null },
            select: {
              id: true,
              amount: true,
              status: true,
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
        data: customer
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customer',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /customers/email/:email - Get customer by email (Admin only)
  fastify.get('/email/:email', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer by email (Admin only)',
      tags: ['customers'],
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
      
      return reply.status(200).send({ success: true, message: 'Customer found', data: customer });
    } catch (error) {
      return reply.status(404).send({ 
        success: false, 
        message: 'Customer not found' 
      });
    }
  });

  // POST /customers - Create new customer (Admin only)
  fastify.post('/', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Create a new customer (Admin only)',
      tags: ['customers'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          name: { type: 'string', minLength: 2, maxLength: 100 },
          password: { type: 'string', minLength: 6, maxLength: 100 }
        },
        required: ['email', 'name', 'password']
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const body = request.body as any;
      // Check if email is already taken
      const existingCustomer = await prisma.customer.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (existingCustomer) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Email is already taken' 
        });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      const customer = await prisma.customer.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
          role: 'FREE',
          isActive: true
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
      
      return reply.status(201).send({ 
        success: true, 
        message: 'Customer created successfully', 
        data: customer 
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to create customer' 
      });
    }
  });

  // PUT /customers/:id - Update customer (Admin only)
  fastify.put('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Update customer by ID (Admin only)',
      tags: ['customers'],
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

  // DELETE /customers/:id - Delete customer (soft delete) (Admin only)
  fastify.delete('/:id', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Delete customer by ID (soft delete) (Admin only)',
      tags: ['customers'],
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


  // GET /customers/stats - Get customer statistics (Admin only)
  fastify.get('/stats', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Get customer statistics (Admin only)',
      tags: ['customers'],
      security: [{ bearerAuth: [] }]
    }
  }, async (request, reply) => {
    try {
      const totalCustomers = await prisma.customer.count({
        where: { deactivatedAt: null }
      });
      
      const activeCustomers = await prisma.customer.count({
        where: { 
          deactivatedAt: null,
          isActive: true 
        }
      });
      
      const freeCustomers = await prisma.customer.count({
        where: { 
          deactivatedAt: null,
          role: 'FREE' 
        }
      });
      
      const memberCustomers = await prisma.customer.count({
        where: { 
          deactivatedAt: null,
          role: 'MEMBER' 
        }
      });
      
      const stats = {
        success: true,
        message: 'Customer statistics retrieved successfully',
        data: {
          total: totalCustomers,
          active: activeCustomers,
          free: freeCustomers,
          members: memberCustomers
        }
      };
      
      return reply.status(200).send(stats);
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customer statistics' 
      });
    }
  });

  // POST /customers/forgot-password - Request password reset (Admin only for security)
  fastify.post('/forgot-password', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Request password reset token (Admin only)',
      tags: ['auth'],
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
      
      // Always return success even if email doesn't exist (security best practice)
      if (!customer) {
        return reply.status(200).send({
          success: true,
          message: 'If the email exists, a reset token has been generated'
        });
      }
      
      // Generate reset token
      const resetToken = jwt.sign({ id: customer.id }, env.JWT_SECRET, {
        expiresIn: '1h'
      } as jwt.SignOptions);
      
      // Set reset token and expiration
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          resetPasswordToken: resetToken,
          resetPasswordExpires: new Date(Date.now() + 3600000) // 1 hour
        }
      });
      
      // Return token only in development
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

  // POST /customers/reset-password - Reset password with token (Admin only)
  fastify.post('/reset-password', {
    preHandler: [requireAdmin],
    schema: {
      description: 'Reset password using reset token (Admin only)',
      tags: ['auth'],
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
      
      // Verify token
      let decoded: any;
      try {
        decoded = jwt.verify(body.token, env.JWT_SECRET);
      } catch (error) {
        return reply.status(400).send({
          success: false,
          message: 'Invalid token'
        });
      }
      
      // Find customer with valid reset token
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
      
      // Hash new password
      const hashedPassword = await bcrypt.hash(body.newPassword, 10);
      
      // Update password and clear reset token
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
}
