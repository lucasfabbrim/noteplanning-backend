import { FastifyInstance } from 'fastify';
import { CustomerController } from '@/controllers';
import { CustomerRepository } from '@/repositories';
import { PrismaClient } from '@prisma/client';

export async function authRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();
  const customerController = new CustomerController(prisma);
  const customerRepository = new CustomerRepository(prisma);

  // POST /auth/login - Login
  fastify.post('/login', {
    schema: {
      description: 'User login',
      tags: ['auth'],
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
    return customerController.loginCustomer(request as any, reply);
  });

  // POST /auth/register - Register
  fastify.post('/register', {
    schema: {
      description: 'User registration',
      tags: ['auth'],
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

  // POST /auth/logout - Logout
  fastify.post('/logout', {
    schema: {
      description: 'User logout',
      tags: ['auth'],
    },
  }, async (request, reply) => {
    return reply.status(200).send({
      success: true,
      message: 'Logged out successfully',
    });
  });

}
