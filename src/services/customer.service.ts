import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { BaseService } from './base.service';
import { CustomerRepository } from '@/repositories';
import { env } from '@/config';
import {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerQuery,
  CustomerResponse,
  CustomerLoginResponse,
  CustomerWithRelations,
} from '@/validators';

export class CustomerService extends BaseService {
  private customerRepository: CustomerRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.customerRepository = new CustomerRepository(prisma);
  }

  /**
   * Get all customers with pagination and filters
   */
  async getAllCustomers(query: CustomerQuery) {
    try {
      const result = await this.customerRepository.findAll(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get customers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(id: string): Promise<CustomerWithRelations> {
    try {
      const customer = await this.customerRepository.findById(id);
      if (!customer) {
        throw new Error('Customer not found');
      }
      return customer;
    } catch (error) {
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer by email
   */
  async getCustomerByEmail(email: string): Promise<CustomerResponse> {
    try {
      const customer = await this.customerRepository.findByEmail(email);
      if (!customer) {
        throw new Error('Customer not found');
      }
      return customer;
    } catch (error) {
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new customer
   */
  async createCustomer(data: CreateCustomerInput): Promise<CustomerResponse> {
    try {
      // Check if email is already taken
      const emailExists = await this.customerRepository.isEmailTaken(data.email);
      if (emailExists) {
        throw new Error('Email is already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create customer
      const customer = await this.customerRepository.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.FREE,
        isActive: true,
      });

      // Return customer without password
      const { password, ...customerResponse } = customer;
      return customerResponse;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update customer by ID
   */
  async updateCustomer(id: string, data: UpdateCustomerInput): Promise<CustomerResponse> {
    try {
      // Check if customer exists
      const exists = await this.customerRepository.exists(id);
      if (!exists) {
        throw new Error('Customer not found');
      }

      // Check if email is taken by another customer
      if (data.email) {
        const emailExists = await this.customerRepository.isEmailTaken(data.email, id);
        if (emailExists) {
          throw new Error('Email is already taken');
        }
      }

      // Hash password if provided
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      // Update customer
      const customer = await this.customerRepository.update(id, updateData);

      // Return customer without password
      const { password, ...customerResponse } = customer;
      return customerResponse;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete customer by ID (soft delete)
   */
  async deleteCustomer(id: string): Promise<void> {
    try {
      // Check if customer exists
      const exists = await this.customerRepository.exists(id);
      if (!exists) {
        throw new Error('Customer not found');
      }

      // Soft delete customer
      await this.customerRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate customer
   */
  async authenticateCustomer(email: string, password: string): Promise<CustomerLoginResponse> {
    try {
      console.log('Authenticating customer with email:', email);
      const customer = await this.customerRepository.findByEmail(email);
      console.log('Customer found:', customer ? 'Yes' : 'No');
      if (!customer) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, customer.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      if (!customer.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: customer.id, 
          email: customer.email, 
          role: customer.role 
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
      );

      // Return standardized login response
      const { password: _, ...customerResponse } = customer;
      const result = {
        token,
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
          isActive: customer.isActive,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt
        }
      };
      console.log('Login result with token:', { ...result, token: '***' });
      return result as any;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get customer statistics
   */
  async getCustomerStats() {
    try {
      const stats = await this.customerRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get customer stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upgrade customer role to MEMBER
   */
  async upgradeToMember(id: string): Promise<CustomerResponse> {
    try {
      const exists = await this.customerRepository.exists(id);
      if (!exists) {
        throw new Error('Customer not found');
      }

      const customer = await this.customerRepository.update(id, { role: Role.MEMBER });
      const { password, ...customerResponse } = customer;
      return customerResponse;
    } catch (error) {
      throw new Error(`Failed to upgrade customer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
