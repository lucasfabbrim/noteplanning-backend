import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { BaseService } from './base.service';
import { AdminRepository } from '@/repositories';
import {
  CreateAdminInput,
  UpdateAdminInput,
  AdminQuery,
  AdminResponse,
} from '@/validators';

export class AdminService extends BaseService {
  private adminRepository: AdminRepository;

  constructor(prisma: PrismaClient) {
    super(prisma);
    this.adminRepository = new AdminRepository(prisma);
  }

  /**
   * Get all admins with pagination and filters
   */
  async getAllAdmins(query: AdminQuery) {
    try {
      const result = await this.adminRepository.findAll(query);
      return {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };
    } catch (error) {
      throw new Error(`Failed to get admins: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string): Promise<AdminResponse> {
    try {
      const admin = await this.adminRepository.findById(id);
      if (!admin) {
        throw new Error('Admin not found');
      }
      return admin;
    } catch (error) {
      throw new Error(`Failed to get admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get admin by email
   */
  async getAdminByEmail(email: string): Promise<AdminResponse> {
    try {
      const admin = await this.adminRepository.findByEmail(email);
      if (!admin) {
        throw new Error('Admin not found');
      }
      return admin;
    } catch (error) {
      throw new Error(`Failed to get admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new admin
   */
  async createAdmin(data: CreateAdminInput): Promise<AdminResponse> {
    try {
      // Check if email is already taken
      const emailExists = await this.adminRepository.isEmailTaken(data.email);
      if (emailExists) {
        throw new Error('Email is already taken');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create admin
      const admin = await this.adminRepository.create({
        email: data.email,
        name: data.name,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      });

      // Return admin without password
      const { password, ...adminResponse } = admin;
      return adminResponse;
    } catch (error) {
      throw new Error(`Failed to create admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update admin by ID
   */
  async updateAdmin(id: string, data: UpdateAdminInput): Promise<AdminResponse> {
    try {
      // Check if admin exists
      const exists = await this.adminRepository.exists(id);
      if (!exists) {
        throw new Error('Admin not found');
      }

      // Check if email is taken by another admin
      if (data.email) {
        const emailExists = await this.adminRepository.isEmailTaken(data.email, id);
        if (emailExists) {
          throw new Error('Email is already taken');
        }
      }

      // Hash password if provided
      const updateData: any = { ...data };
      if (data.password) {
        updateData.password = await bcrypt.hash(data.password, 10);
      }

      // Update admin
      const admin = await this.adminRepository.update(id, updateData);

      // Return admin without password
      const { password, ...adminResponse } = admin;
      return adminResponse;
    } catch (error) {
      throw new Error(`Failed to update admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete admin by ID (soft delete)
   */
  async deleteAdmin(id: string): Promise<void> {
    try {
      // Check if admin exists
      const exists = await this.adminRepository.exists(id);
      if (!exists) {
        throw new Error('Admin not found');
      }

      // Soft delete admin
      await this.adminRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete admin: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Authenticate admin
   */
  async authenticateAdmin(email: string, password: string): Promise<AdminResponse> {
    try {
      const admin = await this.adminRepository.findByEmail(email);
      if (!admin) {
        throw new Error('Invalid credentials');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      if (!admin.isActive) {
        throw new Error('Account is deactivated');
      }

      // Return admin without password
      const { password: _, ...adminResponse } = admin;
      return adminResponse;
    } catch (error) {
      throw new Error(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get admin statistics
   */
  async getAdminStats() {
    try {
      const stats = await this.adminRepository.getStats();
      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      throw new Error(`Failed to get admin stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Toggle admin active status
   */
  async toggleAdminStatus(id: string, isActive: boolean): Promise<AdminResponse> {
    try {
      const exists = await this.adminRepository.exists(id);
      if (!exists) {
        throw new Error('Admin not found');
      }

      const admin = await this.adminRepository.update(id, { isActive });
      const { password, ...adminResponse } = admin;
      return adminResponse;
    } catch (error) {
      throw new Error(`Failed to toggle admin status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
