import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function membershipsRoutes(fastify: FastifyInstance) {
  const prisma = new PrismaClient();

  // GET /memberships - List all memberships
  fastify.get('/', {
    schema: {
      description: 'Get all memberships with pagination',
      tags: ['memberships']
    }
  }, async (request, reply) => {
    try {
      const memberships = await prisma.membership.findMany({
        where: { deactivatedAt: null },
        take: 10,
        select: {
          id: true,
          customerId: true,
          startDate: true,
          endDate: true,
          isActive: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Memberships retrieved successfully',
        data: memberships,
        total: memberships.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get memberships',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /memberships/:id - Get membership by ID
  fastify.get('/:id', {
    schema: {
      description: 'Get membership by ID',
      tags: ['memberships']
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      const membership = await prisma.membership.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        },
        select: {
          id: true,
          customerId: true,
          startDate: true,
          endDate: true,
          isActive: true,
          planType: true,
          createdAt: true,
          updatedAt: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        }
      });
      
      if (!membership) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Membership not found' 
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Membership found',
        data: membership
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get membership',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /memberships/customer/:customerId - Get memberships by customer ID
  fastify.get('/customer/:customerId', {
    schema: {
      description: 'Get memberships by customer ID',
      tags: ['memberships']
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { customerId: string };
      const memberships = await prisma.membership.findMany({
        where: { 
          customerId: params.customerId,
          deactivatedAt: null 
        },
        select: {
          id: true,
          customerId: true,
          startDate: true,
          endDate: true,
          isActive: true,
          planType: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      
      return reply.status(200).send({
        success: true,
        message: 'Customer memberships retrieved successfully',
        data: memberships,
        total: memberships.length
      });
    } catch (error) {
      return reply.status(500).send({ 
        success: false, 
        message: 'Failed to get customer memberships',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /memberships - Create new membership
  fastify.post('/', {
    schema: {
      description: 'Create a new membership',
      tags: ['memberships']
    }
  }, async (request, reply) => {
    try {
      const body = request.body as {
        customerId: string;
        startDate?: Date;
        endDate: Date;
        planType?: string;
      };
      
      // Validate customer exists
      const customer = await prisma.customer.findFirst({
        where: { 
          id: body.customerId,
          deactivatedAt: null 
        }
      });
      
      if (!customer) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Customer not found' 
        });
      }
      
      // Check if customer already has active membership
      const existingMembership = await prisma.membership.findFirst({
        where: {
          customerId: body.customerId,
          isActive: true,
          endDate: { gte: new Date() },
          deactivatedAt: null
        }
      });
      
      if (existingMembership) {
        return reply.status(400).send({ 
          success: false, 
          message: 'Customer already has an active membership' 
        });
      }
      
      const membership = await prisma.membership.create({
        data: {
          customerId: body.customerId,
          startDate: body.startDate || new Date(),
          endDate: body.endDate,
          planType: body.planType || 'monthly',
          isActive: true
        }
      });
      
      return reply.status(201).send({
        success: true,
        message: 'Membership created successfully',
        data: membership
      });
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Failed to create membership',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE /memberships/:id - Delete membership (soft delete)
  fastify.delete('/:id', {
    schema: {
      description: 'Delete membership by ID (soft delete)',
      tags: ['memberships']
    }
  }, async (request, reply) => {
    try {
      const params = request.params as { id: string };
      
      const membership = await prisma.membership.findFirst({
        where: { 
          id: params.id,
          deactivatedAt: null 
        }
      });
      
      if (!membership) {
        return reply.status(404).send({ 
          success: false, 
          message: 'Membership not found' 
        });
      }
      
      await prisma.membership.update({
        where: { id: params.id },
        data: {
          isActive: false,
          endDate: new Date(),
          deactivatedAt: new Date()
        }
      });
      
      return reply.status(204).send();
    } catch (error) {
      return reply.status(400).send({ 
        success: false, 
        message: 'Failed to delete membership',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
