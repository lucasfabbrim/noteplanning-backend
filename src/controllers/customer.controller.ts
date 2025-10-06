import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import { CustomerService } from '@/services';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQuery,
  CustomerParams,
  CustomerEmailParams,
  CustomerLoginInput,
} from '@/validators';

export class CustomerController extends BaseController {
  private customerService: CustomerService;

  constructor(prisma: PrismaClient) {
    super();
    this.customerService = new CustomerService(prisma);
  }

  /**
   * GET /customers - Get all customers with pagination and filters
   */
  async getAllCustomers(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as any;
      const result = await this.customerService.getAllCustomers(query);
      return reply.status(200).send({
        success: true,
        message: 'Customers retrieved successfully',
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /customers/:id - Get customer by ID
   */
  async getCustomerById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      const customer = await this.customerService.getCustomerById(params.id);
      return this.sendSuccess(reply, customer, 'Customer retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /customers/email/:email - Get customer by email
   */
  async getCustomerByEmail(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { email: string };
      const customer = await this.customerService.getCustomerByEmail(params.email);
      return this.sendSuccess(reply, customer, 'Customer retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /customers - Create a new customer
   */
  async createCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const customer = await this.customerService.createCustomer(body);
      return this.sendCreated(reply, customer, 'Customer created successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * PUT /customers/:id - Update customer by ID
   */
  async updateCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      const body = request.body as any;
      const customer = await this.customerService.updateCustomer(params.id, body);
      return this.sendSuccess(reply, customer, 'Customer updated successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * DELETE /customers/:id - Delete customer by ID (soft delete)
   */
  async deleteCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string };
      await this.customerService.deleteCustomer(params.id);
      return this.sendNoContent(reply, 'Customer deleted successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * POST /customers/login - Authenticate customer
   */
  async loginCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      const customer = await this.customerService.authenticateCustomer(
        body.email,
        body.password
      );
      return this.sendSuccess(reply, customer, 'Login successful');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /customers/stats - Get customer statistics
   */
  async getCustomerStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.customerService.getCustomerStats();
      return this.sendSuccess(reply, stats.data, 'Customer statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}
