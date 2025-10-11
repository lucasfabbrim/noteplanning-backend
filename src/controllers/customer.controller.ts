import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { CustomerService } from '@/services/customer.service';

export class CustomerController extends BaseController {
  private prisma: PrismaClient;
  private customerService: CustomerService;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.customerService = new CustomerService(prisma);
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
      
      const customer = await this.customerService.createCustomer({
        email: body.email,
        password: body.password,
        name: body.name,
      });

      return this.sendCreated(reply, customer, 'Customer created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}