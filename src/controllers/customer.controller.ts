import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';

export class CustomerController extends BaseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  async getAllCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const customers = await this.prisma.customer.findMany({
        where: { deactivatedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return this.sendSuccess(reply, customers, 'Customers retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  async getCustomerById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: params.id,
          deactivatedAt: null,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!customer) {
        return this.sendError(reply, 'Customer not found', 404);
      }

      return this.sendSuccess(reply, customer, 'Customer retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }


  async createCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as { email: string; password: string; name: string };
      
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          email: body.email,
          deactivatedAt: null,
        },
      });

      if (existingCustomer) {
        return this.sendError(reply, 'Customer already exists', 409);
      }

      const customer = await this.prisma.customer.create({
        data: {
          email: body.email,
          name: body.name,
          password: body.password, // This should be hashed
          role: 'FREE',
          isActive: true,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return this.sendCreated(reply, customer, 'Customer created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}