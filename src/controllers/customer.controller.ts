import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { BaseController } from './base.controller';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config';

export class CustomerController extends BaseController {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
  }

  /**
   * GET /customers - Get all customers (Admin only)
   */
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

  /**
   * GET /customers/:id - Get customer by ID
   */
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

  /**
   * POST /customers - Create a new customer
   */
  async createCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      // Check if email already exists
      const existingCustomer = await this.prisma.customer.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (existingCustomer) {
        return this.sendError(reply, 'Email is already taken', 409);
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(body.password, 10);
      
      const customer = await this.prisma.customer.create({
        data: {
          email: body.email,
          name: body.name,
          password: hashedPassword,
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

  /**
   * POST /customers/login - Login customer
   */
  async loginCustomer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as any;
      
      // Find customer
      const customer = await this.prisma.customer.findFirst({
        where: { 
          email: body.email,
          deactivatedAt: null 
        }
      });
      
      if (!customer) {
        return this.sendError(reply, 'Invalid credentials', 401);
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(body.password, customer.password);
      if (!isPasswordValid) {
        return this.sendError(reply, 'Invalid credentials', 401);
      }
      
      if (!customer.isActive) {
        return this.sendError(reply, 'Account is deactivated', 401);
      }
      
      // Generate JWT token
      const token = jwt.sign({
        id: customer.id,
        email: customer.email,
        role: customer.role
      }, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN
      } as jwt.SignOptions);
      
      const result = {
        token,
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }
      };

      return this.sendSuccess(reply, result, 'Login successful');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }

  /**
   * GET /customers/stats - Get customer statistics (Admin only)
   */
  async getCustomerStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const [total, active, free, members] = await Promise.all([
        this.prisma.customer.count({
          where: { deactivatedAt: null }
        }),
        this.prisma.customer.count({
          where: { deactivatedAt: null, isActive: true }
        }),
        this.prisma.customer.count({
          where: { deactivatedAt: null, role: 'FREE' }
        }),
        this.prisma.customer.count({
          where: { deactivatedAt: null, role: 'MEMBER' }
        })
      ]);

      const stats = {
        total,
        active,
        free,
        members
      };

      return this.sendSuccess(reply, stats, 'Customer statistics retrieved successfully');
    } catch (error) {
      return this.handleServiceError(reply, error);
    }
  }
}