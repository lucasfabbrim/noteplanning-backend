import { FastifyInstance } from 'fastify';
import { CustomerController } from '@/controllers';
import { CustomerService } from '@/services';
import { PrismaClient } from '@prisma/client';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const customerController = new CustomerController(prisma);
  const customerService = new CustomerService(prisma);

  fastify.post('/login', {
    schema: {
      description: 'User login',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
        required: ['email', 'password'],
      },
    },
  }, async (request, reply) => {
    try {
      const body = request.body as { email: string; password: string };
      const result = await customerService.authenticateCustomer(body.email, body.password);
      
      return reply.status(200).send({
        success: true,
        message: 'Login successful',
        user: result.user,
        customToken: result.customToken,
        firebaseUid: result.firebaseUid
      });
    } catch (error) {
      return reply.status(401).send({
        success: false,
        message: error instanceof Error ? error.message : 'Authentication failed'
      });
    }
  });

  fastify.post('/register', {
    schema: {
      description: 'User registration',
      tags: ['Authentication'],
      body: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          name: { type: 'string', minLength: 2 },
        },
        required: ['email', 'password', 'name'],
      },
    },
  }, async (request, reply) => {
    return customerController.createCustomer(request as any, reply);
  });

  fastify.post('/logout', {
    schema: {
      description: 'User logout',
      tags: ['Authentication'],
    },
  }, async (request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Debug endpoint - remove in production
  fastify.get('/debug/:email', async (request, reply) => {
    try {
      const { email } = request.params as { email: string };
      const customer = await customerService.getCustomerByEmail(email);
      return reply.status(200).send({
        success: true,
        data: customer
      });
    } catch (error) {
      return reply.status(404).send({
        success: false,
        message: error instanceof Error ? error.message : 'Customer not found'
      });
    }
  });

}
